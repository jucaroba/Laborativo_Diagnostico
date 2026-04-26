import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { DIMENSIONES, Rol } from '@/types'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

export const revalidate = 0

const ROLES: { rol: Rol; label: string }[] = [
  { rol: 'A', label: 'Equipo auto' },
  { rol: 'D', label: 'Líder auto' },
  { rol: 'B', label: 'Líder → Equipo' },
  { rol: 'C', label: 'Equipo → Líder' },
]

export default async function ResultadosPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params

  const { data: diag } = await supabase
    .from('diagnosticos')
    .select('*')
    .eq('codigo_resultados', codigo)
    .single()

  if (!diag) notFound()

  const neon = diag.color_neon || '#D8FF00'

  const { data: preguntas } = await supabase
    .from('preguntas')
    .select('id, dimension_id, rol')
    .eq('diagnostico_id', diag.id)

  const { data: participantes } = await supabase
    .from('participantes')
    .select('id, rol')
    .eq('diagnostico_id', diag.id)

  const { data: respuestas } = await supabase
    .from('respuestas')
    .select('participante_id, pregunta_id, valor')

  const totalParticipantes = participantes?.length ?? 0

  type Promedios = Record<number, Record<Rol, { suma: number; n: number }>>
  const acum: Promedios = {}
  for (const dim of DIMENSIONES) {
    acum[dim.id] = { A: { suma: 0, n: 0 }, B: { suma: 0, n: 0 }, C: { suma: 0, n: 0 }, D: { suma: 0, n: 0 } }
  }

  for (const resp of respuestas ?? []) {
    const pregunta = preguntas?.find(p => p.id === resp.pregunta_id)
    if (!pregunta) continue
    const participante = participantes?.find(p => p.id === resp.participante_id)
    if (!participante) continue
    const rol = pregunta.rol as Rol
    acum[pregunta.dimension_id][rol].suma += resp.valor
    acum[pregunta.dimension_id][rol].n += 1
  }

  const resultados = DIMENSIONES.map(dim => {
    const promedios: Partial<Record<Rol, number>> = {}
    for (const r of ['A', 'B', 'C', 'D'] as Rol[]) {
      const d = acum[dim.id][r]
      if (d.n > 0) promedios[r] = Math.round((d.suma / d.n) * 10) / 10
    }
    const vals = Object.values(promedios).filter(Boolean) as number[]
    const delta = vals.length > 1 ? Math.round((Math.max(...vals) - Math.min(...vals)) * 10) / 10 : 0
    return { ...dim, promedios, delta }
  })

  const maxDelta = Math.max(...resultados.map(r => r.delta))

  return (
    <div style={{ ['--neon' as string]: neon, fontFamily: "'Red Hat Display', sans-serif", background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ padding: '48px 56px 40px', borderBottom: '1.5px solid var(--ink)', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 56, alignItems: 'end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <Image src="/brand/laborativo-logo.png" alt="Laborativo" width={200} height={51} style={{ objectFit: 'contain', marginLeft: -15, marginTop: 15 }} />
          </div>
          <span className="eyebrow">Diagnóstico organizacional</span>
          <div className="rule" />
          <h1 style={{ fontWeight: 900, fontSize: 'clamp(48px,6vw,80px)', lineHeight: .88, letterSpacing: '-.02em', margin: '24px 0 0' }}>
            {diag.nombre_compania}
          </h1>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { l: 'Participantes', v: totalParticipantes },
            { l: 'Dimensiones', v: '4' },
            { l: 'Brecha mayor', v: `Δ ${maxDelta}` },
            { l: 'Estado', v: diag.estado },
          ].map(row => (
            <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1.5px solid var(--ink)', padding: '10px 0', fontWeight: 700 }}>
              <span style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: '.1em', color: 'var(--mute)', fontWeight: 600 }}>{row.l}</span>
              <b style={{ fontWeight: 900, fontSize: 14 }}>{row.v}</b>
            </div>
          ))}
        </div>
      </div>

      {/* Section bar — Dot plot */}
      <div style={{ background: 'var(--ink)', padding: '10px 56px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: 0, margin: 0, color: '#fff', fontFamily: 'Red Hat Display, sans-serif' }}>Mapa de brechas</h2>
        <span style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 600, color: 'rgba(255,255,255,.5)' }}>Escala 1–10</span>
      </div>

      {/* Dot Plot */}
      <div style={{ padding: '40px 56px', background: 'var(--card)', borderBottom: '1.5px solid var(--ink)' }}>

        {/* Leyenda */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
          {ROLES.map((r, i) => (
            <span key={r.rol} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 600, color: 'var(--ink)' }}>
              <span style={{
                width: 14, height: 14, display: 'inline-block', border: '1.5px solid var(--ink)',
                background: i === 0 ? neon : i === 1 ? 'var(--ink)' : i === 2 ? 'var(--mute)' : 'transparent'
              }} />
              {r.rol} · {r.label}
            </span>
          ))}
        </div>

        {/* Eje X */}
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 80px', gap: 24, marginBottom: 8 }}>
          <div />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <span key={n} style={{ fontSize: 10, color: 'var(--mute)', fontWeight: 700, width: 20, textAlign: 'center' }}>{n}</span>
            ))}
          </div>
          <div />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {resultados.map((dim, di) => (
            <div key={dim.id} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 80px', alignItems: 'center', gap: 24, padding: '20px 0', borderBottom: di < resultados.length - 1 ? '1.5px solid var(--line-soft)' : 'none' }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--mute)', fontWeight: 700 }}>{dim.subtitulo}</div>
                <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: '-.01em', marginTop: 4 }}>{dim.nombre}</div>
              </div>

              <div style={{ position: 'relative', height: 40 }}>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'var(--line-soft)' }} />
                {ROLES.map((r, i) => {
                  const val = dim.promedios[r.rol]
                  if (!val) return null
                  const left = `${((val - 1) / 9) * 100}%`
                  const colors = [neon, 'var(--ink)', 'var(--mute)', 'transparent']
                  return (
                    <div key={r.rol} title={`${r.label}: ${val}`} style={{
                      position: 'absolute', top: '50%', left,
                      transform: 'translate(-50%, -50%)',
                      width: 16, height: 16,
                      background: colors[i], border: '1.5px solid var(--ink)',
                      zIndex: 4 - i,
                    }} />
                  )
                })}
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', padding: '4px 10px',
                  border: '1.5px solid var(--ink)', fontSize: 12, fontWeight: 900,
                  background: dim.delta === maxDelta && dim.delta > 0 ? neon : 'transparent',
                }}>
                  Δ {dim.delta || '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section bar — Score cards */}
      <div style={{ background: 'var(--ink)', padding: '10px 56px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: 0, margin: 0, color: '#fff', fontFamily: 'Red Hat Display, sans-serif' }}>Puntuación por dimensión</h2>
        <span style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 600, color: 'rgba(255,255,255,.5)' }}>Promedio general</span>
      </div>

      {/* Score cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: '1.5px solid var(--ink)' }}>
        {resultados.map((dim, i) => {
          const promGeneral = Object.values(dim.promedios).filter(Boolean) as number[]
          const avg = promGeneral.length ? Math.round(promGeneral.reduce((a, b) => a + b, 0) / promGeneral.length * 10) / 10 : null
          return (
            <div key={dim.id} style={{
              borderRight: i < 3 ? '1.5px solid var(--ink)' : 'none',
              padding: '28px 24px 24px',
              display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--card)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--mute)', fontWeight: 700 }}>{dim.subtitulo}</span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', padding: '3px 8px',
                  border: '1.5px solid var(--ink)', fontSize: 10, fontWeight: 900,
                  background: dim.delta > 2.5 ? neon : 'transparent',
                }}>
                  Δ {dim.delta || '—'}
                </span>
              </div>
              <div style={{ width: 42, height: 8, background: 'var(--ink)' }} />
              <h3 style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-.02em', lineHeight: 1, margin: 0 }}>{dim.nombre}</h3>
              <div style={{ fontWeight: 900, fontSize: 72, lineHeight: 1, letterSpacing: -2, marginTop: 'auto', color: 'var(--ink)' }}>
                {avg ?? '—'}
              </div>
              <div style={{ height: 8, background: 'var(--bg-2)', position: 'relative', border: '1.5px solid var(--ink)' }}>
                {avg && <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', background: 'var(--ink)', width: `${(avg / 10) * 100}%` }} />}
              </div>
            </div>
          )
        })}
      </div>

      {/* CTA */}
      <div style={{ padding: '64px 56px' }}>
        <span className="eyebrow">¿Qué sigue?</span>
        <div className="rule" />
        <h2 style={{ fontWeight: 900, fontSize: 'clamp(36px,4vw,56px)', lineHeight: .92, letterSpacing: '-.02em', margin: '16px 0 32px', maxWidth: '18ch' }}>
          Convierte los datos en acción.
        </h2>
        <a href="https://laborativo.com" className="btn primary">Agendar sesión de lectura <ArrowRight size={15} strokeWidth={2.5} /></a>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 72, fontSize: 10, color: 'var(--mute)', letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 600 }}>
          <span>Laborativo / Consultoría Creativa Basada en la Emoción</span>
          <span>Diag-2026 · V1.0</span>
        </div>
      </div>

    </div>
  )
}
