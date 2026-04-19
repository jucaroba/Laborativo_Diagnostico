'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Diagnostico } from '@/types'

const ESTADO_SIGUIENTE: Record<string, string> = { borrador: 'activo', activo: 'completado' }
const ESTADO_BTN: Record<string, string> = { borrador: 'ACTIVAR Y ENVIAR LINK', activo: 'MARCAR COMPLETADO' }

export default function AccionesDiagnostico({ diagnostico }: { diagnostico: Diagnostico }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const siguiente = ESTADO_SIGUIENTE[diagnostico.estado]
  if (!siguiente) return null

  async function avanzarEstado() {
    setLoading(true)
    setError('')
    try {
      await supabase.from('diagnosticos').update({ estado: siguiente }).eq('id', diagnostico.id)
      await fetch('/api/enviar-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnosticoId: diagnostico.id, tipo: siguiente }),
      })
      router.refresh()
    } catch {
      setError('Error al actualizar estado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button onClick={avanzarEstado} disabled={loading}
        className="font-black text-sm px-6 py-3 transition-opacity hover:opacity-70 disabled:opacity-30 border-2 border-black uppercase tracking-wide"
        style={{ background: 'var(--black)', color: 'var(--bg)' }}>
        {loading ? 'PROCESANDO…' : ESTADO_BTN[diagnostico.estado]}
      </button>
      {error && <p className="text-xs font-bold" style={{ color: '#FF3366' }}>{error}</p>}
    </div>
  )
}
