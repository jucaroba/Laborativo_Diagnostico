import Image from 'next/image'
import { DIMENSIONES } from '@/types'

type Perspectiva = 'YO' | 'EQUIPO'

type DimResultado = {
  id: number
  nombre: string
  subtitulo: string
  yo: { promedio: number | null; desviacion: number; n: number }
  equipo: { promedio: number | null; desviacion: number; n: number }
  delta: number
}

type Props = {
  nombreCompania: string
  estado: string
  totalParticipantes: number
  totalFormularios: number
  resultados: DimResultado[]
  comparacion?: DimResultado[] | null
  rondaActual?: number
  rondaAnterior?: number
}

function DeltaRonda({ actual, anterior, rondaAnterior }: { actual: number | null; anterior: number | null; rondaAnterior?: number }) {
  if (actual === null || anterior === null) return null
  const diff = Math.round((actual - anterior) * 10) / 10
  const color = diff > 0.1 ? '#1A9850' : diff < -0.1 ? '#D73027' : 'var(--mute)'
  const flecha = diff > 0.1 ? '↑' : diff < -0.1 ? '↓' : '→'
  const signo = diff > 0 ? '+' : ''
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10.5, fontWeight: 700, color,
      fontVariantNumeric: 'tabular-nums',
    }}>
      {flecha} {signo}{diff.toFixed(1)}
      {rondaAnterior ? <span style={{ fontWeight: 500, color: 'var(--mute)', letterSpacing: '.04em', textTransform: 'uppercase', fontSize: 8.5 }}> vs r{rondaAnterior}</span> : null}
    </span>
  )
}

// Paleta Espejo — colores propios para distinguir del 360
const COLOR_YO     = '#6B5BB6' // morado
const COLOR_EQUIPO = '#00C4B4' // teal

const deltaBg = (d: number) => d >= 2.5 ? '#F2C2C2' : d >= 1.5 ? '#FCE99A' : '#C8E6C9'

function SectionBar({ title, subtitle, mobile }: { title: string; subtitle?: string; mobile?: boolean }) {
  return (
    <div style={{
      background: 'var(--ink)',
      padding: mobile ? '10px 20px' : '12px 24px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
    }}>
      <h2 style={{ fontSize: mobile ? 14 : 18, fontWeight: 900, letterSpacing: '-.01em', margin: 0, color: '#fff' }}>{title}</h2>
      {subtitle && <span style={{ fontSize: mobile ? 9 : 10, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600, color: '#fff', textAlign: 'right' }}>{subtitle}</span>}
    </div>
  )
}

function Leyenda({ mobile }: { mobile?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: mobile ? 14 : 20, fontSize: mobile ? 11 : 13, fontWeight: 600, color: 'var(--ink)' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: COLOR_YO }} /> Yo
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: COLOR_EQUIPO }} /> Equipo
      </span>
    </div>
  )
}

function FilaPerspectiva({
  label, valor, color, mobile,
}: { label: string; valor: number | null; color: string; mobile?: boolean }) {
  const pct = valor !== null ? ((valor - 1) / 9) * 100 : 0
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr 42px', gap: mobile ? 8 : 12, alignItems: 'center' }}>
      <span style={{ fontSize: mobile ? 10 : 11, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--ink)' }}>{label}</span>
      <div style={{ position: 'relative', height: mobile ? 8 : 10, background: 'var(--bg-2)', border: '1.5px solid var(--ink)' }}>
        {valor !== null && (
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: color }} />
        )}
      </div>
      <b style={{ fontSize: mobile ? 14 : 16, fontWeight: 900, fontVariantNumeric: 'tabular-nums', textAlign: 'right', color: valor !== null ? 'var(--ink)' : 'var(--mute)' }}>
        {valor !== null ? valor.toFixed(1) : '—'}
      </b>
    </div>
  )
}

