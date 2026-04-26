import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import QuestionForm from '@/components/diagnostico/QuestionForm'
import EstadoNoDisponible from '@/components/diagnostico/EstadoNoDisponible'

export default async function QuestionPage({ params }: { params: Promise<{ codigo: string; idx: string }> }) {
  const { codigo, idx } = await params
  const numIdx = parseInt(idx)

  const { data: diag } = await supabase
    .from('diagnosticos')
    .select('id, nombre_compania, estado, color_neon')
    .eq('codigo_participacion', codigo)
    .single()

  if (!diag) notFound()
  if (diag.estado !== 'activo') {
    return <EstadoNoDisponible estado={diag.estado as 'borrador' | 'completado'} nombreCompania={diag.nombre_compania} neon={diag.color_neon || undefined} />
  }

  return (
    <div style={{ ['--neon' as string]: diag.color_neon || '#D8FF00' }}>
      <QuestionForm diagnosticoId={diag.id} codigo={codigo} idx={numIdx} neon={diag.color_neon || '#D8FF00'} />
    </div>
  )
}
