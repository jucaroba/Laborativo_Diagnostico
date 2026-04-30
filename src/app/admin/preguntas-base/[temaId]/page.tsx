import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Rol, Tema } from '@/types'
import EditorTema from '@/components/admin/EditorTema'

export const revalidate = 0

interface PreguntaBase {
  id: string
  dimension_id: number
  rol: Rol
  texto: string
  orden: number
}

export default async function PreguntasBaseTemaPage({ params }: { params: Promise<{ temaId: string }> }) {
  const { temaId } = await params

  const { data: tema } = await supabase
    .from('temas')
    .select('*')
    .eq('id', temaId)
    .maybeSingle()

  if (!tema) notFound()
  const t = tema as Tema

  const { data: preguntas } = await supabase
    .from('preguntas_base')
    .select('*')
    .eq('tema_id', temaId)
    .order('orden')

  const ps = (preguntas ?? []) as PreguntaBase[]

  return (
    <EditorTema
      temaId={temaId}
      temaNombre={t.nombre}
      descripcion={t.descripcion}
      preguntas={ps}
    />
  )
}
