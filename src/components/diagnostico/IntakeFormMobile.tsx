'use client'
import { ArrowRight } from 'lucide-react'
import type { TipoDiagnostico } from '@/types'

type Perfil = 'equipo' | 'lider'

const PERFILES = [
  { id: 'equipo' as Perfil, h: 'Miembro del equipo', p: 'Responderás desde tu experiencia como parte del equipo.\nIncluye tu auto-evaluación y tu mirada sobre el liderazgo que recibes.' },
  { id: 'lider' as Perfil, h: 'Líder del equipo', p: 'Responderás desde tu rol de liderazgo.\nIncluye tu auto-evaluación y tu mirada sobre el equipo que lideras.' },
]

export default function IntakeFormMobile({
  nombreCompania,
  tipo = 'cultura_360',
  preguntasEquipo,
  preguntasLider,
  preguntasColectivo = 0,
  perfil,
  setPerfil,
  loading,
  onComenzar,
}: {
  nombreCompania: string
  tipo?: TipoDiagnostico
  preguntasEquipo: number
  preguntasLider: number
  preguntasColectivo?: number
  perfil: Perfil | null
  setPerfil: (p: Perfil) => void
  loading: boolean
  onComenzar: () => void
}) {
  const esSimple = tipo !== 'cultura_360'
  const habilitado = esSimple ? !loading : !!perfil && !loading

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Red Hat Display', sans-serif", padding: '24px 20px 32px', display: 'flex', flexDirection: 'column', gap: 18, background: 'var(--bg)', overflowX: 'hidden' }}>
      <span className="eyebrow">{esSimple ? 'Registro' : 'Paso 01 / 02 — Registro'}</span>
      <div className="rule" />
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>{nombreCompania}</div>
        <p style={{ fontSize: 12.5, lineHeight: 1.4, color: 'var(--ink)', fontWeight: 500, margin: 0 }}>
          Laborativo como tercero independiente revisará las respuestas, la compañía solo verá los resultados consolidados.
        </p>
      </div>
      <h2 style={{ fontWeight: 900, fontSize: 'clamp(32px, 9vw, 44px)', lineHeight: .95, letterSpacing: -.5, margin: 0 }}>
        {esSimple ? <>Antes de empezar,<br />unas notas rápidas.</> : <>Antes de empezar,<br />elige tu rol.</>}
      </h2>

      {esSimple ? (
        <p style={{ fontSize: 14.5, lineHeight: 1.5, color: 'var(--ink-2)', margin: 0, fontWeight: 500 }}>
          {tipo === 'equipo_en_espejo'
            ? <>Vas a responder {preguntasColectivo} preguntas desde dos miradas: <strong>cómo te ves a ti</strong> y <strong>cómo ves al equipo</strong>. Sin respuestas correctas, tus respuestas son anónimas.</>
            : tipo === 'termometro_4'
            ? <>Vas a responder {preguntasColectivo} preguntas — una por cada dimensión de cultura. Toma menos de un minuto. Tus respuestas son anónimas y se promedian con las del resto del equipo.</>
            : <>Vas a responder {preguntasColectivo} preguntas sobre cómo se siente el equipo en las cuatro dimensiones de cultura. No hay respuestas correctas o incorrectas. Tus respuestas son anónimas y se promedian con las del resto del equipo.</>}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          <div style={{ background: 'var(--ink)', padding: '10px 14px' }}>
            <h2 style={{ fontSize: 15, fontWeight: 900, letterSpacing: 0, margin: 0, color: '#fff', fontFamily: 'Red Hat Display, sans-serif' }}>Selecciona una de las dos opciones</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            {PERFILES.map(p => (
              <div key={p.id}
                onClick={() => setPerfil(p.id)}
                style={{
                  border: '2px solid var(--ink)', padding: '14px 16px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', gap: 4,
                  background: perfil === p.id ? 'var(--ink)' : 'var(--card)',
                  color: perfil === p.id ? 'var(--card)' : 'var(--ink)',
                  transition: 'all .15s',
                }}>
                <h5 style={{ margin: 0, fontSize: 15, fontWeight: 800, letterSpacing: '-.01em' }}>{p.h}</h5>
                <p style={{ margin: 0, fontSize: 12.5, fontWeight: 500, lineHeight: 1.4, color: 'inherit', whiteSpace: 'pre-line' }}>{p.p}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ paddingTop: 4 }}>
        <button onClick={onComenzar} disabled={!habilitado}
          style={{
            width: '100%',
            padding: '18px 22px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            border: '2px solid var(--ink)',
            background: !habilitado ? 'transparent' : 'var(--ink)',
            color: !habilitado ? 'var(--mute)' : 'var(--bg)',
            borderColor: !habilitado ? 'var(--mute)' : 'var(--ink)',
            fontFamily: 'inherit',
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: '-.01em',
            cursor: !habilitado ? 'not-allowed' : 'pointer',
            transition: 'background .15s ease, color .15s ease, border-color .15s ease',
          }}>
          {loading ? 'Cargando…' : <>Comenzar preguntas <ArrowRight size={17} strokeWidth={2.5} /></>}
        </button>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 24 }}>
        <span className="eyebrow soft">
          {esSimple
            ? `≈ ${Math.max(2, Math.ceil(preguntasColectivo / 3))}–${Math.max(4, Math.ceil(preguntasColectivo / 2))} min · ${preguntasColectivo} preguntas`
            : `≈ 5–8 min${perfil ? ` · ${perfil === 'lider' ? preguntasLider : preguntasEquipo} preguntas` : ''}`}
        </span>
      </div>
    </div>
  )
}
