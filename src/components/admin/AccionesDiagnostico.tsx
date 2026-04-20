'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Diagnostico } from '@/types'
import { Button } from '@/components/ui/button'

const ESTADO_SIGUIENTE: Record<string, string> = { borrador: 'activo', activo: 'completado' }
const ESTADO_BTN: Record<string, string> = { borrador: 'Activar y enviar link', activo: 'Marcar completado' }

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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
      <Button onClick={avanzarEstado} disabled={loading}>
        {loading ? 'Procesando…' : ESTADO_BTN[diagnostico.estado]}
      </Button>
      {error && <p style={{ fontSize: 11, fontWeight: 700, color: '#FF3366', margin: 0 }}>{error}</p>}
    </div>
  )
}
