import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ArrowDown } from 'lucide-react'
import { LANDING_COPY } from '@/lib/landing-copy'
import type { TipoDiagnostico } from '@/types'

const DIMENSIONES = [
  { n: '01', idx: 'Intención', h: 'Sentido', pair: '¿A dónde vamos?', p: 'El propósito compartido.\nQué hace que este equipo exista y hacia qué horizonte se orienta.' },
  { n: '02', idx: 'Motivación', h: 'Energía', pair: '¿Por qué?', p: 'Lo que enciende o apaga a las personas.\nLas razones internas detrás del esfuerzo cotidiano.' },
  { n: '03', idx: 'Interacción', h: 'Vínculos', pair: '¿Con quién?', p: 'Cómo nos relacionamos.\nCalidad de la conversación, confianza y colaboración entre personas.' },
  { n: '04', idx: 'Acción', h: 'Comportamiento', pair: '¿Qué?', p: 'Lo que se hace realmente, no lo que se dice.\nHábitos, decisiones y entregas visibles.' },
]

export default function LandingMobile({
  codigo,
  nombreCompania,
  totalPreguntas,
  tipo = 'cultura_360',
}: {
  codigo: string
  nombreCompania: string
  totalPreguntas: number | null
  tipo?: TipoDiagnostico
}) {
  const copy = LANDING_COPY[tipo]
  const totalN = totalPreguntas ?? 0
  const proceso = copy.proceso.map(f => ({ ...f, meta: f.meta.replace('{N}', String(totalN)) }))

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', fontFamily: "'Red Hat Display', sans-serif" }}>

      {/* Hero */}
      <div style={{ padding: '24px 20px 36px', borderBottom: '1.5px solid var(--ink)' }}>
        <Image src="/brand/laborativo-logo.png" alt="Laborativo" width={140} height={36} style={{ objectFit: 'contain', display: 'block', marginLeft: -12 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 22 }}>
          <span style={{ fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--mute)', fontWeight: 600 }}>
            Producto<b style={{ display: 'block', fontSize: 9.5, color: 'var(--ink)', marginTop: 4, fontWeight: 700, letterSpacing: '.02em', lineHeight: 1.25 }}>{copy.header.producto}</b>
          </span>
          <span style={{ fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--mute)', fontWeight: 600 }}>
            Formato<b style={{ display: 'block', fontSize: 9.5, color: 'var(--ink)', marginTop: 4, fontWeight: 700, letterSpacing: '.02em', lineHeight: 1.25 }}>{copy.header.formato}</b>
          </span>
          <span style={{ fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--mute)', fontWeight: 600 }}>
            Tiempo<b style={{ display: 'block', fontSize: 9.5, color: 'var(--ink)', marginTop: 4, fontWeight: 700, letterSpacing: '.02em', lineHeight: 1.25 }}>{copy.header.tiempo}</b>
          </span>
        </div>

        <div style={{ marginTop: 32 }}>
          <span style={{ background: 'var(--ink)', color: 'var(--bg)', padding: '6px 12px', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 700, display: 'inline-block' }}>{nombreCompania}</span>
        </div>

        <h1 style={{ fontWeight: 900, fontSize: 'clamp(20px, 5.5vw, 30px)', lineHeight: 1.04, letterSpacing: '-.02em', margin: '20px 0 0', paddingBottom: '.05em' }}>
          {copy.hero[0]}<br />{copy.hero[1]}<br />{copy.hero[2]}
        </h1>

        <p style={{ fontSize: 14.5, lineHeight: 1.5, color: 'var(--ink)', margin: '24px 0 0', fontWeight: 500 }}>
          <b style={{ fontWeight: 900 }}>{copy.introBold}</b> {copy.introTexto}<br /><b style={{ fontWeight: 800 }}>{copy.introCierre}</b>
        </p>

        <Link href="#empezar" style={{
          marginTop: 24,
          border: '2.5px solid var(--ink)',
          padding: '14px 18px',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          color: 'var(--ink)',
          textDecoration: 'none',
          display: 'inline-flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          <span>Conoce el modelo /</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Inicia el diagnóstico abajo <ArrowDown size={13} strokeWidth={2.5} />
          </span>
        </Link>
      </div>

      {/* Dimensiones */}
      <div style={{ padding: '40px 20px 48px', borderBottom: '1.5px solid var(--ink)', background: 'var(--paper)' }}>
        <span className="eyebrow">Contexto de diagnóstico.</span>
        <div className="rule" />
        <h2 style={{ fontWeight: 900, fontSize: 'clamp(28px, 8vw, 40px)', lineHeight: .98, letterSpacing: '-.03em', margin: '16px 0 16px', whiteSpace: 'pre-line' }}>
          {copy.tituloDimensiones}
        </h2>
        <span className="chip" style={{ marginBottom: 8 }}>4 ejes · {totalN} preguntas</span>

        <div style={{ display: 'flex', flexDirection: 'column', border: '1.5px solid var(--ink)', marginTop: 24 }}>
          {DIMENSIONES.map((d, i) => (
            <div key={d.n} style={{
              borderBottom: i < DIMENSIONES.length - 1 ? '1.5px solid var(--ink)' : 'none',
              padding: '20px 18px 22px',
              display: 'flex', flexDirection: 'column', gap: 10,
              background: 'var(--card)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10.5, letterSpacing: .5, textTransform: 'uppercase', color: 'var(--ink)', fontWeight: 700 }}>{d.idx}</span>
                <span style={{ fontWeight: 900, fontSize: 13, color: 'var(--ink)' }}>{d.n}</span>
              </div>
              <div style={{ width: 48, height: 6, background: 'var(--ink)' }} />
              <h3 style={{ fontWeight: 900, fontSize: 21, letterSpacing: -.5, lineHeight: 1.05, margin: '4px 0 0' }}>{d.h} / {d.pair}</h3>
              <p style={{ fontSize: 13.5, lineHeight: 1.45, color: 'var(--ink-2)', margin: '4px 0 0', fontWeight: 500, whiteSpace: 'pre-line' }}>{d.p}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Niveles / Perspectivas */}
      <div style={{ padding: '40px 20px 48px', borderBottom: '1.5px solid var(--ink)', background: 'var(--paper)' }}>
        <span className="eyebrow">{copy.eyebrowPerspectivas}</span>
        <div className="rule" />
        <h2 style={{ fontWeight: 900, fontSize: 'clamp(28px, 8vw, 40px)', lineHeight: .96, letterSpacing: '-.03em', margin: '16px 0 12px', whiteSpace: 'pre-line' }}>
          {copy.tituloPerspectivas}
        </h2>
        <p style={{ color: 'var(--ink-2)', margin: '0 0 24px', fontSize: 14.5, lineHeight: 1.5, fontWeight: 500 }}>
          {copy.subtituloPerspectivas}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {copy.niveles.map(l => (
            <div key={l.tag} style={{
              border: '1.5px solid var(--ink)', padding: 18,
              display: 'flex', flexDirection: 'column', gap: 10,
              background: 'var(--card)', color: 'var(--ink)',
            }}>
              <span style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--mute)' }}>
                <span style={{ color: 'var(--ink)' }}>{l.tag.split(' · ')[0]}</span>
                {l.tag.includes(' · ') ? <>{' · '}{l.tag.split(' · ')[1]}</> : null}
              </span>
              <h4 style={{ fontWeight: 900, fontSize: 19, letterSpacing: '-.02em', lineHeight: 1.05, margin: 0 }}>{l.h}</h4>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45, fontWeight: 500, color: 'var(--ink-2)' }}>{l.p}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Proceso */}
      <div style={{ padding: '40px 20px 48px', borderBottom: '1.5px solid var(--ink)' }}>
        <span className="eyebrow">Paso a paso.</span>
        <div className="rule" />
        <h2 style={{ fontWeight: 900, fontSize: 'clamp(28px, 8vw, 40px)', lineHeight: .96, letterSpacing: '-.03em', margin: '16px 0 16px' }}>
          {copy.tituloProceso}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {proceso.map((s, i, arr) => (
            <div key={s.n} style={{
              display: 'flex', flexDirection: 'column', gap: 10,
              padding: '20px 0',
              borderBottom: i < arr.length - 1 ? '1.5px solid var(--ink)' : 'none',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontWeight: 900, fontSize: 36, lineHeight: .9, letterSpacing: '-.04em' }}>{s.n}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end', paddingTop: 4 }}>
                  {s.meta.split(' · ').map((part, idx) => (
                    <span key={idx} style={{ background: 'var(--ink)', color: 'var(--bg)', padding: '4px 9px', fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600 }}>{part}</span>
                  ))}
                </div>
              </div>
              <h4 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: '-.02em' }}>{s.h}</h4>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.5, fontWeight: 500, whiteSpace: 'pre-line' }}>{s.p}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Closing CTA */}
      <div id="empezar" style={{ padding: '48px 20px 56px', scrollMarginTop: 24 }}>
        <span className="eyebrow">Empieza ahora</span>
        <div className="rule" />
        <h2 style={{ fontWeight: 900, fontSize: 'clamp(48px, 13vw, 78px)', lineHeight: .88, letterSpacing: '-.04em', margin: '12px 0 28px' }}>
          de la intuición<br />a la data.
        </h2>
        <Link href={`/d/${codigo}/intake`} style={{
          width: '100%',
          padding: '18px 22px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          border: '2px solid var(--ink)',
          background: 'var(--ink)',
          color: 'var(--bg)',
          fontFamily: 'inherit',
          fontSize: 15,
          fontWeight: 800,
          letterSpacing: '-.01em',
          textDecoration: 'none',
          boxSizing: 'border-box',
        }}>
          Iniciar diagnóstico <ArrowRight size={16} strokeWidth={2.5} />
        </Link>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 56, fontSize: 9.5, color: 'var(--mute)', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600 }}>
          <span>Laborativo / Consultoría Creativa Basada en la Emoción</span>
          <span>Diagnóstico · V1.12</span>
        </div>
      </div>

    </div>
  )
}
