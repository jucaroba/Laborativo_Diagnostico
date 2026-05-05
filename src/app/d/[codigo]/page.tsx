import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ArrowDown } from 'lucide-react'
import EstadoNoDisponible from '@/components/diagnostico/EstadoNoDisponible'

export default async function LandingPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params

  const { data: diag } = await supabase
    .from('diagnosticos')
    .select('id, nombre_compania, estado, color_neon')
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

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', fontFamily: "'Red Hat Display', sans-serif" }}>

      {/* Hero */}
      <div style={{ padding: '48px 56px 64px', borderBottom: '1.5px solid var(--ink)', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 72 }}>
          <Image src="/brand/laborativo-logo.png" alt="Laborativo" width={200} height={51} style={{ objectFit: 'contain', display: 'block', marginLeft: -20, flexShrink: 0, marginTop: 15 }} />
          <div style={{ display: 'flex', gap: 32 }}>
            <span style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--mute)', fontWeight: 600, textAlign: 'right' }}>
              Producto<b style={{ display: 'block', fontSize: 12, color: 'var(--ink)', marginTop: 6, fontWeight: 700, letterSpacing: '.04em' }}>Diagnóstico de Cultura</b>
            </span>
            <span style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--mute)', fontWeight: 600, textAlign: 'right' }}>
              Formato<b style={{ display: 'block', fontSize: 12, color: 'var(--ink)', marginTop: 6, fontWeight: 700, letterSpacing: '.04em' }}>Mirada 360°</b>
            </span>
            <span style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--mute)', fontWeight: 600, textAlign: 'right' }}>
              Tiempo<b style={{ display: 'block', fontSize: 12, color: 'var(--ink)', marginTop: 6, fontWeight: 700, letterSpacing: '.04em' }}>5–10 minutos</b>
            </span>
          </div>
        </div>

        <span className="eyebrow">{diag.nombre_compania}</span>
        <div className="rule" />
        <h1 style={{ fontWeight: 900, fontSize: 80, lineHeight: 1, letterSpacing: '-.020em', maxWidth: '30ch', paddingBottom: '.08em', marginTop: 24 }}>
          exploremos las visiones,<br />entendamos las oportunidades,<br />cambiemos los comportamientos.
        </h1>

        <div style={{ display: 'flex', gap: 40, marginTop: 42, alignItems: 'flex-end' }}>
          <p style={{ fontSize: 17, lineHeight: 1.45, width: '55ch', flexShrink: 0, color: 'var(--ink)', margin: 0, fontWeight: 500 }}>
            Este es un diagnóstico que recoge la sensación del equipo y su líder<br />
            a través de cuatro dimensiones de cultura y cuatro perspectivas que se cruzan.<br />
            Así identificamos dónde están las brechas y cómo abordarlas.<br />
            <b style={{ fontWeight: 800 }}>Un modelo de consultoría creativa basada en la emoción.</b>
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
              cuatro dimensiones para<br />abordar cualquier reto.
            </h2>
          </div>
          <span className="chip">4 ejes · {totalPreguntas ?? 0} preguntas</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: '1.5px solid var(--ink)' }}>
          {[
            { n: '01', idx: 'Intención', h: 'Sentido', pair: '¿A dónde vamos?', p: 'El propósito compartido.\nQué hace que este equipo exista y hacia qué horizonte se orienta.' },
            { n: '02', idx: 'Motivación', h: 'Energía', pair: '¿Por qué?', p: 'Lo que enciende o apaga a las personas.\nLas razones internas detrás del esfuerzo cotidiano.' },
            { n: '03', idx: 'Interacción', h: 'Vínculos', pair: '¿Con quién?', p: 'Cómo nos relacionamos.\nCalidad de la conversación, confianza y colaboración entre personas.' },
            { n: '04', idx: 'Acción', h: 'Comportamiento', pair: '¿Qué?', p: 'Lo que se hace realmente, no lo que se dice.\nHábitos, decisiones y entregas visibles.' },
          ].map((d, i) => (
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

      {/* Niveles */}
      <div style={{ padding: '64px 56px', borderBottom: '1.5px solid var(--ink)', background: 'var(--paper)' }}>
        <span className="eyebrow">Mirada 360°</span>
        <div className="rule" />
        <h2 style={{ fontWeight: 900, fontSize: 'clamp(36px,4.2vw,56px)', lineHeight: .92, letterSpacing: '-.035em', margin: '16px 0 8px' }}>
          cuatro puntos de vista<br />sobre la misma cultura.
        </h2>
        <p style={{ color: 'var(--ink-2)', maxWidth: '56ch', margin: '0 0 40px', fontSize: 16, lineHeight: 1.5, fontWeight: 500 }}>
          Donde estas miradas coinciden, hay alineación.<br />Donde no, hay una brecha y ahí empieza el trabajo.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {[
            { tag: 'Nivel 01 · Individuo', h: 'Autoevaluación personal', p: 'Cada miembro del equipo se observa a sí mismo en las cuatro dimensiones.', accent: false },
            { tag: 'Nivel 02 · Líder', h: 'Autoevaluación del líder', p: 'El líder se observa a sí mismo en las cuatro dimensiones.', accent: false },
            { tag: 'Nivel 03 · Descendente', h: 'Líder evalúa al equipo', p: 'La mirada del líder sobre las conductas colectivas que observa en el equipo.', accent: false },
            { tag: 'Nivel 04 · Ascendente', h: 'Equipo evalúa al líder', p: 'La mirada del equipo sobre las conductas que observa de su líder.', accent: false },
          ].map(l => (
            <div key={l.tag} style={{
              border: '1.5px solid var(--ink)', padding: 22,
              display: 'flex', flexDirection: 'column', gap: 14, minHeight: 156,
              background: 'var(--card)',
              color: 'var(--ink)',
            }}>
              <span style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--mute)' }}>
                <span style={{ color: 'var(--ink)' }}>{l.tag.split(' · ')[0]}</span>
                {' · '}{l.tag.split(' · ')[1]}
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
            cuatro fases del diagnóstico.
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 25 }}>
          {[
            { n: '01', h: 'Invitación y roles', p: 'Cada persona entra con el enlace compartido y selecciona si responde como miembro del equipo o como líder.', meta: '2 min · administrativo' },
            { n: '02', h: 'Perspectivas del tema', p: 'Autoevaluación de los integrantes del equipo, autoevaluación del líder,\nel líder evalúa al equipo y equipo evalúa al líder.\nDe ahí nacen las brechas.', meta: '4–8 min · por persona' },
            { n: '03', h: 'Preguntas por dimensión', p: 'Cada pregunta se ancla a una de las cuatro dimensiones. Las respuestas se cruzan entre perspectivas para detectar dónde la percepción no coincide con la experiencia.', meta: `4 dimensiones · ${totalPreguntas ?? 0} preguntas` },
            { n: '04', h: 'Mapa de brechas', p: 'Entregamos un reporte visual con las brechas por dimensión, la salud cultural por perspectiva y acciones concretas para cerrar las distancias más críticas.', meta: 'Entrega inmediata · Dashboard' },
          ].map((s, i, arr) => (
            <div key={s.n} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 180px', gap: 32, padding: '24px 0', borderBottom: i < arr.length - 1 ? '1.5px solid var(--ink)' : 'none', alignItems: 'start' }}>
              <span style={{ fontWeight: 900, fontSize: 44, lineHeight: .9, letterSpacing: '-.04em' }}>{s.n}</span>
              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, letterSpacing: '-.02em' }}>{s.h}</h4>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5, maxWidth: '50ch', fontWeight: 500, whiteSpace: 'pre-line' }}>{s.p}</p>
              </div>
              <span style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4, alignItems: 'flex-end' }}>
                {s.meta.split(' · ').map((part, i) => (
                  <span key={i} style={{ background: 'var(--ink)', color: 'var(--bg)', padding: '5px 10px', display: 'inline-block' }}>{part}</span>
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
          <span>Diag-2026 · V1.0</span>
        </div>
      </div>

    </div>
  )
}
