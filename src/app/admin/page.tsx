import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Diagnostico, Rol } from '@/types'
import { buttonVariants } from '@/components/ui/button'
import TablaDiagnosticos from '@/components/admin/TablaDiagnosticos'
import { TIPOS_DIAGNOSTICO } from '@/lib/tipos-diagnostico'

export const revalidate = 0

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const fechaCorta = (iso: string) => {
  const d = new Date(iso)
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

// Supabase corta en 1000 filas por defecto. Para conteos agregados (respuestas,
// participantes…) necesitamos TODAS las filas, así que paginamos con .range().
// El orden por una columna única (id) hace la paginación determinista.
async function fetchAllRows<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null }>,
): Promise<T[]> {
  const PAGE = 1000
  const out: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data } = await build(from, from + PAGE - 1)
    const rows = data ?? []
    out.push(...rows)
    if (rows.length < PAGE) break
  }
  return out
}

export default async function AdminPage() {
  const { data: diagnosticosRaw } = await supabase
    .from('diagnosticos').select('*').order('created_at', { ascending: false })

  const diagnosticos = (diagnosticosRaw ?? []) as Diagnostico[]
  const diagIds = diagnosticos.map(d => d.id)
  const equipos = diagIds.length > 0
    ? await fetchAllRows<{ id: string; diagnostico_id: string; estado: string; numero_participantes: number | null }>(
        (from, to) => supabase.from('equipos').select('id, diagnostico_id, estado, numero_participantes').in('diagnostico_id', diagIds).order('id').range(from, to))
    : []

  // Agregados por compañía: nº equipos, conteo por estado y total invitados
  const porCompania: Record<string, { n: number; activos: number; completados: number; invitados: number }> = {}
  for (const eq of equipos ?? []) {
    const cur = porCompania[eq.diagnostico_id] ?? { n: 0, activos: 0, completados: 0, invitados: 0 }
    cur.n += 1
    if (eq.estado === 'activo') cur.activos += 1
    if (eq.estado === 'completado') cur.completados += 1
    cur.invitados += eq.numero_participantes ?? 0
    porCompania[eq.diagnostico_id] = cur
  }

  // Cuántos cuestionarios completos hay por compañía. Cargamos preguntas
  // (agrupadas por compañía + rol), participantes (por equipo) y respuestas;
  // un participante cuenta como "completado" si respondió todas las preguntas
  // de su rol (A → A+C, D → D+B, X/YO/EQUIPO → su propio rol).
  const equipoIds = (equipos ?? []).map(e => e.id)
  const equipoToDiag: Record<string, string> = {}
  for (const eq of equipos ?? []) equipoToDiag[eq.id] = eq.diagnostico_id

  const preguntasRows = diagIds.length > 0
    ? await fetchAllRows<{ id: string; diagnostico_id: string; rol: Rol }>(
        (from, to) => supabase.from('preguntas').select('id, diagnostico_id, rol').in('diagnostico_id', diagIds).order('id').range(from, to))
    : []

  // preguntasPorDiag[diagId][rol] = Set<preguntaId>
  const preguntasPorDiag: Record<string, Record<Rol, Set<string>>> = {}
  for (const p of preguntasRows ?? []) {
    if (!preguntasPorDiag[p.diagnostico_id]) {
      preguntasPorDiag[p.diagnostico_id] = { A: new Set(), B: new Set(), C: new Set(), D: new Set(), X: new Set(), YO: new Set(), EQUIPO: new Set() }
    }
    preguntasPorDiag[p.diagnostico_id][p.rol as Rol].add(p.id)
  }

  const partsRows = equipoIds.length > 0
    ? await fetchAllRows<{ id: string; equipo_id: string; rol: Rol }>(
        (from, to) => supabase.from('participantes').select('id, equipo_id, rol').in('equipo_id', equipoIds).order('id').range(from, to))
    : []
  const partIds = partsRows.map(p => p.id)
  const respsRows = partIds.length > 0
    ? await fetchAllRows<{ participante_id: string; pregunta_id: string }>(
        (from, to) => supabase.from('respuestas').select('participante_id, pregunta_id').in('participante_id', partIds).order('id').range(from, to))
    : []

  const respPorPart: Record<string, Set<string>> = {}
  for (const r of respsRows ?? []) {
    if (!respPorPart[r.participante_id]) respPorPart[r.participante_id] = new Set()
    respPorPart[r.participante_id].add(r.pregunta_id)
  }

  const completadosPorCompania: Record<string, number> = {}
  for (const p of partsRows ?? []) {
    const diagId = equipoToDiag[p.equipo_id]
    if (!diagId) continue
    const buckets = preguntasPorDiag[diagId]
    if (!buckets) continue
    const r = p.rol as Rol
    const esperadas: Set<string> = r === 'A'
      ? new Set<string>([...buckets.A, ...buckets.C])
      : r === 'D'
      ? new Set<string>([...buckets.D, ...buckets.B])
      : new Set<string>([...buckets[r]])
    if (esperadas.size === 0) continue
    const dadas = respPorPart[p.id] ?? new Set<string>()
    let completo = true
    for (const pid of esperadas) if (!dadas.has(pid)) { completo = false; break }
    if (completo) {
      completadosPorCompania[diagId] = (completadosPorCompania[diagId] ?? 0) + 1
    }
  }

  // Filas planas para la tabla (el orden interactivo lo maneja el cliente).
  const filas = diagnosticos.map(d => {
    const tipoConfig = TIPOS_DIAGNOSTICO[(d.tipo ?? 'cultura_360') as keyof typeof TIPOS_DIAGNOSTICO]
    const stats = porCompania[d.id] ?? { n: 0, activos: 0, completados: 0, invitados: 0 }
    return {
      id: d.id,
      empresa: d.nombre_compania,
      tipoEtiqueta: tipoConfig?.etiqueta ?? '360°',
      contacto: d.contacto_nombre,
      fechaIso: d.created_at,
      fecha: fechaCorta(d.created_at),
      equiposN: stats.n,
      equiposActivos: stats.activos,
      invitados: stats.invitados,
      completados: completadosPorCompania[d.id] ?? 0,
    }
  })

  return (
    <div>
      <div className="page-header admin-list-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="page-header__eyebrow">Panel</span>
          <div className="page-header__rule" />
          <h1 className="page-header__title">Diagnósticos</h1>
        </div>
        <Link href="/admin/nuevo" className={buttonVariants()} style={{ background: '#0A0A0A', color: '#ffffff', border: '1px solid #0A0A0A' }}>+ Nuevo diagnóstico</Link>
      </div>

      {!filas.length ? (
        <p className="text-mute" style={{ fontSize: 14 }}>Aún no hay diagnósticos.</p>
      ) : (
        <TablaDiagnosticos filas={filas} />
      )}
    </div>
  )
}