function DimCard({ dim, anterior, rondaAnterior, mobile }: { dim: DimResultado; anterior?: DimResultado | null; rondaAnterior?: number; mobile?: boolean }) {
  return (
    <div style={{
      padding: mobile ? '18px 20px 22px' : '28px 24px 28px',
      display: 'flex', flexDirection: 'column', gap: mobile ? 12 : 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink)', fontWeight: 700 }}>{dim.subtitulo}</div>
          <h3 style={{ fontSize: mobile ? 20 : 22, fontWeight: 900, letterSpacing: '-.02em', lineHeight: 1, margin: '4px 0 0' }}>{dim.nombre}</h3>
        </div>
        <span style={{
          padding: '5px 10px', background: deltaBg(dim.delta),
          fontSize: 12, fontWeight: 900, letterSpacing: '-.01em',
          fontVariantNumeric: 'tabular-nums', flexShrink: 0,
        }}>
          Δ {dim.delta.toFixed(1)}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <FilaPerspectiva label="Yo" valor={dim.yo.promedio} color={COLOR_YO} mobile={mobile} />
        <FilaPerspectiva label="Equipo" valor={dim.equipo.promedio} color={COLOR_EQUIPO} mobile={mobile} />
      </div>
      {anterior && (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', borderTop: '1px solid var(--line-soft)', paddingTop: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--mute)' }}>Yo</span>
            <DeltaRonda actual={dim.yo.promedio} anterior={anterior.yo.promedio} rondaAnterior={rondaAnterior} />
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--mute)' }}>Equipo</span>
            <DeltaRonda actual={dim.equipo.promedio} anterior={anterior.equipo.promedio} rondaAnterior={rondaAnterior} />
          </span>
        </div>
      )}
    </div>
  )
}

// Radar con 2 polígonos: YO y EQUIPO
function RadarEspejo({ resultados, maxSize }: { resultados: DimResultado[]; maxSize: number }) {
  const size = 520
  const center = size / 2
  const radius = size * 0.42
  const axes = DIMENSIONES.length
  const padX = 8
  const viewBoxY = 40
  const viewBoxH = 440

  const axisAngle = (i: number) => -Math.PI * 3 / 4 + (i * 2 * Math.PI) / axes
  const point = (i: number, val: number): [number, number] => {
    const r = (val / 10) * radius
    const a = axisAngle(i)
    return [center + r * Math.cos(a), center + r * Math.sin(a)]
  }
  const labelAnchor = (i: number): { textAnchor: 'start' | 'end'; dominantBaseline: 'auto' | 'hanging' } => {
    const a = axisAngle(i)
    const dx = Math.cos(a)
    const dy = Math.sin(a)
    return {
      textAnchor: dx > 0 ? 'start' : 'end',
      dominantBaseline: dy > 0 ? 'hanging' : 'auto',
    }
  }
  const labelPos = (i: number): [number, number] => {
    const r = radius + 14
    const a = axisAngle(i)
    const x = center + r * Math.cos(a)
    const y = i < 2 ? 100 : 420
    return [x, y]
  }

  const valsYo     = DIMENSIONES.map(d => resultados.find(x => x.id === d.id)?.yo.promedio ?? null)
  const valsEquipo = DIMENSIONES.map(d => resultados.find(x => x.id === d.id)?.equipo.promedio ?? null)
  const completa = (vs: (number | null)[]) => vs.every(v => v !== null)

  return (
    <svg viewBox={`${-padX} ${viewBoxY} ${size + padX * 2} ${viewBoxH}`} style={{ width: '100%', maxWidth: maxSize, height: 'auto' }}>
      {[2, 4, 6, 8, 10].map(level => (
        <polygon
          key={level}
          points={DIMENSIONES.map((_, i) => point(i, level).join(',')).join(' ')}
          fill="none"
          stroke="#0A0A0A"
          strokeOpacity={level === 10 ? 1 : 0.18}
          strokeWidth={level === 10 ? 1.5 : 1}
        />
      ))}

      {DIMENSIONES.map((dim, i) => {
        const [x, y] = point(i, 10)
        return <line key={dim.id} x1={center} y1={center} x2={x} y2={y} stroke="#0A0A0A" strokeOpacity={0.3} strokeWidth={1} />
      })}

      {/* Polígono EQUIPO (más al fondo) */}
      {completa(valsEquipo) && (
        <g>
          <polygon
            points={valsEquipo.map((v, i) => point(i, v as number).join(',')).join(' ')}
            fill={COLOR_EQUIPO} fillOpacity={0.18}
            stroke={COLOR_EQUIPO} strokeWidth={2.5} strokeLinejoin="round"
          />
          {valsEquipo.map((v, i) => {
            const [px, py] = point(i, v as number)
            return <circle key={i} cx={px} cy={py} r={5} fill={COLOR_EQUIPO} stroke="#0A0A0A" strokeWidth={1.5} />
          })}
        </g>
      )}
      {/* Polígono YO (encima) */}
      {completa(valsYo) && (
        <g>
          <polygon
            points={valsYo.map((v, i) => point(i, v as number).join(',')).join(' ')}
            fill={COLOR_YO} fillOpacity={0.18}
            stroke={COLOR_YO} strokeWidth={2.5} strokeLinejoin="round"
          />
          {valsYo.map((v, i) => {
            const [px, py] = point(i, v as number)
            return <circle key={i} cx={px} cy={py} r={5} fill={COLOR_YO} stroke="#0A0A0A" strokeWidth={1.5} />
          })}
        </g>
      )}

      {[0, 2, 4, 6, 8, 10].map(level => {
        const cy = center - (level / 10) * radius * Math.SQRT1_2
        return (
          <g key={`tick-${level}`}>
            <circle cx={center} cy={cy} r={10} fill="#0A0A0A" />
            <text x={center} y={cy} fontSize="10" fontWeight="700" fill="#fff" textAnchor="middle" dominantBaseline="central">
              {level}
            </text>
          </g>
        )
      })}

      {DIMENSIONES.map((dim, i) => {
        const [x, y] = labelPos(i)
        const { textAnchor, dominantBaseline } = labelAnchor(i)
        return (
          <text key={dim.id} x={x} y={y} textAnchor={textAnchor} dominantBaseline={dominantBaseline} fontSize="14" fontWeight="800" fill="#0A0A0A">
            {dim.nombre}
          </text>
        )
      })}
    </svg>
  )
}

