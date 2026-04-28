'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Pregunta, Rol, ROL_INFO } from '@/types'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react'

type PreguntaItem = Omit<Pregunta, 'diagnostico_id'> & { diagnostico_id?: string }

interface Props {
  grupo: PreguntaItem[]
  rol: Rol
  dimensionId: number
  maxOrden: number
  tabla?: 'preguntas' | 'preguntas_base'
  diagnosticoId?: string
  neonColor?: string
}

export default function GrupoPreguntas({ grupo, rol, diagnosticoId, dimensionId, maxOrden, tabla = 'preguntas', neonColor = '#D8FF00' }: Props) {
  const router = useRouter()
  const [preguntas, setPreguntas] = useState<PreguntaItem[]>(grupo)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [textoEdit, setTextoEdit] = useState('')
  const [agregando, setAgregando] = useState(false)
  const [textoNuevo, setTextoNuevo] = useState('')
  const [nextOrden, setNextOrden] = useState(maxOrden)

  async function guardarEdit(id: string) {
    if (!textoEdit.trim()) return
    const texto = textoEdit.trim()
    const { error } = await supabase.from(tabla).update({ texto }).eq('id', id)
    if (error) { alert(`No se pudo guardar la pregunta: ${error.message}`); return }
    setPreguntas(prev => prev.map(p => p.id === id ? { ...p, texto } : p))
    setEditandoId(null)
  }

  async function eliminar(id: string) {
    const { error } = await supabase.from(tabla).delete().eq('id', id)
    if (error) { alert(`No se pudo eliminar la pregunta: ${error.message}`); return }
    setPreguntas(prev => prev.filter(p => p.id !== id))
  }

  async function agregar() {
    if (!textoNuevo.trim()) return
    const orden = nextOrden + 1
    const payload: Record<string, unknown> = {
      dimension_id: dimensionId,
      rol,
      texto: textoNuevo.trim(),
      orden,
    }
    if (tabla === 'preguntas') payload.diagnostico_id = diagnosticoId
    const { data, error } = await supabase.from(tabla).insert(payload).select().single()
    if (error) { alert(`No se pudo agregar la pregunta: ${error.message}`); return }
    if (data) {
      setPreguntas(prev => [...prev, data as PreguntaItem])
      setNextOrden(orden)
    }
    setTextoNuevo('')
    setAgregando(false)
    router.refresh()
  }

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Band header */}
      <div style={{ background: 'var(--bg-2)', padding: '6px 12px', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="page-header__eyebrow" style={{ margin: 0, color: 'var(--ink)', fontWeight: 800 }}>
          {rol} / {ROL_INFO[rol].label}
        </span>
        <button
          onClick={() => { setAgregando(true); setTextoNuevo('') }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '2px 4px', color: neonColor }}
        >
          <Plus size={13} strokeWidth={2.5} />
        </button>
      </div>

      {/* Tabla de preguntas */}
      <Table>
        <TableBody>
          {preguntas.map((p, i) => (
            <TableRow key={p.id}>
              <TableCell className="text-mute" style={{ width: 32, fontWeight: 700, fontSize: 12 }}>{i + 1}</TableCell>
              <TableCell style={{ fontSize: 13, fontWeight: 500 }}>
                {editandoId === p.id ? (
                  <input
                    autoFocus
                    value={textoEdit}
                    onChange={e => setTextoEdit(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') guardarEdit(p.id); if (e.key === 'Escape') setEditandoId(null) }}
                    style={{ width: '100%', fontSize: 13, fontWeight: 500, border: '1.5px solid var(--ink)', padding: '4px 8px', background: '#fff', outline: 'none', fontFamily: 'inherit' }}
                  />
                ) : p.texto}
              </TableCell>
              <TableCell style={{ width: 64, textAlign: 'right' }}>
                {editandoId === p.id ? (
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button onClick={() => guardarEdit(p.id)} style={iconBtn}><Check size={13} strokeWidth={2.5} color="#3D6B4F" /></button>
                    <button onClick={() => setEditandoId(null)} style={iconBtn}><X size={13} strokeWidth={2.5} color="#7A7A7A" /></button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', opacity: 0 }} className="row-actions">
                    <button onClick={() => { setEditandoId(p.id); setTextoEdit(p.texto) }} style={iconBtn}><Pencil size={13} strokeWidth={2} color="#7A7A7A" /></button>
                    <button onClick={() => eliminar(p.id)} style={iconBtn}><Trash2 size={13} strokeWidth={2} color="#FF3366" /></button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}

          {/* Fila para agregar */}
          {agregando && (
            <TableRow>
              <TableCell className="text-mute" style={{ width: 32, fontWeight: 700, fontSize: 12 }}>{preguntas.length + 1}</TableCell>
              <TableCell>
                <input
                  autoFocus
                  value={textoNuevo}
                  onChange={e => setTextoNuevo(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') agregar(); if (e.key === 'Escape') setAgregando(false) }}
                  placeholder="Escribir pregunta…"
                  style={{ width: '100%', fontSize: 13, fontWeight: 500, border: '1.5px solid var(--ink)', padding: '4px 8px', background: '#fff', outline: 'none', fontFamily: 'inherit' }}
                />
              </TableCell>
              <TableCell style={{ width: 64, textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button onClick={agregar} style={iconBtn}><Check size={13} strokeWidth={2.5} color="#3D6B4F" /></button>
                  <button onClick={() => setAgregando(false)} style={iconBtn}><X size={13} strokeWidth={2.5} color="#7A7A7A" /></button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

const iconBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex',
}
