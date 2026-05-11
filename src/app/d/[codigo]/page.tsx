import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ArrowDown } from 'lucide-react'
import EstadoNoDisponible from '@/components/diagnostico/EstadoNoDisponible'
import LandingMobile from '@/components/diagnostico/LandingMobile'
import { LANDING_COPY } from '@/lib/landing-copy'
import type { TipoDiagnostico } from '@/types'

const DIMENSIONES_COPY = [
  { n: '01', idx: 'Intención',   h: 'Sentido',        pair: '¿A dónde vamos?', p: 'El propósito compartido.\nQué hace que este equipo exista y hacia qué horizonte se orienta.' },
  { n: '02', idx: 'Motivación',  h: 'Energía',        pair: '¿Por qué?',        p: 'Lo que enciende o apaga a las personas.\nLas razones internas detrás del esfuerzo cotidiano.' },
  { n: '03', idx: 'Interacción', h: 'Vínculos',       pair: '¿Con quién?',      p: 'Cómo nos relacionamos.\nCalidad de la conversación, confianza y colaboración entre personas.' },
  { n: '04', idx: 'Acción',      h: 'Comportamiento', pair: '¿Qué?',            p: 'Lo que se hace realmente, no lo que se dice.\nHábitos, decisiones y entregas visibles.' },
]

