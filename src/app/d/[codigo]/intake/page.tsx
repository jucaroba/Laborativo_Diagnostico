import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import IntakeForm from '@/components/diagnostico/IntakeForm'

export default async function IntakePage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params

  const { data: diag } = await supabase
    .from('diagnosticos')
    .select('id, nombre_compania, estado, color_neon')
    .eq('codigo_participacion', codigo)
    .single()

  if (!diag || diag.estado !== 'activo') notFound()

  return (
    <div style={{ ['--neon' as string]: diag.color_neon || '#D8FF00' }}>
      <IntakeForm diagnosticoId={diag.id} nombreCompania={diag.nombre_compania} codigo={codigo} />
    </div>
  )
}
