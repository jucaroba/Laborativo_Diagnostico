import { supabase } from '@/lib/supabase'
import { DIMENSIONES, Rol } from '@/types'
import GrupoPreguntas from '@/components/admin/GrupoPreguntas'

export const revalidate = 0

interface PreguntaBase {
  id: string
  dimension_id: number
  rol: Rol
  texto: string
  orden: number
}

export default async function PreguntasBasePage() {
  const { data: preguntas } = await supabase
    .from('preguntas_base')
    .select('*')
    .order('orden')

  const ps = (preguntas ?? []) as PreguntaBase[]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <span className="page-header__eyebrow">Configuración</span>
        <div className="page-header__rule" />
        <h1 className="page-header__title">Preguntas base</h1>
        <p className="page-header__subtitle">
          Plantilla global de preguntas. Las ediciones aquí solo afectan a los diagnósticos creados a partir de este momento.
        </p>
      </div>

      <div>
        <div style={{ background: 'var(--ink)', padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '0', margin: 0, color: '#fff', fontFamily: 'Red Hat Display, sans-serif' }}>Plantilla</h2>
          <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: '0', color: 'var(--neon)', fontFamily: 'Red Hat Display, sans-serif' }}>{ps.length}</span>
        </div>

        {DIMENSIONES.map((dim, idx) => (
          <div key={dim.id} style={{ marginBottom: 40, borderTop: idx === 0 ? 'none' : '2px solid var(--ink)', paddingTop: 16 }}>
            <p className="page-header__eyebrow" style={{ margin: '0 0 4px' }}>{dim.subtitulo}</p>
            <h3 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '0', margin: '0 0 20px', fontFamily: 'Red Hat Display, sans-serif' }}>{dim.nombre}</h3>
            {(['A', 'C', 'D', 'B'] as Rol[]).map(rol => {
              const grupo = ps.filter(p => p.dimension_id === dim.id && p.rol === rol)
              const maxOrden = grupo.length ? Math.max(...grupo.map(p => p.orden)) : 0
              return (
                <GrupoPreguntas
                  key={rol}
                  grupo={grupo}
                  rol={rol}
                  dimensionId={dim.id}
                  maxOrden={maxOrden}
                  tabla="preguntas_base"
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
