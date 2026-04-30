'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Pencil, Check, X } from 'lucide-react'

const iconBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }

interface Props {
  temaId: string
  nombreInicial: string
}

export default function TemaTitulo({ temaId, nombreInicial }: Props) {
  const router = useRouter()
  const [nombre, setNombre] = useState(nombreInicial)
  const [editando, setEditando] = useState(false)
  const [draft, setDraft] = useState(nombreInicial)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function guardar() {
    const v = draft.trim()
    if (!v || v === nombre) { setEditando(false); return }
    setGuardando(true); setError('')
    const { error: err } = await supabase.from('temas').update({ nombre: v }).eq('id', temaId)
    setGuardando(false)
    if (err) { setError(err.message); return }
    setNombre(v)
    setEditando(false)
    router.refresh()
  }

  function cancelar() {
    setDraft(nombre)
    setEditando(false)
    setError('')
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      {editando ? (
        <>
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') guardar(); if (e.key === 'Escape') cancelar() }}
            disabled={guardando}
            style={{
              fontSize: 48, fontWeight: 900, letterSpacing: '-1.5px',
              lineHeight: 1, fontFamily: "'Red Hat Display', sans-serif",
              border: '1.5px solid var(--ink)', padding: '4px 10px',
              background: '#fff', color: 'var(--ink)', outline: 'none',
              minWidth: 320,
            }}
          />
          <button onClick={guardar} disabled={guardando} style={iconBtn} title="Guardar">
            <Check size={20} strokeWidth={2.5} color="#3D6B4F" />
          </button>
          <button onClick={cancelar} disabled={guardando} style={iconBtn} title="Cancelar">
            <X size={20} strokeWidth={2.5} color="#7A7A7A" />
          </button>
          {error && <span style={{ fontSize: 12, color: 'var(--destructive)', fontWeight: 700 }}>{error}</span>}
        </>
      ) : (
        <>
          <h1 className="page-header__title" style={{ margin: 0 }}>{nombre}</h1>
          <button onClick={() => { setDraft(nombre); setEditando(true) }} style={iconBtn} title="Renombrar tema">
            <Pencil size={18} strokeWidth={2} color="var(--ink)" />
          </button>
        </>
      )}
    </div>
  )
}
