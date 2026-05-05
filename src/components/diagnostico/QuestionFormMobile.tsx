'use client'
import { useRouter } from 'next/navigation'
import { DIMENSIONES, Rol } from '@/types'
import { ArrowRight, ArrowLeft } from 'lucide-react'

export default function QuestionFormMobile({
  codigo,
  idx,
  total,
  pregunta,
  valor,
  setValor,
  guardando,
  errorSeleccion,
  setErrorSeleccion,
  onSiguiente,
}: {
  codigo: string
  idx: number
  total: number
  pregunta: { id: string; texto: string; dimension_id: number; rol: Rol; orden: number }
  valor: number | null
  setValor: (n: number) => void
  guardando: boolean
  errorSeleccion: boolean
  setErrorSeleccion: (b: boolean) => void
  onSiguiente: () => void
}) {
  const router = useRouter()
  const dimension = DIMENSIONES.find(d => d.id === pregunta.dimension_id)
  const progreso = Math.round(((idx - 1) / total) * 100)
  const esPrimera = idx === 1
  const esUltima = idx === total

  return (
    <div style={{ fontFamily: "'Red Hat Display', sans-serif", minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Header sticky */}
      <div style={{
        padding: '12px 16px', borderBottom: '1.5px solid var(--ink)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 10,
        gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span style={{ fontSize: 11, color: 'var(--ink)', fontWeight: 700, letterSpacing: .5, whiteSpace: 'nowrap' }}>{idx} / {total}</span>
          <div style={{ width: 90, height: 4, background: 'var(--bg-2)', position: 'relative', border: '1.5px solid var(--ink)', flexShrink: 0 }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', background: 'var(--ink)', width: `${progreso}%`, transition: 'width .4s ease' }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, letterSpacing: .5, fontWeight: 700, textTransform: 'uppercase', minWidth: 0 }}>
          <span style={{ width: 8, height: 8, background: 'var(--ink)', border: '1.5px solid var(--ink)', display: 'inline-block', flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dimension?.nombre}</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '24px 20px 56px' }}>

        {/* Eyebrow con número grande */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
          <span style={{ fontWeight: 900, fontSize: 56, lineHeight: .88, letterSpacing: -1, flexShrink: 0, color: 'var(--ink)' }}>
            {String(idx).padStart(2, '0')}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 6, minWidth: 0 }}>
            <span style={{ fontSize: 10.5, color: 'var(--ink)', letterSpacing: .5, textTransform: 'uppercase', fontWeight: 700 }}>
              Pregunta {idx} de {total}
            </span>
            <span style={{ background: 'var(--ink)', color: 'var(--bg)', padding: '5px 9px', fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 700, alignSelf: 'flex-start', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {dimension?.nombre} — {dimension?.subtitulo}
            </span>
          </div>
        </div>

        {/* Pregunta */}
        <h2 style={{ fontWeight: 900, fontSize: 'clamp(22px, 6vw, 28px)', lineHeight: 1.1, letterSpacing: -.5, margin: '0 0 44px' }}>
          {pregunta.texto}
        </h2>

        {/* Labels arriba: alineados con el 1 (izquierda) y el 10 (derecha) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink)', fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase', marginBottom: 8, gap: 8 }}>
          <span>Totalmente en desacuerdo</span>
          <span style={{ textAlign: 'right' }}>Totalmente de acuerdo</span>
        </div>

        {/* Escala 1-10 — 5 cols × 2 filas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 28 }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <div key={n} onClick={() => { setValor(n); setErrorSeleccion(false) }}
              style={{
                border: '1.5px solid var(--ink)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                aspectRatio: '1 / 1',
                background: valor === n ? 'var(--ink)' : 'var(--card)',
                color: valor === n ? 'var(--bg)' : 'var(--ink)',
                transition: 'background .12s ease',
              }}>
              <span style={{ fontWeight: 900, fontSize: 22, lineHeight: 1, letterSpacing: '-.04em' }}>{n}</span>
            </div>
          ))}
        </div>

        {/* Nav */}
        <div style={{ paddingTop: 18, borderTop: '1.5px solid var(--ink)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {errorSeleccion && (
            <span style={{ fontSize: 12, color: 'var(--mute)', fontWeight: 600, letterSpacing: '.03em', textAlign: 'center' }}>
              Debes seleccionar una opción antes de continuar
            </span>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            {!esPrimera && (
              <button className="btn primary" onClick={() => router.push(`/d/${codigo}/q/${idx - 1}`)} style={{ justifyContent: 'center', padding: '12px 14px', flex: 1 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ArrowLeft size={14} strokeWidth={2.5} /> Anterior</span>
              </button>
            )}
            <button className="btn primary" onClick={onSiguiente} disabled={guardando} style={{ justifyContent: 'center', padding: '12px 14px', flex: esPrimera ? undefined : 1, width: esPrimera ? '100%' : undefined }}>
              {guardando ? 'Guardando…' : <>{esUltima ? 'Finalizar' : 'Siguiente'} <ArrowRight size={14} strokeWidth={2.5} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
