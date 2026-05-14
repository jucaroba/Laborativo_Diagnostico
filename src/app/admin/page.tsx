import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Diagnostico, Rol } from '@/types'
import { buttonVariants } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import AccionesRow from '@/components/admin/AccionesRow'
import { TIPOS_DIAGNOSTICO } from '@/lib/tipos-diagnostico'

export const revalidate = 0

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const fechaCorta = (iso: string) => {
  const d = new Date(iso)
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

export default async function AdminPage() {
  const { data: diagnosticos } = await supabase
    .from('diagnosticos').select('*').order('created_at', { ascending: false })

  const diagIds = (diagnosticos ?? []).map(d => d.id)
  const { data: equipos } = diagIds.length > 0
    ? await supabase.from('equipos').select('id, diagnostico_id, estado, numero_participantes').in('diagnostico_id', diagIds)
    : { data: [] as { id: string; diagnostico_id: string; estado: string; numero_participantes: number | null }[] }

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

  const { data: preguntasRows } = diagIds.length > 0
    ? await supabase.from('preguntas').select('id, diagnostico_id, rol').in('diagnostico_id', diagIds)
    : { data: [] as { id: string; diagnostico_id: string; rol: Rol }[] }

  // preguntasPorDiag[diagId][rol] = Set<preguntaId>
  const preguntasPorDiag: Record<string, Record<Rol, Set<string>>> = {}
  for (const p of preguntasRows ?? []) {
    if (!preguntasPorDiag[p.diagnostico_id]) {
      preguntasPorDiag[p.diagnostico_id] = { A: new Set(), B: new Set(), C: new Set(), D: new Set(), X: new Set(), YO: new Set(), EQUIPO: new Set() }
    }
    preguntasPorDiag[p.diagnostico_id][p.rol as Rol].add(p.id)
  }

  const { data: partsRows } = equipoIds.length > 0
    ? await supabase.from('participantes').select('id, equipo_id, rol').in('equipo_id', equipoIds)
    : { data: [] as { id: string; equipo_id: string; rol: Rol }[] }
  const partIds = (partsRows ?? []).map(p => p.id)
  const { data: respsRows } = partIds.length > 0
    ? await supabase.from('respuestas').select('participante_id, pregunta_id').in('participante_id', partIds)
    : { data: [] as { participante_id: string; pregunta_id: string }[] }

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

      {!diagnosticos?.length ? (
        <p className="text-mute" style={{ fontSize: 14 }}>Aún no hay diagnósticos.</p>
      ) : (
        <div className="admin-table-scroll">
        <Table>
          <TableHeader>
            <TableRow style={{ background: '#0A0A0A', borderBottom: 'none' }}>
              {['Empresa', 'Tipo', 'Contacto', 'Fecha', 'Equipos', 'Participantes', ''].map(h => (
                <TableHead key={h} style={{ color: '#fff', fontWeight: 700, fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', background: 'transparent' }}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {diagnosticos.map((d: Diagnostico) => {
              const tipoConfig = TIPOS_DIAGNOSTICO[(d.tipo ?? 'cultura_360') as keyof typeof TIPOS_DIAGNOSTICO]
              const stats = porCompania[d.id] ?? { n: 0, activos: 0, completados: 0, invitados: 0 }
              const completados = completadosPorCompania[d.id] ?? 0
              return (
              <TableRow key={d.id}>
                <TableCell>
                  <Link href={`/admin/${d.id}`} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 500, fontSize: 14 }}>
                    {d.nombre_compania}
                  </Link>
                </TableCell>
                <TableCell>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px',
                    fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase',
                    fontWeight: 700, background: 'var(--ink)', color: '#fff',
                  }}>{tipoConfig?.etiqueta ?? '360°'}</span>
                </TableCell>
                <TableCell style={{ color: 'var(--ink)', fontWeight: 500, fontSize: 14 }}>{d.contacto_nombre}</TableCell>
                <TableCell style={{ color: 'var(--ink)', fontWeight: 500, fontSize: 14 }}>
                  {fechaCorta(d.created_at)}
                </TableCell>
                <TableCell>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>
                      {stats.n}
                    </span>
                    {(stats.activos + stats.completados) > 0 && (
                      <span style={{ fontSize: 11, color: 'var(--mute)', fontWeight: 600 }}>
                        · {stats.activos} activo{stats.activos === 1 ? '' : 's'}{stats.completados > 0 ? ` · ${stats.completados} completado${stats.completados === 1 ? '' : 's'}` : ''}
                      </span>
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                    {stats.invitados}{' '}
                    <span style={{ color: 'var(--mute)', fontWeight: 600 }}>/</span>{' '}
                    <span title="Cuestionarios completados">{completados}</span>
                  </span>
                </TableCell>
                <TableCell>
                  <AccionesRow id={d.id} />
                </TableCell>
              </TableRow>
              )
            })}
          </TableBody>
        </Table>
        </div>
      )}
    </div>
  )
}
