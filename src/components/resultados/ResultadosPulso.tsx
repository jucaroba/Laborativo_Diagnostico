import Image from 'next/image'
import { DIMENSIONES } from '@/types'

type DimResultado = {
  id: number
  nombre: string
  subtitulo: string
  promedio: number | null  // 1–10
  desviacion: number       // std deviation
  n: number                // # respuestas
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
}

// Pinta el benchmark Laborativo (promedio histórico de OTROS diagnósticos del mismo tipo)
function BenchmarkLabel({ valor, n }: { valor: number | null; n?: number }) {
  if (valor === null) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--ink-2)' }}>
      <span style={{ width: 8, height: 8, background: 'var(--ink)', display: 'inline-block', borderRadius: '50%' }} />
      Benchmark Laborativo · <b style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--ink)' }}>{valor.toFixed(1)}</b>
      {n && n > 0 ? <span style={{ color: 'var(--mute)', fontWeight: 500 }}>· {n} {n === 1 ? 'equipo' : 'equipos'}</span> : null}
    </div>
  )
}

// Pinta el Δ vs ronda anterior: subió, bajó, igual.
function DeltaRonda({ actual, anterior, rondaAnterior }: { actual: number | null; anterior: number | null; rondaAnterior?: number }) {
  if (actual === null || anterior === null) return null
  const diff = Math.round((actual - anterior) * 10) / 10
  const color = diff > 0.1 ? '#1A9850' : diff < -0.1 ? '#D73027' : 'var(--mute)'
  const flecha = diff > 0.1 ? '↑' : diff < -0.1 ? '↓' : '→'
  const signo = diff > 0 ? '+' : ''
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 700, color,
      fontVariantNumeric: 'tabular-nums',
    }}>
      {flecha} {signo}{diff.toFixed(1)}
      {rondaAnterior ? <span style={{ fontWeight: 500, color: 'var(--mute)', letterSpacing: '.04em', textTransform: 'uppercase', fontSize: 9 }}> vs ronda {rondaAnterior}</span> : null}
    </span>
  )
}

const avgColor = (v: number | null) => {
  if (v === null) return 'var(--mute)'
  if (v >= 8) return '#1A9850'
  if (v >= 6) return '#A2C859'
  if (v >= 4) return '#FEE08B'
  return '#D73027'
}

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

