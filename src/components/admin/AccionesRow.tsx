'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Pencil, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const iconBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }

export default function AccionesRow({ id }: { id: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function eliminar() {
    setLoading(true)
    await supabase.from('diagnosticos').delete().eq('id', id)
    setOpen(false)
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
      <button style={{ ...iconBtn, color: 'var(--ink)' }} title="Editar diagnóstico" onClick={() => router.push(`/admin/${id}`)}>
        <Pencil size={14} strokeWidth={2} />
      </button>
      <button style={iconBtn} title="Eliminar" onClick={() => setOpen(true)}>
        <Trash2 size={14} strokeWidth={2} color="#FF3366" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar diagnóstico</DialogTitle>
            <DialogDescription>
              Esta acción es permanente. Se eliminarán también las preguntas, participantes y respuestas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancelar</Button>
            <Button variant="destructive" onClick={eliminar} disabled={loading}>
              {loading ? 'Eliminando…' : 'Sí, eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
