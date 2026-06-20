'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

// Activa el diagnóstico: pasa de configuración a la etapa de envío, donde
// aparece la sección de equipos / cargar participantes.
export default function ActivarDiagnostico({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function activar() {
    setLoading(true)
    const { error } = await createSupabaseBrowser()
      .from('diagnosticos')
      .update({ activado: true })
      .eq('id', id)
    if (error) {
      alert(`No se pudo activar el diagnóstico: ${error.message}`)
      setLoading(false)
      return
    }
    router.refresh()
  }

  return (
    <Button onClick={activar} disabled={loading}>
      {loading ? 'Activando…' : <>Activar diagnóstico <ArrowRight size={14} strokeWidth={2.5} /></>}
    </Button>
  )
}
