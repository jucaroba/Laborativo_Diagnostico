import { supabase } from '@/lib/supabase'
import { Tema } from '@/types'
import ListaTemas from '@/components/admin/ListaTemas'

export const revalidate = 0

interface PreguntaBaseRef { tema_id: string }

export default async function PreguntasBasePage() {
  const [{ data: temas }, { data: preguntas }] = await Promise.all([
    supabase.from('temas').select('*').order('created_at'),
    supabase.from('preguntas_base').select('tema_id'),
  ])

  const conteos = new Map<string, number>()
  for (const p of (preguntas ?? []) as PreguntaBaseRef[]) {
    conteos.set(p.tema_id, (conteos.get(p.tema_id) ?? 0) + 1)
  }

  const items = ((temas ?? []) as Tema[]).map(t => ({
    ...t,
    total_preguntas: conteos.get(t.id) ?? 0,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <span className="page-header__eyebrow">Configuración</span>
        <div className="page-header__rule" />
        <h1 className="page-header__title">Preguntas base</h1>
        <p className="page-header__subtitle">
          Plantillas organizadas por tema. Cada tema contiene 4 dimensiones × 4 roles. Al crear un diagnóstico eliges qué tema usar y se copian sus preguntas.
        </p>
      </div>

      <ListaTemas temas={items} />
    </div>
  )
}
