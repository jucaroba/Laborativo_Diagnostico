import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { enviarInvitacionesLote } from '@/lib/resend'

type Entrada = { nombre: string; email: string; area?: string }

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { equipoId?: string; diagnosticoId?: string; lista: Entrada[] }
    const { lista } = body
    const equipoId = body.equipoId

    if (!equipoId || !Array.isArray(lista) || lista.length === 0) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    // Cargar el equipo (necesitamos diagnostico_id para el nombre de la compañía).
    const { data: equipo } = await supabaseAdmin
      .from('equipos')
      .select('id, diagnostico_id, nombre, estado, codigo_participacion')
      .eq('id', equipoId)
      .single()

    if (!equipo) return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 })

    const { data: diag } = await supabaseAdmin
      .from('diagnosticos')
      .select('id, nombre_compania')
      .eq('id', equipo.diagnostico_id)
      .single()

    if (!diag) return NextResponse.json({ error: 'Compañía no encontrada' }, { status: 404 })

    if (equipo.estado === 'completado') {
      await supabaseAdmin
        .from('equipos')
        .update({ estado: 'activo' })
        .eq('id', equipoId)
    }

    const limpia = lista
      .map(e => ({ nombre: (e.nombre || '').trim(), email: (e.email || '').trim().toLowerCase(), area: (e.area || '').trim() || null }))
      .filter(e => e.nombre && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email))

    if (limpia.length === 0) {
      return NextResponse.json({ error: 'Ningún registro válido' }, { status: 400 })
    }

    const { data: filas, error: upsertError } = await supabaseAdmin
      .from('invitaciones')
      .upsert(
        limpia.map(e => ({
          equipo_id: equipoId,
          nombre: e.nombre,
          email: e.email,
          area: e.area,
        })),
        { onConflict: 'equipo_id,email' }
      )
      // token: lo genera la BD por default al insertar; lo recuperamos para el link personalizado.
      .select('id, nombre, email, token')

    if (upsertError || !filas) {
      return NextResponse.json({ error: upsertError?.message || 'Error al guardar' }, { status: 500 })
    }

    const emailPorId = new Map(filas.map(f => [f.id, f.email]))
    const { enviados: idsEnviados, fallidos: fallidosRef } = await enviarInvitacionesLote(
      filas.map(f => ({
        invitacionId: f.id,
        email: f.email,
        nombre: f.nombre,
        nombreCompania: diag.nombre_compania,
        codigoParticipacion: equipo.codigo_participacion,
        token: f.token,
      }))
    )
    const fallidos = fallidosRef.map(f => ({ email: emailPorId.get(f.ref) ?? f.ref, error: f.error }))

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
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error inesperado' }, { status: 500 })
  }
}
