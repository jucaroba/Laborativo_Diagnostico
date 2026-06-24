'use client'
import { useState } from 'react'

export type FilaDetalle = { dimensionId: number; dimNombre: string; rolLabel: string; texto: string; valor: number }
export type ParticipanteDet = { id: string; filas: FilaDetalle[] }
export type FilaInvitado = {
  id: string
  nombre: string
  email: string
  area: string | null
  estado: 'respondio' | 'incompleto' | 'sin-iniciar'
  dadas: number
  total: number
  promedio: number | null
  participantes: ParticipanteDet[]
}

type SortKey = 'nombre' | 'estado' | 'promedio'

// Orden de prioridad de estado (de "más avanzado" a "menos").
const ESTADO_RANK: Record<FilaInvitado['estado'], number> = { respondio: 0, incompleto: 1, 'sin-iniciar': 2 }

// Detalle de respuestas de un participante (replica el render del server).
function DetalleParticipante({ filas }: { filas: FilaDetalle[] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 8, color: 'var(--ink)' }}>
      <tbody>
        {filas.map((f, i) => {
          const prev = i > 0 ? filas[i - 1] : null
          const next = i < filas.length - 1 ? filas[i + 1] : null
          const cambioDim = prev && prev.dimensionId !== f.dimensionId
          const ultimaDeDim = next && next.dimensionId !== f.dimensionId
          const pad = `${cambioDim ? 18 : 6}px 10px ${ultimaDeDim ? 18 : 6}px`
          return (
            <tr key={i} style={cambioDim ? { borderTop: '3px solid var(--ink)' } : undefined}>
              <td style={{ padding: pad, width: 90, color: 'var(--ink)', fontWeight: 700, whiteSpace: 'nowrap' }}>{f.dimNombre}</td>
              <td style={{ padding: pad, width: 110, color: 'var(--ink)' }}>{f.rolLabel}</td>
              <td style={{ padding: pad, color: 'var(--ink)' }}>{f.texto}</td>
              <td style={{ padding: pad, width: 44, textAlign: 'right', fontWeight: 800, color: 'var(--ink)' }}>{f.valor}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default function ListaRespuestasPersonas({ filas }: { filas: FilaInvitado[] }) {
  const [sortBy, setSortBy] = useState<SortKey>('nombre')
  const [dir, setDir] = useState<'asc' | 'desc'>('asc')

  function toggle(key: SortKey) {
    if (sortBy === key) setDir(d => (d === 'asc' ? 'desc' : 'asc'))
    // Por defecto: nombre y estado ascendente (A→Z, respondió primero); promedio descendente (mayor primero).
    else { setSortBy(key); setDir(key === 'promedio' ? 'desc' : 'asc') }
  }

  const ordenadas = [...filas].sort((a, b) => {
    let cmp = 0
    if (sortBy === 'nombre') cmp = a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
    else if (sortBy === 'estado') cmp = ESTADO_RANK[a.estado] - ESTADO_RANK[b.estado]
    else {
      // Sin promedio (sin iniciar) siempre al final, sin importar la dirección.
      if (a.promedio == null && b.promedio == null) cmp = 0
      else if (a.promedio == null) return 1
      else if (b.promedio == null) return -1
      else cmp = a.promedio - b.promedio
    }
    // Desempate estable por nombre.
    if (cmp === 0 && sortBy !== 'nombre') cmp = a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
    return dir === 'asc' ? cmp : -cmp
  })

  const FILTROS: { label: string; key: SortKey }[] = [
    { label: 'Nombre', key: 'nombre' },
    { label: 'Estado', key: 'estado' },
    { label: 'Resultado', key: 'promedio' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Barra de filtros / orden */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--mute)' }}>Ordenar por</span>
        {FILTROS.map(f => {
          const active = sortBy === f.key
          return (
            <button
              key={f.key}
              onClick={() => toggle(f.key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
                padding: '5px 10px', cursor: 'pointer',
                border: '1.5px solid var(--ink)',
                background: active ? 'var(--ink)' : 'transparent',
                color: active ? '#fff' : 'var(--ink)',
              }}
            >
              {f.label}
              <span style={{ fontSize: 9, lineHeight: 1, opacity: active ? 1 : 0.4 }}>
                {active ? (dir === 'asc' ? '▲' : '▼') : '↕'}
              </span>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ordenadas.map(inv => {
          const respondio = inv.estado === 'respondio'
          const expandible = inv.participantes.length > 0
          return (
            <details key={inv.id} style={{ border: '1.5px solid var(--ink)', background: 'var(--card)' }}>
              <summary style={{ listStyle: 'none', outline: 'none', cursor: expandible ? 'pointer' : 'default', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, flex: 1, minWidth: 160 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>{inv.nombre}</span>
                  <span style={{ fontSize: 13, color: 'var(--ink)' }}>/</span>
                  <span style={{ fontSize: 12, color: 'var(--ink)' }}>{inv.email}</span>
                </span>
                {inv.promedio != null && (
                  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }} title="Promedio de todas las respuestas (escala 1–10)">
                    <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>{inv.promedio.toFixed(1)}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.04em', color: 'var(--ink)' }}>/ 10</span>
                  </span>
                )}
                {inv.area && <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', border: '1.5px solid var(--ink)', padding: '2px 8px' }}>{inv.area}</span>}
                <span style={{
                  fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 700, padding: '3px 8px',
                  background: respondio ? 'var(--ink)' : 'transparent',
                  color: respondio ? '#fff' : 'var(--mute)',
                  border: '1.5px solid', borderColor: respondio ? 'var(--ink)' : 'var(--mute)',
                }}>
                  {respondio ? 'Respondió' : inv.estado === 'incompleto' ? `Incompleto ${inv.dadas}/${inv.total}` : 'Sin iniciar'}
                </span>
              </summary>
              {expandible && (
                <div style={{ borderTop: '1.5px solid var(--ink)', padding: '4px 6px 10px' }}>
                  {inv.participantes.map(p => <DetalleParticipante key={p.id} filas={p.filas} />)}
                </div>
              )}
            </details>
          )
        })}
      </div>
    </div>
  )
}
