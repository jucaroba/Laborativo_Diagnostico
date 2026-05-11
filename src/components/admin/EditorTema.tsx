'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DIMENSIONES, ROL_INFO, Rol, TipoDiagnostico } from '@/types'
import { TIPOS_DIAGNOSTICO } from '@/lib/tipos-diagnostico'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus as PlusIcon, Pencil, Trash2, Check, X } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { ClaudeIcon } from '@/components/icons/ClaudeIcon'
import GrupoPreguntas from './GrupoPreguntas'
import TemaTitulo from './TemaTitulo'

const VERTICALES = [
  'General',
  'Tecnología', 'Retail', 'Salud', 'Manufactura', 'Educación',
  'Servicios financieros', 'Construcción', 'Medios y entretenimiento',
  'Logística', 'Consultoría', 'Otro',
]

interface PreguntaBase {
  id: string
  dimension_id: number
  rol: Rol
  texto: string
  orden: number
}

interface PreguntaEditable {
  dimension_id: number
  rol: Rol
  texto: string
  orden: number
}

interface Props {
  temaId: string
  temaNombre: string
  descripcion: string | null
  preguntas: PreguntaBase[]
  tipo?: TipoDiagnostico
}

const iconBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }

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

function BotonesAccion({ onDescartar, onGuardar, guardando }: { onDescartar: () => void; onGuardar: () => void; guardando: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
      <Button variant="outline" onClick={onDescartar} disabled={guardando}>Descartar</Button>
      <Button onClick={onGuardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar plantilla'}</Button>
    </div>
  )
}

export default function EditorTema({ temaId, temaNombre, descripcion, preguntas, tipo }: Props) {
  const tipoConfig = TIPOS_DIAGNOSTICO[tipo ?? 'cultura_360']
  const rolesIter = tipoConfig?.rolesPregunta ?? (['A', 'C', 'D', 'B'] as const)
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [vertical, setVertical] = useState('')
  const [contexto, setContexto] = useState('')
  const [generando, setGenerando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [generadas, setGeneradas] = useState<PreguntaEditable[] | null>(null)
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)

  const enReview = generadas !== null
  const cantidadExistentes = preguntas.length

  async function generar() {
    setGenerando(true); setError('')
    try {
      const res = await fetch('/api/generar-preguntas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema: temaNombre, vertical, contexto }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'No se pudieron generar las preguntas')
      }
      const { preguntas: ps } = await res.json() as { preguntas: PreguntaEditable[] }
      setGeneradas(ps)
      setAbierto(false)
    } catch (e: any) {
      setError(e.message || 'Error generando')
    } finally {
      setGenerando(false)
    }
  }

  function intentarGuardar() {
    if (cantidadExistentes > 0) setMostrarConfirmacion(true)
    else guardar()
  }

  async function guardar() {
    if (!generadas) return
    setGuardando(true); setError('')
    try {
      if (cantidadExistentes > 0) {
        const { error: delErr } = await supabase
          .from('preguntas_base')
          .delete()
          .eq('tema_id', temaId)
        if (delErr) throw new Error(delErr.message)
      }
      const { error: insErr } = await supabase
        .from('preguntas_base')
        .insert(generadas.map((p, i) => ({ ...p, orden: i, tema_id: temaId })))
      if (insErr) throw new Error(insErr.message)
      setMostrarConfirmacion(false)
      router.refresh()
    } catch (e: any) {
      setError(e.message || 'No se pudieron guardar las preguntas generadas')
    } finally {
      setGuardando(false)
    }
  }

  function descartar() {
    setGeneradas(null)
    setError('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <Link href="/admin/preguntas-base" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--mute)', textDecoration: 'none', marginBottom: 8 }}>
          <ArrowLeft size={13} strokeWidth={2.5} /> Temas
        </Link>
        <span className="page-header__eyebrow">Tema</span>
        <div className="page-header__rule" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <TemaTitulo temaId={temaId} nombreInicial={temaNombre} />
          {enReview ? (
            <BotonesAccion onDescartar={descartar} onGuardar={intentarGuardar} guardando={guardando} />
          ) : !abierto ? (
            <Button onClick={() => { setAbierto(true); setError('') }}>
              <ClaudeIcon size={14} /> Generar con IA
            </Button>
          ) : null}
        </div>
        {descripcion && <p className="page-header__subtitle">{descripcion}</p>}
      </div>

      {/* Form IA */}
      {abierto && !enReview && (
        <div style={{ border: '1.5px solid var(--ink)', padding: 20, background: '#fff' }}>
          <div className="form-row">
            <Label className="form-label">Vertical / Industria</Label>
            <div>
              <Select value={vertical} onValueChange={(v: string | null) => setVertical(v ?? '')}>
                <SelectTrigger><SelectValue placeholder="Opcional · selecciona un sector" /></SelectTrigger>
                <SelectContent>{VERTICALES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="form-row">
            <Label className="form-label">Contexto del tema</Label>
            <div>
              <Textarea
                value={contexto}
                onChange={e => setContexto(e.target.value)}
                placeholder="Describe las características que quieres para este set de preguntas"
                rows={4}
              />
            </div>
          </div>
          <div className="form-row" style={{ paddingTop: 16 }}>
            <div />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {error && <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--destructive)', margin: 0 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <Button onClick={generar} disabled={generando}>
                  {generando ? 'Generando…' : <><ClaudeIcon size={14} /> Generar preguntas</>}
                </Button>
                <Button variant="outline" onClick={() => setAbierto(false)} disabled={generando}>Cancelar</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor (existente o review) */}
      <div>
        <div style={{ background: 'var(--ink)', padding: '10px 16px', marginBottom: 27, display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: 0, margin: 0, color: '#fff', fontFamily: 'Red Hat Display, sans-serif' }}>Plantilla</h2>
          <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: 0, color: '#fff', fontFamily: 'Red Hat Display, sans-serif' }}>
            {enReview ? generadas!.length : preguntas.length}
          </span>
        </div>

        {enReview ? (
          // Review editor (in-memory)
          <>
            {DIMENSIONES.map((dim, idx) => (
              <div key={dim.id} style={{ marginBottom: 40, borderTop: idx === 0 ? 'none' : '2px solid var(--ink)', paddingTop: 16 }}>
                <p className="page-header__eyebrow" style={{ margin: '0 0 4px' }}>{dim.subtitulo}</p>
                <h3 style={{ fontSize: 20, fontWeight: 900, letterSpacing: 0, margin: '0 0 20px', fontFamily: 'Red Hat Display, sans-serif' }}>{dim.nombre}</h3>
                {rolesIter.map(rol => {
                  const grupo = generadas!.map((p, i) => ({ ...p, idx: i })).filter(p => p.dimension_id === dim.id && p.rol === rol)
                  return (
                    <div key={rol} style={{ marginBottom: 20 }}>
                      <div style={{ background: 'var(--bg-2)', padding: '6px 12px', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className="page-header__eyebrow" style={{ margin: 0, color: 'var(--ink)', fontWeight: 800 }}>{rol} / {ROL_INFO[rol].label}</span>
                        <button
                          onClick={() => setGeneradas(prev => prev ? [...prev, { dimension_id: dim.id, rol, texto: '', orden: prev.length }] : null)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', display: 'flex', padding: '2px 4px' }}
                        >
                          <PlusIcon size={13} strokeWidth={2.5} />
                        </button>
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          {grupo.map((p, i) => (
                            <RevisionRow
                              key={p.idx}
                              num={i + 1}
                              texto={p.texto}
                              onChange={txt => setGeneradas(prev => prev ? prev.map((q, qi) => qi === p.idx ? { ...q, texto: txt } : q) : null)}
                              onDelete={() => setGeneradas(prev => prev ? prev.filter((_, qi) => qi !== p.idx) : null)}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                })}
              </div>
            ))}

            {error && <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--destructive)', margin: '8px 0' }}>{error}</p>}

            <div style={{ marginTop: 16 }}>
              <BotonesAccion onDescartar={descartar} onGuardar={intentarGuardar} guardando={guardando} />
            </div>
          </>
        ) : (
          // Editor existente (DB-direct)
          <>
            {DIMENSIONES.map((dim, idx) => (
              <div key={dim.id} style={{ marginBottom: 40, borderTop: idx === 0 ? 'none' : '2px solid var(--ink)', paddingTop: 16 }}>
                <p className="page-header__eyebrow" style={{ margin: '0 0 4px' }}>{dim.subtitulo}</p>
                <h3 style={{ fontSize: 20, fontWeight: 900, letterSpacing: 0, margin: '0 0 20px', fontFamily: 'Red Hat Display, sans-serif' }}>{dim.nombre}</h3>
                {rolesIter.map(rol => {
                  const grupo = preguntas.filter(p => p.dimension_id === dim.id && p.rol === rol)
                  const maxOrden = grupo.length ? Math.max(...grupo.map(p => p.orden)) : 0
                  return (
                    <GrupoPreguntas
                      key={rol}
                      grupo={grupo}
                      rol={rol}
                      dimensionId={dim.id}
                      maxOrden={maxOrden}
                      tabla="preguntas_base"
                      temaId={temaId}
                    />
                  )
                })}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Confirmación de reemplazo */}
      <Dialog open={mostrarConfirmacion} onOpenChange={open => { if (!open) setMostrarConfirmacion(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reemplazar preguntas</DialogTitle>
            <DialogDescription>
              El tema <strong>{temaNombre}</strong> ya tiene {cantidadExistentes} preguntas. Si continúas, se eliminan y se reemplazan por las {generadas?.length ?? 0} generadas. Los diagnósticos creados antes no se ven afectados (sus preguntas ya son una copia).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarConfirmacion(false)} disabled={guardando}>Cancelar</Button>
            <Button onClick={guardar} disabled={guardando}>
              {guardando ? 'Reemplazando…' : 'Sí, reemplazar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
