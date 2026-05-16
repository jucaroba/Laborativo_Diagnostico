// Pobla el diagnóstico "Empresa Demo #4" (Termómetro de 4) con 88
// participantes. Cada persona responde 4 preguntas (una por dimensión,
// rol X). Es el cuestionario más corto del catálogo.
//
// Patrón diseñado: gradiente claro de bueno→malo entre dimensiones,
// con una dispersión polarizada en Acción.
//
// Uso: npm run seed-empresa-demo-4

import { createClient } from '@supabase/supabase-js'

const DIAG_ID   = '5b8ddc38-df94-471b-b3cf-a349378f5dbe'
const EQUIPO_ID = 'd163a667-4cf0-4bde-af34-af5ab1d28cee'
const N_PARTICIPANTES = 88

const CENTROS: Record<number, number> = {
  1: 7.5, // Intención    · alto
  2: 6.5, // Motivación   · medio-alto
  3: 5.5, // Interacción  · medio
  4: 4.5, // Acción       · medio-bajo
}

const SIGMAS: Record<number, number> = {
  1: 1.5, // notable
  2: 1.6, // notable
  3: 1.7, // notable
  4: 2.5, // polarizado (banda roja)
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
  for (let i = 0; i < n; i++) arr.push(clamp(Math.round(centro + gauss() * sigma)))
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

  const { count: existentes } = await sb
    .from('participantes').select('id', { count: 'exact', head: true })
    .eq('equipo_id', EQUIPO_ID)
  if ((existentes ?? 0) > 0) {
    console.log(`↻ borrando ${existentes} participantes previos…`)
    await sb.from('participantes').delete().eq('equipo_id', EQUIPO_ID)
  }

  const { data: preguntas, error: errPreg } = await sb
    .from('preguntas').select('id, dimension_id, rol').eq('diagnostico_id', DIAG_ID)
  if (errPreg || !preguntas) throw new Error(errPreg?.message ?? 'sin preguntas')
  console.log(`\n✓ ${preguntas.length} preguntas cargadas para Empresa Demo #4 (Termómetro)`)

  const parts: string[] = []
  for (let i = 0; i < N_PARTICIPANTES; i++) {
    const { data, error } = await sb.from('participantes')
      .insert({ equipo_id: EQUIPO_ID, rol: 'X' }).select('id').single()
    if (error || !data) throw new Error(error?.message ?? 'no se pudo crear participante')
    parts.push(data.id)
  }
  console.log(`✓ ${N_PARTICIPANTES} participantes con rol X creados`)

  const respuestas: { participante_id: string; pregunta_id: string; valor: number }[] = []
  for (let dim = 1; dim <= 4; dim++) {
    const preguntasDim = preguntas.filter(p => p.dimension_id === dim && p.rol === 'X')
    const total = preguntasDim.length * parts.length
    const valores = generarValores(CENTROS[dim], total, SIGMAS[dim])
    let idx = 0
    for (const partId of parts) {
      for (const preg of preguntasDim) {
        respuestas.push({ participante_id: partId, pregunta_id: preg.id, valor: valores[idx++] })
      }
    }
  }
  console.log(`✓ ${respuestas.length} respuestas generadas (esperado: ${N_PARTICIPANTES} × 4 = ${N_PARTICIPANTES * 4})`)

  const CHUNK = 500
  for (let i = 0; i < respuestas.length; i += CHUNK) {
    const { error } = await sb.from('respuestas').insert(respuestas.slice(i, i + CHUNK))
    if (error) throw new Error(error.message)
  }
  console.log(`✓ respuestas insertadas en BD\n`)

  // Reporte
  const idxPreg = new Map(preguntas.map(p => [p.id, p as { dimension_id: number }]))
  const acum: Record<number, { suma: number; n: number; vals: number[] }> = {
    1: { suma: 0, n: 0, vals: [] }, 2: { suma: 0, n: 0, vals: [] },
    3: { suma: 0, n: 0, vals: [] }, 4: { suma: 0, n: 0, vals: [] },
  }
  for (const r of respuestas) {
    const p = idxPreg.get(r.pregunta_id)
    if (!p) continue
    acum[p.dimension_id].suma += r.valor
    acum[p.dimension_id].n += 1
    acum[p.dimension_id].vals.push(r.valor)
  }
  const dims = ['', 'Intención', 'Motivación', 'Interacción', 'Acción']
  console.log('Resultados:')
  for (let dim = 1; dim <= 4; dim++) {
    const prom = acum[dim].suma / acum[dim].n
    const variance = acum[dim].vals.reduce((s, v) => s + (v - prom) ** 2, 0) / acum[dim].n
    const sd = Math.sqrt(variance)
    console.log(`  ${dim} · ${dims[dim].padEnd(12)} · X=${prom.toFixed(1)}±${sd.toFixed(1)}`)
  }
  console.log('\nDashboard: https://diagnostico.laborativo.com/r/050048bb')
}

main().catch(err => { console.error('Error:', err); process.exit(1) })
