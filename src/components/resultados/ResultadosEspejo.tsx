import Image from 'next/image'
import { DIMENSIONES } from '@/types'
import { ChipTipo, dispersionBg, promedioBg, RANGOS_DISPERSION } from './_dispersion-shared'

type Perspectiva = 'YO' | 'EQUIPO'

type DimResultado = {
  id: number
  nombre: string
  subtitulo: string
  yo: { promedio: number | null; desviacion: number; n: number }
  equipo: { promedio: number | null; desviacion: number; n: number }
  delta: number
}

type PreguntaBrecha = {
  idYo: string
  idEquipo: string
  texto: string
  dimension_id: number
  promYo: number
  promEquipo: number
  brecha: number
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
  benchmark?: DimResultado[] | null
  benchmarkN?: number
  /** Para cada dimensión, lista de promedios por persona por perspectiva. */
  dispersionPorDimEspejo?: Record<number, { YO: number[]; EQUIPO: number[] }>
  /** Preguntas ordenadas por brecha Yo-Equipo (descendente). */
  preguntasBrechaEspejo?: PreguntaBrecha[]
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
      fontFeatureSettings: '"tnum" 1, "zero" 0',
    }}>
      {flecha} {signo}{diff.toFixed(1)}
      {rondaAnterior ? <span style={{ fontWeight: 500, color: 'var(--mute)', letterSpacing: '.04em', textTransform: 'uppercase', fontSize: 8.5 }}> vs r{rondaAnterior}</span> : null}
    </span>
  )
}

// Paleta Espejo — mismo lenguaje cromático que el 360 (cyan + rosa)
const COLOR_YO     = '#00E6FF' // cyan
const COLOR_EQUIPO = '#FF3366' // rosa

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

// Leyenda apilada vertical para acompañar el radar a su derecha.
function LeyendaVertical() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: COLOR_YO }} /> Yo
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: COLOR_EQUIPO }} /> Equipo
      </span>
    </div>
  )
}

// Barra única dividida horizontalmente: Yo arriba, Equipo abajo,
// línea negra en el medio. Etiquetas a la izquierda, valores a la derecha.
function BarrasYoEquipo({
  yo, equipo, mobile,
}: { yo: number | null; equipo: number | null; mobile?: boolean }) {
  const pctYo = yo !== null ? ((yo - 1) / 9) * 100 : 0
  const pctEq = equipo !== null ? ((equipo - 1) / 9) * 100 : 0
  const altoBarra = mobile ? 36 : 44
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr 48px', gap: mobile ? 8 : 12, alignItems: 'stretch' }}>
      {/* Labels apilados a la izquierda */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{
          flex: 1, display: 'flex', alignItems: 'center',
          fontSize: mobile ? 10 : 11, letterSpacing: '.08em',
          textTransform: 'uppercase', fontWeight: 700, color: 'var(--ink)',
        }}>YO</span>
        <span style={{
          flex: 1, display: 'flex', alignItems: 'center',
          fontSize: mobile ? 10 : 11, letterSpacing: '.08em',
          textTransform: 'uppercase', fontWeight: 700, color: 'var(--ink)',
        }}>EQUIPO</span>
      </div>

      {/* Barra única: mitad superior Yo, línea negra, mitad inferior Equipo */}
      <div style={{
        position: 'relative', height: altoBarra,
        border: '1.5px solid var(--ink)',
      }}>
        {yo !== null && (
          <div style={{
            position: 'absolute', left: 0, top: 0, height: '50%',
            width: `${pctYo}%`, background: COLOR_YO,
          }} />
        )}
        <div aria-hidden style={{
          position: 'absolute', left: 0, right: 0, top: '50%',
          height: 1.5, background: 'var(--ink)', transform: 'translateY(-50%)',
        }} />
        {equipo !== null && (
          <div style={{
            position: 'absolute', left: 0, bottom: 0, height: '50%',
            width: `${pctEq}%`, background: COLOR_EQUIPO,
          }} />
        )}
      </div>

      {/* Valores apilados a la derecha */}
      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right', fontFeatureSettings: '"tnum" 1, "zero" 0' }}>
        <b style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          fontSize: mobile ? 14 : 16, fontWeight: 900,
          color: yo !== null ? 'var(--ink)' : 'var(--mute)',
        }}>
          {yo !== null ? yo.toFixed(1) : '—'}
        </b>
        <b style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          fontSize: mobile ? 14 : 16, fontWeight: 900,
          color: equipo !== null ? 'var(--ink)' : 'var(--mute)',
        }}>
          {equipo !== null ? equipo.toFixed(1) : '—'}
        </b>
      </div>
    </div>
  )
}

