// ─────────────────────────────────────────────────────────────
// Helpers para calcular resultados por dimensión.
// Pensados para Pulso, Termómetro y Espejo (tipos sin perfil).
// Sirven tanto para el diagnóstico actual como para el padre,
// cuando hay una ronda anterior con la que comparar.
// ─────────────────────────────────────────────────────────────

import { supabase } from '@/lib/supabase'
import { DIMENSIONES, type TipoDiagnostico } from '@/types'

export type DimSimple = {
  id: number
  nombre: string
  subtitulo: string
  promedio: number | null
  desviacion: number
  n: number
}

export type DimEspejo = {
  id: number
  nombre: string
  subtitulo: string
  yo: { promedio: number | null; desviacion: number; n: number }
  equipo: { promedio: number | null; desviacion: number; n: number }
  delta: number
}

type PreguntaMin = { id: string; dimension_id: number; rol: string }
type RespuestaMin = { pregunta_id: string; valor: number }

const round1 = (n: number) => Math.round(n * 10) / 10

// ─── Cálculo a partir de datos ya cargados ─────────────────────

export function calcSimpleFromData(
  preguntas: PreguntaMin[],
  respuestas: RespuestaMin[],
): DimSimple[] {
  const porDim: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [] }
  for (const r of respuestas) {
    const pq = preguntas.find(p => p.id === r.pregunta_id)
    if (!pq) continue
    if (porDim[pq.dimension_id]) porDim[pq.dimension_id].push(r.valor)
  }
  return DIMENSIONES.map(d => {
    const vals = porDim[d.id]
    if (!vals.length) return { id: d.id, nombre: d.nombre, subtitulo: d.subtitulo, promedio: null, desviacion: 0, n: 0 }
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length
    const variance = vals.reduce((s, v) => s + (v - avg) ** 2, 0) / vals.length
    return {
      id: d.id,
      nombre: d.nombre,
      subtitulo: d.subtitulo,
      promedio: round1(avg),
      desviacion: round1(Math.sqrt(variance)),
      n: vals.length,
    }
  })
}

export function calcEspejoFromData(
  preguntas: PreguntaMin[],
  respuestas: RespuestaMin[],
): DimEspejo[] {
  type Bucket = { suma: number; n: number; valores: number[] }
  const init = (): Bucket => ({ suma: 0, n: 0, valores: [] })
  const acum: Record<number, { YO: Bucket; EQUIPO: Bucket }> = {
    1: { YO: init(), EQUIPO: init() },
    2: { YO: init(), EQUIPO: init() },
    3: { YO: init(), EQUIPO: init() },
    4: { YO: init(), EQUIPO: init() },
  }
  for (const r of respuestas) {
    const pq = preguntas.find(p => p.id === r.pregunta_id)
    if (!pq) continue
    const persp = pq.rol === 'YO' ? 'YO' : pq.rol === 'EQUIPO' ? 'EQUIPO' : null
    if (!persp) continue
    const bucket = acum[pq.dimension_id]?.[persp]
    if (!bucket) continue
    bucket.suma += r.valor
    bucket.n += 1
    bucket.valores.push(r.valor)
  }
  const stats = (b: Bucket) => {
    if (b.n === 0) return { promedio: null as number | null, desviacion: 0, n: 0 }
    const avg = b.suma / b.n
    const variance = b.valores.reduce((s, v) => s + (v - avg) ** 2, 0) / b.n
    return { promedio: round1(avg), desviacion: round1(Math.sqrt(variance)), n: b.n }
  }
  return DIMENSIONES.map(d => {
    const yo = stats(acum[d.id].YO)
    const equipo = stats(acum[d.id].EQUIPO)
    const delta = (yo.promedio !== null && equipo.promedio !== null)
      ? round1(Math.abs(yo.promedio - equipo.promedio))
      : 0
    return { id: d.id, nombre: d.nombre, subtitulo: d.subtitulo, yo, equipo, delta }
  })
}

