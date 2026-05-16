import Image from 'next/image'
import { ChipTipo, HistogramaDim, LeyendaDispersion, promedioBg } from './_dispersion-shared'

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
  benchmark?: DimResultado[] | null
  benchmarkN?: number
  /** Promedios por persona por dimensión (calculado en el server). */
  dispersionPorDim?: Record<number, number[]>
}

// Lectura ejecutiva del termómetro: un titular que resume el estado general.
function lecturaEjecutiva(resultados: DimResultado[]): { titulo: string; color: string } {
  const vals = resultados.map(r => r.promedio).filter((v): v is number => typeof v === 'number')
  const bajas = vals.filter(v => v < 5).length
  if (vals.length === 0) return { titulo: 'Sin datos suficientes.', color: 'var(--mute)' }
  if (bajas >= 3) return { titulo: 'Pulso bajo en varias dimensiones.', color: '#F2C2C2' }
  if (bajas >= 1) return { titulo: 'Algunas zonas frías.', color: '#FCE99A' }
  return { titulo: 'Buena temperatura general.', color: '#C8E6C9' }
}

// Frase interpretativa por dimensión según el rango del promedio.
function fraseDim(nombre: string, valor: number | null): string {
  if (valor === null) return ''
  if (valor >= 7.5) return `El equipo siente fortaleza en ${nombre.toLowerCase()}.`
  if (valor >= 6.0) return `Buen pulso en ${nombre.toLowerCase()}, con margen para crecer.`
  if (valor >= 4.5) return `Lectura tibia en ${nombre.toLowerCase()}. Vale revisar.`
  return `${nombre} está bajo. Punto de atención prioritario.`
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
      fontFeatureSettings: '"tnum" 1, "zero" 0',
    }}>
      {flecha} {signo}{diff.toFixed(1)}
      {rondaAnterior ? <span style={{ fontWeight: 500, color: 'var(--mute)', letterSpacing: '.04em', textTransform: 'uppercase', fontSize: 9 }}> vs ronda {rondaAnterior}</span> : null}
    </span>
  )
}

// Color del relleno de la barra del termómetro: ahora unificado con el
// semáforo del resto del dashboard (verde/amarillo/rojo del promedioBg).
const tempColor = (v: number | null) => {
  if (v === null) return 'var(--mute)'
  return promedioBg(v)
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

function MedidorBase({ dim, sizeNumber, padding, anterior, rondaAnterior, benchmark, benchmarkN }: { dim: DimResultado; sizeNumber: number; padding: string; anterior?: number | null; rondaAnterior?: number; benchmark?: number | null; benchmarkN?: number }) {
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
        <span style={{ fontWeight: 900, fontSize: sizeNumber, lineHeight: .9, letterSpacing: '-.05em', color: 'var(--ink)' }}>
          {dim.promedio !== null ? dim.promedio.toFixed(1) : '—'}
        </span>
        {dim.promedio !== null && (
          <span style={{ fontWeight: 700, fontSize: sizeNumber * 0.4, lineHeight: 1, letterSpacing: '-.02em' }}>
            <span style={{ position: 'relative', top: -sizeNumber * 0.07 }}>/</span><span>10</span>
          </span>
        )}
      </div>
      {/* Barra termómetro */}
      <div style={{ position: 'relative', height: 10, border: '1.5px solid var(--ink)' }}>
        {dim.promedio !== null && (
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: color }} />
        )}
        {/* marca benchmark */}
        {benchmark !== null && benchmark !== undefined && (
          <div title={`Benchmark: ${benchmark.toFixed(1)}`} style={{
            position: 'absolute',
            left: `${((benchmark - 1) / 9) * 100}%`,
            top: -5, bottom: -5, width: 2.5,
            background: 'var(--ink)', transform: 'translateX(-1.25px)',
          }} />
        )}
      </div>
      {/* Frase interpretativa por dimensión */}
      <div style={{ fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 500, lineHeight: 1.4 }}>
        {fraseDim(dim.nombre, dim.promedio)}
      </div>
      {benchmark !== null && benchmark !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--ink-2)' }}>
          <span style={{ width: 8, height: 8, background: 'var(--ink)', display: 'inline-block', borderRadius: '50%' }} />
          Benchmark Laborativo · <b style={{ fontWeight: 800, fontFeatureSettings: '"tnum" 1, "zero" 0', color: 'var(--ink)' }}>{benchmark.toFixed(1)}</b>
          {benchmarkN && benchmarkN > 0 ? <span style={{ color: 'var(--mute)', fontWeight: 500 }}>· {benchmarkN} {benchmarkN === 1 ? 'equipo' : 'equipos'}</span> : null}
        </div>
      )}
    </div>
  )
}

