import { supabaseAdmin } from '@/lib/supabase-admin'
import { notFound } from 'next/navigation'
import { DIMENSIONES, ROL_INFO, Rol } from '@/types'
import ListaRespuestasPersonas, { FilaInvitado } from '@/components/admin/ListaRespuestasPersonas'

export const revalidate = 0

// Vista INTERNA de Laborativo: respuestas individuales asociadas a la persona
// invitada (nombre / email / área). El cliente nunca ve este detalle, solo el
// dashboard agregado. Usa el service role porque `invitaciones` tiene RLS
// restringido a usuarios autenticados.

interface PreguntaRow { id: string; dimension_id: number; rol: Rol; texto: string; orden: number }
interface InvitacionRow { id: string; nombre: string; email: string; area: string | null; enviado_at: string | null }
interface ParticipanteRow { id: string; rol: Rol; invitacion_id: string | null }
interface RespuestaRow { participante_id: string; pregunta_id: string; valor: number }

// Roles que responde un participante según su propio rol (en 360, A responde A+C,
// D responde D+B; en los demás tipos responde solo su rol).
function rolesQueResponde(rol: Rol): Rol[] {
  if (rol === 'A') return ['A', 'C']
  if (rol === 'D') return ['D', 'B']
  return [rol]
}

export default async function RespuestasPorPersonaPage({ params }: { params: Promise<{ id: string; equipoId: string }> }) {
  const { id, equipoId } = await params

  const { data: equipo } = await supabaseAdmin
    .from('equipos')
    .select('id, diagnostico_id, nombre')
    .eq('id', equipoId)
    .single()

  if (!equipo || equipo.diagnostico_id !== id) notFound()

  const [{ data: preguntas }, { data: invitaciones }, { data: participantes }] = await Promise.all([
    supabaseAdmin.from('preguntas').select('id, dimension_id, rol, texto, orden').eq('diagnostico_id', id).order('dimension_id').order('orden'),
    supabaseAdmin.from('invitaciones').select('id, nombre, email, area, enviado_at').eq('equipo_id', equipoId).order('nombre'),
    supabaseAdmin.from('participantes').select('id, rol, invitacion_id').eq('equipo_id', equipoId),
  ])

  const ps = (preguntas ?? []) as PreguntaRow[]
  const invs = (invitaciones ?? []) as InvitacionRow[]
  const parts = (participantes ?? []) as ParticipanteRow[]

  const partIds = parts.map(p => p.id)
  const { data: respuestas } = partIds.length > 0
    ? await supabaseAdmin.from('respuestas').select('participante_id, pregunta_id, valor').in('participante_id', partIds)
    : { data: [] as RespuestaRow[] }
  const resps = (respuestas ?? []) as RespuestaRow[]

  // Índices de apoyo
  const preguntaById = new Map(ps.map(p => [p.id, p]))
  const respPorParticipante = new Map<string, RespuestaRow[]>()
  for (const r of resps) {
    const arr = respPorParticipante.get(r.participante_id) ?? []
    arr.push(r)
    respPorParticipante.set(r.participante_id, arr)
  }
  const partsPorInvitacion = new Map<string, ParticipanteRow[]>()
  const anonimos: ParticipanteRow[] = []
  for (const p of parts) {
    if (p.invitacion_id) {
      const arr = partsPorInvitacion.get(p.invitacion_id) ?? []
      arr.push(p)
      partsPorInvitacion.set(p.invitacion_id, arr)
    } else {
      anonimos.push(p)
    }
  }

  // Cuántas preguntas se esperan de un participante según su rol.
  function esperadas(rol: Rol): number {
    return ps.filter(p => rolesQueResponde(rol).includes(p.rol)).length
  }

  const dimNombre = new Map<number, string>(DIMENSIONES.map(d => [d.id, d.nombre]))

  // ── Render del detalle de respuestas de un participante ──
  function DetalleParticipante({ part }: { part: ParticipanteRow }) {
    const rs = (respPorParticipante.get(part.id) ?? []).slice()
    // Ordena por dimensión y orden de la pregunta.
    rs.sort((a, b) => {
      const pa = preguntaById.get(a.pregunta_id)
      const pb = preguntaById.get(b.pregunta_id)
      if (!pa || !pb) return 0
      return pa.dimension_id - pb.dimension_id || pa.orden - pb.orden
    })
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 8, color: 'var(--ink)' }}>
        <tbody>
          {rs.map((r, i) => {
            const pq = preguntaById.get(r.pregunta_id)
            if (!pq) return null
            // Línea gruesa negra al cambiar de dimensión (no antes de la primera),
            // con más aire arriba y abajo de la línea.
            const prev = i > 0 ? preguntaById.get(rs[i - 1].pregunta_id) : null
            const next = i < rs.length - 1 ? preguntaById.get(rs[i + 1].pregunta_id) : null
            const cambioDim = prev && prev.dimension_id !== pq.dimension_id
            const ultimaDeDim = next && next.dimension_id !== pq.dimension_id
            const pad = `${cambioDim ? 18 : 6}px 10px ${ultimaDeDim ? 18 : 6}px`
            return (
              <tr key={r.pregunta_id} style={cambioDim ? { borderTop: '3px solid var(--ink)' } : undefined}>
                <td style={{ padding: pad, width: 90, color: 'var(--ink)', fontWeight: 700, whiteSpace: 'nowrap' }}>{dimNombre.get(pq.dimension_id)}</td>
                <td style={{ padding: pad, width: 110, color: 'var(--ink)' }}>{ROL_INFO[pq.rol]?.label ?? pq.rol}</td>
                <td style={{ padding: pad, color: 'var(--ink)' }}>{pq.texto}</td>
                <td style={{ padding: pad, width: 44, textAlign: 'right', fontWeight: 800, color: 'var(--ink)' }}>{r.valor}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  const totalRespondieron = invs.filter(i => {
    const ps2 = partsPorInvitacion.get(i.id) ?? []
    return ps2.some(p => (respPorParticipante.get(p.id)?.length ?? 0) >= esperadas(p.rol) && esperadas(p.rol) > 0)
  }).length

  // Filas serializables para el componente cliente (filtros + promedio por persona).
  const filas: FilaInvitado[] = invs.map(inv => {
    const ps2 = partsPorInvitacion.get(inv.id) ?? []
    const dadas = ps2.reduce((acc, p) => acc + (respPorParticipante.get(p.id)?.length ?? 0), 0)
    const total = ps2.reduce((acc, p) => acc + esperadas(p.rol), 0)
    const respondio = ps2.length > 0 && total > 0 && dadas >= total
    const estado = respondio ? 'respondio' : ps2.length ? 'incompleto' : 'sin-iniciar'

    let suma = 0
    let n = 0
    const participantes = ps2.map(p => {
      const rs = (respPorParticipante.get(p.id) ?? []).slice().sort((a, b) => {
        const pa = preguntaById.get(a.pregunta_id)
        const pb = preguntaById.get(b.pregunta_id)
        if (!pa || !pb) return 0
        return pa.dimension_id - pb.dimension_id || pa.orden - pb.orden
      })
      const filasDet = rs.flatMap(r => {
        const pq = preguntaById.get(r.pregunta_id)
        if (!pq) return []
        suma += r.valor
        n += 1
        return [{
          dimensionId: pq.dimension_id,
          dimNombre: dimNombre.get(pq.dimension_id) ?? '',
          rolLabel: ROL_INFO[pq.rol]?.label ?? pq.rol,
          texto: pq.texto,
          valor: r.valor,
        }]
      })
      return { id: p.id, filas: filasDet }
    })

    const promedio = n > 0 ? Math.round((suma / n) * 10) / 10 : null
    return { id: inv.id, nombre: inv.nombre, email: inv.email, area: inv.area, estado, dadas, total, promedio, participantes }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h1 className="page-header__title">{equipo.nombre}</h1>
        <p className="page-header__subtitle">
          {totalRespondieron} de {invs.length} invitados respondieron
          {anonimos.length > 0 && ` · ${anonimos.length} respuesta(s) sin identificar`}
        </p>
      </div>

      {invs.length === 0 && anonimos.length === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--mute)' }}>Aún no hay invitaciones ni respuestas en este equipo.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {invs.length > 0 && <ListaRespuestasPersonas filas={filas} />}

          {anonimos.length > 0 && (
            <details style={{ border: '1.5px dashed var(--ink)', background: 'var(--card)' }}>
              <summary style={{ listStyle: 'none', outline: 'none', cursor: 'pointer', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 800, flex: 1 }}>Sin identificar</span>
                <span style={{ fontSize: 12, color: 'var(--mute)' }}>{anonimos.length} respuesta(s) por link genérico</span>
              </summary>
              <div style={{ borderTop: '1.5px solid var(--ink)', padding: '4px 6px 10px' }}>
                {anonimos.map(p => <DetalleParticipante key={p.id} part={p} />)}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
