'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DIMENSIONES, ROL_INFO, Rol, Tema } from '@/types'
import ColorPickerHex from './ColorPickerHex'
import { Button } from '@/components/ui/button'
import { ArrowRight, Plus as PlusIcon, Pencil, Trash2, Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Paso = 'datos' | 'revision'
interface PreguntaEditable { dimension_id: number; rol: Rol; texto: string; orden: number }

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="form-row">
      <Label className="form-label">{label}</Label>
      <div>{children}</div>
    </div>
  )
}

function Actions({ children }: { children: React.ReactNode }) {
  return <div style={{ paddingTop: 24, display: 'flex', gap: 8 }}>{children}</div>
}

function RevisionRow({ num, texto, onChange, onDelete }: { num: number; texto: string; onChange: (t: string) => void; onDelete: () => void }) {
  const [editando, setEditando] = useState(false)
  const [draft, setDraft] = useState(texto)
  function confirmar() { onChange(draft); setEditando(false) }
  return (
    <tr style={{ borderBottom: '1px solid var(--line-soft)' }} className="revision-row">
      <td style={{ width: 32, padding: '8px 8px 8px 0', fontSize: 12, fontWeight: 700, color: 'var(--mute)', verticalAlign: 'middle' }}>{num}</td>
      <td style={{ padding: '8px 0', fontSize: 13, fontWeight: 500, verticalAlign: 'middle' }}>
        {editando
          ? <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') confirmar(); if (e.key === 'Escape') setEditando(false) }}
              style={{ width: '100%', fontSize: 13, fontWeight: 500, border: '1.5px solid var(--ink)', padding: '4px 8px', background: '#fff', outline: 'none', fontFamily: 'inherit' }} />
          : texto || <span style={{ color: 'var(--mute)' }}>Escribe la pregunta…</span>}
      </td>
      <td style={{ width: 64, textAlign: 'right', verticalAlign: 'middle' }}>
        {editando
          ? <span style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button onClick={confirmar} style={iconBtn}><Check size={13} strokeWidth={2.5} color="#3D6B4F" /></button>
              <button onClick={() => setEditando(false)} style={iconBtn}><X size={13} strokeWidth={2} color="#7A7A7A" /></button>
            </span>
          : <span className="row-actions" style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', opacity: 0 }}>
              <button onClick={() => { setDraft(texto); setEditando(true) }} style={iconBtn}><Pencil size={13} strokeWidth={2} color="#7A7A7A" /></button>
              <button onClick={onDelete} style={iconBtn}><Trash2 size={13} strokeWidth={2} color="#FF3366" /></button>
            </span>}
      </td>
    </tr>
  )
}
const iconBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }

