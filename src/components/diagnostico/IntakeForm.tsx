'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowRight } from 'lucide-react'

type Perfil = 'equipo' | 'lider'

const PERFILES = [
  { id: 'equipo' as Perfil, h: 'Miembro del equipo', p: 'Responderás desde tu experiencia como parte del equipo.\nIncluye tu auto-evaluación y tu mirada sobre el liderazgo que recibes.' },
  { id: 'lider' as Perfil, h: 'Líder del equipo', p: 'Responderás desde tu rol de liderazgo.\nIncluye tu auto-evaluación y tu mirada sobre el equipo que lideras.' },
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
    <div style={{ minHeight: '100vh', fontFamily: "'Red Hat Display', sans-serif", padding: 56, display: 'flex', flexDirection: 'column', gap: 24, background: 'var(--bg)', maxWidth: 720 }}>
      <span className="eyebrow">Paso 01 / 02 — Registro</span>
      <div className="rule" />
      <div style={{ fontSize: 13, color: 'var(--neon)', fontWeight: 700, marginTop: 24, textTransform: 'uppercase', letterSpacing: '.08em' }}>{nombreCompania}</div>
      <h2 style={{ fontWeight: 900, fontSize: 64, lineHeight: .92, letterSpacing: -1 }}>
        Antes de empezar,<br />cuéntanos quién responde.
      </h2>
      <p style={{ color: 'var(--ink-2)', lineHeight: 1.5, fontWeight: 500, fontSize: 15, margin: 0 }}>
        Esta información nos ayuda a cruzar tu respuesta con la de tu equipo.<br />Nadie verá tus respuestas individuales, solo los resultados colectivos.
      </p>

      {/* Rol */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        <div style={{ background: 'var(--ink)', padding: '10px 16px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: 0, margin: 0, color: '#fff', fontFamily: 'Red Hat Display, sans-serif' }}>Elige tu rol, selecciona una de las dos opciones</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          {PERFILES.map(p => (
            <div key={p.id}
              onClick={() => setPerfil(p.id)}
              style={{
                border: perfil === p.id ? '2px solid var(--neon)' : '2px solid var(--ink)', padding: '16px 18px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', gap: 4,
                background: 'var(--card)',
                color: 'var(--ink)',
                transition: 'all .15s',
              }}>
              <h5 style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: '-.01em' }}>{p.h}</h5>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500, lineHeight: 1.4, opacity: perfil === p.id ? .6 : .7, color: 'inherit', whiteSpace: 'pre-line' }}>{p.p}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ paddingTop: 8 }}>
        <button onClick={comenzar} disabled={!perfil || loading}
          className="btn primary"
          style={{ opacity: (!perfil || loading) ? .4 : 1, cursor: (!perfil || loading) ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Cargando…' : <>Comenzar preguntas <ArrowRight size={15} strokeWidth={2.5} /></>}
        </button>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <span className="eyebrow soft">≈ 12–18 min · 32 preguntas</span>
      </div>
    </div>
  )
}
