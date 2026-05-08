'use client'
import { useState } from 'react'
import { Arquetipo, ArquetipoCtx } from '@/lib/arquetipos'
import { RefreshCw } from 'lucide-react'
import { ClaudeIcon } from '@/components/icons/ClaudeIcon'

type Tipo = 'brechas' | 'relaciones'

type Props = {
  brechas: Arquetipo
  relaciones: Arquetipo
  ctx: ArquetipoCtx
  diagnosticoId: string
}

type Card = { tipo: Tipo; titulo: string; arquetipo: Arquetipo; loading: boolean }

function Tagged({ tag, children }: { tag: string; children: React.ReactNode }) {
  // Tag fijo en la izquierda; texto envuelve en su propia columna
  // (hanging indent: las líneas siguientes no caen bajo el tag).
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase',
      color: 'var(--ink)', fontWeight: 700, lineHeight: 1.5,
    }}>
      <span style={{ background: 'var(--ink)', color: 'var(--bg)', padding: '2px 6px', flexShrink: 0 }}>{tag}</span>
      <span style={{ flex: 1 }}>{children}</span>
    </div>
  )
}

export default function ArquetiposEquipo({ brechas, relaciones, ctx, diagnosticoId }: Props) {
  const [brechasState, setBrechasState] = useState<Arquetipo>(brechas)
  const [relacionesState, setRelacionesState] = useState<Arquetipo>(relaciones)
  const [loadingBrechas, setLoadingBrechas] = useState(false)
  const [loadingRelaciones, setLoadingRelaciones] = useState(false)

  async function regenerar(tipo: Tipo) {
    const setLoading = tipo === 'brechas' ? setLoadingBrechas : setLoadingRelaciones
    const setState   = tipo === 'brechas' ? setBrechasState   : setRelacionesState
    const actual     = tipo === 'brechas' ? brechasState      : relacionesState

    setLoading(true)
    try {
      const res = await fetch('/api/regenerar-arquetipo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          diagnosticoId,
          promediosPorRol: ctx.promediosPorRol,
          promedioGlobalPorRol: ctx.promedioGlobalPorRol,
          promedioDim: ctx.promedioDim,
          deltaDim: ctx.deltaDim,
          actual: {
            tag: actual.tag, titulo: actual.titulo, resumen: actual.resumen,
            cuerpo: actual.cuerpo, cita: actual.cita, accion: actual.accion,
          },
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'No se pudo regenerar')
      }
      const fields = await res.json()
      setState(prev => ({ ...prev, ...fields }))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const cards: Card[] = [
    { tipo: 'brechas',    titulo: 'Brechas entre perspectivas',   arquetipo: brechasState,    loading: loadingBrechas },
    { tipo: 'relaciones', titulo: 'Relaciones entre dimensiones', arquetipo: relacionesState, loading: loadingRelaciones },
  ]

  // Layout: 2 columnas × 2 filas (top + bottom). Render aplanado para
  // que CSS Grid alinee los bottoms en una misma fila y queden con
  // exactamente la misma altura (toma la del más alto).
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gridTemplateRows: '1fr auto',
      borderBottom: '1.5px solid var(--ink)',
      borderLeft: '1.5px solid var(--ink)',
      borderRight: '1.5px solid var(--ink)',
    }}>
      {cards.map((card, i) => {
        const a = card.arquetipo
        return (
          <div key={`top-${i}`} style={{
            gridColumn: i + 1, gridRow: 1,
            borderRight: i === 0 ? '1.5px solid var(--ink)' : 'none',
            display: 'flex', flexDirection: 'column',
          }}>
            <header style={{ padding: '28px 32px 20px' }}>
              <span className="eyebrow">{a.tag} / {card.titulo}</span>
              <div className="rule" />
              <h3 style={{
                fontSize: 32, fontWeight: 900, letterSpacing: '-.02em',
                lineHeight: 1.05, margin: '16px 0 0', color: 'var(--ink)',
              }}>
                {a.titulo}
              </h3>
            </header>

            <div style={{ padding: '0 32px 24px', display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.4, color: 'var(--ink)', margin: 0, letterSpacing: '-.01em' }}>
                {a.resumen}
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)', margin: 0, fontWeight: 500 }}>
                {a.cuerpo}
              </p>

              <button
                type="button"
                onClick={() => regenerar(card.tipo)}
                disabled={card.loading}
                aria-busy={card.loading}
                style={{
                  alignSelf: 'flex-start',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px',
                  border: '1.5px solid var(--ink)',
                  background: card.loading ? 'var(--bg-2)' : 'transparent',
                  color: 'var(--ink)',
                  fontFamily: 'inherit', fontSize: 11,
                  fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
                  cursor: card.loading ? 'not-allowed' : 'pointer',
                  transition: 'background .15s ease',
                }}
              >
                {card.loading
                  ? <><RefreshCw size={13} strokeWidth={2.5} className="spinning" /> Regenerando…</>
                  : <><ClaudeIcon size={13} /> Otra lectura</>}
              </button>
            </div>
          </div>
        )
      })}

      {cards.map((card, i) => {
        const a = card.arquetipo
        return (
          <div key={`bot-${i}`} style={{
            gridColumn: i + 1, gridRow: 2,
            borderRight: i === 0 ? '1.5px solid var(--ink)' : 'none',
            borderTop: '1.5px solid var(--ink)',
            padding: '16px 32px',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <Tagged tag="Patrón">{a.patron}</Tagged>
            <Tagged tag="Experiencia">{a.accion}</Tagged>
          </div>
        )
      })}
    </div>
  )
}
