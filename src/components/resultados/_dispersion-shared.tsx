// Helpers compartidos para las secciones de "Dispersión" en los
// dashboards de Termómetro y Espejo. Estilísticamente alineado con
// la versión interna del Pulso, pero vive en su propio módulo para
// no tener que tocar ResultadosPulso.tsx.
//
// Si en algún momento se quiere unificar Pulso con esto, se puede
// migrar; mientras tanto convive paralelo a propósito.

import { DIMENSIONES } from '@/types'

// Color de fondo del badge de dispersión según rangos interpretativos.
export function dispersionBg(d: number): string {
  if (d <= 1.2) return '#C8E6C9' // verde · equipo alineado
  if (d <= 2.0) return '#FCE99A' // amarillo · dispersión notable
  return '#F2C2C2'                 // rojo · equipo dividido
}

// Color de fondo del badge del promedio sobre la escala 1–10.
export function promedioBg(v: number | null): string {
  if (v === null) return 'transparent'
  if (v >= 7) return '#C8E6C9'
  if (v >= 5) return '#FCE99A'
  return '#F2C2C2'
}

export const RANGOS_DISPERSION: Array<{ rango: string; lectura: string; color: string }> = [
  { rango: '± 0.0 – 1.2', lectura: 'Equipo alineado',     color: '#C8E6C9' },
  { rango: '± 1.3 – 2.0', lectura: 'Dispersión notable', color: '#FCE99A' },
  { rango: '± 2.0+',      lectura: 'Equipo dividido',    color: '#F2C2C2' },
]

// ─── HistogramaDim ─────────────────────────────────────────────────
// Mini-histograma de frecuencias por dimensión.
// `valores` son los promedios por persona en la dimensión (1–10).
export function HistogramaDim({
  nombre, subtitulo, promedio, desviacion, valores,
}: { nombre: string; subtitulo: string; promedio: number | null; desviacion: number; valores: number[] }) {
  const buckets = Array(10).fill(0) as number[]
  for (const v of valores) {
    const b = Math.max(1, Math.min(10, Math.round(v))) - 1
    buckets[b] += 1
  }
  const maxFreq = Math.max(1, ...buckets)
  const ALTO = 120
  const ROTULO = 16
  const ALTO_BARRA = ALTO - ROTULO

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 35 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink)', fontWeight: 700 }}>
            {subtitulo}
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-.02em', lineHeight: 1, marginTop: 2 }}>
            {nombre}
          </div>
        </div>
        <span aria-hidden style={{ width: 1.5, alignSelf: 'stretch', background: 'var(--ink)' }} />
        <span style={{
          fontSize: 22, fontWeight: 900, letterSpacing: '-.02em', color: 'var(--ink)',
          fontFeatureSettings: '"tnum" 1, "zero" 0', lineHeight: 1,
          background: promedioBg(promedio), padding: '6px 10px', display: 'inline-block',
        }}>
          {promedio !== null ? promedio.toFixed(1) : '—'} / 10
        </span>
        <span aria-hidden style={{ width: 1.5, alignSelf: 'stretch', background: 'var(--ink)' }} />
        <span style={{
          fontSize: 22, fontWeight: 900, letterSpacing: '-.02em', color: 'var(--ink)',
          fontFeatureSettings: '"tnum" 1, "zero" 0', lineHeight: 1,
          background: dispersionBg(desviacion), padding: '6px 10px', display: 'inline-block',
        }}>
          ± {desviacion.toFixed(1)}
        </span>
      </div>

      <div style={{ position: 'relative' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4,
          height: ALTO, position: 'relative', zIndex: 1,
          borderBottom: '1px solid var(--ink)',
          alignItems: 'end',
        }}>
          {buckets.map((n, i) => {
            const h = (n / maxFreq) * ALTO_BARRA
            return (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 800, color: 'var(--ink)',
                  fontFeatureSettings: '"tnum" 1, "zero" 0',
                  visibility: n > 0 ? 'visible' : 'hidden',
                  lineHeight: 1,
                }}>{n}</span>
                <div
                  title={`${i + 1}: ${n} ${n === 1 ? 'persona' : 'personas'}`}
                  style={{
                    width: '100%', height: `${h}px`,
                    minHeight: n > 0 ? 4 : 0,
                    background: 'var(--ink)', transition: 'height .15s', display: 'block',
                  }}
                />
              </div>
            )
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4, marginTop: 6 }}>
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} style={{
              fontSize: 10, color: 'var(--mute)', fontWeight: 600,
              textAlign: 'center', fontFeatureSettings: '"tnum" 1, "zero" 0',
            }}>{i + 1}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── LeyendaDispersion ────────────────────────────────────────────
export function LeyendaDispersion() {
  return (
    <div style={{ padding: '32px 56px 32px', borderBottom: '1.5px solid var(--ink)' }}>
      <div style={{
        border: '1.5px solid var(--ink)', background: 'var(--card)',
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexWrap: 'wrap', gap: 28, rowGap: 12,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 800, color: 'var(--ink)',
          letterSpacing: '.06em', textTransform: 'uppercase',
        }}>
          Cómo leer la dispersión
        </span>
        {RANGOS_DISPERSION.map(r => (
          <span key={r.rango} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 13, fontWeight: 800, color: 'var(--ink)', fontFeatureSettings: '"tnum" 1, "zero" 0',
              background: r.color, padding: '4px 10px',
            }}>
              {r.rango}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
              {r.lectura}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── ChipTipo: chip negro de tipo en el header del dashboard ──────
export function ChipTipo({ etiqueta, rondaActual }: { etiqueta: string; rondaActual?: number }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
      <span style={{
        fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 700,
        background: 'var(--ink)', color: '#fff', padding: '3px 8px',
      }}>{etiqueta}</span>
      {rondaActual && rondaActual > 1 && (
        <span style={{
          fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 700,
          background: 'transparent', color: 'var(--ink)', border: '1.5px solid var(--ink)', padding: '2px 8px',
        }}>Ronda {rondaActual}</span>
      )}
    </div>
  )
}

// Para que TS no se queje si se usa DIMENSIONES desde acá.
export { DIMENSIONES }
