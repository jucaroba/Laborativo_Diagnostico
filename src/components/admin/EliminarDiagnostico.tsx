'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'

export default function EliminarDiagnostico({ id, neonColor }: { id: string; neonColor?: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function eliminar() {
    setLoading(true)
    await supabase.from('diagnosticos').delete().eq('id', id)
    router.push('/admin')
    router.refresh()
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>Eliminar</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar diagnóstico</DialogTitle>
            <DialogDescription>
              Esta acción es permanente. Se eliminarán también todas las preguntas, participantes y respuestas asociadas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancelar</Button>
            <Button onClick={eliminar} disabled={loading} style={{ background: neonColor ?? '#D8FF00', color: '#0A0A0A', border: `1px solid ${neonColor ?? '#D8FF00'}` }}>
              {loading ? 'Eliminando…' : 'Sí, eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