export default function NuevoDiagnosticoForm() {
  const router = useRouter()
  const [paso, setPaso] = useState<Paso>('datos')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const [intentoContinuar, setIntentoContinuar] = useState(false)

  const [datos, setDatos] = useState({
    nombre_compania: '', contacto_nombre: '', contacto_cargo: '',
    contacto_email: '', color_neon: '#37FF25',
  })
  const [preguntas, setPreguntas] = useState<PreguntaEditable[]>([])
  const [temas, setTemas] = useState<Tema[]>([])
  const [cargandoTemas, setCargandoTemas] = useState(true)
  const [temaSeleccionadoId, setTemaSeleccionadoId] = useState<string | null>(null)
  const [cargandoBase, setCargandoBase] = useState(false)

  useEffect(() => {
    let cancelado = false
    supabase.from('temas').select('*').order('created_at').then(({ data, error: err }) => {
      if (cancelado) return
      if (err) { setError('No se pudieron cargar los temas.'); setCargandoTemas(false); return }
      setTemas((data ?? []) as Tema[])
      setCargandoTemas(false)
    })
    return () => { cancelado = true }
  }, [])

  async function cargarBase(temaId: string) {
    setError('')
    setCargandoBase(true)
    const { data, error: err } = await supabase
      .from('preguntas_base')
      .select('dimension_id, rol, texto, orden')
      .eq('tema_id', temaId)
      .order('dimension_id')
      .order('rol')
      .order('orden')
    setCargandoBase(false)
    if (err || !data) { setError('No se pudieron cargar las preguntas base.'); return }
    const ps: PreguntaEditable[] = data.map((p, i) => ({
      dimension_id: p.dimension_id,
      rol: p.rol as Rol,
      texto: p.texto,
      orden: i,
    }))
    setPreguntas(ps); setPaso('revision')
  }

  function continuar() {
    if (!datosValidos || !temaSeleccionadoId) {
      setIntentoContinuar(true)
      return
    }
    cargarBase(temaSeleccionadoId)
  }

  async function guardar() {
    setGuardando(true); setError('')
    try {
      const { data: diag, error: diagErr } = await supabase.from('diagnosticos').insert({
        nombre_compania: datos.nombre_compania, contacto_nombre: datos.contacto_nombre,
        contacto_cargo: datos.contacto_cargo, contacto_email: datos.contacto_email,
        color_neon: datos.color_neon,
      }).select().single()
      if (diagErr || !diag) throw new Error(diagErr?.message)
      const { error: pregErr } = await supabase.from('preguntas')
        .insert(preguntas.map(p => ({ ...p, diagnostico_id: diag.id })))
      if (pregErr) throw new Error(pregErr.message)
      router.push(`/admin/${diag.id}`)
    } catch (e: any) { setError(e.message || 'Error guardando') }
    finally { setGuardando(false) }
  }

  const datosValidos = datos.nombre_compania && datos.contacto_nombre && datos.contacto_cargo && datos.contacto_email

  return (
    <div>

      {/* Header de página */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <span className="page-header__eyebrow">Nuevo diagnóstico</span>
        <div className="page-header__rule" />
        <h1 className="page-header__title">Configuración</h1>
      </div>

      <div style={{ maxWidth: 720 }}>
      <div style={{
        background: 'var(--ink)',
        padding: '10px 16px',
        marginBottom: 27,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '0', margin: 0, color: '#fff', fontFamily: 'Red Hat Display, sans-serif' }}>Datos de la empresa</h2>
        {paso === 'revision' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              onClick={() => setPaso('datos')}
              disabled={guardando}
              style={{ background: 'transparent', color: '#fff', border: '1.5px solid #fff' }}
            >
              <ArrowRight size={15} strokeWidth={2.5} style={{ transform: 'rotate(180deg)' }} /> Cambiar tema
            </Button>
            <Button
              onClick={guardar}
              disabled={guardando}
              style={{ background: '#fff', color: 'var(--ink)', border: '1.5px solid #fff' }}
            >
              {guardando ? 'Guardando…' : 'Guardar diagnóstico'}
            </Button>
          </div>
        )}
      </div>

      {/* PASO 1: Datos + selección de tema */}
      {paso === 'datos' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32, alignItems: 'center' }}>
            <Input style={{ height: 36 }} value={datos.nombre_compania} onChange={e => setDatos(d => ({ ...d, nombre_compania: e.target.value }))} placeholder="Nombre de la empresa" />
            <Input style={{ height: 36 }} value={datos.contacto_nombre} onChange={e => setDatos(d => ({ ...d, contacto_nombre: e.target.value }))} placeholder="Nombre del contacto" />
            <Input style={{ height: 36 }} value={datos.contacto_cargo} onChange={e => setDatos(d => ({ ...d, contacto_cargo: e.target.value }))} placeholder="Cargo" />
            <Input style={{ height: 36 }} type="email" value={datos.contacto_email} onChange={e => setDatos(d => ({ ...d, contacto_email: e.target.value }))} placeholder="Email" />
            <ColorPickerHex value={datos.color_neon} onChange={c => setDatos(d => ({ ...d, color_neon: c }))} />
            <div />
          </div>

          <div style={{ marginTop: 44 }}>
            <div style={{ background: 'var(--ink)', padding: '10px 16px', marginBottom: 27 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '0', margin: 0, color: '#fff', fontFamily: 'Red Hat Display, sans-serif' }}>Set de preguntas</h2>
            </div>
            {cargandoTemas ? (
              <p className="text-mute" style={{ fontSize: 13 }}>Cargando temas…</p>
            ) : !temas.length ? (
              <p className="text-mute" style={{ fontSize: 13 }}>
                Aún no hay temas. Crea uno en <strong>Preguntas base</strong>.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {temas.map(t => {
                  const seleccionado = temaSeleccionadoId === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTemaSeleccionadoId(t.id)}
                      style={{
                        textAlign: 'left', padding: '16px 20px',
                        border: '1.5px solid var(--ink)',
                        background: seleccionado ? 'var(--bg-2)' : 'var(--card)',
                        cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', gap: 4,
                        transition: 'border-color .15s, background .15s',
                      }}
                      onMouseEnter={e => { if (!seleccionado) e.currentTarget.style.borderColor = 'var(--ink)' }}
                      onMouseLeave={e => { if (!seleccionado) e.currentTarget.style.borderColor = 'var(--ink)' }}
                    >
                      <span style={{ fontWeight: 800, fontSize: 14 }}>{t.nombre}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {error && <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--destructive)', paddingTop: 12, margin: 0 }}>{error}</p>}

          <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16 }}>
            {intentoContinuar && !datosValidos && <span style={{ fontSize: 12, color: 'var(--mute)', fontWeight: 500 }}>Completa los campos para seguir</span>}
            {intentoContinuar && datosValidos && !temaSeleccionadoId && <span style={{ fontSize: 12, color: 'var(--mute)', fontWeight: 500 }}>Selecciona un tema para seguir</span>}
            <Button onClick={continuar} disabled={cargandoBase}>
              {cargandoBase ? 'Cargando…' : 'Continuar'} <ArrowRight size={15} strokeWidth={2.5} />
            </Button>
          </div>
        </div>
      )}

      {/* PASO 3: Revisión de preguntas */}
      {paso === 'revision' && (
        <div>
          {DIMENSIONES.map((dim, dimIdx) => (
            <div key={dim.id} style={{ marginBottom: 40, borderTop: dimIdx === 0 ? 'none' : '2px solid var(--ink)', paddingTop: 16 }}>
              <p className="page-header__eyebrow" style={{ margin: '0 0 4px' }}>{dim.subtitulo}</p>
              <h3 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '0', margin: '0 0 20px', fontFamily: 'Red Hat Display, sans-serif' }}>{dim.nombre}</h3>
              {(['A', 'C', 'D', 'B'] as Rol[]).map(rol => {
                const grupo = preguntas.map((p, i) => ({ ...p, idx: i })).filter(p => p.dimension_id === dim.id && p.rol === rol)
                return (
                  <div key={rol} style={{ marginBottom: 20 }}>
                    <div style={{ background: 'var(--bg-2)', padding: '6px 12px', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="page-header__eyebrow" style={{ margin: 0, color: 'var(--ink)', fontWeight: 800 }}>{rol} / {ROL_INFO[rol].label}</span>
                      <button onClick={() => setPreguntas(prev => [...prev, { dimension_id: dim.id, rol, texto: '', orden: prev.length + 1 }])}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', display: 'flex', padding: '2px 4px' }}>
                        <PlusIcon size={13} strokeWidth={2.5} />
                      </button>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        {grupo.map((p, i) => (
                          <RevisionRow key={p.idx} num={i + 1} texto={p.texto}
                            onChange={txt => setPreguntas(prev => prev.map((q, qi) => qi === p.idx ? { ...q, texto: txt } : q))}
                            onDelete={() => setPreguntas(prev => prev.filter((_, qi) => qi !== p.idx))}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              })}
            </div>
          ))}
          {error && <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--destructive)', paddingTop: 12, margin: 0 }}>{error}</p>}
          <div style={{
            background: 'var(--ink)',
            padding: '10px 16px',
            marginTop: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 8,
            flexWrap: 'wrap',
          }}>
            <Button
              onClick={() => setPaso('datos')}
              disabled={guardando}
              style={{ background: 'transparent', color: '#fff', border: '1.5px solid #fff' }}
            >
              <ArrowRight size={15} strokeWidth={2.5} style={{ transform: 'rotate(180deg)' }} /> Cambiar tema
            </Button>
            <Button
              onClick={guardar}
              disabled={guardando}
              style={{ background: '#fff', color: 'var(--ink)', border: '1.5px solid #fff' }}
            >
              {guardando ? 'Guardando…' : 'Guardar diagnóstico'}
            </Button>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
