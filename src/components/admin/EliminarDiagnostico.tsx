'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function EliminarDiagnostico({ id }: { id: string }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function eliminar() {
    setLoading(true)
    await supabase.from('diagnosticos').delete().eq('id', id)
    router.push('/admin')
    router.refresh()
  }

  if (!confirm) {
    return (
      <button onClick={() => setConfirm(true)}
        className="font-black text-sm px-4 py-3 uppercase tracking-wide border-2 border-black hover:bg-black hover:text-white transition-colors">
        Eliminar
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#FF3366' }}>¿Eliminar definitivamente?</span>
      <button onClick={eliminar} disabled={loading}
        style={{ background: '#FF3366', color: '#fff', border: '2px solid #FF3366', padding: '8px 16px', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.05em', opacity: loading ? .5 : 1 }}>
        {loading ? 'Eliminando…' : 'Sí, eliminar'}
      </button>
      <button onClick={() => setConfirm(false)}
        style={{ background: 'transparent', border: '2px solid #000', padding: '8px 16px', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.05em' }}>
        Cancelar
      </button>
    </div>
  )
}
