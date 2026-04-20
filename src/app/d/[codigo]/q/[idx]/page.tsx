import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import QuestionForm from '@/components/diagnostico/QuestionForm'

export default async function QuestionPage({ params }: { params: Promise<{ codigo: string; idx: string }> }) {
  const { codigo, idx } = await params
  const numIdx = parseInt(idx)

  const { data: diag } = await supabase
    .from('diagnosticos')
    .select('id, nombre_compania, estado, color_neon')
    .eq('codigo_participacion', codigo)
    .single()

  if (!diag || diag.estado !== 'activo') notFound()

  return (
    <div style={{ ['--neon' as string]: diag.color_neon || '#D8FF00' }}>
      <QuestionForm diagnosticoId={diag.id} codigo={codigo} idx={numIdx} neon={diag.color_neon || '#D8FF00'} />
    </div>
  )
}