// Card "Promedio" — quinta columna del grid de "Lectura por dimensión".
// Promedio simple de los 4 promedios de dimensión. Separada visualmente
// con una línea vertical corta a su izquierda (no toca el top ni el
// bottom de la card, mismo patrón de Pulso y 360°).
function PromedioCardTermometro({ resultados }: { resultados: DimResultado[] }) {
  const vals = resultados.map(r => r.promedio).filter((v): v is number => typeof v === 'number')
  const prom = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null
  const pct = prom !== null ? ((prom - 1) / 9) * 100 : 0
  const color = prom !== null ? promedioBg(prom) : 'var(--mute)'
  return (
    <div style={{
      padding: '32px 24px 30px',
      display: 'flex', flexDirection: 'column', gap: 14,
      position: 'relative',
    }}>
      {/* Separador vertical corto a la izquierda (no llega ni al top ni al bottom) */}
      <span aria-hidden style={{
        position: 'absolute', left: 0, top: 32, bottom: 30,
        width: 1.5, background: 'var(--ink)',
      }} />
      <div>
        <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink)', fontWeight: 700 }}>Global</div>
        <h3 style={{ fontSize: 30.72, fontWeight: 900, letterSpacing: '-.02em', lineHeight: 1, margin: '4px 0 0' }}>Promedio</h3>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontWeight: 900, fontSize: 96, lineHeight: .9, letterSpacing: '-.05em', color: 'var(--ink)' }}>
          {prom !== null ? prom.toFixed(1) : '—'}
        </span>
        {prom !== null && (
          <span style={{ fontWeight: 700, fontSize: 38.4, lineHeight: 1, letterSpacing: '-.02em' }}>
            <span style={{ position: 'relative', top: -6.7 }}>/</span><span>10</span>
          </span>
        )}
      </div>
      <div style={{ position: 'relative', height: 10, border: '1.5px solid var(--ink)' }}>
        {prom !== null && (
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: color }} />
        )}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 500, lineHeight: 1.4 }}>
        Promedio simple de las 4 dimensiones.
      </div>
    </div>
  )
}

export default function ResultadosTermometro({
  nombreCompania, estado, totalParticipantes, totalFormularios, resultados,
  comparacion, rondaActual, rondaAnterior, benchmark, benchmarkN, dispersionPorDim,
}: Props) {
  const hayComparacion = comparacion && comparacion.length > 0
  const getAnterior = (id: number) => comparacion?.find(c => c.id === id)?.promedio ?? null
  const hayBenchmark = !!benchmark && benchmark.length > 0
  const getBenchmark = (id: number) => benchmark?.find(b => b.id === id)?.promedio ?? null
  const lectura = lecturaEjecutiva(resultados)
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
          <ChipTipo etiqueta="Termómetro" rondaActual={rondaActual} />
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
              <MedidorBase dim={dim} sizeNumber={56} padding="18px 16px 20px" anterior={hayComparacion ? getAnterior(dim.id) : null} rondaAnterior={rondaAnterior} benchmark={hayBenchmark ? getBenchmark(dim.id) : null} benchmarkN={benchmarkN} />
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
            <ChipTipo etiqueta="Termómetro" rondaActual={rondaActual} />
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

          {/* Lectura ejecutiva: un titular grande que resume el termómetro */}
          <SectionBar title="Lectura ejecutiva" subtitle="Una mirada en una frase" />
          <div style={{
            padding: '40px 56px 40px', borderBottom: '1.5px solid var(--ink)',
            display: 'flex', justifyContent: 'center',
          }}>
            <h2 style={{
              fontSize: 'clamp(36px,5vw,64px)', fontWeight: 900, letterSpacing: '-.035em',
              lineHeight: 1, margin: 0, textAlign: 'center', color: 'var(--ink)',
              background: lectura.color, padding: '20px 32px',
            }}>
              {lectura.titulo}
            </h2>
          </div>

          <SectionBar title="Lectura por dimensión" subtitle="Una pregunta por dimensión · Escala 1–10" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderBottom: '1.5px solid var(--ink)' }}>
            {resultados.map(dim => (
              <div key={dim.id}>
                <MedidorBase dim={dim} sizeNumber={96} padding="32px 24px 30px" anterior={hayComparacion ? getAnterior(dim.id) : null} rondaAnterior={rondaAnterior} benchmark={hayBenchmark ? getBenchmark(dim.id) : null} benchmarkN={benchmarkN} />
              </div>
            ))}
            <PromedioCardTermometro resultados={resultados} />
          </div>

          {/* Dispersión: mini-histogramas + leyenda */}
          {dispersionPorDim && (
            <>
              <SectionBar title="Dispersión del equipo" subtitle="Frecuencia de respuestas por dimensión" />
              <div style={{ padding: '48px 56px 56px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', columnGap: 64, rowGap: 64 }}>
                {resultados.map(dim => (
                  <HistogramaDim
                    key={dim.id}
                    nombre={dim.nombre}
                    subtitulo={dim.subtitulo}
                    promedio={dim.promedio}
                    desviacion={dim.desviacion}
                    valores={dispersionPorDim[dim.id] ?? []}
                  />
                ))}
              </div>
              <LeyendaDispersion />
            </>
          )}
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink)', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600 }}>
          <span>Laborativo / Consultoría Creativa Basada en la Emoción</span>
          <span>Termómetro · V1.0</span>
        </div>
      </div>
    </>
  )
}
