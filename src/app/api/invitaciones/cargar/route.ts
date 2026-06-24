import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { enviarInvitacionesLote } from '@/lib/resend'

// Cargue a nivel diagnóstico: crea un equipo por ÁREA y reparte cada persona
// a su área. El rol (líder/miembro) viene en la lista, no se elige en el intake.
type Entrada = { nombre: string; email: string; area?: string; perfil?: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const AREA_DEFAULT = 'General'

function normPerfil(v?: string): 'lider' | 'miembro' {
  const s = (v || '').trim().toLowerCase()
  return s.startsWith('líd') || s.startsWith('lid') || s.startsWith('lead') || s === 'l' ? 'lider' : 'miembro'
}

export async function POST(req: NextRequest) {
  try {
    const { diagnosticoId, lista } = (await req.json()) as { diagnosticoId?: string; lista: Entrada[] }
    if (!diagnosticoId || !Array.isArray(lista) || lista.length === 0) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const { data: diag } = await supabaseAdmin
      .from('diagnosticos')
      .select('id, nombre_compania')
      .eq('id', diagnosticoId)
      .single()
    if (!diag) return NextResponse.json({ error: 'Diagnóstico no encontrado' }, { status: 404 })

    // Limpieza + normalización
    const limpia = lista
      .map(e => ({
        nombre: (e.nombre || '').trim(),
        email: (e.email || '').trim().toLowerCase(),
        area: (e.area || '').trim() || AREA_DEFAULT,
        perfil: normPerfil(e.perfil),
      }))
      .filter(e => e.nombre && EMAIL_RE.test(e.email))
    if (limpia.length === 0) {
      return NextResponse.json({ error: 'Ningún registro válido' }, { status: 400 })
    }

    // 1) Un equipo por área (reusa si ya existe por nombre en este diagnóstico)
    const areas = [...new Set(limpia.map(e => e.area))]
    const { data: equiposExistentes } = await supabaseAdmin
      .from('equipos')
      .select('id, nombre, codigo_participacion')
      .eq('diagnostico_id', diagnosticoId)
    const porNombre = new Map((equiposExistentes ?? []).map(e => [e.nombre, e]))

    const equipoDeArea = new Map<string, { id: string; codigo_participacion: string }>()
    let equiposCreados = 0
    for (const area of areas) {
      const conteo = limpia.filter(e => e.area === area).length
      const existe = porNombre.get(area)
      if (existe) {
        await supabaseAdmin.from('equipos').update({ estado: 'activo', numero_participantes: conteo }).eq('id', existe.id)
        equipoDeArea.set(area, { id: existe.id, codigo_participacion: existe.codigo_participacion })
      } else {
        const { data: nuevo, error } = await supabaseAdmin
          .from('equipos')
          .insert({ diagnostico_id: diagnosticoId, nombre: area, estado: 'activo', numero_participantes: conteo })
          .select('id, codigo_participacion')
          .single()
        if (error || !nuevo) return NextResponse.json({ error: `No se pudo crear el equipo "${area}": ${error?.message}` }, { status: 500 })
        equipoDeArea.set(area, { id: nuevo.id, codigo_participacion: nuevo.codigo_participacion })
        equiposCreados++
      }
    }

    // 2) Invitaciones (una por persona, en el equipo de su área)
    const filasInsert = limpia.map(e => ({
      equipo_id: equipoDeArea.get(e.area)!.id,
      nombre: e.nombre,
      email: e.email,
      area: e.area,
      perfil: e.perfil,
    }))
    const { data: invs, error: invErr } = await supabaseAdmin
      .from('invitaciones')
      .upsert(filasInsert, { onConflict: 'equipo_id,email' })
      .select('id, nombre, email, token, equipo_id')
    if (invErr || !invs) {
      return NextResponse.json({ error: invErr?.message || 'Error al guardar invitaciones' }, { status: 500 })
    }

    // codigo_participacion por equipo, para el link de cada persona
    const codigoPorEquipo = new Map<string, string>()
    for (const [, v] of equipoDeArea) codigoPorEquipo.set(v.id, v.codigo_participacion)

    // 3) Envío de correos personalizados (en lote, respetando el rate limit)
    const emailPorId = new Map(invs.map(f => [f.id, f.email]))
    const { enviados: idsEnviados, fallidos: fallidosRef } = await enviarInvitacionesLote(
      invs.map(f => ({
        invitacionId: f.id,
        email: f.email,
        nombre: f.nombre,
        nombreCompania: diag.nombre_compania,
        codigoParticipacion: codigoPorEquipo.get(f.equipo_id)!,
        token: f.token,
      })),
    )
    const fallidos = fallidosRef.map(f => ({ email: emailPorId.get(f.ref) ?? f.ref, error: f.error }))
    if (idsEnviados.length > 0) {
      await supabaseAdmin.from('invitaciones').update({ enviado_at: new Date().toISOString() }).in('id', idsEnviados)
    }

    return NextResponse.json({
      ok: true,
      areas: areas.length,
      equiposCreados,
      invitaciones: invs.length,
      enviados: idsEnviados.length,
      fallidos,
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error inesperado' }, { status: 500 })
  }
}
