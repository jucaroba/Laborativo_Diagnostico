// Dry-run de la migración a compañías + equipos.
// No modifica nada. Solo reporta qué pasaría al ejecutar
// `supabase-migration-equipos.sql` contra la base actual.
//
// Uso:
//   npm run dry-run-equipos
//
// Requiere SUPABASE_SERVICE_ROLE_KEY en .env.local (RLS-bypass).

import { createClient } from '@supabase/supabase-js'

type Diag = {
  id: string
  nombre_compania: string
  tipo: string
  grupo_id: string | null
  color_neon: string
  numero_participantes: number | null
  estado: string
  codigo_participacion: string
  codigo_resultados: string
  created_at: string
}

type Inv = { id: string; diagnostico_id: string; equipo_id: string | null }
type Part = { id: string; diagnostico_id: string; equipo_id: string | null }
type Equipo = { id: string; diagnostico_id: string }
type Grupo = { id: string; nombre: string; tipo: string }

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
    process.exit(1)
  }
  const sb = createClient(url, key, { auth: { persistSession: false } })

  const [{ data: diags }, { data: invs }, { data: parts }, { data: grupos }, equiposRes] = await Promise.all([
    sb.from('diagnosticos').select('id, nombre_compania, tipo, grupo_id, color_neon, numero_participantes, estado, codigo_participacion, codigo_resultados, created_at').order('created_at'),
    sb.from('invitaciones').select('id, diagnostico_id, equipo_id'),
    sb.from('participantes').select('id, diagnostico_id, equipo_id'),
    sb.from('grupos').select('id, nombre, tipo'),
    // La tabla `equipos` aún no existe; la consulta puede fallar y eso es esperado.
    sb.from('equipos').select('id, diagnostico_id').then(r => r, () => ({ data: [] as Equipo[] })),
  ])

  const D = (diags ?? []) as Diag[]
  const I = (invs ?? []) as Inv[]
  const P = (parts ?? []) as Part[]
  const G = (grupos ?? []) as Grupo[]
  const E = (equiposRes?.data ?? []) as Equipo[]

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  DRY-RUN · Migración a Compañías + Equipos')
  console.log('═══════════════════════════════════════════════════════════════\n')

  console.log('Estado actual de la base:')
  console.log(`  diagnósticos: ${D.length}`)
  console.log(`  invitaciones: ${I.length}`)
  console.log(`  participantes: ${P.length}`)
  console.log(`  grupos:       ${G.length}`)
  console.log(`  equipos:      ${E.length}  ${E.length > 0 ? '(la tabla ya existe → la migración será parcial/idempotente)' : '(la tabla aún no existe)'}\n`)

  // ───────── Plan de creación de equipos ─────────
  const diagsConEquipo = new Set(E.map(e => e.diagnostico_id))
  const aCrear = D.filter(d => !diagsConEquipo.has(d.id))

  console.log('Equipos que se crearían (1 por diagnóstico, "Equipo principal"):')
  console.log(`  ${aCrear.length} nuevos`)
  if (aCrear.length > 0 && aCrear.length <= 20) {
    for (const d of aCrear) {
      console.log(`    · ${d.nombre_compania.padEnd(34)} (${d.tipo}, estado: ${d.estado})`)
    }
  } else if (aCrear.length > 20) {
    console.log(`    [muestra de 5]`)
    for (const d of aCrear.slice(0, 5)) {
      console.log(`    · ${d.nombre_compania.padEnd(34)} (${d.tipo}, estado: ${d.estado})`)
    }
  }
  console.log('')

  // ───────── Re-apuntado de invitaciones y participantes ─────────
  const invsSinEquipo = I.filter(i => !i.equipo_id).length
  const partsSinEquipo = P.filter(p => !p.equipo_id).length
  console.log('Re-apuntado de FKs:')
  console.log(`  invitaciones por re-apuntar a equipo_id:  ${invsSinEquipo} de ${I.length}`)
  console.log(`  participantes por re-apuntar a equipo_id: ${partsSinEquipo} de ${P.length}`)
  console.log('')

  // ───────── Detección de grupos con varios diagnósticos ─────────
  const porGrupo: Record<string, Diag[]> = {}
  for (const d of D) {
    if (!d.grupo_id) continue
    porGrupo[d.grupo_id] = [...(porGrupo[d.grupo_id] ?? []), d]
  }
  const fusionables = Object.entries(porGrupo).filter(([, arr]) => arr.length > 1)

  if (fusionables.length === 0) {
    console.log('Grupos con varios diagnósticos: ninguno. (No hay candidatos a fusión manual.)')
  } else {
    console.log(`⚠️  Grupos con varios diagnósticos detectados: ${fusionables.length}`)
    console.log('   La migración NO los fusiona: cada diagnóstico se vuelve una compañía aparte.')
    console.log('   Si la idea era que estos sean equipos de UNA misma compañía, hay que')
    console.log('   moverlos manualmente después (cambiar equipos.diagnostico_id).\n')
    for (const [gid, arr] of fusionables) {
      const g = G.find(x => x.id === gid)
      console.log(`   ◇ Grupo "${g?.nombre ?? '?'}" [${g?.tipo}] — ${arr.length} diagnósticos:`)
      for (const d of arr) {
        console.log(`       · ${d.nombre_compania}`)
      }
    }
  }
  console.log('')

  // ───────── Resumen del SQL ─────────
  console.log('Cambios de schema que aplicará la migración:')
  console.log('  + CREATE TABLE equipos (id, diagnostico_id, nombre, color_neon,')
  console.log('                          numero_participantes, estado,')
  console.log('                          codigo_participacion, codigo_resultados, …)')
  console.log('  + invitaciones.equipo_id  uuid NOT NULL → equipos(id)')
  console.log('  + participantes.equipo_id uuid NOT NULL → equipos(id)')
  console.log('  + diagnosticos.codigo_resultados_comparativo  text UNIQUE NOT NULL')
  console.log('  + RLS + políticas sobre equipos (mismo patrón que diagnosticos)')
  console.log('')
  console.log('NO se dropea nada en esta fase. La limpieza (drop columns viejas,')
  console.log('drop table grupos) se hace en una migración posterior.\n')

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  Listo para ejecutar `supabase-migration-equipos.sql`')
  console.log('═══════════════════════════════════════════════════════════════')
}

main().catch(err => {
  console.error('Error en dry-run:', err)
  process.exit(1)
})
