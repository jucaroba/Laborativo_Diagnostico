import { supabaseAdmin } from '@/lib/supabase-admin'
import { DIMENSIONES, ROL_INFO, Rol } from '@/types'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

// Vista INTERNA de Laborativo a nivel DIAGNÓSTICO: respuestas individuales de
// todas las personas, agrupadas por equipo/área. El cliente nunca ve este
// detalle, solo el dashboard agregado. Usa service role porque `invitaciones`
// tiene RLS restringido a usuarios autenticados.

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://diagnostico.laborativo.com'

interface PreguntaRow { id: string; dimension_id: number; rol: Rol; texto: string; orden: number }
interface EquipoRow { id: string; nombre: string; codigo_resultados: string }
interface InvitacionRow { id: string; nombre: string; email: string; area: string | null; equipo_id: string }
interface ParticipanteRow { id: string; rol: Rol; invitacion_id: string | null; equipo_id: string }
interface RespuestaRow { participante_id: string; pregunta_id: string; valor: number }

// En 360, A responde A+C y D responde D+B; en los demás tipos cada quien responde solo su rol.
function rolesQueResponde(rol: Rol): Rol[] {
  if (rol === 'A') return ['A', 'C']
  if (rol === 'D') return ['D', 'B']
  return [rol]
}

