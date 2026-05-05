import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { enviarLinkDescripcion } from '@/lib/resend'

type Entrada = { nombre: string; email: string }

export async function POST(req: NextRequest) {
  try {
    const { diagnosticoId, lista } = (await req.json()) as { diagnosticoId: string; lista: Entrada[] }

    if (!diagnosticoId || !Array.isArray(lista) || lista.length === 0) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const { data: diag } = await supabaseAdmin
      .from('diagnosticos')
      .select('id, nombre_compania, codigo_participacion')
      .eq('id', diagnosticoId)
      .single()

    if (!diag) return NextResponse.json({ error: 'Diagnóstico no encontrado' }, { status: 404 })

    const limpia = lista
      .map(e => ({ nombre: (e.nombre || '').trim(), email: (e.email || '').trim().toLowerCase() }))
      .filter(e => e.nombre && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email))

    if (limpia.length === 0) {
      return NextResponse.json({ error: 'Ningún registro válido' }, { status: 400 })
    }

    const resultados = await Promise.allSettled(
      limpia.map(e =>
        enviarLinkDescripcion({
          participanteEmail: e.email,
          participanteNombre: e.nombre,
          nombreCompania: diag.nombre_compania,
          codigoParticipacion: diag.codigo_participacion,
        })
      )
    )

    let enviados = 0
    const fallidos: { email: string; error: string }[] = []
    resultados.forEach((r, i) => {
      if (r.status === 'fulfilled') enviados++
      else fallidos.push({ email: limpia[i].email, error: String(r.reason?.message || r.reason) })
    })

    return NextResponse.json({
      ok: true,
      enviados,
      fallidos,
      total: limpia.length,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error inesperado' }, { status: 500 })
  }
}
