'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PREGUNTAS_BASE } from '@/lib/preguntas-base'
import { DIMENSIONES, Rol } from '@/types'

const ESCALA = [
  { n: 1, label: 'Muy bajo', desc: 'Totalmente en desacuerdo' },
  { n: 2, label: 'Bajo', desc: 'En desacuerdo' },
  { n: 3, label: 'Medio', desc: 'Ni de acuerdo ni en desacuerdo' },
  { n: 4, label: 'Alto', desc: 'De acuerdo' },
  { n: 5, label: 'Muy alto', desc: 'Totalmente de acuerdo' },
  { n: 6, label: '', desc: '' },
  { n: 7, label: '', desc: '' },
  { n: 8, label: '', desc: '' },
  { n: 9, label: '', desc: '' },
  { n: 10, label: '', desc: '' },
]

export default function QuestionForm({ diagnosticoId, codigo, idx, neon }: {
  diagnosticoId: string
  codigo: string
  idx: number
  neon: string
}) {
  const router = useRouter()
  const [pid, setPid] = useState<string | null>(null)
  const [perfil, setPerfil] = useState<'equipo' | 'lider' | null>(null)
  const [preguntas, setPreguntas] = useState<{ id: string; texto: string; dimension_id: number; rol: Rol; orden: number }[]>([])
  const [valor, setValor] = useState<number | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    const storedPid = sessionStorage.getItem('pid')
    const storedPerfil = sessionStorage.getItem('perfil') as 'equipo' | 'lider' | null
    setPid(storedPid)
    setPerfil(storedPerfil)
  }, [])

  useEffect(() => {
    if (!perfil) return
    cargarPreguntas()
  }, [perfil, diagnosticoId])

  async function cargarPreguntas() {
    const roles: Rol[] = perfil === 'equipo' ? ['A', 'C'] : ['D', 'B']
    const { data } = await supabase
      .from('preguntas')
      .select('*')
      .eq('diagnostico_id', diagnosticoId)
      .in('rol', roles)
      .order('orden')
    if (data) setPreguntas(data)
  }

  if (!pid || !perfil) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--mute)', fontFamily: "'Red Hat Display', sans-serif" }}>
          Sesión no encontrada. <a href={`/d/${codigo}/intake`} style={{ color: 'var(--ink)', fontWeight: 700 }}>Reiniciar →</a>
        </p>
      </div>
    )
  }

  if (!preguntas.length) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p style={{ color: 'var(--mute)', fontFamily: "'Red Hat Display', sans-serif" }}>Cargando…</p>
    </div>
  }

  const total = preguntas.length
  const pregunta = preguntas[idx - 1]
  if (!pregunta) { router.push(`/d/${codigo}/intake`); return null }

  const dimension = DIMENSIONES.find(d => d.id === pregunta.dimension_id)
  const progreso = Math.round(((idx - 1) / total) * 100)
  const esPrimera = idx === 1
  const esUltima = idx === total

  async function siguiente() {
    if (!valor || !pid) return
    setGuardando(true)

    await supabase.from('respuestas').upsert({
      participante_id: pid,
      pregunta_id: pregunta.id,
      valor,
    }, { onConflict: 'participante_id,pregunta_id' })

    if (esUltima) {
      router.push(`/d/${codigo}/gracias`)
    } else {
      setValor(null)
      router.push(`/d/${codigo}/q/${idx + 1}`)
    }
    setGuardando(false)
  }

  return (
    <div style={{ fontFamily: "'Red Hat Display', sans-serif", minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Header sticky */}
      <div style={{
        padding: '20px 56px', borderBottom: '1.5px solid var(--ink)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 240, height: 4, background: 'var(--bg-2)', position: 'relative', border: '1.5px solid var(--ink)' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', background: 'var(--ink)', width: `${progreso}%`, transition: 'width .4s ease' }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--ink)', fontWeight: 700, letterSpacing: .5 }}>{idx} / {total}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, letterSpacing: .5, fontWeight: 700, textTransform: 'uppercase' }}>
          <span style={{ width: 8, height: 8, background: neon, border: '1.5px solid var(--ink)', display: 'inline-block' }} />
          {dimension?.nombre}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '56px 56px 100px', maxWidth: 900, margin: '0 auto' }}>

        {/* Eyebrow con número grande */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 32 }}>
          <span style={{ fontWeight: 900, fontSize: 88, lineHeight: .88, letterSpacing: -1, flexShrink: 0, color: 'var(--ink)' }}>
            {String(idx).padStart(2, '0')}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12 }}>
            <span style={{ fontSize: 11, color: 'var(--ink)', letterSpacing: .5, textTransform: 'uppercase', fontWeight: 700 }}>
              Pregunta {idx} de {total}
            </span>
            <span className="eyebrow soft">{dimension?.nombre} — {dimension?.subtitulo}</span>
          </div>
        </div>

        {/* Pregunta */}
        <h2 style={{ fontWeight: 900, fontSize: 40, lineHeight: 1.05, letterSpacing: -1, margin: '0 0 40px', maxWidth: '22ch' }}>
          {pregunta.texto}
        </h2>

        {/* Escala 1-10 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6, marginBottom: 12 }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <div key={n} onClick={() => setValor(n)}
              style={{
                border: '1.5px solid var(--ink)', padding: '18px 8px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', gap: 8, minHeight: 100,
                alignItems: 'center', justifyContent: 'flex-start',
                background: valor === n ? 'var(--ink)' : 'var(--card)',
                color: valor === n ? 'var(--bg)' : 'var(--ink)',
                transition: 'background .12s ease',
              }}>
              <span style={{ fontWeight: 900, fontSize: 28, lineHeight: 1, letterSpacing: '-.04em' }}>{n}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--mute)', fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase', marginBottom: 40 }}>
          <span>Totalmente en desacuerdo</span>
          <span>Totalmente de acuerdo</span>
        </div>

        {/* Nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, borderTop: '1.5px solid var(--ink)' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {!esPrimera && (
              <button className="btn" onClick={() => router.push(`/d/${codigo}/q/${idx - 1}`)}>← Anterior</button>
            )}
          </div>
          <button className="btn primary" onClick={siguiente}
            disabled={!valor || guardando}
            style={{ opacity: (!valor || guardando) ? .4 : 1, cursor: (!valor || guardando) ? 'not-allowed' : 'pointer' }}>
            {guardando ? 'Guardando…' : esUltima ? 'Finalizar →' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>
  )
}
