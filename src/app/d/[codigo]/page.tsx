import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default async function LandingPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params

  const { data: diag } = await supabase
    .from('diagnosticos')
    .select('id, nombre_compania, estado, color_neon')
    .eq('codigo_participacion', codigo)
    .single()

  if (!diag || diag.estado !== 'activo') notFound()

  const neon = diag.color_neon || '#D8FF00'

  return (
    <div style={{ ['--neon' as string]: neon, background: 'var(--bg)', minHeight: '100vh', fontFamily: "'Red Hat Display', sans-serif" }}>

      {/* Hero */}
      <div style={{ padding: '48px 56px 64px', borderBottom: '1.5px solid var(--ink)', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 40, marginBottom: 72 }}>
          <div style={{ display: 'flex', gap: 32 }}>
            <span style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--mute)', fontWeight: 600 }}>
              Producto<b style={{ display: 'block', fontSize: 12, color: 'var(--ink)', marginTop: 6, fontWeight: 700, letterSpacing: '.04em' }}>Diagnóstico de Cultura</b>
            </span>
            <span style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--mute)', fontWeight: 600 }}>
              Formato<b style={{ display: 'block', fontSize: 12, color: 'var(--ink)', marginTop: 6, fontWeight: 700, letterSpacing: '.04em' }}>Mirada 360°</b>
            </span>
            <span style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--mute)', fontWeight: 600 }}>
              Tiempo<b style={{ display: 'block', fontSize: 12, color: 'var(--ink)', marginTop: 6, fontWeight: 700, letterSpacing: '.04em' }}>12–18 minutos</b>
            </span>
          </div>
          <Image src="/brand/laborativo-logo.png" alt="Laborativo" width={224} height={56} style={{ objectFit: 'contain' }} />
        </div>

        <div style={{ position: 'absolute', right: 56, top: 48, textAlign: 'right', fontSize: 10, color: 'var(--mute)', letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 600 }}>
          <b style={{ display: 'block', fontWeight: 900, fontSize: 56, color: 'var(--ink)', lineHeight: 1, marginBottom: 6, letterSpacing: '-.04em' }}>04</b>
          dimensiones<br />de análisis
        </div>

        <span className="eyebrow">Una experiencia laborativo.</span>
        <div className="rule" />
        <h1 style={{ fontWeight: 900, fontSize: 'clamp(64px,8.4vw,120px)', lineHeight: .88, letterSpacing: '-.045em', maxWidth: '13ch', paddingBottom: '.08em', marginTop: 24 }}>
          las empresas son<br />personas, las personas <em style={{ fontStyle: 'italic' }}>emoción.</em>
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 80, marginTop: 72, alignItems: 'end' }}>
          <p style={{ fontSize: 17, lineHeight: 1.45, maxWidth: '46ch', color: 'var(--ink)', margin: 0, fontWeight: 500 }}>
            Un diagnóstico breve para ver con claridad cómo se comporta tu cultura hoy y dónde están las brechas entre lo que el líder cree, lo que el equipo vive, y lo que la organización realmente hace.{' '}
            <b style={{ fontWeight: 800 }}>Un modelo de consultoría creativa basada en la emoción.</b>
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 13, color: 'var(--mute)', fontWeight: 500 }}>{diag.nombre_compania}</span>
            <Link href={`/d/${codigo}/intake`} className="btn primary">Iniciar diagnóstico →</Link>
          </div>
        </div>
      </div>

      {/* Dimensiones */}
      <div style={{ padding: '64px 56px', borderBottom: '1.5px solid var(--ink)', background: 'var(--paper)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 40, marginBottom: 40 }}>
          <div>
            <span className="eyebrow">Contexto de diagnóstico.</span>
            <div className="rule" />
            <h2 style={{ fontWeight: 900, fontSize: 'clamp(36px,4.2vw,56px)', lineHeight: .95, letterSpacing: '-.035em', maxWidth: '16ch', marginTop: 24 }}>
              Cuatro dimensiones para abordar cualquier reto.
            </h2>
          </div>
          <span className="chip">4 ejes · 32 preguntas</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: '1.5px solid var(--ink)' }}>
          {[
            { n: '01', idx: 'Intención', h: 'Sentido', pair: '¿A dónde vamos?', p: 'El propósito compartido. Qué hace que este equipo exista y hacia qué horizonte se orienta.' },
            { n: '02', idx: 'Motivación', h: 'Energía', pair: '¿Por qué?', p: 'Lo que enciende o apaga a las personas. Las razones internas detrás del esfuerzo cotidiano.' },
            { n: '03', idx: 'Interacción', h: 'Vínculos', pair: '¿Con quién?', p: 'Cómo nos relacionamos. Calidad de la conversación, confianza y colaboración entre personas.' },
            { n: '04', idx: 'Acción', h: 'Comportamiento', pair: '¿Qué?', p: 'Lo que se hace realmente —no lo que se dice—. Hábitos, decisiones y entregas visibles.' },
          ].map((d, i) => (
            <div key={d.n} style={{
              borderRight: i < 3 ? '1.5px solid var(--ink)' : 'none',
              padding: '28px 24px 32px', position: 'relative',
              minHeight: 280, display: 'flex', flexDirection: 'column', gap: 14,
              background: 'var(--card)', transition: 'background .2s ease',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = neon)}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--card)')}>
              <span style={{ position: 'absolute', top: 16, right: 20, fontWeight: 900, fontSize: 14 }}>{d.n}</span>
              <span style={{ fontSize: 11, letterSpacing: .5, textTransform: 'uppercase', color: 'var(--mute)', fontWeight: 700 }}>{d.idx}</span>
              <div style={{ width: 56, height: 8, background: 'var(--ink)' }} />
              <h3 style={{ fontWeight: 900, fontSize: 32, letterSpacing: -.5, lineHeight: 1 }}>{d.h}</h3>
              <span style={{ fontWeight: 500, fontSize: 14, color: 'var(--mute)', letterSpacing: .5, textTransform: 'uppercase' }}>{d.pair}</span>
              <p style={{ fontSize: 14, lineHeight: 1.45, color: 'var(--ink-2)', margin: '8px 0 0', maxWidth: '30ch', fontWeight: 500 }}>{d.p}</p>
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
            Cómo funciona el diagnóstico.
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1.5px solid var(--ink)', marginLeft: 25 }}>
          {[
            { n: '01', h: 'Invitación y roles', p: 'Cada persona entra con el enlace compartido y selecciona si responde como miembro del equipo o como líder.', meta: '2 min · administrativo' },
            { n: '02', h: 'Cuatro niveles de mirada', p: 'Autoevaluación individual, autoevaluación del líder, líder evalúa al equipo y equipo evalúa al líder. De ahí nacen las brechas.', meta: '12–18 min · por persona' },
            { n: '03', h: 'Preguntas por dimensión', p: 'Cada pregunta se ancla a una de las cuatro dimensiones. Las respuestas se cruzan entre perspectivas para detectar dónde la percepción no coincide con la vivencia.', meta: '4 dimensiones · 32 preguntas' },
            { n: '04', h: 'Mapa de brechas', p: 'Entregamos un reporte visual con las brechas por dimensión, la salud cultural por perspectiva, y acciones concretas para cerrar las distancias más críticas.', meta: 'Entrega inmediata · Dashboard' },
          ].map((s, i, arr) => (
            <div key={s.n} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 180px', gap: 32, padding: '24px 0', borderBottom: i < arr.length - 1 ? '1.5px solid var(--ink)' : 'none', alignItems: 'start' }}>
              <span style={{ fontWeight: 900, fontSize: 44, lineHeight: .9, letterSpacing: '-.04em' }}>{s.n}</span>
              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, letterSpacing: '-.02em' }}>{s.h}</h4>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5, maxWidth: '50ch', fontWeight: 500 }}>{s.p}</p>
              </div>
              <span style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--mute)', textAlign: 'right', fontWeight: 600 }}>{s.meta}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Niveles */}
      <div style={{ padding: '64px 56px', borderBottom: '1.5px solid var(--ink)', background: 'var(--paper)' }}>
        <span className="eyebrow">Mirada 360°</span>
        <div className="rule" />
        <h2 style={{ fontWeight: 900, fontSize: 'clamp(36px,4.2vw,56px)', lineHeight: .92, letterSpacing: '-.035em', margin: '16px 0 8px' }}>
          Cuatro puntos de vista<br />sobre la misma cultura.
        </h2>
        <p style={{ color: 'var(--ink-2)', maxWidth: '56ch', margin: '0 0 40px', fontSize: 16, lineHeight: 1.5, fontWeight: 500 }}>
          Donde estas miradas coinciden, hay alineación. Donde no, hay una brecha —y ahí empieza el trabajo.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {[
            { tag: 'Nivel 01 · Individuo', h: 'Autoevaluación personal', p: 'Cada miembro del equipo se observa a sí mismo en las cuatro dimensiones.', accent: false },
            { tag: 'Nivel 02 · Líder', h: 'Autoevaluación del líder', p: 'El líder se observa con los mismos criterios que su equipo.', accent: true },
            { tag: 'Nivel 03 · Descendente', h: 'Líder evalúa al equipo', p: 'La mirada del líder sobre las conductas colectivas que observa.', accent: false },
            { tag: 'Nivel 04 · Ascendente', h: 'Equipo evalúa al líder', p: 'El contrapeso. Cómo ve el equipo al liderazgo que recibe.', accent: false },
          ].map(l => (
            <div key={l.tag} style={{
              border: '1.5px solid var(--ink)', padding: 22,
              display: 'flex', flexDirection: 'column', gap: 14, minHeight: 260,
              background: l.accent ? neon : 'var(--card)',
              color: 'var(--ink)',
            }}>
              <span style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 700, color: l.accent ? 'var(--ink)' : 'var(--mute)' }}>{l.tag}</span>
              <h4 style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-.02em', lineHeight: 1.05, margin: 0 }}>{l.h}</h4>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45, fontWeight: 500, color: 'var(--ink-2)' }}>{l.p}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Closing CTA */}
      <div style={{ padding: '80px 56px' }}>
        <span className="eyebrow soft">Empieza ahora</span>
        <div className="rule" />
        <h2 style={{ fontWeight: 900, fontSize: 'clamp(48px,6.5vw,96px)', lineHeight: .88, letterSpacing: '-.045em', margin: '12px 0 32px', maxWidth: '14ch' }}>
          De la intuición<br />al mapa.
        </h2>
        <Link href={`/d/${codigo}/intake`} className="btn primary">Iniciar diagnóstico →</Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 72, fontSize: 10, color: 'var(--mute)', letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 600 }}>
          <span>Laborativo / Consultoría Creativa Basada en la Emoción</span>
          <span>Diag-2026 · V1.0</span>
        </div>
      </div>

    </div>
  )
}
