'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Diagnostico } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Pencil } from 'lucide-react'

export default function EditarDiagnostico({ diagnostico }: { diagnostico: Diagnostico }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nombre_compania: diagnostico.nombre_compania,
    contacto_nombre: diagnostico.contacto_nombre,
    contacto_cargo: diagnostico.contacto_cargo,
    contacto_email: diagnostico.contacto_email,
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function guardar() {
    setLoading(true)
    await supabase.from('diagnosticos').update(form).eq('id', diagnostico.id)
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '1.5px solid var(--ink)', padding: '8px 12px',
    fontSize: 14, fontFamily: 'Red Hat Display, sans-serif', fontWeight: 500,
    background: 'var(--bg)', color: 'var(--ink)', outline: 'none',
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Pencil size={14} strokeWidth={2.5} /> Editar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar diagnóstico</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8 }}>
            {[
              { label: 'Empresa', field: 'nombre_compania' },
              { label: 'Nombre contacto', field: 'contacto_nombre' },
              { label: 'Cargo', field: 'contacto_cargo' },
              { label: 'Email', field: 'contacto_email' },
            ].map(({ label, field }) => (
              <div key={field}>
                <p className="page-header__eyebrow" style={{ margin: '0 0 4px' }}>{label}</p>
                <input
                  style={inputStyle}
                  value={form[field as keyof typeof form]}
                  onChange={e => set(field, e.target.value)}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancelar</Button>
            <Button onClick={guardar} disabled={loading}>
              {loading ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
