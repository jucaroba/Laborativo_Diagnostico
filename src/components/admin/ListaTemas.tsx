'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Tema } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pencil, Trash2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'

interface TemaRow extends Tema {
  total_preguntas: number
}

interface Props {
  temas: TemaRow[]
}

const iconBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }

export default function ListaTemas({ temas }: Props) {
  const router = useRouter()
  const [items, setItems] = useState<TemaRow[]>(temas)
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [error, setError] = useState('')
  const [confirmarEliminar, setConfirmarEliminar] = useState<TemaRow | null>(null)
  const [eliminando, setEliminando] = useState(false)

  async function crear() {
    const nombre = nombreNuevo.trim()
    if (!nombre) return
    setError('')
    const { data, error: err } = await supabase
      .from('temas')
      .insert({ nombre })
      .select()
      .single()
    if (err || !data) {
      setError(err?.message ?? 'No se pudo crear el tema')
      return
    }
    setItems(prev => [...prev, { ...(data as Tema), total_preguntas: 0 }])
    setNombreNuevo('')
    router.refresh()
  }

  async function eliminar() {
    if (!confirmarEliminar) return
    setEliminando(true)
    const { error: err } = await supabase.from('temas').delete().eq('id', confirmarEliminar.id)
    if (err) {
      alert(`No se pudo eliminar: ${err.message}`)
      setEliminando(false)
      return
    }
    setItems(prev => prev.filter(t => t.id !== confirmarEliminar.id))
    setConfirmarEliminar(null)
    setEliminando(false)
    router.refresh()
  }

  return (
    <div>
      <div style={{ background: 'var(--ink)', padding: '10px 16px', marginBottom: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: 0, margin: 0, color: '#fff', fontFamily: 'Red Hat Display, sans-serif' }}>
          Creación de tema
        </h2>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 32 }}>
        <Input
          value={nombreNuevo}
          onChange={e => setNombreNuevo(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') crear() }}
          placeholder="Nombre del tema"
          style={{ flex: 1, height: 36 }}
        />
        <Button onClick={crear}>Crear</Button>
      </div>

      {error && <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--destructive)', margin: '0 0 12px' }}>{error}</p>}

      {!items.length ? (
        <p className="text-mute" style={{ fontSize: 14 }}>Aún no hay temas. Crea el primero para empezar.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow style={{ background: '#0A0A0A', borderBottom: 'none' }}>
              {['Tema', 'Preguntas', 'Creado', ''].map(h => (
                <TableHead key={h} style={{ color: '#fff', fontWeight: 700, fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', background: 'transparent', height: 44, padding: '0 16px' }}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(t => (
              <TableRow key={t.id}>
                <TableCell style={{ fontWeight: 600, fontSize: 14 }}>
                  <Link href={`/admin/preguntas-base/${t.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    {t.nombre}
                  </Link>
                </TableCell>
                <TableCell style={{ color: 'var(--ink)' }}>{t.total_preguntas}</TableCell>
                <TableCell style={{ color: 'var(--ink)' }}>
                  {new Date(t.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                </TableCell>
                <TableCell style={{ width: 100, textAlign: 'right' }}>
                  <div className="row-actions" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <Link href={`/admin/preguntas-base/${t.id}`} style={{ ...iconBtn, color: 'var(--ink)' }} title="Editar tema">
                      <Pencil size={14} strokeWidth={2} />
                    </Link>
                    <button onClick={() => setConfirmarEliminar(t)} style={iconBtn} title="Eliminar">
                      <Trash2 size={14} strokeWidth={2} color="#FF3366" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!confirmarEliminar} onOpenChange={open => { if (!open) setConfirmarEliminar(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar tema</DialogTitle>
            <DialogDescription>
              {confirmarEliminar
                ? <>Vas a eliminar el tema <strong>{confirmarEliminar.nombre}</strong> y sus {confirmarEliminar.total_preguntas} preguntas. Los diagnósticos creados antes no se ven afectados (sus preguntas ya son una copia).</>
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmarEliminar(null)} disabled={eliminando}>Cancelar</Button>
            <Button onClick={eliminar} disabled={eliminando}>{eliminando ? 'Eliminando…' : 'Sí, eliminar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
