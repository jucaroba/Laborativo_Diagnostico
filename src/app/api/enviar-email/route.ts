import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { enviarLinkParticipacion, enviarLinkResultados } from '@/lib/resend'

export async function POST(req: NextRequest) {
  try {
    const { diagnosticoId, tipo } = await req.json()

    const { data: diag } = await supabase
      .from('diagnosticos')
      .select('*')
      .eq('id', diagnosticoId)
      .single()

    if (!diag) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    if (tipo === 'activo') {
      await enviarLinkParticipacion({
        contactoEmail: diag.contacto_email,
        contactoNombre: diag.contacto_nombre,
        nombreCompania: diag.nombre_compania,
        codigoParticipacion: diag.codigo_participacion,
      })
    } else if (tipo === 'completado') {
      await enviarLinkResultados({
        contactoEmail: diag.contacto_email,
        contactoNombre: diag.contacto_nombre,
        nombreCompania: diag.nombre_compania,
        codigoResultados: diag.codigo_resultados,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
