'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import type { Diagnostico, Pregunta } from '@/types'
import { RefreshCw, ArrowRight } from 'lucide-react'

type Props = {
  padre: Diagnostico
}

export default function IniciarRondaButton({ padre }: Props) {
  const router = useRouter()
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function iniciarRonda() {
    setCreando(true)
    setError(null)
    try {
      const nuevaRonda = (padre.ronda ?? 1) + 1

      // 1) Crear el diagnóstico hijo clonando los datos del padre
      const { data: hijo, error: errHijo } = await supabase
        .from('diagnosticos')
        .insert({
          nombre_compania: padre.nombre_compania,
          contacto_nombre: padre.contacto_nombre,
          contacto_cargo: padre.contacto_cargo,
          contacto_email: padre.contacto_email,
          color_neon: padre.color_neon,
          numero_participantes: padre.numero_participantes,
          tipo: padre.tipo,
          estado: 'activo',
          diagnostico_padre_id: padre.id,
          ronda: nuevaRonda,
        })
        .select()
        .single()

      if (errHijo || !hijo) throw new Error(errHijo?.message ?? 'No se pudo crear la nueva ronda')

      // 2) Clonar las preguntas del padre
      const { data: preguntasPadre, error: errPreg } = await supabase
        .from('preguntas')
        .select('dimension_id, rol, texto, orden')
        .eq('diagnostico_id', padre.id)
        .order('orden')

      if (errPreg) throw new Error(errPreg.message)

      if (preguntasPadre && preguntasPadre.length > 0) {
        const payload = preguntasPadre.map((p: Omit<Pregunta, 'id' | 'diagnostico_id'>) => ({
          ...p, diagnostico_id: hijo.id,
        }))
        const { error: errIns } = await supabase.from('preguntas').insert(payload)
        if (errIns) throw new Error(errIns.message)
      }

      // 3) Llevar al admin del nuevo diagnóstico
      router.push(`/admin/${hijo.id}`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
      setCreando(false)
    }
  }

  const nuevaRondaLabel = (padre.ronda ?? 1) + 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
      <Button onClick={iniciarRonda} disabled={creando}>
        {creando
          ? <><RefreshCw size={14} strokeWidth={2.5} className="spinning" /> Creando…</>
          : <>Iniciar Ronda {nuevaRondaLabel} <ArrowRight size={14} strokeWidth={2.5} /></>}
      </Button>
      {error && <span style={{ fontSize: 11, color: 'var(--destructive)', fontWeight: 600 }}>{error}</span>}
    </div>
  )
}