function DimCard({ dim, anterior, rondaAnterior, benchmark, benchmarkN, mobile }: { dim: DimResultado; anterior?: DimResultado | null; rondaAnterior?: number; benchmark?: DimResultado | null; benchmarkN?: number; mobile?: boolean }) {
  return (
    <div style={{
      padding: mobile ? '0' : '0',
      display: 'flex', flexDirection: 'column', gap: mobile ? 12 : 16,
    }}>
      {/* Header: dimensión + separador vertical + Δ, todo en la misma fila a la izquierda */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink)', fontWeight: 700 }}>{dim.subtitulo}</div>
          <h3 style={{ fontSize: mobile ? 20 : 22, fontWeight: 900, letterSpacing: '-.02em', lineHeight: 1, margin: '4px 0 0' }}>{dim.nombre}</h3>
        </div>
        <span aria-hidden style={{ width: 1.5, alignSelf: 'stretch', background: 'var(--ink)' }} />
        <span style={{
          padding: mobile ? '8px 12px' : '12px 14px', background: deltaBg(dim.delta),
          fontSize: mobile ? 16 : 20, fontWeight: 900, letterSpacing: '-.02em',
          fontFeatureSettings: '"tnum" 1, "zero" 0', flexShrink: 0,
          color: 'var(--ink)', lineHeight: 1,
          alignSelf: 'stretch', display: 'inline-flex', alignItems: 'center',
        }}>
          Δ {dim.delta.toFixed(1)}
        </span>
      </div>
      <BarrasYoEquipo yo={dim.yo.promedio} equipo={dim.equipo.promedio} mobile={mobile} />
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
      {benchmark && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid var(--line-soft)', paddingTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 600, color: 'var(--ink-2)' }}>
            <span style={{ width: 8, height: 8, background: 'var(--ink)', display: 'inline-block', borderRadius: '50%' }} />
            Benchmark Laborativo
            {benchmarkN && benchmarkN > 0 ? <span style={{ color: 'var(--mute)', fontWeight: 500 }}>· {benchmarkN} {benchmarkN === 1 ? 'equipo' : 'equipos'}</span> : null}
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 11, fontWeight: 600, color: 'var(--ink-2)' }}>
            <span><span style={{ color: 'var(--mute)' }}>Yo</span> <b style={{ fontWeight: 800, color: 'var(--ink)', fontFeatureSettings: '"tnum" 1, "zero" 0' }}>{benchmark.yo.promedio !== null ? benchmark.yo.promedio.toFixed(1) : '—'}</b></span>
            <span><span style={{ color: 'var(--mute)' }}>Equipo</span> <b style={{ fontWeight: 800, color: 'var(--ink)', fontFeatureSettings: '"tnum" 1, "zero" 0' }}>{benchmark.equipo.promedio !== null ? benchmark.equipo.promedio.toFixed(1) : '—'}</b></span>
          </div>
        </div>
      )}
    </div>
  )
}

