'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowRight } from 'lucide-react'

type Perfil = 'equipo' | 'lider'

const PERFILES = [
  { id: 'equipo' as Perfil, h: 'Miembro del equipo', p: 'Responderás desde tu experiencia como parte del equipo. Incluye tu auto-evaluación y tu mirada sobre el liderazgo que recibes.' },
  { id: 'lider' as Perfil, h: 'Líder del equipo', p: 'Responderás desde tu rol de liderazgo. Incluye tu auto-evaluación y tu mirada sobre el equipo que lideras.' },
]

export default function IntakeForm({ diagnosticoId, nombreCompania, codigo }: {
  diagnosticoId: string
  nombreCompania: string
  codigo: string
}) {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(false)

  async function comenzar() {
    if (!perfil) return
    setLoading(true)

    const rol = perfil === 'equipo' ? 'A' : 'D'

    const { data: participante } = await supabase
      .from('participantes')
      .insert({ diagnostico_id: diagnosticoId, rol })
      .select()
      .single()

    if (participante) {
      sessionStorage.setItem('pid', participante.id)
      sessionStorage.setItem('perfil', perfil)
      router.push(`/d/${codigo}/q/1`)
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh', fontFamily: "'Red Hat Display', sans-serif" }}>

      {/* Left */}
      <div style={{ padding: 56, borderRight: '1.5px solid var(--ink)', display: 'flex', flexDirection: 'column', gap: 24, background: 'var(--bg)' }}>
        <span className="eyebrow">Paso 01 / 02 — Registro</span>
        <div className="rule" />
        <div style={{ fontSize: 13, color: 'var(--neon)', fontWeight: 700, marginTop: 24, textTransform: 'uppercase', letterSpacing: '.08em' }}>{nombreCompania}</div>
        <h2 style={{ fontWeight: 900, fontSize: 64, lineHeight: .92, letterSpacing: -1 }}>
          Antes de empezar,<br />cuéntanos quién responde.
        </h2>
        <p style={{ color: 'var(--ink-2)', lineHeight: 1.5, maxWidth: 'calc(42ch + 50px)', fontWeight: 500, fontSize: 15, margin: 0 }}>
          Esta información nos ayuda a cruzar tu respuesta con la de tu equipo.<br />Nadie verá tus respuestas individuales, solo los resultados colectivos.
        </p>

        <div style={{ marginTop: 'auto' }}>
          <span className="eyebrow soft">≈ 12–18 min · 32 preguntas</span>
        </div>
      </div>

      {/* Right */}
      <div style={{ padding: 56, display: 'flex', flexDirection: 'column', gap: 20, background: 'var(--paper)', borderLeft: '1.5px solid var(--ink)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 10, letterSpacing: .5, textTransform: 'uppercase', color: 'var(--ink)', fontWeight: 700 }}>
            ¿Con qué rol participas?
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            {PERFILES.map(p => (
              <div key={p.id}
                onClick={() => setPerfil(p.id)}
                style={{
                  border: '1.5px solid var(--ink)', padding: '16px 18px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', gap: 4,
                  background: perfil === p.id ? 'var(--ink)' : 'var(--card)',
                  color: perfil === p.id ? 'var(--bg)' : 'var(--ink)',
                  transition: 'all .15s',
                }}>
                <h5 style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: '-.01em' }}>{p.h}</h5>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, lineHeight: 1.4, opacity: perfil === p.id ? .6 : .7, color: 'inherit' }}>{p.p}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 24, borderTop: '1.5px solid var(--line-soft)' }}>
          <button onClick={comenzar} disabled={!perfil || loading}
            className="btn primary"
            style={{ width: '100%', justifyContent: 'center', opacity: (!perfil || loading) ? .4 : 1, cursor: (!perfil || loading) ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Cargando…' : <>Comenzar preguntas <ArrowRight size={15} strokeWidth={2.5} /></>}
          </button>
        </div>
      </div>
    </div>
  )
}
