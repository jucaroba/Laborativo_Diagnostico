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
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const VERTICALES = [
  'Tecnología', 'Retail', 'Salud', 'Manufactura', 'Educación',
  'Servicios financieros', 'Construcción', 'Medios y entretenimiento',
  'Logística', 'Consultoría', 'Otro',
]

type Paso = 'datos' | 'preguntas-opcion' | 'ia-config' | 'revision'
interface PreguntaEditable { dimension_id: number; rol: Rol; texto: string; orden: number }

const lbl = {
  fontSize: 10, fontWeight: 700, letterSpacing: '.1em',
  textTransform: 'uppercase' as const, color: 'var(--mute)',
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 24, alignItems: 'start', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
      <Label style={lbl}>{label}</Label>
      <div>{children}</div>
    </div>
  )
}

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
    for (const grupo of PREGUNTAS_BASE)
      for (const texto of grupo.preguntas)
        ps.push({ dimension_id: grupo.dimension_id, rol: grupo.rol, texto, orden: orden++ })
    setPreguntas(ps)
    setPaso('revision')
  }

  async function generarConIA() {
    setGenerando(true); setError('')
    try {
      const res = await fetch('/api/generar-preguntas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombreCompania: datos.nombre_compania, vertical: iaConfig.vertical, contexto: iaConfig.contexto }),
      })
      if (!res.ok) throw new Error()
      const { preguntas: generadas } = await res.json()
      setPreguntas(generadas); setPaso('revision')
    } catch { setError('No se pudieron generar las preguntas.') }
    finally { setGenerando(false) }
  }

  async function guardar() {
    setGuardando(true); setError('')
    try {
      const { data: diag, error: diagErr } = await supabase.from('diagnosticos').insert({
        nombre_compania: datos.nombre_compania, contacto_nombre: datos.contacto_nombre,
        contacto_cargo: datos.contacto_cargo, contacto_email: datos.contacto_email,
        color_neon: datos.color_neon, vertical: iaConfig.vertical || null, contexto_ia: iaConfig.contexto || null,
      }).select().single()
      if (diagErr || !diag) throw new Error(diagErr?.message)
      const { error: pregErr } = await supabase.from('preguntas').insert(preguntas.map(p => ({ ...p, diagnostico_id: diag.id })))
      if (pregErr) throw new Error(pregErr.message)
      router.push(`/admin/${diag.id}`)
    } catch (e: any) { setError(e.message || 'Error guardando') }
    finally { setGuardando(false) }
  }

  const datosValidos = datos.nombre_compania && datos.contacto_nombre && datos.contacto_cargo && datos.contacto_email

  return (
    <div style={{ fontFamily: "'Red Hat Display', sans-serif", maxWidth: 720 }}>

      {/* PASO 1 */}
      {paso === 'datos' && (
        <div>
          <div style={{ borderTop: '1.5px solid var(--ink)', marginBottom: 0 }} />
          <Row label="Compañía">
            <Input value={datos.nombre_compania} onChange={e => setDatos(d => ({ ...d, nombre_compania: e.target.value }))} placeholder="Ej: Bancolombia S.A." />
          </Row>
          <Row label="Contacto">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input value={datos.contacto_nombre} onChange={e => setDatos(d => ({ ...d, contacto_nombre: e.target.value }))} placeholder="Nombre completo" />
              <Input value={datos.contacto_cargo} onChange={e => setDatos(d => ({ ...d, contacto_cargo: e.target.value }))} placeholder="Cargo" />
            </div>
          </Row>
          <Row label="Email">
            <Input type="email" value={datos.contacto_email} onChange={e => setDatos(d => ({ ...d, contacto_email: e.target.value }))} placeholder="correo@empresa.com" />
          </Row>
          <Row label="Color neón">
            <NeonPicker value={datos.color_neon} onChange={c => setDatos(d => ({ ...d, color_neon: c }))} />
          </Row>
          <div style={{ paddingTop: 24 }}>
            <Button onClick={() => setPaso('preguntas-opcion')} disabled={!datosValidos}>Continuar →</Button>
          </div>
        </div>
      )}

      {/* PASO 2 */}
      {paso === 'preguntas-opcion' && (
        <div>
          <div style={{ borderTop: '1.5px solid var(--ink)' }} />
          <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 13, color: 'var(--mute)', fontWeight: 500, margin: '0 0 16px' }}>
              ¿Cómo configuramos las preguntas para <strong style={{ color: 'var(--ink)', fontWeight: 800 }}>{datos.nombre_compania}</strong>?
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Preguntas base', desc: 'Preguntas genéricas de Laborativo. Editables antes de guardar.', action: cargarBase },
                { label: 'Contextualizar con IA ✦', desc: 'Claude investiga la empresa y ajusta las preguntas al contexto.', action: () => setPaso('ia-config') },
              ].map(opt => (
                <button key={opt.label} onClick={opt.action} style={{
                  textAlign: 'left', padding: '16px', border: '1px solid var(--border)',
                  background: 'var(--card)', cursor: 'pointer', fontFamily: "'Red Hat Display', sans-serif",
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                  <span style={{ fontWeight: 800, fontSize: 14 }}>{opt.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--mute)' }}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div style={{ paddingTop: 24 }}>
            <Button variant="outline" onClick={() => setPaso('datos')}>← Volver</Button>
          </div>
        </div>
      )}

      {/* PASO 3 */}
      {paso === 'ia-config' && (
        <div>
          <div style={{ borderTop: '1.5px solid var(--ink)' }} />
          <Row label="Vertical / Industria">
            <Select value={iaConfig.vertical} onValueChange={(v: string | null) => setIaConfig(c => ({ ...c, vertical: v ?? '' }))}>
              <SelectTrigger><SelectValue placeholder="Selecciona un sector" /></SelectTrigger>
              <SelectContent>{VERTICALES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </Row>
          <Row label="Contexto adicional">
            <Textarea value={iaConfig.contexto} onChange={e => setIaConfig(c => ({ ...c, contexto: e.target.value }))}
              placeholder="Retos de cultura, situación actual..." rows={4} />
          </Row>
          {error && <p style={{ fontSize: 12, fontWeight: 700, color: '#FF3366', padding: '12px 0', margin: 0 }}>{error}</p>}
          <div style={{ paddingTop: 24, display: 'flex', gap: 8 }}>
            <Button onClick={generarConIA} disabled={!iaConfig.vertical || generando}>
              {generando ? 'Generando…' : '✦ Generar preguntas'}
            </Button>
            <Button variant="outline" onClick={() => setPaso('preguntas-opcion')} disabled={generando}>← Volver</Button>
          </div>
        </div>
      )}

      {/* PASO 4 */}
      {paso === 'revision' && (
        <div>
          <div style={{ borderTop: '1.5px solid var(--ink)' }} />
          {DIMENSIONES.map(dim => (
            <div key={dim.id}>
              <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 24, padding: '16px 0', borderBottom: '1px solid var(--border)', alignItems: 'start' }}>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 14, margin: '0 0 2px' }}>{dim.nombre}</p>
                  <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--mute)', margin: 0 }}>{dim.subtitulo}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {(['A', 'B', 'C', 'D'] as Rol[]).map(rol => {
                    const ps = preguntas.map((p, i) => ({ ...p, idx: i })).filter(p => p.dimension_id === dim.id && p.rol === rol)
                    if (!ps.length) return null
                    return (
                      <div key={rol} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--mute)', margin: 0 }}>
                          {rol} — {ROL_INFO[rol].label}
                        </p>
                        {ps.map(p => (
                          <Textarea key={p.idx} value={p.texto} rows={2}
                            onChange={e => setPreguntas(prev => prev.map((q, i) => i === p.idx ? { ...q, texto: e.target.value } : q))} />
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
          {error && <p style={{ fontSize: 12, fontWeight: 700, color: '#FF3366', padding: '12px 0', margin: 0 }}>{error}</p>}
          <div style={{ paddingTop: 24, display: 'flex', gap: 8 }}>
            <Button onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar diagnóstico'}</Button>
            <Button variant="outline" onClick={() => setPaso('preguntas-opcion')} disabled={guardando}>← Cambiar preguntas</Button>
          </div>
        </div>
      )}
    </div>
  )
}
