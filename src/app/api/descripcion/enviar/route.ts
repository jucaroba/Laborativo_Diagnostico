import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { enviarLinksDescripcionLote } from '@/lib/resend'

type Entrada = { nombre: string; email: string }

export async function POST(req: NextRequest) {
  try {
    const { equipoId, lista } = (await req.json()) as { equipoId: string; lista: Entrada[] }

    if (!equipoId || !Array.isArray(lista) || lista.length === 0) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const { data: equipo } = await supabaseAdmin
      .from('equipos')
      .select('id, diagnostico_id, codigo_participacion')
      .eq('id', equipoId)
      .single()

    if (!equipo) return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 })

    const { data: diag } = await supabaseAdmin
      .from('diagnosticos')
      .select('nombre_compania')
      .eq('id', equipo.diagnostico_id)
      .single()

    if (!diag) return NextResponse.json({ error: 'Compañía no encontrada' }, { status: 404 })

    const limpia = lista
      .map(e => ({ nombre: (e.nombre || '').trim(), email: (e.email || '').trim().toLowerCase() }))
      .filter(e => e.nombre && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email))

    if (limpia.length === 0) {
      return NextResponse.json({ error: 'Ningún registro válido' }, { status: 400 })
    }

    const { enviados: refsEnviados, fallidos } = await enviarLinksDescripcionLote(
      limpia.map(e => ({
        email: e.email,
        nombre: e.nombre,
        nombreCompania: diag.nombre_compania,
        codigoParticipacion: equipo.codigo_participacion,
      }))
    )

    return NextResponse.json({
      ok: true,
      enviados: refsEnviados.length,
      fallidos: fallidos.map(f => ({ email: f.ref, error: f.error })),
      total: limpia.length,
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error inesperado' }, { status: 500 })
  }
}
