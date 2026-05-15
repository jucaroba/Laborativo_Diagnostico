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

// Sigma por dimensión: controla la dispersión de las respuestas. Subimos
// el sigma de Interacción para conseguir una dispersión > 2.0 (equipo
// dividido / banda roja).
const SIGMAS: Record<number, number> = {
  1: 1.5, // Intención    → dispersión ~1.5 (notable)
  2: 1.5, // Motivación   → dispersión ~1.5 (notable)
  3: 2.6, // Interacción  → dispersión > 2.0 (dividido)
  4: 1.6, // Acción       → dispersión ~1.6 (notable)
}

// Generador con DISPERSIÓN real. Antes mezclaba sólo floor y ceil del centro
// (rango ±1, casi sin variación). Ahora genera valores con distribución
// gaussiana alrededor del centro, con σ configurable, y al final corrige
// algunos valores para que la suma cuadre y el promedio quede ~exacto.
function generarValores(centro: number, n: number, sigma = 1.6): number[] {
  const clamp = (v: number) => Math.max(1, Math.min(10, v))
  // Box-Muller para gaussiana standard
  const gauss = () => {
    let u = 0, v = 0
    while (u === 0) u = Math.random()
    while (v === 0) v = Math.random()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }
  const arr: number[] = []
  for (let i = 0; i < n; i++) {
    arr.push(clamp(Math.round(centro + gauss() * sigma)))
  }
  // Ajuste fino: si la suma se alejó del objetivo, empuja unos valores
  // 1 unidad arriba o abajo hasta acercarse (sin salir de 1..10).
  const objetivo = Math.round(centro * n)
  let intentos = 0
  while (intentos < 200) {
    const sumaActual = arr.reduce((a, b) => a + b, 0)
    const diff = objetivo - sumaActual
    if (Math.abs(diff) <= Math.max(1, Math.floor(n / 50))) break
    const idx = Math.floor(Math.random() * n)
    const nuevo = clamp(arr[idx] + Math.sign(diff))
    if (nuevo !== arr[idx]) arr[idx] = nuevo
    intentos += 1
  }
  // Shuffle final
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

  // Reset: borra participantes existentes del equipo. ON DELETE CASCADE
  // limpia respuestas automáticamente.
  const { count: existentes } = await sb
    .from('participantes')
    .select('id', { count: 'exact', head: true })
    .eq('equipo_id', EQUIPO_ID)
  if ((existentes ?? 0) > 0) {
    console.log(`↻ borrando ${existentes} participantes previos (y sus respuestas en cascada)…`)
    await sb.from('participantes').delete().eq('equipo_id', EQUIPO_ID)
  }

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
    const sigma = SIGMAS[dim]
    const preguntasDim = preguntas.filter(p => p.dimension_id === dim && p.rol === 'X')
    const total = preguntasDim.length * partsX.length
    const valores = generarValores(centro, total, sigma)
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
