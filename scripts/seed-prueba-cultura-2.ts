// Pobla el diagnóstico "Prueba Cultura / 2" (cultura_360) con un equipo,
// invitaciones identificadas (nombre/email/área), participantes y respuestas.
//
// Escenario diseñado para revisar el dashboard, la vista de respuestas por
// persona y los estados de invitación:
//   - 8 miembros del equipo responden completo (rol A → responde A+C)
//   - 1 miembro responde a medias (estado "Incompleto")
//   - 1 miembro no responde (estado "Sin iniciar")
//   - 2 líderes responden completo (rol D → responde D+B)
//
// Brechas por dimensión (líder se ve mejor de lo que lo ve el equipo):
//   Interacción = brecha máxima · Acción = casi alineada.
//
// Idempotente: reusa el equipo "Equipo Piloto" y borra sus datos antes de sembrar.
//
// Uso:
//   node --env-file=.env.local --experimental-strip-types --no-warnings scripts/seed-prueba-cultura-2.ts

import { createClient } from '@supabase/supabase-js'

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

const NOMBRE_DIAG = 'Prueba Cultura / 2'
const NOMBRE_EQUIPO = 'Equipo Piloto'

type Rol = 'A' | 'B' | 'C' | 'D'

// Centros (promedio objetivo 1–10) por dimensión × rol.
// A = equipo auto · C = equipo→líder · D = líder auto · B = líder→equipo
const CENTROS: Record<number, Record<Rol, number>> = {
  1: { A: 7.0, C: 6.0, D: 8.5, B: 8.0 }, // Intención   · brecha 2.5
  2: { A: 6.5, C: 5.0, D: 8.0, B: 7.5 }, // Motivación  · brecha 3.0
  3: { A: 6.0, C: 4.5, D: 8.5, B: 8.0 }, // Interacción · brecha 4.0 ← máx
  4: { A: 7.5, C: 7.0, D: 7.5, B: 7.2 }, // Acción      · brecha 0.5 ← alineado
}

type Persona = { nombre: string; email: string; area: string; perfil: 'equipo' | 'lider'; estado: 'completo' | 'parcial' | 'sin_iniciar' }

const PERSONAS: Persona[] = [
  { nombre: 'Ana Torres',       email: 'ana.torres@empresa-prueba.com',     area: 'Ventas',      perfil: 'equipo', estado: 'completo' },
  { nombre: 'Carlos Ruiz',      email: 'carlos.ruiz@empresa-prueba.com',    area: 'Ventas',      perfil: 'equipo', estado: 'completo' },
  { nombre: 'Diana Gómez',      email: 'diana.gomez@empresa-prueba.com',    area: 'Operaciones', perfil: 'equipo', estado: 'completo' },
  { nombre: 'Esteban Páez',     email: 'esteban.paez@empresa-prueba.com',   area: 'Operaciones', perfil: 'equipo', estado: 'completo' },
  { nombre: 'Felipe Niño',      email: 'felipe.nino@empresa-prueba.com',    area: 'Marketing',   perfil: 'equipo', estado: 'completo' },
  { nombre: 'Gabriela Soto',    email: 'gabriela.soto@empresa-prueba.com',  area: 'Marketing',   perfil: 'equipo', estado: 'completo' },
  { nombre: 'Hugo Marín',       email: 'hugo.marin@empresa-prueba.com',     area: 'Tecnología',  perfil: 'equipo', estado: 'completo' },
  { nombre: 'Irene Castro',     email: 'irene.castro@empresa-prueba.com',   area: 'Tecnología',  perfil: 'equipo', estado: 'completo' },
  { nombre: 'Jorge Lara',       email: 'jorge.lara@empresa-prueba.com',     area: 'Finanzas',    perfil: 'equipo', estado: 'parcial' },
  { nombre: 'Karen Díaz',       email: 'karen.diaz@empresa-prueba.com',     area: 'Finanzas',    perfil: 'equipo', estado: 'sin_iniciar' },
  { nombre: 'Lucía Fernández',  email: 'lucia.fernandez@empresa-prueba.com', area: 'Dirección',  perfil: 'lider',  estado: 'completo' },
  { nombre: 'Mario Beltrán',    email: 'mario.beltran@empresa-prueba.com',  area: 'Dirección',   perfil: 'lider',  estado: 'completo' },
]

const clamp = (v: number) => Math.max(1, Math.min(10, v))
const valorCerca = (centro: number) => clamp(Math.round(centro + (Math.random() * 2 - 1) * 1.3))