// Radar con 2 polígonos: YO y EQUIPO.
// Geometría idéntica al radar del dashboard 360° (RadarPerspectivas) —
// solo cambian los polígonos que pinta (Yo + Equipo en vez de los 4 roles).
function RadarEspejo({ resultados, maxSize }: { resultados: DimResultado[]; maxSize: number }) {
  const size = 520
  const center = size / 2
  const radius = size * 0.48
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
    const y = i < 2 ? 93 : 425
    return [x, y]
  }

  const valsYo     = DIMENSIONES.map(d => resultados.find(x => x.id === d.id)?.yo.promedio ?? null)
  const valsEquipo = DIMENSIONES.map(d => resultados.find(x => x.id === d.id)?.equipo.promedio ?? null)
  const completa = (vs: (number | null)[]) => vs.every(v => v !== null)

  return (
    <svg viewBox={`${-padX} ${viewBoxY} ${size + padX * 2} ${viewBoxH}`} style={{ width: '100%', maxWidth: maxSize, height: 'auto' }}>
      {/* Grid rings */}
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

      {/* Axes */}
      {DIMENSIONES.map((dim, i) => {
        const [x, y] = point(i, 10)
        return (
          <line
            key={dim.id}
            x1={center} y1={center} x2={x} y2={y}
            stroke="#0A0A0A" strokeOpacity={0.3} strokeWidth={1}
          />
        )
      })}

      {/* Polígono EQUIPO (al fondo) */}
      {completa(valsEquipo) && (
        <g>
          <polygon
            points={valsEquipo.map((v, i) => point(i, v as number).join(',')).join(' ')}
            fill={COLOR_EQUIPO} fillOpacity={0.18}
            stroke={COLOR_EQUIPO} strokeWidth={2.5} strokeLinejoin="round"
          />
          {valsEquipo.map((v, i) => {
            const [px, py] = point(i, v as number)
            return <circle key={i} cx={px} cy={py} r={4} fill={COLOR_EQUIPO} stroke="#0A0A0A" strokeWidth={1.5} />
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
            return <circle key={i} cx={px} cy={py} r={4} fill={COLOR_YO} stroke="#0A0A0A" strokeWidth={1.5} />
          })}
        </g>
      )}

      {/* Scale ticks — círculos negros con número blanco */}
      {[0, 2, 4, 6, 8, 10].map(level => {
        const cy = center - (level / 10) * radius * Math.SQRT1_2
        return (
          <g key={`tick-${level}`}>
            <circle cx={center} cy={cy} r={9} fill="#0A0A0A" />
            <text
              x={center} y={cy}
              fontSize="10" fontWeight="700" fill="#fff"
              textAnchor="middle" dominantBaseline="central"
            >
              {level}
            </text>
          </g>
        )
      })}

      {/* Dimension labels en cada esquina */}
      {DIMENSIONES.map((dim, i) => {
        const [x, y] = labelPos(i)
        const { textAnchor, dominantBaseline } = labelAnchor(i)
        return (
          <text
            key={dim.id}
            x={x} y={y}
            textAnchor={textAnchor} dominantBaseline={dominantBaseline}
            fontSize="14" fontWeight="800" fill="#0A0A0A"
          >
            {dim.nombre}
          </text>
        )
      })}
    </svg>
  )
}

export default function ResultadosEspejo({
  nombreCompania, estado, totalParticipantes, totalFormularios, resultados,
  comparacion, rondaActual, rondaAnterior, benchmark, benchmarkN,
  dispersionPorDimEspejo, preguntasBrechaEspejo,
}: Props) {
  const getAnterior = (id: number) => comparacion?.find(c => c.id === id) ?? null
  const getBenchmark = (id: number) => benchmark?.find(b => b.id === id) ?? null
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
          <ChipTipo etiqueta="Equipo en Espejo" rondaActual={rondaActual} />
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
              <DimCard dim={dim} anterior={getAnterior(dim.id)} rondaAnterior={rondaAnterior} benchmark={getBenchmark(dim.id)} benchmarkN={benchmarkN} mobile />
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
            <ChipTipo etiqueta="Equipo en Espejo" rondaActual={rondaActual} />
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
          <div style={{
            padding: '40px 56px 48px', borderBottom: '1.5px solid var(--ink)',
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', columnGap: 56, rowGap: 64,
          }}>
            {[...resultados].sort((a, b) => b.delta - a.delta).map(dim => (
              <DimCard
                key={dim.id}
                dim={dim}
                anterior={getAnterior(dim.id)}
                rondaAnterior={rondaAnterior}
                benchmark={getBenchmark(dim.id)}
                benchmarkN={benchmarkN}
              />
            ))}
          </div>

          {/* Forma del espejo + Más alineado/Menos alineado agrupados:
              cards apiladas a la izquierda, radar + leyenda lateral a la derecha. */}
          <SectionBar title="Forma del espejo" subtitle="Yo y Equipo · más alineado y menos alineado" />
          <div style={{
            padding: '16px 56px 16px', borderBottom: '1.5px solid var(--ink)',
            display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 48, alignItems: 'center',
          }}>
            {/* Izquierda: Más alineado / Menos alineado apilados */}
            <AlineadoDistanteApilado resultados={resultados} />

            {/* Derecha: radar + leyenda apilada vertical a su derecha */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <RadarEspejo resultados={resultados} maxSize={580} />
              <LeyendaVertical />
            </div>
          </div>

          {/* Dispersión por perspectiva: mini-histograma con YO y EQUIPO superpuestos */}
          {dispersionPorDimEspejo && (
            <>
              <SectionBar title="Dispersión del equipo" subtitle="Frecuencia de respuestas por dimensión y perspectiva" />
              <div style={{ padding: '48px 56px 56px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', columnGap: 64, rowGap: 64 }}>
                {resultados.map(dim => (
                  <HistogramaEspejo
                    key={dim.id}
                    nombre={dim.nombre}
                    subtitulo={dim.subtitulo}
                    yo={dim.yo}
                    equipo={dim.equipo}
                    valoresYo={dispersionPorDimEspejo[dim.id]?.YO ?? []}
                    valoresEquipo={dispersionPorDimEspejo[dim.id]?.EQUIPO ?? []}
                  />
                ))}
              </div>
              <LeyendaDispersionEspejo />
            </>
          )}

          {/* Preguntas con mayor brecha Yo–Equipo */}
          {preguntasBrechaEspejo && preguntasBrechaEspejo.length > 0 && (
            <PreguntasBrechaEspejo preguntas={preguntasBrechaEspejo} />
          )}
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink)', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600 }}>
          <span>Laborativo / Consultoría Creativa Basada en la Emoción</span>
          <span>Espejo · V1.0</span>
        </div>
      </div>
    </>
  )
}

