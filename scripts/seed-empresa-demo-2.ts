// Pobla el diagnóstico "Empresa Demo #2" (Pulso Colectivo) con
// 36 participantes con rol X (rol único del pulso, todos responden
// lo mismo). Diseña una distribución con variación entre dimensiones
// para que el dashboard se vea con contenido real:
//
//   Intención    → 7.5 (alto)
//   Motivación   → 6.8 (medio-alto)
//   Interacción  → 5.5 (medio-bajo)
//   Acción       → 4.0 (bajo)
//
// Uso: npm run seed-empresa-demo-2

import { createClient } from '@supabase/supabase-js'

const DIAG_ID   = '59c474fe-4076-4ac7-bb58-15f4f29707cf'
const EQUIPO_ID = '0dab182b-dbce-4d86-a356-9ad2f303a899'
const N_PARTICIPANTES = 36

// Centro (promedio objetivo) por dimensión. Una sola perspectiva (X).
const CENTROS: Record<number, number> = {
  1: 7.5, // Intención
  2: 6.8, // Motivación
  3: 5.5, // Interacción
  4: 4.0, // Acción
}

function generarValores(centro: number, n: number): number[] {
  const clamp = (v: number) => Math.max(1, Math.min(10, v))
  const floor = clamp(Math.floor(centro))
  const ceil  = clamp(Math.ceil(centro))
  const fraction = centro - Math.floor(centro)
  const nCeil = Math.round(fraction * n)
  const nFloor = n - nCeil
  const arr = [
    ...Array(nFloor).fill(floor),
    ...Array(nCeil).fill(ceil),
  ]
  // Shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
    process.exit(1)
  }
  const sb = createClient(url, key, { auth: { persistSession: false } })

  const { data: preguntas, error: errPreg } = await sb
    .from('preguntas').select('id, dimension_id, rol')
    .eq('diagnostico_id', DIAG_ID)
  if (errPreg || !preguntas) throw new Error(errPreg?.message ?? 'sin preguntas')

  console.log(`\n✓ ${preguntas.length} preguntas cargadas para Empresa Demo #2 (Pulso)`)

  const partsX: string[] = []
  for (let i = 0; i < N_PARTICIPANTES; i++) {
    const { data, error } = await sb.from('participantes')
      .insert({ equipo_id: EQUIPO_ID, rol: 'X' }).select('id').single()
    if (error || !data) throw new Error(error?.message ?? 'no se pudo crear participante X')
    partsX.push(data.id)
  }
  console.log(`✓ ${N_PARTICIPANTES} participantes con rol X creados`)

  const respuestas: { participante_id: string; pregunta_id: string; valor: number }[] = []
  for (let dim = 1; dim <= 4; dim++) {
    const centro = CENTROS[dim]
    const preguntasDim = preguntas.filter(p => p.dimension_id === dim && p.rol === 'X')
    const total = preguntasDim.length * partsX.length
    const valores = generarValores(centro, total)
    let idx = 0
    for (const partId of partsX) {
      for (const preg of preguntasDim) {
        respuestas.push({ participante_id: partId, pregunta_id: preg.id, valor: valores[idx++] })
      }
    }
  }

  console.log(`✓ ${respuestas.length} respuestas generadas (esperado: ${N_PARTICIPANTES} × 12 = ${N_PARTICIPANTES * 12})`)

  const CHUNK = 500
  for (let i = 0; i < respuestas.length; i += CHUNK) {
    const lote = respuestas.slice(i, i + CHUNK)
    const { error } = await sb.from('respuestas').insert(lote)
    if (error) throw new Error(error.message)
  }
  console.log(`✓ respuestas insertadas en BD\n`)

  // Reporte
  const acum: Record<number, { suma: number; n: number }> = {
    1: { suma: 0, n: 0 }, 2: { suma: 0, n: 0 }, 3: { suma: 0, n: 0 }, 4: { suma: 0, n: 0 },
  }
  const idxPreg = new Map(preguntas.map(p => [p.id, p as { dimension_id: number }]))
  for (const r of respuestas) {
    const p = idxPreg.get(r.pregunta_id)
    if (!p) continue
    acum[p.dimension_id].suma += r.valor
    acum[p.dimension_id].n += 1
  }
  const dims = ['', 'Intención', 'Motivación', 'Interacción', 'Acción']
  const round1 = (n: number) => Math.round(n * 10) / 10
  console.log('Promedios resultantes por dimensión:')
  for (let dim = 1; dim <= 4; dim++) {
    const prom = round1(acum[dim].suma / acum[dim].n)
    console.log(`  ${dim} · ${dims[dim].padEnd(12)} · X=${prom}`)
  }
  console.log('\nDashboard: https://diagnostico.laborativo.com/r/802225a5')
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