async function main() {
  const { data: diag } = await s.from('diagnosticos').select('id').eq('nombre_compania', NOMBRE_DIAG).single()
  if (!diag) { console.error(`No encontré el diagnóstico "${NOMBRE_DIAG}"`); process.exit(1) }
  const DID = diag.id

  const { data: preguntas } = await s.from('preguntas').select('id, dimension_id, rol').eq('diagnostico_id', DID)
  if (!preguntas?.length) { console.error('El diagnóstico no tiene preguntas.'); process.exit(1) }
  const preguntasPorRol: Record<Rol, { id: string; dimension_id: number }[]> = { A: [], B: [], C: [], D: [] }
  for (const p of preguntas) {
    if (p.rol in preguntasPorRol) preguntasPorRol[p.rol as Rol].push({ id: p.id, dimension_id: p.dimension_id })
  }

  // Equipo: reusar o crear
  let equipoId: string
  const { data: eqExistente } = await s.from('equipos').select('id').eq('diagnostico_id', DID).eq('nombre', NOMBRE_EQUIPO).maybeSingle()
  if (eqExistente) {
    equipoId = eqExistente.id
    await s.from('participantes').delete().eq('equipo_id', equipoId) // cascade → respuestas
    await s.from('invitaciones').delete().eq('equipo_id', equipoId)
    await s.from('equipos').update({ estado: 'activo', numero_participantes: PERSONAS.length }).eq('id', equipoId)
    console.log(`Equipo reutilizado y limpiado (${equipoId})`)
  } else {
    const { data: nuevo, error } = await s.from('equipos')
      .insert({ diagnostico_id: DID, nombre: NOMBRE_EQUIPO, estado: 'activo', numero_participantes: PERSONAS.length })
      .select('id').single()
    if (error || !nuevo) { console.error('No se pudo crear el equipo:', error?.message); process.exit(1) }
    equipoId = nuevo.id
    console.log(`Equipo creado: "${NOMBRE_EQUIPO}" (${equipoId})`)
  }

  // Invitaciones
  const { data: invs, error: invErr } = await s.from('invitaciones')
    .insert(PERSONAS.map(p => ({ equipo_id: equipoId, nombre: p.nombre, email: p.email, area: p.area, enviado_at: new Date().toISOString() })))
    .select('id, email')
  if (invErr || !invs) { console.error('Error insertando invitaciones:', invErr?.message); process.exit(1) }
  const invByEmail = new Map(invs.map(i => [i.email, i.id]))

  // Participantes + respuestas
  const respuestas: { participante_id: string; pregunta_id: string; valor: number }[] = []
  const respondieron: string[] = []
  let nParticipantes = 0

  for (const persona of PERSONAS) {
    if (persona.estado === 'sin_iniciar') continue
    const rol: Rol = persona.perfil === 'equipo' ? 'A' : 'D'
    const rolesQueResponde: Rol[] = rol === 'A' ? ['A', 'C'] : ['D', 'B']
    const invId = invByEmail.get(persona.email)!

    const { data: part, error: partErr } = await s.from('participantes')
      .insert({ equipo_id: equipoId, rol, invitacion_id: invId }).select('id').single()
    if (partErr || !part) { console.error(`Error participante ${persona.nombre}:`, partErr?.message); continue }
    nParticipantes++

    let preguntasPersona = rolesQueResponde.flatMap(r => preguntasPorRol[r].map(q => ({ ...q, rol: r })))
    if (persona.estado === 'parcial') preguntasPersona = preguntasPersona.slice(0, Math.ceil(preguntasPersona.length / 2))

    for (const q of preguntasPersona) {
      respuestas.push({ participante_id: part.id, pregunta_id: q.id, valor: valorCerca(CENTROS[q.dimension_id][q.rol as Rol]) })
    }
    if (persona.estado === 'completo') respondieron.push(invId)
  }

  // Inserta respuestas en lotes
  for (let i = 0; i < respuestas.length; i += 500) {
    const { error } = await s.from('respuestas').insert(respuestas.slice(i, i + 500))
    if (error) { console.error('Error insertando respuestas:', error.message); process.exit(1) }
  }

  // Marca respondido_at en quienes completaron
  if (respondieron.length) {
    await s.from('invitaciones').update({ respondido_at: new Date().toISOString() }).in('id', respondieron)
  }

  // Links útiles
  const { data: eq } = await s.from('equipos').select('codigo_participacion, codigo_resultados').eq('id', equipoId).single()
  console.log(`\n✓ ${PERSONAS.length} invitaciones · ${nParticipantes} participantes · ${respuestas.length} respuestas`)
  console.log(`  Dashboard:    /r/${eq?.codigo_resultados}`)
  console.log(`  Participar:   /d/${eq?.codigo_participacion}/intake`)
  console.log(`  Respuestas:   /admin/${DID}/respuestas/${equipoId}`)
}

main()
