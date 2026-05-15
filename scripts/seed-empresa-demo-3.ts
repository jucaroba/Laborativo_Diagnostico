// Pobla el diagnóstico "Empresa Demo #3" (Equipo en Espejo) con 20
// participantes. Cada persona responde 24 preguntas (12 YO + 12 EQUIPO).
//
// Patrón diseñado: la persona se ve a sí misma mejor que como ve al equipo
// (clásico del espejo). Algunas dimensiones con brecha grande, otras chicas;
// una dimensión con dispersión alta en EQUIPO para mostrar polarización.
//
// Uso: npm run seed-empresa-demo-3

import { createClient } from '@supabase/supabase-js'

const DIAG_ID   = '5302a72a-fad4-4f15-9ffe-92a1c0a49356'
const EQUIPO_ID = 'c77a4320-b5d1-4360-a1a5-b9c4ba9fcde4'
const N_PARTICIPANTES = 20

type Persp = 'YO' | 'EQUIPO'

// Centro (promedio objetivo) por dimensión × perspectiva.
//   YO    = cómo me veo a mí mismo
//   EQUIPO = cómo veo al equipo
const CENTROS: Record<number, Record<Persp, number>> = {
  1: { YO: 8.0, EQUIPO: 7.0 }, // Intención    · brecha 1.0
  2: { YO: 7.5, EQUIPO: 5.5 }, // Motivación   · brecha 2.0
  3: { YO: 6.5, EQUIPO: 7.0 }, // Interacción  · brecha 0.5 (raro: veo al equipo mejor que yo)
  4: { YO: 7.0, EQUIPO: 4.0 }, // Acción       · brecha 3.0 ← la más grande
}

// Sigma controla la dispersión. Hacemos Acción/EQUIPO polarizada (>2.0).
const SIGMAS: Record<number, Record<Persp, number>> = {
  1: { YO: 1.4, EQUIPO: 1.5 },
  2: { YO: 1.5, EQUIPO: 1.7 },
  3: { YO: 1.6, EQUIPO: 1.5 },
  4: { YO: 1.4, EQUIPO: 2.5 }, // Acción / EQUIPO: polarizado
}

function generarValores(centro: number, n: number, sigma: number): number[] {
  const clamp = (v: number) => Math.max(1, Math.min(10, v))
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

  // Reset participantes previos
  const { count: existentes } = await sb
    .from('participantes').select('id', { count: 'exact', head: true })
    .eq('equipo_id', EQUIPO_ID)
  if ((existentes ?? 0) > 0) {
    console.log(`↻ borrando ${existentes} participantes previos…`)
    await sb.from('participantes').delete().eq('equipo_id', EQUIPO_ID)
  }

  const { data: preguntas, error: errPreg } = await sb
    .from('preguntas').select('id, dimension_id, rol')
    .eq('diagnostico_id', DIAG_ID)
  if (errPreg || !preguntas) throw new Error(errPreg?.message ?? 'sin preguntas')
  console.log(`\n✓ ${preguntas.length} preguntas cargadas para Empresa Demo #3 (Espejo)`)

  // Cada persona = 1 participante con rol 'YO' (convención del intake).
  // Responde sus 12 preguntas YO + sus 12 EQUIPO.
  const parts: string[] = []
  for (let i = 0; i < N_PARTICIPANTES; i++) {
    const { data, error } = await sb.from('participantes')
      .insert({ equipo_id: EQUIPO_ID, rol: 'YO' }).select('id').single()
    if (error || !data) throw new Error(error?.message ?? 'no se pudo crear participante')
    parts.push(data.id)
  }
  console.log(`✓ ${N_PARTICIPANTES} participantes creados`)

  const respuestas: { participante_id: string; pregunta_id: string; valor: number }[] = []

  for (let dim = 1; dim <= 4; dim++) {
    for (const persp of ['YO', 'EQUIPO'] as Persp[]) {
      const centro = CENTROS[dim][persp]
      const sigma = SIGMAS[dim][persp]
      const preguntasDim = preguntas.filter(p => p.dimension_id === dim && p.rol === persp)
      const total = preguntasDim.length * parts.length
      const valores = generarValores(centro, total, sigma)
      let idx = 0
      for (const partId of parts) {
        for (const preg of preguntasDim) {
          respuestas.push({ participante_id: partId, pregunta_id: preg.id, valor: valores[idx++] })
        }
      }
    }
  }

  console.log(`✓ ${respuestas.length} respuestas generadas (esperado: ${N_PARTICIPANTES} × 24 = ${N_PARTICIPANTES * 24})`)
  const CHUNK = 500
  for (let i = 0; i < respuestas.length; i += CHUNK) {
    const lote = respuestas.slice(i, i + CHUNK)
    const { error } = await sb.from('respuestas').insert(lote)
    if (error) throw new Error(error.message)
  }
  console.log(`✓ respuestas insertadas en BD\n`)

  // Reporte
  const idxPreg = new Map(preguntas.map(p => [p.id, p as { dimension_id: number; rol: string }]))
  type Cell = { suma: number; n: number; vals: number[] }
  const init = (): Cell => ({ suma: 0, n: 0, vals: [] })
  const acum: Record<number, { YO: Cell; EQUIPO: Cell }> = {
    1: { YO: init(), EQUIPO: init() },
    2: { YO: init(), EQUIPO: init() },
    3: { YO: init(), EQUIPO: init() },
    4: { YO: init(), EQUIPO: init() },
  }
  for (const r of respuestas) {
    const p = idxPreg.get(r.pregunta_id)
    if (!p) continue
    if (p.rol !== 'YO' && p.rol !== 'EQUIPO') continue
    acum[p.dimension_id][p.rol as Persp].suma += r.valor
    acum[p.dimension_id][p.rol as Persp].n += 1
    acum[p.dimension_id][p.rol as Persp].vals.push(r.valor)
  }
  const stats = (c: Cell) => {
    const prom = c.suma / c.n
    const variance = c.vals.reduce((s, v) => s + (v - prom) ** 2, 0) / c.n
    return { prom: Math.round(prom * 10) / 10, sd: Math.round(Math.sqrt(variance) * 10) / 10 }
  }
  const dims = ['', 'Intención', 'Motivación', 'Interacción', 'Acción']
  console.log('Promedios resultantes (YO vs EQUIPO):')
  for (let dim = 1; dim <= 4; dim++) {
    const y = stats(acum[dim].YO)
    const e = stats(acum[dim].EQUIPO)
    const delta = Math.round(Math.abs(y.prom - e.prom) * 10) / 10
    console.log(`  ${dim} · ${dims[dim].padEnd(12)} · YO=${y.prom}±${y.sd}  EQUIPO=${e.prom}±${e.sd}  Δ=${delta}`)
  }
  console.log('\nDashboard: https://diagnostico.laborativo.com/r/48f41798')
}

main().catch(err => { console.error('Error:', err); process.exit(1) })
