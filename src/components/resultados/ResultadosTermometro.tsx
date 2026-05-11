import Image from 'next/image'

type DimResultado = {
  id: number
  nombre: string
  subtitulo: string
  promedio: number | null  // 1–10
  desviacion: number
  n: number
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
      fontSize: 11, fontWeight: 700, color,
      fontVariantNumeric: 'tabular-nums',
    }}>
      {flecha} {signo}{diff.toFixed(1)}
      {rondaAnterior ? <span style={{ fontWeight: 500, color: 'var(--mute)', letterSpacing: '.04em', textTransform: 'uppercase', fontSize: 9 }}> vs ronda {rondaAnterior}</span> : null}
    </span>
  )
}

// Color "termómetro" según valor: rojo–ámbar–verde
const tempColor = (v: number | null) => {
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

function MedidorBase({ dim, sizeNumber, padding, anterior, rondaAnterior }: { dim: DimResultado; sizeNumber: number; padding: string; anterior?: number | null; rondaAnterior?: number }) {
  const pct = dim.promedio !== null ? ((dim.promedio - 1) / 9) * 100 : 0
  const color = tempColor(dim.promedio)
  return (
    <div style={{ padding, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink)', fontWeight: 700 }}>{dim.subtitulo}</div>
          <h3 style={{ fontSize: sizeNumber * 0.32, fontWeight: 900, letterSpacing: '-.02em', lineHeight: 1, margin: '4px 0 0' }}>{dim.nombre}</h3>
        </div>
        {anterior !== null && anterior !== undefined && <DeltaRonda actual={dim.promedio} anterior={anterior} rondaAnterior={rondaAnterior} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontWeight: 900, fontSize: sizeNumber, lineHeight: .9, letterSpacing: '-.05em', color }}>
          {dim.promedio !== null ? dim.promedio.toFixed(1) : '—'}
        </span>
        {dim.promedio !== null && (
          <span style={{ fontWeight: 700, fontSize: sizeNumber * 0.4, lineHeight: 1, letterSpacing: '-.02em' }}>
            <span style={{ position: 'relative', top: -sizeNumber * 0.07 }}>/</span><span>10</span>
          </span>
        )}
      </div>
      {/* Barra termómetro */}
      <div style={{ position: 'relative', height: 10, background: 'var(--bg-2)', border: '1.5px solid var(--ink)' }}>
        {dim.promedio !== null && (
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: color }} />
        )}
        {/* marcas en 5 y 8 */}
        {[5, 8].map(n => (
          <div key={n} style={{
            position: 'absolute',
            left: `${((n - 1) / 9) * 100}%`,
            top: -3, bottom: -3, width: 1.5,
            background: 'var(--ink)', opacity: .4,
          }} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-2)', fontWeight: 500 }}>
        ± {dim.desviacion.toFixed(1)} de dispersión · {dim.n} respuestas
      </div>
    </div>
  )
}

export default function ResultadosTermometro({
  nombreCompania, estado, totalParticipantes, totalFormularios, resultados,
  comparacion, rondaActual, rondaAnterior,
}: Props) {
  const hayComparacion = comparacion && comparacion.length > 0
  const getAnterior = (id: number) => comparacion?.find(c => c.id === id)?.promedio ?? null
  return (
    <>
      {/* MOBILE */}
      <div className="only-mobile" style={{ fontFamily: "'Red Hat Display', sans-serif", background: 'var(--bg)', minHeight: '100vh' }}>
        <header style={{ borderBottom: '1.5px solid var(--ink)', background: '#ffffff', padding: '10px 20px', display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image src="/brand/laborativo-logo.png" alt="Laborativo" width={120} height={31} style={{ objectFit: 'contain' }} />
            <span style={{ color: 'var(--mute)', fontSize: 12, marginTop: 4 }}>/</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', letterSpacing: '.04em', marginTop: 4 }}>Termómetro</span>
          </div>
        </header>

        <div style={{ padding: '24px 20px 20px', borderBottom: '1.5px solid var(--ink)' }}>
          <span className="page-header__eyebrow">Termómetro de 4{rondaActual && rondaActual > 1 ? ` · Ronda ${rondaActual}` : ''}</span>
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

        <SectionBar title="Lectura por dimensión" subtitle="Escala 1–10" mobile />
        <div style={{ borderBottom: '1.5px solid var(--ink)', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          {resultados.map((dim, i) => (
            <div key={dim.id} style={{
              borderRight: i % 2 === 0 ? '1.5px solid var(--ink)' : 'none',
              borderBottom: i < resultados.length - 2 ? '1.5px solid var(--ink)' : 'none',
            }}>
              <MedidorBase dim={dim} sizeNumber={56} padding="18px 16px 20px" anterior={hayComparacion ? getAnterior(dim.id) : null} rondaAnterior={rondaAnterior} />
            </div>
          ))}
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 9.5, color: 'var(--ink)', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600 }}>
          <span>Laborativo / Consultoría Creativa Basada en la Emoción</span>
          <span>Termómetro · V1.0</span>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="only-desktop" style={{ fontFamily: "'Red Hat Display', sans-serif", background: 'var(--bg)', minHeight: '100vh' }}>
        <header style={{ borderBottom: '1.5px solid var(--ink)', background: '#ffffff', padding: '14px 40px', display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Image src="/brand/laborativo-logo.png" alt="Laborativo" width={154} height={39} style={{ objectFit: 'contain' }} />
            <span style={{ color: 'var(--mute)', fontSize: 14, marginTop: 5 }}>/</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', letterSpacing: '.04em', marginTop: 5 }}>Termómetro</span>
          </div>
        </header>

        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ padding: '40px 56px 32px', borderBottom: '1.5px solid var(--ink)' }}>
            <span className="page-header__eyebrow">Termómetro de 4{rondaActual && rondaActual > 1 ? ` · Ronda ${rondaActual}` : ''}</span>
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

          <SectionBar title="Lectura por dimensión" subtitle="Una pregunta por dimensión · Escala 1–10" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1.5px solid var(--ink)' }}>
            {resultados.map((dim, i, arr) => (
              <div key={dim.id} style={{
                borderRight: i < arr.length - 1 ? '1.5px solid var(--ink)' : 'none',
              }}>
                <MedidorBase dim={dim} sizeNumber={96} padding="32px 24px 30px" anterior={hayComparacion ? getAnterior(dim.id) : null} rondaAnterior={rondaAnterior} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink)', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600 }}>
          <span>Laborativo / Consultoría Creativa Basada en la Emoción</span>
          <span>Termómetro · V1.0</span>
        </div>
      </div>
    </>
  )
}
