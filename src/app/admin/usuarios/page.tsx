'use client'

import { useEffect, useState } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Usuario = { id: string; email: string | null; created_at: string }

const fechaCorta = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso))
  } catch { return '' }
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [creando, setCreando] = useState(false)

  const [editId, setEditId] = useState<string | null>(null)
  const [editEmail, setEditEmail] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { void cargar() }, [])

  async function cargar() {
    setCargando(true)
    try {
      const res = await fetch('/api/admin/usuarios', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al cargar')
      setUsuarios(json.users || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setCargando(false)
    }
  }

  async function crear(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setCreando(true)
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al crear')
      setUsuarios(prev => [json.user, ...prev])
      setEmail(''); setPassword('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setCreando(false)
    }
  }

  async function eliminar(id: string, emailLabel: string | null) {
    if (!confirm(`¿Eliminar ${emailLabel || 'este usuario'}? Esta acción no se puede deshacer.`)) return
    try {
      const res = await fetch(`/api/admin/usuarios/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'No se pudo eliminar')
      }
      setUsuarios(prev => prev.filter(u => u.id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error desconocido')
    }
  }

  function abrirEdicion(u: Usuario) {
    setEditId(u.id)
    setEditEmail(u.email || '')
    setEditPassword('')
  }

  function cerrarEdicion() {
    setEditId(null)
    setEditEmail('')
    setEditPassword('')
  }

  async function guardarEdicion(id: string) {
    setGuardando(true)
    try {
      const updates: Record<string, string> = {}
      const original = usuarios.find(u => u.id === id)
      if (editEmail.trim() && editEmail.trim() !== original?.email) updates.email = editEmail.trim()
      if (editPassword.trim()) updates.password = editPassword.trim()
      if (Object.keys(updates).length === 0) { cerrarEdicion(); return }

      const res = await fetch(`/api/admin/usuarios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'No se pudo actualizar')
      setUsuarios(prev => prev.map(u => u.id === id ? json.user : u))
      cerrarEdicion()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      <div className="page-header" style={{ marginBottom: 0 }}>
        <span className="page-header__eyebrow">Configuración</span>
        <div className="page-header__rule" />
        <h1 className="page-header__title">Usuarios</h1>
        <p className="page-header__subtitle">
          Gestiona los usuarios que pueden acceder a la plataforma.
        </p>
      </div>

      {/* Formulario crear */}
      <form onSubmit={crear} style={{
        border: '1.5px solid var(--ink)',
        padding: 20,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr auto',
        gap: 16,
        alignItems: 'end',
        background: 'var(--card)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Label className="form-label" htmlFor="nuevo-email">Correo</Label>
          <Input id="nuevo-email" type="email" required placeholder="correo@laborativo.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Label className="form-label" htmlFor="nuevo-password">Contraseña</Label>
          <Input id="nuevo-password" type="password" required minLength={6} placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="btn primary" disabled={creando}>
          {creando ? 'Creando…' : '+ Crear usuario'}
        </Button>
      </form>

      {error && (
        <div style={{
          padding: '10px 14px',
          border: '1.5px solid #FF3366',
          color: '#FF3366',
          fontSize: 13,
          fontWeight: 600,
          background: '#FFE5EC',
        }}>
          {error}
        </div>
      )}

      {/* Listado */}
      <div style={{ border: '1.5px solid var(--ink)' }}>
        <div style={{ background: 'var(--ink)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '0', margin: 0, color: '#fff', fontFamily: 'Red Hat Display, sans-serif' }}>Usuarios</h2>
          <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: '0', color: 'var(--neon)', fontFamily: 'Red Hat Display, sans-serif' }}>
            {usuarios.length}
          </span>
        </div>

        {cargando ? (
          <div style={{ padding: 24, fontSize: 13, color: 'var(--mute)' }}>Cargando…</div>
        ) : usuarios.length === 0 ? (
          <div style={{ padding: 24, fontSize: 13, color: 'var(--mute)' }}>Aún no hay usuarios.</div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {usuarios.map((u, i) => {
              const editando = editId === u.id
              return (
                <li key={u.id} style={{
                  borderTop: i === 0 ? 'none' : '1px solid var(--line-soft)',
                  padding: '14px 16px',
                  display: 'grid',
                  gridTemplateColumns: editando ? '1fr 1fr auto' : '1fr auto',
                  gap: 16,
                  alignItems: 'center',
                }}>
                  {editando ? (
                    <>
                      <Input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="Correo" />
                      <Input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="Nueva contraseña (opcional)" />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => guardarEdicion(u.id)} disabled={guardando} style={iconBtn} aria-label="Guardar">
                          <Check size={15} strokeWidth={2.5} color="#3D6B4F" />
                        </button>
                        <button onClick={cerrarEdicion} style={iconBtn} aria-label="Cancelar">
                          <X size={15} strokeWidth={2.5} color="#7A7A7A" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.email || <span style={{ color: 'var(--mute)' }}>(sin email)</span>}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--mute)', fontWeight: 500, marginTop: 2 }}>
                          Creado el {fechaCorta(u.created_at)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => abrirEdicion(u)} style={iconBtn} aria-label="Editar">
                          <Pencil size={15} strokeWidth={2} color="#7A7A7A" />
                        </button>
                        <button onClick={() => eliminar(u.id, u.email)} style={iconBtn} aria-label="Eliminar">
                          <Trash2 size={15} strokeWidth={2} color="#FF3366" />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

const iconBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 4,
  display: 'flex',
}