// ─── Fetch + cálculo (para el diagnóstico padre) ───────────────

export async function fetchYCalcSimple(diagnosticoId: string): Promise<DimSimple[] | null> {
  const { preguntas, respuestas } = await fetchPreguntasYRespuestas(diagnosticoId)
  if (!preguntas.length) return null
  return calcSimpleFromData(preguntas, respuestas)
}

export async function fetchYCalcEspejo(diagnosticoId: string): Promise<DimEspejo[] | null> {
  const { preguntas, respuestas } = await fetchPreguntasYRespuestas(diagnosticoId)
  if (!preguntas.length) return null
  return calcEspejoFromData(preguntas, respuestas)
}

// ─── Benchmark Laborativo ─────────────────────────────────────
// Promedio histórico por dimensión sobre todos los OTROS
// diagnósticos del mismo tipo (excluye el diag actual).
// Devuelve null si no hay datos suficientes.

export type Benchmark<T> = {
  resultados: T
  nDiagnosticos: number
}

async function fetchPreguntasYRespuestasDeTipo(tipo: TipoDiagnostico, excluirId: string) {
  const { data: diags } = await supabase
    .from('diagnosticos')
    .select('id')
    .eq('tipo', tipo)
    .neq('id', excluirId)
    .in('estado', ['activo', 'completado'])

  const diagIds = (diags ?? []).map(d => d.id)
  if (!diagIds.length) {
    return { preguntas: [] as PreguntaMin[], respuestas: [] as RespuestaMin[], nDiagnosticos: 0 }
  }

  const { data: preguntas } = await supabase
    .from('preguntas')
    .select('id, dimension_id, rol')
    .in('diagnostico_id', diagIds)

  const { data: participantes } = await supabase
    .from('participantes')
    .select('id')
    .in('diagnostico_id', diagIds)

  const partIds = (participantes ?? []).map(p => p.id)
  const { data: respuestas } = partIds.length > 0
    ? await supabase
        .from('respuestas')
        .select('pregunta_id, valor')
        .in('participante_id', partIds)
    : { data: [] as RespuestaMin[] }

  return {
    preguntas: (preguntas ?? []) as PreguntaMin[],
    respuestas: (respuestas ?? []) as RespuestaMin[],
    nDiagnosticos: diagIds.length,
  }
}

export async function fetchBenchmarkSimple(tipo: TipoDiagnostico, excluirId: string): Promise<Benchmark<DimSimple[]> | null> {
  const { preguntas, respuestas, nDiagnosticos } = await fetchPreguntasYRespuestasDeTipo(tipo, excluirId)
  if (nDiagnosticos === 0) return null
  return { resultados: calcSimpleFromData(preguntas, respuestas), nDiagnosticos }
}

export async function fetchBenchmarkEspejo(tipo: TipoDiagnostico, excluirId: string): Promise<Benchmark<DimEspejo[]> | null> {
  const { preguntas, respuestas, nDiagnosticos } = await fetchPreguntasYRespuestasDeTipo(tipo, excluirId)
  if (nDiagnosticos === 0) return null
  return { resultados: calcEspejoFromData(preguntas, respuestas), nDiagnosticos }
}

async function fetchPreguntasYRespuestas(diagnosticoId: string) {
  const { data: preguntas } = await supabase
    .from('preguntas')
    .select('id, dimension_id, rol')
    .eq('diagnostico_id', diagnosticoId)

  const { data: participantes } = await supabase
    .from('participantes')
    .select('id')
    .eq('diagnostico_id', diagnosticoId)

  const partIds = (participantes ?? []).map(p => p.id)
  const { data: respuestas } = partIds.length > 0
    ? await supabase
        .from('respuestas')
        .select('pregunta_id, valor')
        .in('participante_id', partIds)
    : { data: [] as RespuestaMin[] }

  return { preguntas: (preguntas ?? []) as PreguntaMin[], respuestas: (respuestas ?? []) as RespuestaMin[] }
}
