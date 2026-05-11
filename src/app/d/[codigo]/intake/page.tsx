import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import IntakeForm from '@/components/diagnostico/IntakeForm'
import EstadoNoDisponible from '@/components/diagnostico/EstadoNoDisponible'
import type { TipoDiagnostico } from '@/types'

export default async function IntakePage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params

  const { data: diag } = await supabase
    .from('diagnosticos')
    .select('id, nombre_compania, estado, color_neon, tipo')
    .eq('codigo_participacion', codigo)
    .single()

  if (!diag) notFound()
  if (diag.estado !== 'activo') {
    return <EstadoNoDisponible estado={diag.estado as 'borrador' | 'completado'} nombreCompania={diag.nombre_compania} neon={diag.color_neon || undefined} />
  }

  const { data: preguntas } = await supabase
    .from('preguntas')
    .select('rol')
    .eq('diagnostico_id', diag.id)

  const conteo: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, X: 0, YO: 0, EQUIPO: 0 }
  for (const p of preguntas ?? []) conteo[p.rol] = (conteo[p.rol] ?? 0) + 1

  return (
    <IntakeForm
      diagnosticoId={diag.id}
      nombreCompania={diag.nombre_compania}
      codigo={codigo}
      tipo={(diag.tipo ?? 'cultura_360') as TipoDiagnostico}
      preguntasEquipo={conteo.A + conteo.C}
      preguntasLider={conteo.D + conteo.B}
      preguntasColectivo={conteo.X}
    />
  )
}
