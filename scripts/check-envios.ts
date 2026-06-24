import { createClient } from '@supabase/supabase-js'

// Solo lectura: reporta el estado de envío de invitaciones para un diagnóstico.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
if (!url || !serviceKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

const BUSQUEDA = process.argv[2] ?? 'High results'

async function main() {
  const { data: diags, error: e1 } = await supabase
    .from('diagnosticos')
    .select('id, nombre_compania, activado, created_at')
    .ilike('nombre_compania', `%${BUSQUEDA}%`)
  if (e1) throw e1

  if (!diags || diags.length === 0) {
    console.log(`No se encontró ningún diagnóstico que coincida con "${BUSQUEDA}".`)
    // Listamos los nombres disponibles para ayudar a ubicarlo
    const { data: todos } = await supabase.from('diagnosticos').select('nombre_compania').order('created_at', { ascending: false }).limit(40)
    console.log('\nDiagnósticos existentes (más recientes):')
    for (const d of todos ?? []) console.log('  -', d.nombre_compania)
    return
  }

  for (const diag of diags) {
    console.log(`\n══════════════════════════════════════════════`)
    console.log(`Diagnóstico: ${diag.nombre_compania}  (activado: ${diag.activado})`)
    console.log(`id: ${diag.id}`)

    const { data: equipos } = await supabase
      .from('equipos')
      .select('id, nombre')
      .eq('diagnostico_id', diag.id)
    const equiposById = new Map((equipos ?? []).map(e => [e.id, e.nombre]))
    const equipoIds = (equipos ?? []).map(e => e.id)

    if (equipoIds.length === 0) { console.log('  (sin equipos)'); continue }

    const { data: invs } = await supabase
      .from('invitaciones')
      .select('nombre, email, area, equipo_id, enviado_at, respondido_at')
      .in('equipo_id', equipoIds)
      .order('equipo_id')
      .order('nombre')

    const total = invs?.length ?? 0
    const noEnviados = (invs ?? []).filter(i => !i.enviado_at)
    const enviados = total - noEnviados.length
    console.log(`  Equipos: ${equipoIds.length}  ·  Invitaciones: ${total}  ·  Enviados: ${enviados}  ·  SIN ENVIAR: ${noEnviados.length}`)

    if (noEnviados.length > 0) {
      console.log(`\n  ⚠️  Invitaciones SIN enviar (enviado_at = null):`)
      for (const i of noEnviados) {
        console.log(`     · [${equiposById.get(i.equipo_id) ?? '?'}] ${i.nombre} <${i.email}>${i.respondido_at ? '  (¡pero ya respondió!)' : ''}`)
      }
    } else {
      console.log(`  ✓ Todas las invitaciones tienen enviado_at.`)
    }

    const sinResponder = (invs ?? []).filter(i => !i.respondido_at)
    console.log(`\n  Respondieron: ${total - sinResponder.length}/${total}.`)
    if (sinResponder.length > 0) {
      console.log(`  Enviados pero SIN responder aún:`)
      for (const i of sinResponder) {
        console.log(`     · ${i.nombre} <${i.email}>  (enviado: ${i.enviado_at ? new Date(i.enviado_at).toLocaleString('es-CO') : '—'})`)
      }
    }
  }
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) })
