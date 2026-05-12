import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import QuestionForm from '@/components/diagnostico/QuestionForm'
import EstadoNoDisponible from '@/components/diagnostico/EstadoNoDisponible'
import type { TipoDiagnostico } from '@/types'

export default async function QuestionPage({ params }: { params: Promise<{ codigo: string; idx: string }> }) {
  const { codigo, idx } = await params
  const numIdx = parseInt(idx)

  // Resolución por equipo: el código identifica a UN equipo dentro de una compañía.
  const { data: equipo } = await supabase
    .from('equipos')
    .select('id, diagnostico_id, estado, color_neon')
    .eq('codigo_participacion', codigo)
    .single()

  if (!equipo) notFound()

  const { data: diag } = await supabase
    .from('diagnosticos')
    .select('id, nombre_compania, tipo')
    .eq('id', equipo.diagnostico_id)
    .single()

  if (!diag) notFound()
  if (equipo.estado !== 'activo') {
    return <EstadoNoDisponible estado={equipo.estado as 'borrador' | 'completado'} nombreCompania={diag.nombre_compania} neon={equipo.color_neon || undefined} />
  }

  return <QuestionForm diagnosticoId={diag.id} codigo={codigo} idx={numIdx} tipo={(diag.tipo ?? 'cultura_360') as TipoDiagnostico} />
}
