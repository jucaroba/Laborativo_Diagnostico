// Pobla el diagnóstico "Empresa Demo" con respuestas simuladas:
//   - 23 participantes con rol A (equipo) → responden A + C
//   -  1 participante  con rol D (líder)  → responden D + B
//
// Centros de promedio diseñados para que:
//   - La dimensión con promedio más bajo sea Acción.
//   - La brecha mínima sea Motivación (1.5).
//   - La brecha máxima sea Acción (5.2).
//
// Uso:
//   npm run seed-empresa-demo

import { createClient } from '@supabase/supabase-js'

const DIAG_ID   = 'f4044717-d350-47b1-95b2-4f31e3e37137'
const EQUIPO_ID = '687cd7e1-2fac-4574-8a96-2cad6243092e'

type Rol = 'A' | 'B' | 'C' | 'D'

// Centros (promedio objetivo) por dimensión × rol.
// dim 1 = Intención, 2 = Motivación, 3 = Interacción, 4 = Acción
const CENTROS: Record<number, Record<Rol, number>> = {
  1: { A: 7.0, B: 8.0, C: 6.5, D: 8.2 },  // brecha ≈ 1.7
  2: { A: 6.8, B: 7.8, C: 6.5, D: 8.0 },  // brecha 1.5 ← MÍN
  3: { A: 5.5, B: 7.5, C: 4.5, D: 8.0 },  // brecha 3.5
  4: { A: 3.5, B: 4.5, C: 2.5, D: 7.7 },  // brecha 5.2 ← MÁX · promedio más bajo
}

// Devuelve n valores enteros 1-10 cuyo promedio se aproxime a `centro`:
// mezcla floor(centro) y ceil(centro) en la proporción que minimiza el sesgo.
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
  // Shuffle para que los valores no queden agrupados al asignarlos.
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

  // 1) Cargar preguntas del diagnóstico
  const { data: preguntas, error: errPreg } = await sb
    .from('preguntas').select('id, dimension_id, rol')
    .eq('diagnostico_id', DIAG_ID)
  if (errPreg || !preguntas) throw new Error(errPreg?.message ?? 'sin preguntas')

  type Preg = { id: string; dimension_id: number; rol: Rol }
  const ps = preguntas as Preg[]

  console.log(`\n✓ ${ps.length} preguntas cargadas para Empresa Demo`)

  // 2) Crear 23 participantes con rol A
  const partsA: string[] = []
  for (let i = 0; i < 23; i++) {
    const { data, error } = await sb.from('participantes')
      .insert({ equipo_id: EQUIPO_ID, rol: 'A' }).select('id').single()
    if (error || !data) throw new Error(error?.message ?? 'no se pudo crear participante A')
    partsA.push(data.id)
  }
  console.log(`✓ 23 participantes con rol A creados`)

  // 3) Crear 1 participante con rol D
  const { data: partDRow, error: errD } = await sb.from('participantes')
    .insert({ equipo_id: EQUIPO_ID, rol: 'D' }).select('id').single()
  if (errD || !partDRow) throw new Error(errD?.message ?? 'no se pudo crear participante D')
  const partD = partDRow.id
  console.log(`✓ 1 participante con rol D creado`)

  // 4) Por cada (dimensión × rol) generar valores y asignarlos a las
  //    combinaciones (participante × pregunta).
  const respuestas: { participante_id: string; pregunta_id: string; valor: number }[] = []

  for (let dim = 1; dim <= 4; dim++) {
    for (const rol of ['A', 'B', 'C', 'D'] as Rol[]) {
      const centro = CENTROS[dim][rol]
      const preguntasDim = ps.filter(p => p.dimension_id === dim && p.rol === rol)
      // A y C los responden los 23 participantes de equipo;
      // B y D los responde el 1 participante líder.
      const participantes = rol === 'A' || rol === 'C' ? partsA : [partD]
      const total = preguntasDim.length * participantes.length
      if (total === 0) continue
      const valores = generarValores(centro, total)
      let idx = 0
      for (const partId of participantes) {
        for (const preg of preguntasDim) {
          respuestas.push({ participante_id: partId, pregunta_id: preg.id, valor: valores[idx++] })
        }
      }
    }
  }

  console.log(`✓ ${respuestas.length} respuestas generadas (esperado: 23×24 + 1×24 = ${23 * 24 + 1 * 24})`)

  // 5) Insertar en lotes (Supabase impone límite por request)
  const CHUNK = 500
  for (let i = 0; i < respuestas.length; i += CHUNK) {
    const lote = respuestas.slice(i, i + CHUNK)
    const { error } = await sb.from('respuestas').insert(lote)
    if (error) throw new Error(error.message)
  }
  console.log(`✓ respuestas insertadas en BD\n`)

  // 6) Reporte de promedios reales obtenidos (para sanity-check)
  const acum: Record<number, Record<Rol, { suma: number; n: number }>> = {
    1: { A: { suma: 0, n: 0 }, B: { suma: 0, n: 0 }, C: { suma: 0, n: 0 }, D: { suma: 0, n: 0 } },
    2: { A: { suma: 0, n: 0 }, B: { suma: 0, n: 0 }, C: { suma: 0, n: 0 }, D: { suma: 0, n: 0 } },
    3: { A: { suma: 0, n: 0 }, B: { suma: 0, n: 0 }, C: { suma: 0, n: 0 }, D: { suma: 0, n: 0 } },
    4: { A: { suma: 0, n: 0 }, B: { suma: 0, n: 0 }, C: { suma: 0, n: 0 }, D: { suma: 0, n: 0 } },
  }
  const idxPreg = new Map(ps.map(p => [p.id, p]))
  for (const r of respuestas) {
    const p = idxPreg.get(r.pregunta_id)
    if (!p) continue
    acum[p.dimension_id][p.rol].suma += r.valor
    acum[p.dimension_id][p.rol].n += 1
  }
  const dims = ['', 'Intención', 'Motivación', 'Interacción', 'Acción']
  const round1 = (n: number) => Math.round(n * 10) / 10
  console.log('Promedios resultantes por dimensión / rol:')
  for (let dim = 1; dim <= 4; dim++) {
    const A = round1(acum[dim].A.suma / acum[dim].A.n)
    const B = round1(acum[dim].B.suma / acum[dim].B.n)
    const C = round1(acum[dim].C.suma / acum[dim].C.n)
    const D = round1(acum[dim].D.suma / acum[dim].D.n)
    const min = Math.min(A, B, C, D)
    const max = Math.max(A, B, C, D)
    const brecha = round1(max - min)
    const promedioDim = round1((A + B + C + D) / 4)
    console.log(`  ${dim} · ${dims[dim].padEnd(12)} · A=${A} B=${B} C=${C} D=${D} · prom=${promedioDim} · Δ=${brecha}`)
  }
  console.log('\nDashboard:', `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/r/6febd2ff`)
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