export default async function LandingPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params

  const { data: diag } = await supabase
    .from('diagnosticos')
    .select('id, nombre_compania, estado, color_neon, tipo')
    .eq('codigo_participacion', codigo)
    .single()

  if (!diag) notFound()
  if (diag.estado !== 'activo') {
    return <EstadoNoDisponible estado={diag.estado as 'borrador' | 'completado'} nombreCompania={diag.nombre_compania} neon={diag.color_neon || undefined} />
  }

  const { count: totalPreguntas } = await supabase
    .from('preguntas')
    .select('*', { count: 'exact', head: true })
    .eq('diagnostico_id', diag.id)

  const tipo = (diag.tipo ?? 'cultura_360') as TipoDiagnostico
  const copy = LANDING_COPY[tipo]
  const totalN = totalPreguntas ?? 0
  const procesoConN = copy.proceso.map(f => ({ ...f, meta: f.meta.replace('{N}', String(totalN)) }))
  const nNiveles = copy.niveles.length

  return (
    <>
    <div className="only-mobile">
      <LandingMobile codigo={codigo} nombreCompania={diag.nombre_compania} totalPreguntas={totalPreguntas ?? null} tipo={tipo} />
    </div>
    <div className="only-desktop" style={{ background: 'var(--bg)', minHeight: '100vh', fontFamily: "'Red Hat Display', sans-serif" }}>

      {/* Hero */}
      <div style={{ padding: '48px 56px 64px', borderBottom: '1.5px solid var(--ink)', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 72 }}>
          <Image src="/brand/laborativo-logo.png" alt="Laborativo" width={200} height={51} style={{ objectFit: 'contain', display: 'block', marginLeft: -20, flexShrink: 0, marginTop: 15 }} />
          <div style={{ display: 'flex', gap: 32 }}>
            <span style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--mute)', fontWeight: 600, textAlign: 'right' }}>
              Producto<b style={{ display: 'block', fontSize: 12, color: 'var(--ink)', marginTop: 6, fontWeight: 700, letterSpacing: '.04em' }}>{copy.header.producto}</b>
            </span>
            <span style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--mute)', fontWeight: 600, textAlign: 'right' }}>
              Formato<b style={{ display: 'block', fontSize: 12, color: 'var(--ink)', marginTop: 6, fontWeight: 700, letterSpacing: '.04em' }}>{copy.header.formato}</b>
            </span>
            <span style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--mute)', fontWeight: 600, textAlign: 'right' }}>
              Tiempo<b style={{ display: 'block', fontSize: 12, color: 'var(--ink)', marginTop: 6, fontWeight: 700, letterSpacing: '.04em' }}>{copy.header.tiempo}</b>
            </span>
          </div>
        </div>

        <span style={{ background: 'var(--ink)', color: 'var(--bg)', padding: '6px 12px', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 700, display: 'inline-block' }}>{diag.nombre_compania}</span>
        <h1 style={{ fontWeight: 900, fontSize: 80, lineHeight: 1, letterSpacing: '-.020em', maxWidth: '30ch', paddingBottom: '.08em', marginTop: 24 }}>
          {copy.hero[0]}<br />{copy.hero[1]}<br />{copy.hero[2]}
        </h1>

        <div style={{ display: 'flex', gap: 40, marginTop: 42, alignItems: 'flex-end' }}>
          <p style={{ fontSize: 17, lineHeight: 1.45, width: '48ch', flexShrink: 0, color: 'var(--ink)', margin: 0, fontWeight: 500 }}>
            <b style={{ fontWeight: 900 }}>{copy.introBold}</b> {copy.introTexto}<br />
            <b style={{ fontWeight: 800 }}>{copy.introCierre}</b>
          </p>
          <Link href="#empezar" style={{
            border: '2.5px solid var(--ink)',
            padding: '18px 24px',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            color: 'var(--ink)',
            textDecoration: 'none',
            display: 'inline-flex',
            flexDirection: 'column',
            gap: 6,
            alignSelf: 'flex-end',
            marginBottom: 7,
          }}>
            <span>Conoce el modelo /</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Inicia el diagnóstico abajo <ArrowDown size={14} strokeWidth={2.5} />
            </span>
          </Link>
        </div>
      </div>

      {/* Dimensiones */}
      <div style={{ padding: '64px 56px', borderBottom: '1.5px solid var(--ink)', background: 'var(--paper)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 40, marginBottom: 40 }}>
          <div>
            <span className="eyebrow">Contexto de diagnóstico.</span>
            <div className="rule" />
            <h2 style={{ fontWeight: 900, fontSize: 'clamp(36px,4.2vw,56px)', lineHeight: .95, letterSpacing: '-.035em', maxWidth: '26ch', marginTop: 24 }}>
              {copy.tituloDimensiones}
            </h2>
          </div>
          <span className="chip">4 ejes · {totalN} preguntas</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: '1.5px solid var(--ink)' }}>
          {DIMENSIONES_COPY.map((d, i) => (
            <div key={d.n} className="dim-card" style={{
              borderRight: i < 3 ? '1.5px solid var(--ink)' : 'none',
              padding: '28px 24px 32px',
              minHeight: 250, display: 'flex', flexDirection: 'column', gap: 14,
              background: 'var(--card)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, letterSpacing: .5, textTransform: 'uppercase', color: 'var(--ink)', fontWeight: 700 }}>{d.idx}</span>
                <span style={{ fontWeight: 900, fontSize: 14, color: 'var(--ink)' }}>{d.n}</span>
              </div>
              <div style={{ width: 56, height: 8, background: 'var(--ink)' }} />
              <h3 style={{ fontWeight: 900, fontSize: 26, letterSpacing: -.5, lineHeight: 1, marginTop: 15 }}>{d.h} / {d.pair}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.45, color: 'var(--ink-2)', margin: '8px 0 0', maxWidth: '30ch', fontWeight: 500, whiteSpace: 'pre-line' }}>{d.p}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Niveles / Perspectivas */}
      <div style={{ padding: '64px 56px', borderBottom: '1.5px solid var(--ink)', background: 'var(--paper)' }}>
        <span className="eyebrow">{copy.eyebrowPerspectivas}</span>
        <div className="rule" />
        <h2 style={{ fontWeight: 900, fontSize: 'clamp(36px,4.2vw,56px)', lineHeight: .92, letterSpacing: '-.035em', margin: '16px 0 8px', maxWidth: '28ch' }}>
          {copy.tituloPerspectivas}
        </h2>
        <p style={{ color: 'var(--ink-2)', maxWidth: '56ch', margin: '0 0 40px', fontSize: 16, lineHeight: 1.5, fontWeight: 500 }}>
          {copy.subtituloPerspectivas}
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(nNiveles, 4)},1fr)`,
          gap: 16,
          maxWidth: nNiveles === 1 ? 640 : 'none',
        }}>
          {copy.niveles.map(l => (
            <div key={l.tag} style={{
              border: '1.5px solid var(--ink)', padding: 22,
              display: 'flex', flexDirection: 'column', gap: 14, minHeight: 156,
              background: 'var(--card)',
              color: 'var(--ink)',
            }}>
              <span style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--mute)' }}>
                <span style={{ color: 'var(--ink)' }}>{l.tag.split(' · ')[0]}</span>
                {l.tag.includes(' · ') ? <>{' · '}{l.tag.split(' · ')[1]}</> : null}
              </span>
              <h4 style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-.02em', lineHeight: 1.05, margin: 0 }}>{l.h}</h4>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45, fontWeight: 500, color: 'var(--ink-2)' }}>{l.p}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Proceso */}
      <div style={{ padding: '64px 56px', borderBottom: '1.5px solid var(--ink)', display: 'grid', gridTemplateColumns: '280px 1fr', gap: 72 }}>
        <div>
          <span className="eyebrow">Paso a paso.</span>
          <div className="rule" />
          <h2 style={{ fontWeight: 900, fontSize: 'clamp(36px,4vw,56px)', lineHeight: .92, letterSpacing: '-.035em', marginTop: 24 }}>
            {copy.tituloProceso}
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 25 }}>
          {procesoConN.map((s, i, arr) => (
            <div key={s.n} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 180px', gap: 32, padding: '24px 0', borderBottom: i < arr.length - 1 ? '1.5px solid var(--ink)' : 'none', alignItems: 'start' }}>
              <span style={{ fontWeight: 900, fontSize: 44, lineHeight: .9, letterSpacing: '-.04em' }}>{s.n}</span>
              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, letterSpacing: '-.02em' }}>{s.h}</h4>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5, maxWidth: '50ch', fontWeight: 500, whiteSpace: 'pre-line' }}>{s.p}</p>
              </div>
              <span style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4, alignItems: 'flex-end' }}>
                {s.meta.split(' · ').map((part, idx) => (
                  <span key={idx} style={{ background: 'var(--ink)', color: 'var(--bg)', padding: '5px 10px', display: 'inline-block' }}>{part}</span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Closing CTA */}
      <div id="empezar" style={{ padding: '80px 56px', scrollMarginTop: 24 }}>
        <span className="eyebrow">Empieza ahora</span>
        <div className="rule" />
        <h2 style={{ fontWeight: 900, fontSize: 'clamp(48px,6.5vw,96px)', lineHeight: .88, letterSpacing: '-.045em', margin: '12px 0 32px', maxWidth: '14ch' }}>
          de la intuición<br />a la data.
        </h2>
        <Link href={`/d/${codigo}/intake`} className="btn primary">Iniciar diagnóstico <ArrowRight size={15} strokeWidth={2.5} /></Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 72, fontSize: 10, color: 'var(--mute)', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600 }}>
          <span>Laborativo / Consultoría Creativa Basada en la Emoción</span>
          <span>Diagnóstico · V1.12</span>
        </div>
      </div>

    </div>
    </>
  )
}
