'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PREGUNTAS_BASE } from '@/lib/preguntas-base'
import { DIMENSIONES, ROL_INFO, Rol } from '@/types'
import NeonPicker from './NeonPicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const VERTICALES = [
  'Tecnología', 'Retail', 'Salud', 'Manufactura', 'Educación',
  'Servicios financieros', 'Construcción', 'Medios y entretenimiento',
  'Logística', 'Consultoría', 'Otro',
]

type Paso = 'datos' | 'preguntas-opcion' | 'ia-config' | 'revision'

interface PreguntaEditable {
  dimension_id: number
  rol: Rol
  texto: string
  orden: number
}

const field = { display: 'flex', flexDirection: 'column' as const, gap: 6 }
const labelStyle = { fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' as const, color: 'var(--mute)' }

export default function NuevoDiagnosticoForm() {
  const router = useRouter()
  const [paso, setPaso] = useState<Paso>('datos')
  const [guardando, setGuardando] = useState(false)
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState('')

  const [datos, setDatos] = useState({
    nombre_compania: '',
    contacto_nombre: '',
    contacto_cargo: '',
    contacto_email: '',
    color_neon: '#39FF14',
  })

  const [iaConfig, setIaConfig] = useState({ vertical: '', contexto: '' })
  const [preguntas, setPreguntas] = useState<PreguntaEditable[]>([])

  function cargarBase() {
    const ps: PreguntaEditable[] = []
    let orden = 0
    for (const grupo of PREGUNTAS_BASE) {
      for (const texto of grupo.preguntas) {
        ps.push({ dimension_id: grupo.dimension_id, rol: grupo.rol, texto, orden: orden++ })
      }
    }
    setPreguntas(ps)
    setPaso('revision')
  }

  async function generarConIA() {
    setGenerando(true)
    setError('')
    try {
      const res = await fetch('/api/generar-preguntas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombreCompania: datos.nombre_compania, vertical: iaConfig.vertical, contexto: iaConfig.contexto }),
      })
      if (!res.ok) throw new Error('Error generando preguntas')
      const { preguntas: generadas } = await res.json()
      setPreguntas(generadas)
      setPaso('revision')
    } catch {
      setError('No se pudieron generar las preguntas. Intenta de nuevo.')
    } finally {
      setGenerando(false)
    }
  }

  async function guardar() {
    setGuardando(true)
    setError('')
    try {
      const { data: diag, error: diagErr } = await supabase
        .from('diagnosticos')
        .insert({
          nombre_compania: datos.nombre_compania,
          contacto_nombre: datos.contacto_nombre,
          contacto_cargo: datos.contacto_cargo,
          contacto_email: datos.contacto_email,
          color_neon: datos.color_neon,
          vertical: iaConfig.vertical || null,
          contexto_ia: iaConfig.contexto || null,
        })
        .select().single()

      if (diagErr || !diag) throw new Error(diagErr?.message)

      const { error: pregErr } = await supabase.from('preguntas')
        .insert(preguntas.map(p => ({ ...p, diagnostico_id: diag.id })))
      if (pregErr) throw new Error(pregErr.message)

      router.push(`/admin/${diag.id}`)
    } catch (e: any) {
      setError(e.message || 'Error guardando el diagnóstico')
    } finally {
      setGuardando(false)
    }
  }

  const datosValidos = datos.nombre_compania && datos.contacto_nombre && datos.contacto_cargo && datos.contacto_email

  return (
    <div style={{ fontFamily: "'Red Hat Display', sans-serif", maxWidth: 640 }}>

      {/* PASO 1: Datos */}
      {paso === 'datos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={field}>
            <Label style={labelStyle}>Nombre de la compañía</Label>
            <Input value={datos.nombre_compania}
              onChange={e => setDatos(d => ({ ...d, nombre_compania: e.target.value }))}
              placeholder="Ej: Bancolombia S.A." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={field}>
              <Label style={labelStyle}>Nombre del contacto</Label>
              <Input value={datos.contacto_nombre}
                onChange={e => setDatos(d => ({ ...d, contacto_nombre: e.target.value }))}
                placeholder="Nombre completo" />
            </div>
            <div style={field}>
              <Label style={labelStyle}>Cargo</Label>
              <Input value={datos.contacto_cargo}
                onChange={e => setDatos(d => ({ ...d, contacto_cargo: e.target.value }))}
                placeholder="Ej: Gerente de Cultura" />
            </div>
          </div>

          <div style={field}>
            <Label style={labelStyle}>Email del contacto</Label>
            <Input type="email" value={datos.contacto_email}
              onChange={e => setDatos(d => ({ ...d, contacto_email: e.target.value }))}
              placeholder="correo@empresa.com" />
          </div>

          <div style={field}>
            <Label style={labelStyle}>Color neón del diagnóstico</Label>
            <NeonPicker value={datos.color_neon} onChange={c => setDatos(d => ({ ...d, color_neon: c }))} />
          </div>

          <Button onClick={() => setPaso('preguntas-opcion')} disabled={!datosValidos}>
            Continuar →
          </Button>
        </div>
      )}

      {/* PASO 2: Opción preguntas */}
      {paso === 'preguntas-opcion' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--mute)', fontWeight: 500, margin: 0 }}>
            ¿Cómo configuramos las preguntas para <strong style={{ color: 'var(--ink)' }}>{datos.nombre_compania}</strong>?
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Preguntas base', desc: 'Preguntas genéricas de Laborativo. Editables antes de guardar.', action: cargarBase },
              { label: 'Contextualizar con IA ✦', desc: 'Claude investiga la empresa y ajusta las preguntas al contexto.', action: () => setPaso('ia-config') },
            ].map(opt => (
              <button key={opt.label} onClick={opt.action}
                style={{
                  textAlign: 'left', padding: '20px', border: '1.5px solid var(--border)',
                  background: 'var(--card)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6,
                  fontFamily: "'Red Hat Display', sans-serif",
                  transition: 'border-color .15s, background .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.background = 'var(--ink)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--card)'; e.currentTarget.style.color = 'inherit' }}>
                <span style={{ fontWeight: 800, fontSize: 14 }}>{opt.label}</span>
                <span style={{ fontSize: 12, fontWeight: 500, opacity: .7 }}>{opt.desc}</span>
              </button>
            ))}
          </div>
          <Button variant="outline" onClick={() => setPaso('datos')}>← Volver</Button>
        </div>
      )}

      {/* PASO 3: Config IA */}
      {paso === 'ia-config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={field}>
            <Label style={labelStyle}>Vertical / Industria</Label>
            <select value={iaConfig.vertical} onChange={e => setIaConfig(c => ({ ...c, vertical: e.target.value }))}
              style={{ height: 36, padding: '0 12px', border: '1px solid var(--border)', background: 'var(--card)', fontFamily: "'Red Hat Display', sans-serif", fontSize: 13, fontWeight: 500 }}>
              <option value="">Selecciona un sector</option>
              {VERTICALES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div style={field}>
            <Label style={labelStyle}>Contexto adicional (opcional)</Label>
            <textarea value={iaConfig.contexto}
              onChange={e => setIaConfig(c => ({ ...c, contexto: e.target.value }))}
              placeholder="Retos de cultura, situación actual, lo que consideres relevante..."
              rows={4}
              style={{ padding: '10px 12px', border: '1px solid var(--border)', background: 'var(--card)', fontFamily: "'Red Hat Display', sans-serif", fontSize: 13, fontWeight: 500, resize: 'none', outline: 'none' }} />
          </div>
          {error && <p style={{ fontSize: 12, fontWeight: 700, color: '#FF3366', margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={generarConIA} disabled={!iaConfig.vertical || generando}>
              {generando ? 'Generando…' : '✦ Generar preguntas'}
            </Button>
            <Button variant="outline" onClick={() => setPaso('preguntas-opcion')} disabled={generando}>← Volver</Button>
          </div>
        </div>
      )}

      {/* PASO 4: Revisión */}
      {paso === 'revision' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <p style={{ fontSize: 13, color: 'var(--mute)', fontWeight: 500, margin: 0 }}>
            Revisa y edita las preguntas antes de guardar.
          </p>
          {DIMENSIONES.map(dim => (
            <div key={dim.id}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 800 }}>{dim.nombre}</span>
                <span style={{ fontSize: 11, color: 'var(--mute)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{dim.subtitulo}</span>
              </div>
              {(['A', 'B', 'C', 'D'] as Rol[]).map(rol => {
                const ps = preguntas.map((p, i) => ({ ...p, idx: i })).filter(p => p.dimension_id === dim.id && p.rol === rol)
                if (!ps.length) return null
                return (
                  <div key={rol} style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--mute)', margin: '0 0 8px' }}>
                      {rol} — {ROL_INFO[rol].label}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {ps.map(p => (
                        <textarea key={p.idx} value={p.texto}
                          onChange={e => setPreguntas(prev => prev.map((q, i) => i === p.idx ? { ...q, texto: e.target.value } : q))}
                          rows={2}
                          style={{ padding: '10px 12px', border: '1px solid var(--border)', background: 'var(--card)', fontFamily: "'Red Hat Display', sans-serif", fontSize: 13, fontWeight: 500, resize: 'none', outline: 'none', width: '100%' }} />
                      ))}
                    </div>
                  </div>
                )
              })}
              <div style={{ borderBottom: '1px solid var(--border)', marginBottom: 8 }} />
            </div>
          ))}
          {error && <p style={{ fontSize: 12, fontWeight: 700, color: '#FF3366', margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={guardar} disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar diagnóstico'}
            </Button>
            <Button variant="outline" onClick={() => setPaso('preguntas-opcion')} disabled={guardando}>← Cambiar preguntas</Button>
          </div>
        </div>
      )}
    </div>
  )
}