export default function ResultadosPulso({
  nombreCompania, estado, totalParticipantes, totalFormularios, resultados,
  comparacion, rondaActual, rondaAnterior, benchmark, benchmarkN,
}: Props) {
  const hayComparacion = comparacion && comparacion.length > 0
  const getAnterior = (id: number) => comparacion?.find(c => c.id === id)?.promedio ?? null
  const hayBenchmark = !!benchmark && benchmark.length > 0
  const getBenchmark = (id: number) => benchmark?.find(b => b.id === id)?.promedio ?? null
  return (
    <>
      {/* MOBILE */}
      <div className="only-mobile" style={{ fontFamily: "'Red Hat Display', sans-serif", background: 'var(--bg)', minHeight: '100vh' }}>
        <header style={{ borderBottom: '1.5px solid var(--ink)', background: '#ffffff', padding: '10px 20px', display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image src="/brand/laborativo-logo.png" alt="Laborativo" width={120} height={31} style={{ objectFit: 'contain' }} />
            <span style={{ color: 'var(--mute)', fontSize: 12, marginTop: 4 }}>/</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', letterSpacing: '.04em', marginTop: 4 }}>Pulso · Resultados</span>
          </div>
        </header>

        <div style={{ padding: '24px 20px 20px', borderBottom: '1.5px solid var(--ink)' }}>
          <span className="page-header__eyebrow">Pulso colectivo{rondaActual && rondaActual > 1 ? ` · Ronda ${rondaActual}` : ''}</span>
          <div className="page-header__rule" />
          <h1 style={{ fontSize: 'clamp(28px, 8vw, 36px)', fontWeight: 900, letterSpacing: '-.02em', lineHeight: 1, margin: 0 }}>
            {nombreCompania}
          </h1>
        </div>

        <SectionBar title="Resumen" subtitle={`Estado · ${estado}`} mobile />
        <div style={{ borderBottom: '1.5px solid var(--ink)', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          {[
            { label: 'Participantes',   count: totalParticipantes },
            { label: '# formularios',   count: totalFormularios },
          ].map((g, i) => (
            <div key={g.label} style={{
              padding: '14px 16px',
              borderRight: i === 0 ? '1.5px solid var(--ink)' : 'none',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <span style={{ fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink)', fontWeight: 700 }}>
                {g.label}
              </span>
              <div style={{ fontWeight: 900, fontSize: 32, lineHeight: 1, letterSpacing: '-.03em' }}>{g.count}</div>
            </div>
          ))}
        </div>

        <SectionBar title="Pulso por dimensión" subtitle="Escala 1–10" mobile />
        <div style={{ borderBottom: '1.5px solid var(--ink)' }}>
          {[...resultados].sort((a, b) => (b.promedio ?? -Infinity) - (a.promedio ?? -Infinity)).map((dim, i, arr) => (
            <DimCardMobile
              key={dim.id}
              dim={dim}
              anterior={hayComparacion ? getAnterior(dim.id) : null}
              rondaAnterior={rondaAnterior}
              benchmark={hayBenchmark ? getBenchmark(dim.id) : null}
              benchmarkN={benchmarkN}
              ultimo={i === arr.length - 1}
            />
          ))}
        </div>

        <SectionBar title="Forma del pulso" subtitle="Vista radar" mobile />
        <div style={{ padding: '24px 20px 32px', borderBottom: '1.5px solid var(--ink)' }}>
          <RadarPulso resultados={resultados} maxSize={420} />
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 9.5, color: 'var(--ink)', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600 }}>
          <span>Laborativo / Consultoría Creativa Basada en la Emoción</span>
          <span>Pulso · V1.0</span>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="only-desktop" style={{ fontFamily: "'Red Hat Display', sans-serif", background: 'var(--bg)', minHeight: '100vh' }}>
        <header style={{ borderBottom: '1.5px solid var(--ink)', background: '#ffffff', padding: '14px 40px', display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Image src="/brand/laborativo-logo.png" alt="Laborativo" width={154} height={39} style={{ objectFit: 'contain' }} />
            <span style={{ color: 'var(--mute)', fontSize: 14, marginTop: 5 }}>/</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', letterSpacing: '.04em', marginTop: 5 }}>Pulso · Resultados</span>
          </div>
        </header>

        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ padding: '40px 56px 32px', borderBottom: '1.5px solid var(--ink)' }}>
            <span className="page-header__eyebrow">Pulso colectivo{rondaActual && rondaActual > 1 ? ` · Ronda ${rondaActual}` : ''}</span>
            <div className="page-header__rule" />
            <h1 className="page-header__title" style={{ fontSize: 'clamp(32px,4vw,48px)' }}>
              {nombreCompania}
            </h1>
          </div>

          <SectionBar title="Resumen de respuestas" subtitle={`Estado · ${estado}`} />
          <div style={{ padding: '0', borderBottom: '1.5px solid var(--ink)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)' }}>
              {[
                { label: 'Participantes',   count: totalParticipantes },
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

          <SectionBar title="Pulso por dimensión" subtitle="Escala 1–10" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1.5px solid var(--ink)' }}>
            {[...resultados].sort((a, b) => (b.promedio ?? -Infinity) - (a.promedio ?? -Infinity)).map((dim, i, arr) => (
              <DimCardDesktop
                key={dim.id}
                dim={dim}
                anterior={hayComparacion ? getAnterior(dim.id) : null}
                rondaAnterior={rondaAnterior}
                benchmark={hayBenchmark ? getBenchmark(dim.id) : null}
                benchmarkN={benchmarkN}
                ultimo={i === arr.length - 1}
              />
            ))}
          </div>

          <SectionBar title="Forma del pulso" subtitle="Las 4 dimensiones como polígono" />
          <div style={{ padding: '32px 56px 48px', borderBottom: '1.5px solid var(--ink)', display: 'flex', justifyContent: 'center' }}>
            <RadarPulso resultados={resultados} maxSize={520} />
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink)', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600 }}>
          <span>Laborativo / Consultoría Creativa Basada en la Emoción</span>
          <span>Pulso · V1.0</span>
        </div>
      </div>
    </>
  )
}

// ─── DimCard ─────────────────────────────────────────────────────

function DimCardMobile({ dim, anterior, rondaAnterior, benchmark, benchmarkN, ultimo }: { dim: DimResultado; anterior: number | null; rondaAnterior?: number; benchmark: number | null; benchmarkN?: number; ultimo: boolean }) {
  return (
    <div style={{
      padding: '18px 20px 20px',
      borderBottom: ultimo ? 'none' : '1.5px solid var(--ink)',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink)', fontWeight: 700 }}>{dim.subtitulo}</div>
          <h3 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-.02em', lineHeight: 1, margin: '4px 0 0' }}>{dim.nombre}</h3>
        </div>
        {anterior !== null && <DeltaRonda actual={dim.promedio} anterior={anterior} rondaAnterior={rondaAnterior} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontWeight: 900, fontSize: 52, lineHeight: 1, letterSpacing: '-.04em', color: avgColor(dim.promedio) }}>
          {dim.promedio !== null ? dim.promedio.toFixed(1) : '—'}
        </span>
        {dim.promedio !== null && (
          <span style={{ fontWeight: 700, fontSize: 24, lineHeight: 1, letterSpacing: '-.02em' }}>
            <span style={{ position: 'relative', top: -4 }}>/</span><span>10</span>
          </span>
        )}
      </div>
      <BarraPulso valor={dim.promedio} benchmark={benchmark} />
      <div style={{ fontSize: 11, color: 'var(--ink-2)', fontWeight: 500 }}>
        ± {dim.desviacion.toFixed(1)} de dispersión · {dim.n} respuestas
      </div>
      {benchmark !== null && <BenchmarkLabel valor={benchmark} n={benchmarkN} />}
    </div>
  )
}

function DimCardDesktop({ dim, anterior, rondaAnterior, benchmark, benchmarkN, ultimo }: { dim: DimResultado; anterior: number | null; rondaAnterior?: number; benchmark: number | null; benchmarkN?: number; ultimo: boolean }) {
  return (
    <div style={{
      padding: '28px 24px 26px',
      borderRight: ultimo ? 'none' : '1.5px solid var(--ink)',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink)', fontWeight: 700 }}>{dim.subtitulo}</div>
          <h3 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-.02em', lineHeight: 1, margin: '4px 0 0' }}>{dim.nombre}</h3>
        </div>
        {anterior !== null && <DeltaRonda actual={dim.promedio} anterior={anterior} rondaAnterior={rondaAnterior} />}
      </div>
      <div style={{ width: 42, height: 8, background: 'var(--ink)' }} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{ fontWeight: 900, fontSize: 72, lineHeight: 1, letterSpacing: '-.04em', color: avgColor(dim.promedio) }}>
          {dim.promedio !== null ? dim.promedio.toFixed(1) : '—'}
        </span>
        {dim.promedio !== null && (
          <span style={{ fontWeight: 700, fontSize: 36, lineHeight: 1, letterSpacing: '-.02em' }}>
            <span style={{ position: 'relative', top: -5 }}>/</span><span style={{ position: 'relative', top: 0 }}>10</span>
          </span>
        )}
      </div>
      <BarraPulso valor={dim.promedio} benchmark={benchmark} />
      <div style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 500 }}>
        ± {dim.desviacion.toFixed(1)} de dispersión · {dim.n} respuestas
      </div>
      {benchmark !== null && <BenchmarkLabel valor={benchmark} n={benchmarkN} />}
    </div>
  )
}

function BarraPulso({ valor, benchmark }: { valor: number | null; benchmark?: number | null }) {
  const pct = valor !== null ? ((valor - 1) / 9) * 100 : 0
  const benchPct = benchmark !== null && benchmark !== undefined ? ((benchmark - 1) / 9) * 100 : null
  return (
    <div style={{ position: 'relative', height: 8, background: 'var(--bg-2)', border: '1.5px solid var(--ink)' }}>
      {valor !== null && (
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: 'var(--ink)' }} />
      )}
      {benchPct !== null && (
        <div title={`Benchmark: ${benchmark!.toFixed(1)}`} style={{
          position: 'absolute', left: `${benchPct}%`, top: -5, bottom: -5,
          width: 2, background: 'var(--ink)', transform: 'translateX(-1px)',
        }} />
      )}
    </div>
  )
}

// ─── Radar simple (una perspectiva, 4 ejes) ──────────────────────

function RadarPulso({ resultados, maxSize }: { resultados: DimResultado[]; maxSize: number }) {
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

  const vals = DIMENSIONES.map((d) => {
    const r = resultados.find(x => x.id === d.id)
    return r?.promedio ?? null
  })
  const tienePoligono = vals.every(v => v !== null)
  const pts = tienePoligono ? vals.map((v, i) => point(i, v as number).join(',')) : []

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

      {tienePoligono && (
        <g>
          <polygon
            points={pts.join(' ')}
            fill="#0A0A0A"
            fillOpacity={0.12}
            stroke="#0A0A0A"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          {vals.map((v, i) => {
            const [px, py] = point(i, v as number)
            return <circle key={i} cx={px} cy={py} r={5} fill="#0A0A0A" stroke="#fff" strokeWidth={2} />
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