export default function ResultadosEspejo({
  nombreCompania, estado, totalParticipantes, totalFormularios, resultados,
  comparacion, rondaActual, rondaAnterior,
}: Props) {
  const getAnterior = (id: number) => comparacion?.find(c => c.id === id) ?? null
  return (
    <>
      {/* MOBILE */}
      <div className="only-mobile" style={{ fontFamily: "'Red Hat Display', sans-serif", background: 'var(--bg)', minHeight: '100vh' }}>
        <header style={{ borderBottom: '1.5px solid var(--ink)', background: '#ffffff', padding: '10px 20px', display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image src="/brand/laborativo-logo.png" alt="Laborativo" width={120} height={31} style={{ objectFit: 'contain' }} />
            <span style={{ color: 'var(--mute)', fontSize: 12, marginTop: 4 }}>/</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', letterSpacing: '.04em', marginTop: 4 }}>Espejo</span>
          </div>
        </header>

        <div style={{ padding: '24px 20px 20px', borderBottom: '1.5px solid var(--ink)' }}>
          <span className="page-header__eyebrow">Equipo en Espejo{rondaActual && rondaActual > 1 ? ` · Ronda ${rondaActual}` : ''}</span>
          <div className="page-header__rule" />
          <h1 style={{ fontSize: 'clamp(28px, 8vw, 36px)', fontWeight: 900, letterSpacing: '-.02em', lineHeight: 1, margin: 0 }}>
            {nombreCompania}
          </h1>
        </div>

        <SectionBar title="Resumen" subtitle={`Estado · ${estado}`} mobile />
        <div style={{ borderBottom: '1.5px solid var(--ink)', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          {[
            { label: 'Participantes', count: totalParticipantes },
            { label: '# formularios', count: totalFormularios },
          ].map((g, i) => (
            <div key={g.label} style={{
              padding: '14px 16px',
              borderRight: i === 0 ? '1.5px solid var(--ink)' : 'none',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <span style={{ fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink)', fontWeight: 700 }}>{g.label}</span>
              <div style={{ fontWeight: 900, fontSize: 32, lineHeight: 1, letterSpacing: '-.03em' }}>{g.count}</div>
            </div>
          ))}
        </div>

        <SectionBar title="Brecha Yo ↔ Equipo" subtitle="Por dimensión" mobile />
        <div style={{ padding: '16px 20px 4px', borderBottom: '1.5px solid var(--line-soft)' }}>
          <Leyenda mobile />
        </div>
        <div style={{ borderBottom: '1.5px solid var(--ink)' }}>
          {[...resultados].sort((a, b) => b.delta - a.delta).map((dim, i, arr) => (
            <div key={dim.id} style={{ borderBottom: i < arr.length - 1 ? '1.5px solid var(--ink)' : 'none' }}>
              <DimCard dim={dim} anterior={getAnterior(dim.id)} rondaAnterior={rondaAnterior} mobile />
            </div>
          ))}
        </div>

        <SectionBar title="Forma del espejo" subtitle="Vista radar" mobile />
        <div style={{ padding: '24px 20px 32px', borderBottom: '1.5px solid var(--ink)', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          <Leyenda mobile />
          <RadarEspejo resultados={resultados} maxSize={420} />
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 9.5, color: 'var(--ink)', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600 }}>
          <span>Laborativo / Consultoría Creativa Basada en la Emoción</span>
          <span>Espejo · V1.0</span>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="only-desktop" style={{ fontFamily: "'Red Hat Display', sans-serif", background: 'var(--bg)', minHeight: '100vh' }}>
        <header style={{ borderBottom: '1.5px solid var(--ink)', background: '#ffffff', padding: '14px 40px', display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Image src="/brand/laborativo-logo.png" alt="Laborativo" width={154} height={39} style={{ objectFit: 'contain' }} />
            <span style={{ color: 'var(--mute)', fontSize: 14, marginTop: 5 }}>/</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', letterSpacing: '.04em', marginTop: 5 }}>Espejo</span>
          </div>
        </header>

        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ padding: '40px 56px 32px', borderBottom: '1.5px solid var(--ink)' }}>
            <span className="page-header__eyebrow">Equipo en Espejo{rondaActual && rondaActual > 1 ? ` · Ronda ${rondaActual}` : ''}</span>
            <div className="page-header__rule" />
            <h1 className="page-header__title" style={{ fontSize: 'clamp(32px,4vw,48px)' }}>
              {nombreCompania}
            </h1>
          </div>

          <SectionBar title="Resumen de respuestas" subtitle={`Estado · ${estado}`} />
          <div style={{ borderBottom: '1.5px solid var(--ink)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)' }}>
              {[
                { label: 'Participantes', count: totalParticipantes },
                { label: '# de formularios', count: totalFormularios },
              ].map((g, i, arr) => (
                <div key={g.label} style={{
                  padding: '16px 24px',
                  borderRight: i < arr.length - 1 ? '1.5px solid var(--ink)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
                }}>
                  <span style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink)', fontWeight: 700 }}>{g.label}</span>
                  <div style={{ fontWeight: 900, fontSize: 40, lineHeight: 1, letterSpacing: '-.03em' }}>{g.count}</div>
                </div>
              ))}
            </div>
          </div>

          <SectionBar title="Brecha Yo ↔ Equipo" subtitle="Por dimensión, ordenadas por mayor brecha" />
          <div style={{ padding: '20px 56px 12px', borderBottom: '1.5px solid var(--line-soft)' }}>
            <Leyenda />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', borderBottom: '1.5px solid var(--ink)' }}>
            {[...resultados].sort((a, b) => b.delta - a.delta).map((dim, i, arr) => (
              <div key={dim.id} style={{
                borderRight: i % 2 === 0 ? '1.5px solid var(--ink)' : 'none',
                borderBottom: i < arr.length - 2 ? '1.5px solid var(--ink)' : 'none',
              }}>
                <DimCard dim={dim} anterior={getAnterior(dim.id)} rondaAnterior={rondaAnterior} />
              </div>
            ))}
          </div>

          <SectionBar title="Forma del espejo" subtitle="Yo y Equipo en una sola vista" />
          <div style={{ padding: '32px 56px 48px', borderBottom: '1.5px solid var(--ink)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <Leyenda />
            <RadarEspejo resultados={resultados} maxSize={520} />
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink)', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600 }}>
          <span>Laborativo / Consultoría Creativa Basada en la Emoción</span>
          <span>Espejo · V1.0</span>
        </div>
      </div>
    </>
  )
}