export default async function RespuestasInternas({
  diagnosticoId, codigoResultadosComparativo,
}: { diagnosticoId: string; codigoResultadosComparativo: string }) {
  const { data: equiposData } = await supabaseAdmin
    .from('equipos').select('id, nombre, codigo_resultados').eq('diagnostico_id', diagnosticoId).order('created_at')
  const equipos = (equiposData ?? []) as EquipoRow[]
  const equipoIds = equipos.map(e => e.id)

  const { data: preguntasData } = await supabaseAdmin
    .from('preguntas').select('id, dimension_id, rol, texto, orden')
    .eq('diagnostico_id', diagnosticoId).order('dimension_id').order('orden')
  const ps = (preguntasData ?? []) as PreguntaRow[]

  const [{ data: invData }, { data: partData }] = equipoIds.length > 0
    ? await Promise.all([
        supabaseAdmin.from('invitaciones').select('id, nombre, email, area, equipo_id').in('equipo_id', equipoIds).order('nombre'),
        supabaseAdmin.from('participantes').select('id, rol, invitacion_id, equipo_id').in('equipo_id', equipoIds),
      ])
    : [{ data: [] as InvitacionRow[] }, { data: [] as ParticipanteRow[] }]
  const invs = (invData ?? []) as InvitacionRow[]
  const parts = (partData ?? []) as ParticipanteRow[]

  const partIds = parts.map(p => p.id)
  const { data: respData } = partIds.length > 0
    ? await supabaseAdmin.from('respuestas').select('participante_id, pregunta_id, valor').in('participante_id', partIds)
    : { data: [] as RespuestaRow[] }
  const resps = (respData ?? []) as RespuestaRow[]

  // ── Índices de apoyo ──
  const preguntaById = new Map(ps.map(p => [p.id, p]))
  const respPorParticipante = new Map<string, RespuestaRow[]>()
  for (const r of resps) {
    const arr = respPorParticipante.get(r.participante_id) ?? []
    arr.push(r); respPorParticipante.set(r.participante_id, arr)
  }
  const partsPorInvitacion = new Map<string, ParticipanteRow[]>()
  const anonimosPorEquipo = new Map<string, ParticipanteRow[]>()
  for (const p of parts) {
    if (p.invitacion_id) {
      const arr = partsPorInvitacion.get(p.invitacion_id) ?? []
      arr.push(p); partsPorInvitacion.set(p.invitacion_id, arr)
    } else {
      const arr = anonimosPorEquipo.get(p.equipo_id) ?? []
      arr.push(p); anonimosPorEquipo.set(p.equipo_id, arr)
    }
  }
  const invsPorEquipo = new Map<string, InvitacionRow[]>()
  for (const inv of invs) {
    const arr = invsPorEquipo.get(inv.equipo_id) ?? []
    arr.push(inv); invsPorEquipo.set(inv.equipo_id, arr)
  }

  // Cuántas preguntas se esperan de un participante según su rol.
  function esperadas(rol: Rol): number {
    return ps.filter(p => rolesQueResponde(rol).includes(p.rol)).length
  }
  const dimNombre = new Map<number, string>(DIMENSIONES.map(d => [d.id, d.nombre]))

  // ── Render del detalle de respuestas de un participante ──
  function DetalleParticipante({ part }: { part: ParticipanteRow }) {
    const rs = (respPorParticipante.get(part.id) ?? []).slice()
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

  // ── Fila (persona invitada) con su detalle desplegable ──
  function PersonaInvitada({ inv }: { inv: InvitacionRow }) {
    const ps2 = partsPorInvitacion.get(inv.id) ?? []
    const dadas = ps2.reduce((acc, p) => acc + (respPorParticipante.get(p.id)?.length ?? 0), 0)
    const total = ps2.reduce((acc, p) => acc + esperadas(p.rol), 0)
    const respondio = ps2.length > 0 && total > 0 && dadas >= total
    return (
      <details style={{ border: '1.5px solid var(--ink)', background: 'var(--card)' }}>
        <summary style={{ listStyle: 'none', outline: 'none', cursor: ps2.length ? 'pointer' : 'default', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, flex: 1, minWidth: 160 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>{inv.nombre}</span>
            <span style={{ fontSize: 13, color: 'var(--ink)' }}>/</span>
            <span style={{ fontSize: 12, color: 'var(--ink)' }}>{inv.email}</span>
          </span>
          <span style={{
            fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 700, padding: '3px 8px',
            background: respondio ? 'var(--ink)' : 'transparent',
            color: respondio ? '#fff' : 'var(--mute)',
            border: '1.5px solid', borderColor: respondio ? 'var(--ink)' : 'var(--mute)',
          }}>
            {respondio ? 'Respondió' : ps2.length ? `Incompleto ${dadas}/${total}` : 'Sin iniciar'}
          </span>
        </summary>
        {ps2.length > 0 && (
          <div style={{ borderTop: '1.5px solid var(--ink)', padding: '4px 6px 10px' }}>
            {ps2.map(p => <DetalleParticipante key={p.id} part={p} />)}
          </div>
        )}
      </details>
    )
  }

  // Sin participantes: el cargue (invitación) se hace desde el header.
  if (invs.length === 0 && parts.length === 0) {
    return (
      <div style={{ border: '1.5px solid var(--ink)', background: 'var(--card)', padding: '20px 16px' }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
          Aún no hay participantes. Usa <strong>Cargar participantes</strong> arriba para invitarlos: cada área se vuelve un grupo.
        </p>
      </div>
    )
  }

  const hayMultiples = equipos.filter(e => (invsPorEquipo.get(e.id)?.length ?? 0) + (anonimosPorEquipo.get(e.id)?.length ?? 0) > 0).length >= 2

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {hayMultiples && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Link
            href={`/r/c/${codigoResultadosComparativo}`}
            target="_blank"
            style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
              color: 'var(--ink)', textDecoration: 'none', border: '1.5px solid var(--ink)', padding: '6px 10px',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            Comparativo <ArrowUpRight size={13} strokeWidth={2.5} />
          </Link>
        </div>
      )}

      {equipos.map(eq => {
        const eInvs = invsPorEquipo.get(eq.id) ?? []
        const eAnon = anonimosPorEquipo.get(eq.id) ?? []
        if (eInvs.length === 0 && eAnon.length === 0) return null
        const respondieron = eInvs.filter(inv => {
          const ps2 = partsPorInvitacion.get(inv.id) ?? []
          return ps2.some(p => (respPorParticipante.get(p.id)?.length ?? 0) >= esperadas(p.rol) && esperadas(p.rol) > 0)
        }).length
        return (
          <section key={eq.id}>
            <div style={{
              background: 'var(--ink)', padding: '10px 16px', marginBottom: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '0', margin: 0, color: '#fff', fontFamily: 'Red Hat Display, sans-serif' }}>
                {eq.nombre} <span style={{ fontWeight: 700, color: 'var(--mute)' }}>/ {respondieron} de {eInvs.length}</span>
              </h2>
              <Link
                href={`${BASE_URL}/r/${eq.codigo_resultados}`}
                target="_blank"
                style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
                  color: '#fff', textDecoration: 'none', border: '1.5px solid #fff', padding: '6px 10px',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}
              >
                Dashboard <ArrowUpRight size={13} strokeWidth={2.5} />
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {eInvs.map(inv => <PersonaInvitada key={inv.id} inv={inv} />)}

              {eAnon.length > 0 && (
                <details style={{ border: '1.5px dashed var(--ink)', background: 'var(--card)' }}>
                  <summary style={{ listStyle: 'none', outline: 'none', cursor: 'pointer', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, flex: 1 }}>Sin identificar</span>
                    <span style={{ fontSize: 12, color: 'var(--mute)' }}>{eAnon.length} respuesta(s) por link genérico</span>
                  </summary>
                  <div style={{ borderTop: '1.5px solid var(--ink)', padding: '4px 6px 10px' }}>
                    {eAnon.map(p => <DetalleParticipante key={p.id} part={p} />)}
                  </div>
                </details>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
