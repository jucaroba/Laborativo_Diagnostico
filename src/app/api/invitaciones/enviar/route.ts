import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { enviarInvitacionParticipante } from '@/lib/resend'

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

    const { data: filas, error: upsertError } = await supabaseAdmin
      .from('invitaciones')
      .upsert(
        limpia.map(e => ({ diagnostico_id: diagnosticoId, nombre: e.nombre, email: e.email })),
        { onConflict: 'diagnostico_id,email' }
      )
      .select('id, nombre, email')

    if (upsertError || !filas) {
      return NextResponse.json({ error: upsertError?.message || 'Error al guardar' }, { status: 500 })
    }

    const resultados = await Promise.allSettled(
      filas.map(f =>
        enviarInvitacionParticipante({
          participanteEmail: f.email,
          participanteNombre: f.nombre,
          nombreCompania: diag.nombre_compania,
          codigoParticipacion: diag.codigo_participacion,
        }).then(() => f.id)
      )
    )

    const idsEnviados: string[] = []
    const fallidos: { email: string; error: string }[] = []
    resultados.forEach((r, i) => {
      if (r.status === 'fulfilled') idsEnviados.push(r.value as string)
      else fallidos.push({ email: filas[i].email, error: String(r.reason?.message || r.reason) })
    })

    if (idsEnviados.length > 0) {
      await supabaseAdmin
        .from('invitaciones')
        .update({ enviado_at: new Date().toISOString() })
        .in('id', idsEnviados)
    }

    return NextResponse.json({
      ok: true,
      enviados: idsEnviados.length,
      fallidos,
      total: filas.length,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error inesperado' }, { status: 500 })
  }
}
