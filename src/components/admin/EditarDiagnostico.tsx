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
  // El número de participantes vive a nivel equipo, no compañía.
  const [form, setForm] = useState({
    nombre_compania: diagnostico.nombre_compania,
    contacto_nombre: diagnostico.contacto_nombre,
    contacto_cargo: diagnostico.contacto_cargo,
    contacto_email: diagnostico.contacto_email,
  })
  const [benchmark, setBenchmark] = useState(diagnostico.benchmark_habilitado ?? false)

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function guardar() {
    setLoading(true)
    await supabase.from('diagnosticos').update({
      ...form,
      benchmark_habilitado: benchmark,
    }).eq('id', diagnostico.id)
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
      <button
        type="button"
        title="Editar diagnóstico"
        onClick={() => setOpen(true)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', color: 'var(--ink)' }}
      >
        <Pencil size={18} strokeWidth={2} />
      </button>
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

            {/* Toggle Benchmark */}
            <label style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '12px 14px', border: '1.5px solid var(--ink)',
              cursor: 'pointer', marginTop: 4,
            }}>
              <input
                type="checkbox"
                checked={benchmark}
                onChange={e => setBenchmark(e.target.checked)}
                style={{ marginTop: 3, accentColor: 'var(--ink)' }}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-.01em', color: 'var(--ink)' }}>
                  Mostrar Benchmark Laborativo
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 500, marginTop: 2 }}>
                  En el dashboard se compara cada dimensión contra el promedio histórico de todos los demás diagnósticos del mismo tipo.
                </div>
              </div>
            </label>
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
