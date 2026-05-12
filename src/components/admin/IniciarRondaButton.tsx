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

      // 1) Crear la compañía hijo clonando los datos de contacto del padre
      const { data: hijo, error: errHijo } = await supabase
        .from('diagnosticos')
        .insert({
          nombre_compania: padre.nombre_compania,
          contacto_nombre: padre.contacto_nombre,
          contacto_cargo: padre.contacto_cargo,
          contacto_email: padre.contacto_email,
          tipo: padre.tipo,
          diagnostico_padre_id: padre.id,
          ronda: nuevaRonda,
        })
        .select()
        .single()

      if (errHijo || !hijo) throw new Error(errHijo?.message ?? 'No se pudo crear la nueva ronda')

      // 2) Clonar las preguntas del padre (compartidas a nivel compañía)
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

      // 3) Clonar los equipos del padre: mismo nombre/color/número, códigos nuevos.
      const { data: equiposPadre, error: errEq } = await supabase
        .from('equipos')
        .select('nombre, color_neon, numero_participantes')
        .eq('diagnostico_id', padre.id)
        .order('created_at')

      if (errEq) throw new Error(errEq.message)

      if (equiposPadre && equiposPadre.length > 0) {
        const { error: errInsEq } = await supabase.from('equipos').insert(
          equiposPadre.map(eq => ({ ...eq, diagnostico_id: hijo.id, estado: 'activo' }))
        )
        if (errInsEq) throw new Error(errInsEq.message)
      }

      // 4) Llevar al admin de la nueva compañía
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
