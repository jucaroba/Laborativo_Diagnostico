'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PREGUNTAS_BASE } from '@/lib/claude'
import { DIMENSIONES, ROL_INFO, Rol } from '@/types'

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
  })

  const [iaConfig, setIaConfig] = useState({
    vertical: '',
    contexto: '',
  })

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
        body: JSON.stringify({
          nombreCompania: datos.nombre_compania,
          vertical: iaConfig.vertical,
          contexto: iaConfig.contexto,
        }),
      })
      if (!res.ok) throw new Error('Error generando preguntas')
      const { preguntas: generadas } = await res.json()
      setPreguntas(generadas)
      setPaso('revision')
    } catch (e) {
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
        .insert({ ...datos, vertical: iaConfig.vertical || null, contexto_ia: iaConfig.contexto || null })
        .select()
        .single()

      if (diagErr || !diag) throw new Error(diagErr?.message)

      const rows = preguntas.map((p) => ({ ...p, diagnostico_id: diag.id }))
      const { error: pregErr } = await supabase.from('preguntas').insert(rows)
      if (pregErr) throw new Error(pregErr.message)

      router.push(`/admin/${diag.id}`)
    } catch (e: any) {
      setError(e.message || 'Error guardando el diagnóstico')
    } finally {
      setGuardando(false)
    }
  }

  function actualizarPregunta(idx: number, texto: string) {
    setPreguntas((prev) => prev.map((p, i) => i === idx ? { ...p, texto } : p))
  }

  const datosValidos = datos.nombre_compania && datos.contacto_nombre && datos.contacto_cargo && datos.contacto_email

  return (
    <div className="flex flex-col gap-6">

      {/* PASO 1: Datos del cliente */}
      {paso === 'datos' && (
        <div className="flex flex-col gap-4">
          <Campo label="Nombre de la compañía" required>
            <input value={datos.nombre_compania} onChange={e => setDatos(d => ({ ...d, nombre_compania: e.target.value }))}
              placeholder="Ej: Bancolombia S.A." className={inputCls} />
          </Campo>
          <div className="grid grid-cols-2 gap-4">
            <Campo label="Nombre del contacto" required>
              <input value={datos.contacto_nombre} onChange={e => setDatos(d => ({ ...d, contacto_nombre: e.target.value }))}
                placeholder="Nombre completo" className={inputCls} />
            </Campo>
            <Campo label="Cargo" required>
              <input value={datos.contacto_cargo} onChange={e => setDatos(d => ({ ...d, contacto_cargo: e.target.value }))}
                placeholder="Ej: Gerente de Cultura" className={inputCls} />
            </Campo>
          </div>
          <Campo label="Email del contacto" required>
            <input type="email" value={datos.contacto_email} onChange={e => setDatos(d => ({ ...d, contacto_email: e.target.value }))}
              placeholder="correo@empresa.com" className={inputCls} />
          </Campo>
          <div className="mt-2">
            <button onClick={() => setPaso('preguntas-opcion')} disabled={!datosValidos}
              className={btnPrimary + (!datosValidos ? ' opacity-40 cursor-not-allowed' : '')}>
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* PASO 2: Opción de preguntas */}
      {paso === 'preguntas-opcion' && (
        <div className="flex flex-col gap-4">
          <p className="font-sans text-sm" style={{ color: 'var(--brown-mid)' }}>
            ¿Cómo quieres configurar las preguntas para <strong>{datos.nombre_compania}</strong>?
          </p>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={cargarBase}
              className="text-left p-5 rounded-xl border-2 transition-all hover:border-current"
              style={{ borderColor: 'var(--cream-dark)', background: 'white' }}>
              <p className="font-medium mb-1" style={{ color: 'var(--brown)' }}>Preguntas base</p>
              <p className="text-sm font-sans" style={{ color: 'var(--brown-light)' }}>
                Carga las preguntas genéricas de Laborativo. Puedes editarlas después.
              </p>
            </button>
            <button onClick={() => setPaso('ia-config')}
              className="text-left p-5 rounded-xl border-2 transition-all hover:border-current"
              style={{ borderColor: 'var(--cream-dark)', background: 'white' }}>
              <p className="font-medium mb-1" style={{ color: 'var(--brown)' }}>Contextualizar con IA ✦</p>
              <p className="text-sm font-sans" style={{ color: 'var(--brown-light)' }}>
                Claude investiga la empresa y genera preguntas ajustadas al contexto.
              </p>
            </button>
          </div>
          <button onClick={() => setPaso('datos')} className={btnSecondary}>← Volver</button>
        </div>
      )}

      {/* PASO 3: Configuración IA */}
      {paso === 'ia-config' && (
        <div className="flex flex-col gap-4">
          <Campo label="Vertical / Industria">
            <select value={iaConfig.vertical} onChange={e => setIaConfig(c => ({ ...c, vertical: e.target.value }))}
              className={inputCls}>
              <option value="">Selecciona un sector</option>
              {VERTICALES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </Campo>
          <Campo label="Contexto adicional (opcional)">
            <textarea value={iaConfig.contexto} onChange={e => setIaConfig(c => ({ ...c, contexto: e.target.value }))}
              placeholder="Describe retos específicos de cultura, situación actual de la organización, o cualquier contexto relevante..."
              rows={5} className={inputCls + ' resize-none'} />
          </Campo>
          {error && <p className="text-sm font-sans" style={{ color: 'var(--rol-c)' }}>{error}</p>}
          <div className="flex gap-3">
            <button onClick={generarConIA} disabled={!iaConfig.vertical || generando}
              className={btnPrimary + ((!iaConfig.vertical || generando) ? ' opacity-40 cursor-not-allowed' : '')}>
              {generando ? 'Generando preguntas…' : '✦ Generar preguntas'}
            </button>
            <button onClick={() => setPaso('preguntas-opcion')} disabled={generando} className={btnSecondary}>← Volver</button>
          </div>
        </div>
      )}

      {/* PASO 4: Revisión y edición de preguntas */}
      {paso === 'revision' && (
        <div className="flex flex-col gap-6">
          <p className="font-sans text-sm" style={{ color: 'var(--brown-mid)' }}>
            Revisa y edita las preguntas antes de guardar el diagnóstico.
          </p>
          {DIMENSIONES.map(dim => (
            <div key={dim.id}>
              <div className="mb-3">
                <span className="font-medium" style={{ color: 'var(--brown)' }}>{dim.nombre}</span>
                <span className="text-sm font-sans ml-2" style={{ color: 'var(--brown-light)' }}>{dim.subtitulo}</span>
              </div>
              {(['A', 'B', 'C', 'D'] as Rol[]).map(rol => {
                const rolInfo = ROL_INFO[rol]
                const ps = preguntas.map((p, i) => ({ ...p, idx: i })).filter(p => p.dimension_id === dim.id && p.rol === rol)
                if (!ps.length) return null
                return (
                  <div key={rol} className="mb-4">
                    <p className="text-xs font-sans uppercase tracking-wide mb-2"
                      style={{ color: rolInfo.color }}>
                      {rol} — {rolInfo.label}
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
              <div style={{ borderBottom: '1px solid var(--cream-dark)' }} className="mb-4" />
            </div>
          ))}
          {error && <p className="text-sm font-sans" style={{ color: 'var(--rol-c)' }}>{error}</p>}
          <div className="flex gap-3">
            <button onClick={guardar} disabled={guardando}
              className={btnPrimary + (guardando ? ' opacity-40 cursor-not-allowed' : '')}>
              {guardando ? 'Guardando…' : 'Guardar diagnóstico'}
            </button>
            <button onClick={() => setPaso('preguntas-opcion')} disabled={guardando} className={btnSecondary}>
              ← Cambiar preguntas
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Campo({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-sans" style={{ color: 'var(--brown-mid)' }}>
        {label}{required && <span style={{ color: 'var(--rol-c)' }}> *</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-4 py-2.5 rounded-lg text-sm font-sans outline-none transition-colors'
  + ' border border-[var(--cream-dark)] bg-white focus:border-[var(--brown-mid)]'
  + ' text-[var(--brown)] placeholder:text-[var(--brown-light)]'

const btnPrimary = 'font-sans text-sm px-5 py-2.5 rounded-lg transition-opacity hover:opacity-80'
  + ' bg-[var(--brown)] text-[var(--cream)]'

const btnSecondary = 'font-sans text-sm px-5 py-2.5 rounded-lg transition-opacity hover:opacity-70'
  + ' border border-[var(--cream-dark)] text-[var(--brown-mid)] bg-white'
