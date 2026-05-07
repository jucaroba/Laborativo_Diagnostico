'use client'
import { ArrowRight } from 'lucide-react'

type Perfil = 'equipo' | 'lider'

const PERFILES = [
  { id: 'equipo' as Perfil, h: 'Miembro del equipo', p: 'Responderás desde tu experiencia como parte del equipo.\nIncluye tu auto-evaluación y tu mirada sobre el liderazgo que recibes.' },
  { id: 'lider' as Perfil, h: 'Líder del equipo', p: 'Responderás desde tu rol de liderazgo.\nIncluye tu auto-evaluación y tu mirada sobre el equipo que lideras.' },
]

export default function IntakeFormMobile({
  nombreCompania,
  preguntasEquipo,
  preguntasLider,
  perfil,
  setPerfil,
  loading,
  onComenzar,
}: {
  nombreCompania: string
  preguntasEquipo: number
  preguntasLider: number
  perfil: Perfil | null
  setPerfil: (p: Perfil) => void
  loading: boolean
  onComenzar: () => void
}) {
  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Red Hat Display', sans-serif", padding: '24px 20px 32px', display: 'flex', flexDirection: 'column', gap: 18, background: 'var(--bg)', overflowX: 'hidden' }}>
      <span className="eyebrow">Paso 01 / 02 — Registro</span>
      <div className="rule" />
      <div style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 700, marginTop: 8, textTransform: 'uppercase', letterSpacing: '.08em' }}>{nombreCompania}</div>
      <h2 style={{ fontWeight: 900, fontSize: 'clamp(32px, 9vw, 44px)', lineHeight: .95, letterSpacing: -.5, margin: 0 }}>
        Antes de empezar,<br />elige tu rol.
      </h2>

      {/* Rol */}
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
              <p style={{ margin: 0, fontSize: 12.5, fontWeight: 500, lineHeight: 1.4, opacity: perfil === p.id ? .6 : .7, color: 'inherit', whiteSpace: 'pre-line' }}>{p.p}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ paddingTop: 4 }}>
        <button onClick={onComenzar} disabled={!perfil || loading}
          style={{
            width: '100%',
            padding: '18px 22px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            border: '2px solid var(--ink)',
            background: (!perfil || loading) ? 'transparent' : 'var(--ink)',
            color: (!perfil || loading) ? 'var(--mute)' : 'var(--bg)',
            borderColor: (!perfil || loading) ? 'var(--mute)' : 'var(--ink)',
            fontFamily: 'inherit',
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: '-.01em',
            cursor: (!perfil || loading) ? 'not-allowed' : 'pointer',
            transition: 'background .15s ease, color .15s ease, border-color .15s ease',
          }}>
          {loading ? 'Cargando…' : <>Comenzar preguntas <ArrowRight size={17} strokeWidth={2.5} /></>}
        </button>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 24 }}>
        <span className="eyebrow soft">
          ≈ 12–18 min{perfil ? ` · ${perfil === 'lider' ? preguntasLider : preguntasEquipo} preguntas` : ''}
        </span>
      </div>
    </div>
  )
}
