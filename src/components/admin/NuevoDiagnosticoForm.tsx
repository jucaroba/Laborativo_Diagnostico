'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PREGUNTAS_BASE } from '@/lib/preguntas-base'
import { DIMENSIONES, ROL_INFO, Rol } from '@/types'
import NeonPicker from './NeonPicker'

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
        .select()
        .single()

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

  function actualizarPregunta(idx: number, texto: string) {
    setPreguntas(prev => prev.map((p, i) => i === idx ? { ...p, texto } : p))
  }

  const datosValidos = datos.nombre_compania && datos.contacto_nombre && datos.contacto_cargo && datos.contacto_email

  return (
    <div className="flex flex-col gap-8">

      {/* PASO 1: Datos */}
      {paso === 'datos' && (
        <div className="flex flex-col gap-6">
          <Campo label="Nombre de la compañía">
            <input value={datos.nombre_compania}
              onChange={e => setDatos(d => ({ ...d, nombre_compania: e.target.value }))}
              placeholder="Ej: Bancolombia S.A." className={inputCls} />
          </Campo>

          <div className="grid grid-cols-2 gap-4">
            <Campo label="Nombre del contacto">
              <input value={datos.contacto_nombre}
                onChange={e => setDatos(d => ({ ...d, contacto_nombre: e.target.value }))}
                placeholder="Nombre completo" className={inputCls} />
            </Campo>
            <Campo label="Cargo">
              <input value={datos.contacto_cargo}
                onChange={e => setDatos(d => ({ ...d, contacto_cargo: e.target.value }))}
                placeholder="Ej: Gerente de Cultura" className={inputCls} />
            </Campo>
          </div>

          <Campo label="Email del contacto">
            <input type="email" value={datos.contacto_email}
              onChange={e => setDatos(d => ({ ...d, contacto_email: e.target.value }))}
              placeholder="correo@empresa.com" className={inputCls} />
          </Campo>

          <Campo label="Color neón del diagnóstico">
            <NeonPicker value={datos.color_neon} onChange={c => setDatos(d => ({ ...d, color_neon: c }))} />
          </Campo>

          <button onClick={() => setPaso('preguntas-opcion')} disabled={!datosValidos}
            className={btnPrimary + (!datosValidos ? ' opacity-30 cursor-not-allowed' : '')}>
            CONTINUAR →
          </button>
        </div>
      )}

      {/* PASO 2: Opción preguntas */}
      {paso === 'preguntas-opcion' && (
        <div className="flex flex-col gap-4">
          <p className="text-sm" style={{ color: 'var(--gray-mid)' }}>
            ¿Cómo configuramos las preguntas para <strong className="text-black">{datos.nombre_compania}</strong>?
          </p>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={cargarBase}
              className="text-left p-6 border-2 border-black hover:bg-black hover:text-white transition-colors">
              <p className="font-black mb-1">Preguntas base</p>
              <p className="text-sm" style={{ color: 'var(--gray-mid)' }}>
                Preguntas genéricas de Laborativo. Editables antes de guardar.
              </p>
            </button>
            <button onClick={() => setPaso('ia-config')}
              className="text-left p-6 border-2 border-black hover:bg-black hover:text-white transition-colors">
              <p className="font-black mb-1">Contextualizar con IA ✦</p>
              <p className="text-sm" style={{ color: 'var(--gray-mid)' }}>
                Claude investiga la empresa y ajusta las preguntas al contexto.
              </p>
            </button>
          </div>
          <button onClick={() => setPaso('datos')} className={btnSecondary}>← VOLVER</button>
        </div>
      )}

      {/* PASO 3: Config IA */}
      {paso === 'ia-config' && (
        <div className="flex flex-col gap-6">
          <Campo label="Vertical / Industria">
            <select value={iaConfig.vertical} onChange={e => setIaConfig(c => ({ ...c, vertical: e.target.value }))}
              className={inputCls}>
              <option value="">Selecciona un sector</option>
              {VERTICALES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </Campo>
          <Campo label="Contexto adicional (opcional)">
            <textarea value={iaConfig.contexto}
              onChange={e => setIaConfig(c => ({ ...c, contexto: e.target.value }))}
              placeholder="Retos de cultura, situación actual, lo que consideres relevante..."
              rows={5} className={inputCls + ' resize-none'} />
          </Campo>
          {error && <p className="text-sm font-bold" style={{ color: '#FF3366' }}>{error}</p>}
          <div className="flex gap-3">
            <button onClick={generarConIA} disabled={!iaConfig.vertical || generando}
              className={btnPrimary + ((!iaConfig.vertical || generando) ? ' opacity-30 cursor-not-allowed' : '')}>
              {generando ? 'GENERANDO…' : '✦ GENERAR PREGUNTAS'}
            </button>
            <button onClick={() => setPaso('preguntas-opcion')} disabled={generando} className={btnSecondary}>
              ← VOLVER
            </button>
          </div>
        </div>
      )}

      {/* PASO 4: Revisión */}
      {paso === 'revision' && (
        <div className="flex flex-col gap-6">
          <p className="text-sm" style={{ color: 'var(--gray-mid)' }}>
            Revisa y edita las preguntas antes de guardar.
          </p>
          {DIMENSIONES.map(dim => (
            <div key={dim.id}>
              <div className="flex items-baseline gap-3 mb-4">
                <span className="font-black text-lg">{dim.nombre}</span>
                <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--gray-mid)' }}>{dim.subtitulo}</span>
              </div>
              {(['A', 'B', 'C', 'D'] as Rol[]).map(rol => {
                const ps = preguntas.map((p, i) => ({ ...p, idx: i })).filter(p => p.dimension_id === dim.id && p.rol === rol)
                if (!ps.length) return null
                return (
                  <div key={rol} className="mb-4">
                    <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: 'var(--gray-mid)' }}>
                      {rol} — {ROL_INFO[rol].label}
                    </p>
                    <div className="flex flex-col gap-2">
                      {ps.map(p => (
                        <textarea key={p.idx} value={p.texto}
                          onChange={e => actualizarPregunta(p.idx, e.target.value)}
                          rows={2} className={inputCls + ' resize-none text-sm'} />
                      ))}
                    </div>
                  </div>
                )
              })}
              <div style={{ borderBottom: '1px solid var(--gray-border)' }} className="mb-6" />
            </div>
          ))}
          {error && <p className="text-sm font-bold" style={{ color: '#FF3366' }}>{error}</p>}
          <div className="flex gap-3">
            <button onClick={guardar} disabled={guardando}
              className={btnPrimary + (guardando ? ' opacity-30 cursor-not-allowed' : '')}>
              {guardando ? 'GUARDANDO…' : 'GUARDAR DIAGNÓSTICO'}
            </button>
            <button onClick={() => setPaso('preguntas-opcion')} disabled={guardando} className={btnSecondary}>
              ← CAMBIAR PREGUNTAS
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--gray-mid)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-4 py-3 text-sm border-2 border-black bg-white outline-none focus:border-black'
  + ' font-medium placeholder:text-gray-400'

const btnPrimary = 'font-black text-sm px-6 py-3 transition-opacity hover:opacity-70'
  + ' bg-black text-white border-2 border-black uppercase tracking-wide'

const btnSecondary = 'font-black text-sm px-6 py-3 transition-colors hover:bg-black hover:text-white'
  + ' border-2 border-black bg-transparent uppercase tracking-wide'
