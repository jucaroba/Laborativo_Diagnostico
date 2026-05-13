import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { Diagnostico, Equipo, Pregunta, DIMENSIONES, Rol } from '@/types'
import { TIPOS_DIAGNOSTICO } from '@/lib/tipos-diagnostico'
import EliminarDiagnostico from '@/components/admin/EliminarDiagnostico'
import EditarDiagnostico from '@/components/admin/EditarDiagnostico'
import EquiposSection from '@/components/admin/EquiposSection'
import GrupoPreguntas from '@/components/admin/GrupoPreguntas'
import IniciarRondaButton from '@/components/admin/IniciarRondaButton'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const revalidate = 0

export default async function DiagnosticoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: diag } = await supabase.from('diagnosticos').select('*').eq('id', id).single()
  if (!diag) notFound()

  const { data: preguntas } = await supabase
    .from('preguntas').select('*').eq('diagnostico_id', id).order('orden')

  const { data: equipos } = await supabase
    .from('equipos').select('*').eq('diagnostico_id', id).order('created_at')

  const d = diag as Diagnostico
  const eqs = (equipos ?? []) as Equipo[]
  const ps = (preguntas ?? []) as Pregunta[]
  const tipoConfig = TIPOS_DIAGNOSTICO[d.tipo ?? 'cultura_360']
  const rolesIter = tipoConfig?.rolesPregunta ?? (['A', 'C', 'D', 'B'] as const)

  // Padre (si esta es una ronda 2+) — para el badge "Ronda N · ← ver ronda anterior"
  const { data: padreData } = d.diagnostico_padre_id
    ? await supabase
        .from('diagnosticos')
        .select('id, nombre_compania, ronda')
        .eq('id', d.diagnostico_padre_id)
        .maybeSingle()
    : { data: null }

  const ronda = d.ronda ?? 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          {ronda > 1 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              {padreData && (
                <Link
                  href={`/admin/${padreData.id}`}
                  style={{
                    fontSize: 11, color: 'var(--ink)', fontWeight: 600, letterSpacing: '.04em',
                    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <ArrowLeft size={12} strokeWidth={2.5} /> Ronda {padreData.ronda ?? 1}
                </Link>
              )}
              <span style={{
                fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 700,
                background: 'var(--ink)', color: '#fff', padding: '3px 8px',
              }}>Ronda {ronda}</span>
            </div>
          )}
          <h1 className="page-header__title" style={{ fontSize: 32, letterSpacing: '0px' }}>{d.nombre_compania}</h1>
          <p className="page-header__subtitle">{d.contacto_nombre} / {d.contacto_cargo} / {d.contacto_email}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <EditarDiagnostico diagnostico={d} />
          <EliminarDiagnostico id={d.id} />
          <IniciarRondaButton padre={d} />
        </div>
      </div>

      {/* Equipos */}
      <EquiposSection
        diagnosticoId={d.id}
        tipo={d.tipo ?? 'cultura_360'}
        codigoResultadosComparativo={d.codigo_resultados_comparativo}
        equiposIniciales={eqs}
      />

      {/* Preguntas */}
      <div>
        <div style={{ background: 'var(--ink)', padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '0', margin: 0, color: '#fff', fontFamily: 'Red Hat Display, sans-serif' }}>
            Preguntas <span style={{ fontWeight: 700 }}>/ {ps.length}</span>
          </h2>
        </div>
        {DIMENSIONES.map((dim, idx) => (
          <div key={dim.id} style={{ marginBottom: 40, borderTop: idx === 0 ? 'none' : '2px solid var(--ink)', paddingTop: idx === 0 ? 16 : 16 }}>
            <p className="page-header__eyebrow" style={{ margin: '0 0 4px' }}>{dim.subtitulo}</p>
            <h3 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '0', margin: '0 0 20px', fontFamily: 'Red Hat Display, sans-serif' }}>{dim.nombre}</h3>
            {rolesIter.map(rol => {
              const grupo = ps.filter(p => p.dimension_id === dim.id && p.rol === rol)
              const maxOrden = grupo.length ? Math.max(...grupo.map(p => p.orden)) : ps.length
              return (
                <GrupoPreguntas
                  key={rol}
                  grupo={grupo}
                  rol={rol}
                  diagnosticoId={d.id}
                  dimensionId={dim.id}
                  maxOrden={maxOrden}
                />

              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
