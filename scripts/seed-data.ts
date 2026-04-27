import { createClient } from '@supabase/supabase-js'

type Rol = 'A' | 'B' | 'C' | 'D'
type Perfil = 'alineado' | 'brecha-liderazgo' | 'bajo' | 'mixto'

// Centros por perfil → [dim1, dim2, dim3, dim4] por rol
const PERFILES: Record<Perfil, Record<Rol, [number, number, number, number]>> = {
  alineado: {
    A: [7, 7, 7, 7],
    B: [7, 7, 7, 7],
    C: [7, 7, 7, 7],
    D: [7, 7, 7, 7],
  },
  'brecha-liderazgo': {
    A: [7, 5, 4, 7],
    B: [8, 8, 9, 7],
    C: [6, 4, 3, 6],
    D: [8, 9, 9, 8],
  },
  bajo: {
    A: [4, 4, 4, 4],
    B: [4, 4, 4, 4],
    C: [4, 4, 4, 4],
    D: [4, 4, 4, 4],
  },
  mixto: {
    A: [7, 7, 4, 7],
    B: [7, 7, 9, 7],
    C: [7, 7, 3, 7],
    D: [7, 7, 9, 7],
  },
}

// Composición por personas reales: cada equipo responde perspectivas A+C, cada líder D+B
const COMPOSICION_DEFAULT = { equipo: 6, lider: 1 }

function clamp(n: number, min = 1, max = 10) {
  return Math.max(min, Math.min(max, n))
}

function randomScore(center: number, jitter = 1.2): number {
  // Distribución alrededor del centro con ruido gaussiano simple
  const noise = (Math.random() + Math.random() + Math.random() - 1.5) * jitter
  return clamp(Math.round(center + noise))
}

function parseArgs() {
  const args = process.argv.slice(2)
  const codigo = args.find(a => !a.startsWith('--'))
  const perfilFlag = args.find(a => a.startsWith('--perfil='))
  const perfil = (perfilFlag?.split('=')[1] as Perfil) ?? 'brecha-liderazgo'
  const reset = args.includes('--reset')

  if (!codigo) {
    console.error('Uso: npm run seed -- <codigo_participacion> [--perfil=alineado|brecha-liderazgo|bajo|mixto] [--reset]')
    process.exit(1)
  }
  if (!(perfil in PERFILES)) {
    console.error(`Perfil inválido: ${perfil}. Usa: ${Object.keys(PERFILES).join(', ')}`)
    process.exit(1)
  }
  return { codigo, perfil, reset }
}

async function main() {
  const { codigo, perfil, reset } = parseArgs()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o claves de Supabase en .env.local')
    process.exit(1)
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠ Usando anon key (RLS bloquea --reset). Agrega SUPABASE_SERVICE_ROLE_KEY a .env.local para reset.')
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } })

  const { data: diag, error: diagErr } = await supabase
    .from('diagnosticos')
    .select('id, nombre_compania, estado')
    .eq('codigo_participacion', codigo)
    .single()

  if (diagErr || !diag) {
    console.error(`Diagnóstico no encontrado para código: ${codigo}`)
    process.exit(1)
  }

  console.log(`→ ${diag.nombre_compania} · estado: ${diag.estado}`)

  const { data: preguntas } = await supabase
    .from('preguntas')
    .select('id, dimension_id, rol')
    .eq('diagnostico_id', diag.id)

  if (!preguntas || preguntas.length === 0) {
    console.error('No hay preguntas para este diagnóstico. Genera o carga las preguntas en /admin antes de seedearlo.')
    process.exit(1)
  }

  console.log(`→ ${preguntas.length} preguntas en este diagnóstico`)

  if (reset) {
    const { data: previos } = await supabase.from('participantes').select('id').eq('diagnostico_id', diag.id)
    if (previos && previos.length > 0) {
      const { error } = await supabase.from('participantes').delete().in('id', previos.map(p => p.id))
      if (error) {
        console.error('Error reseteando participantes:', error)
        process.exit(1)
      }
      const { data: restantes } = await supabase.from('participantes').select('id').eq('diagnostico_id', diag.id)
      if (restantes && restantes.length > 0) {
        console.error(`Reset bloqueado: quedaron ${restantes.length} participantes (probablemente RLS). Verifica SUPABASE_SERVICE_ROLE_KEY.`)
        process.exit(1)
      }
      console.log(`→ Eliminados ${previos.length} participantes previos (cascadea respuestas)`)
    }
  }

  const preguntasPorRol: Record<Rol, { id: string; dimension_id: number }[]> = { A: [], B: [], C: [], D: [] }
  for (const p of preguntas) preguntasPorRol[p.rol as Rol].push({ id: p.id, dimension_id: p.dimension_id })

  const config = PERFILES[perfil]
  let totalP = 0
  let totalR = 0

  // Pares de perspectivas según perfil de intake
  const personas: { perfilIntake: 'equipo' | 'lider'; rolParticipante: Rol; rolesRespuesta: Rol[] }[] = [
    ...Array(COMPOSICION_DEFAULT.equipo).fill(null).map(() => ({ perfilIntake: 'equipo' as const, rolParticipante: 'A' as Rol, rolesRespuesta: ['A', 'C'] as Rol[] })),
    ...Array(COMPOSICION_DEFAULT.lider).fill(null).map(() => ({ perfilIntake: 'lider' as const, rolParticipante: 'D' as Rol, rolesRespuesta: ['D', 'B'] as Rol[] })),
  ]

  for (const persona of personas) {
    const { data: part, error: pErr } = await supabase
      .from('participantes')
      .insert({ diagnostico_id: diag.id, rol: persona.rolParticipante })
      .select('id')
      .single()

    if (pErr || !part) {
      console.error(`Error creando participante ${persona.perfilIntake}:`, pErr)
      process.exit(1)
    }

    const respuestas: { participante_id: string; pregunta_id: string; valor: number }[] = []
    for (const rol of persona.rolesRespuesta) {
      for (const q of preguntasPorRol[rol]) {
        respuestas.push({
          participante_id: part.id,
          pregunta_id: q.id,
          valor: randomScore(config[rol][q.dimension_id - 1]),
        })
      }
    }

    const { error: rErr } = await supabase.from('respuestas').insert(respuestas)
    if (rErr) {
      console.error('Error creando respuestas:', rErr)
      process.exit(1)
    }

    totalP++
    totalR += respuestas.length
  }

  console.log(`✓ Insertados ${totalP} participantes (${COMPOSICION_DEFAULT.equipo} equipo + ${COMPOSICION_DEFAULT.lider} líder) y ${totalR} respuestas con perfil "${perfil}"`)
}

main().catch(e => { console.error(e); process.exit(1) })