// ─── "El espejo más alineado / más distante" — versión apilada ───
// Las dos cards una encima de la otra (para mostrar al lado del radar).
function AlineadoDistanteApilado({ resultados }: { resultados: DimResultado[] }) {
  const sorted = [...resultados].sort((a, b) => a.delta - b.delta)
  const masAlineada = sorted[0]
  const masDistante = sorted[sorted.length - 1]
  if (!masAlineada || !masDistante) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
      <CardAlineado dim={masAlineada} variante="alineado" />
      <CardAlineado dim={masDistante} variante="distante" />
    </div>
  )
}

function CardAlineado({ dim, variante }: { dim: DimResultado; variante: 'alineado' | 'distante' }) {
  const color = variante === 'alineado' ? '#C8E6C9' : '#F2C2C2'
  const etiqueta = variante === 'alineado' ? 'Más alineado' : 'Menos alineado'
  const subtitulo = variante === 'alineado'
    ? 'La mirada individual y la del equipo se parecen.'
    : 'La mirada individual y la del equipo se separan.'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Label negro + nombre de la dimensión al lado derecho */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 700,
          background: 'var(--ink)', color: '#fff', padding: '3px 10px',
        }}>{etiqueta}</span>
        <h3 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-.02em', margin: 0, lineHeight: 1 }}>
          {dim.nombre}
        </h3>
      </div>
      <p style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500, margin: 0, lineHeight: 1.4 }}>
        {subtitulo}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Caja del Δ 20% más grande */}
        <span style={{
          fontSize: 34, fontWeight: 900, letterSpacing: '-.03em', color: 'var(--ink)',
          fontFeatureSettings: '"tnum" 1, "zero" 0', lineHeight: 1,
          background: color, padding: '10px 16px', display: 'inline-block',
        }}>
          Δ {dim.delta.toFixed(1)}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontFeatureSettings: '"tnum" 1, "zero" 0' }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-2)' }}>
            Yo <b style={{ color: 'var(--ink)', fontWeight: 800 }}>{dim.yo.promedio !== null ? dim.yo.promedio.toFixed(1) : '—'}</b>
          </span>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-2)' }}>
            Equipo <b style={{ color: 'var(--ink)', fontWeight: 800 }}>{dim.equipo.promedio !== null ? dim.equipo.promedio.toFixed(1) : '—'}</b>
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Histograma de Espejo: dos series superpuestas (YO + EQUIPO) ─
function HistogramaEspejo({
  nombre, subtitulo, yo, equipo, valoresYo, valoresEquipo,
}: {
  nombre: string
  subtitulo: string
  yo: { promedio: number | null; desviacion: number }
  equipo: { promedio: number | null; desviacion: number }
  valoresYo: number[]
  valoresEquipo: number[]
}) {
  const bucketize = (valores: number[]) => {
    const b = Array(10).fill(0) as number[]
    for (const v of valores) {
      const i = Math.max(1, Math.min(10, Math.round(v))) - 1
      b[i] += 1
    }
    return b
  }
  const bucketsYo = bucketize(valoresYo)
  const bucketsEquipo = bucketize(valoresEquipo)
  const maxFreq = Math.max(1, ...bucketsYo, ...bucketsEquipo)
  const ALTO = 130
  const ROTULO = 16
  const ALTO_BARRA = ALTO - ROTULO

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink)', fontWeight: 700 }}>
            {subtitulo}
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-.02em', lineHeight: 1, marginTop: 2 }}>
            {nombre}
          </div>
        </div>
        <span aria-hidden style={{ width: 1.5, alignSelf: 'stretch', background: 'var(--ink)' }} />
        <PromedioCompacto label="Yo" valor={yo.promedio} dispersion={yo.desviacion} color={COLOR_YO} />
        <PromedioCompacto label="Equipo" valor={equipo.promedio} dispersion={equipo.desviacion} color={COLOR_EQUIPO} />
      </div>

      <div style={{ position: 'relative' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6,
          height: ALTO, borderBottom: '1px solid var(--ink)', alignItems: 'end',
        }}>
          {bucketsYo.map((_, i) => {
            const nYo = bucketsYo[i]
            const nEq = bucketsEquipo[i]
            const hYo = (nYo / maxFreq) * ALTO_BARRA
            const hEq = (nEq / maxFreq) * ALTO_BARRA
            return (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
                <span style={{
                  fontSize: 10, fontWeight: 800, color: 'var(--ink)',
                  fontFeatureSettings: '"tnum" 1, "zero" 0', lineHeight: 1,
                  visibility: (nYo > 0 || nEq > 0) ? 'visible' : 'hidden',
                }}>
                  {nYo + nEq}
                </span>
                {/* Dos barras lado a lado dentro del slot */}
                <div style={{
                  width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2,
                  alignItems: 'end', justifyContent: 'center',
                  flex: 1,
                }}>
                  <div title={`Yo · ${i + 1}: ${nYo}`} style={{
                    height: `${hYo}px`, minHeight: nYo > 0 ? 4 : 0,
                    background: COLOR_YO,
                  }} />
                  <div title={`Equipo · ${i + 1}: ${nEq}`} style={{
                    height: `${hEq}px`, minHeight: nEq > 0 ? 4 : 0,
                    background: COLOR_EQUIPO,
                  }} />
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6, marginTop: 6 }}>
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

function PromedioCompacto({ label, valor, dispersion, color }: { label: string; valor: number | null; dispersion: number; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
        {label}
      </span>
      <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-.02em', color: 'var(--ink)', fontFeatureSettings: '"tnum" 1, "zero" 0', lineHeight: 1 }}>
        {valor !== null ? valor.toFixed(1) : '—'} <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)' }}>± {dispersion.toFixed(1)}</span>
      </span>
    </div>
  )
}

function LeyendaDispersionEspejo() {
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

// ─── Preguntas con mayor brecha Yo–Equipo ────────────────────────
function PreguntasBrechaEspejo({ preguntas }: { preguntas: PreguntaBrecha[] }) {
  const top = preguntas.slice(0, 5)
  const dimNombre = (id: number) => DIMENSIONES.find(d => d.id === id)?.nombre ?? ''

  // Color del badge de brecha según tamaño
  const brechaBg = (b: number) => b >= 2.5 ? '#F2C2C2' : b >= 1.5 ? '#FCE99A' : '#C8E6C9'

  return (
    <>
      <SectionBar title="Preguntas con mayor brecha" subtitle="Dónde más se separan Yo y Equipo" />
      <div style={{ padding: '40px 56px 48px', borderBottom: '1.5px solid var(--ink)', display: 'flex', flexDirection: 'column' }}>
        {top.map((p, i) => (
          <div
            key={p.idYo}
            style={{
              display: 'grid', gridTemplateColumns: '90px 1fr auto auto',
              padding: '16px 0', gap: 32,
              borderTop: i === 0 ? 'none' : '1px solid var(--line-soft)',
              alignItems: 'center',
            }}
          >
            <span style={{
              fontSize: 22, fontWeight: 900, letterSpacing: '-.03em', color: 'var(--ink)',
              fontFeatureSettings: '"tnum" 1, "zero" 0', lineHeight: 1,
              background: brechaBg(p.brecha), padding: '6px 10px',
              display: 'inline-block', justifySelf: 'start',
            }}>
              Δ {p.brecha.toFixed(1)}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink)', fontWeight: 700 }}>
                {dimNombre(p.dimension_id)}
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.4 }}>
                {p.texto}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFeatureSettings: '"tnum" 1, "zero" 0' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLOR_YO }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', letterSpacing: '.04em', textTransform: 'uppercase' }}>Yo</span>
              <b style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>{p.promYo.toFixed(1)}</b>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFeatureSettings: '"tnum" 1, "zero" 0' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLOR_EQUIPO }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', letterSpacing: '.04em', textTransform: 'uppercase' }}>Equipo</span>
              <b style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>{p.promEquipo.toFixed(1)}</b>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// Reservado: helpers de dispersión simples por valor también disponibles si se necesita.
void dispersionBg
void promedioBg
