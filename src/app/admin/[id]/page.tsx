import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { Diagnostico, Pregunta, DIMENSIONES, ROL_INFO, Rol } from '@/types'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import AccionesDiagnostico from '@/components/admin/AccionesDiagnostico'
import CopiarLink from '@/components/admin/CopiarLink'
import EliminarDiagnostico from '@/components/admin/EliminarDiagnostico'
import GrupoPreguntas from '@/components/admin/GrupoPreguntas'
import { ArrowUpRight } from 'lucide-react'

export const revalidate = 0

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://diagnostico.laborativo.com'

export default async function DiagnosticoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: diag } = await supabase.from('diagnosticos').select('*').eq('id', id).single()
  if (!diag) notFound()

  const { data: preguntas } = await supabase
    .from('preguntas').select('*').eq('diagnostico_id', id).order('orden')
  const { data: participantes } = await supabase
    .from('participantes').select('rol').eq('diagnostico_id', id)

  const conteoRoles = { A: 0, B: 0, C: 0, D: 0 }
  for (const p of participantes ?? []) conteoRoles[p.rol as Rol]++

  const d = diag as Diagnostico
  const ps = (preguntas ?? []) as Pregunta[]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-header__title" style={{ fontSize: 32, letterSpacing: '0px' }}>{d.nombre_compania}</h1>
          <p className="page-header__subtitle">{d.contacto_nombre} / {d.contacto_cargo} / {d.contacto_email}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <EliminarDiagnostico id={d.id} />
          <AccionesDiagnostico diagnostico={d} />
        </div>
      </div>

      {/* Links */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[
          { label: 'Link de participación', url: `${BASE_URL}/d/${d.codigo_participacion}`, href: `${BASE_URL}/d/${d.codigo_participacion}` },
          { label: 'Link de resultados', url: `${BASE_URL}/r/${d.codigo_resultados}`, href: `${BASE_URL}/r/${d.codigo_resultados}` },
        ].map(l => (
          <div key={l.label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <a href={l.href} target="_blank" rel="noopener noreferrer" className="page-header__eyebrow" style={{ margin: 0, textDecoration: 'none', color: 'var(--mute)' }}>{l.label}</a>
              <a href={l.href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', color: d.color_neon, lineHeight: 1 }}>
                <ArrowUpRight size={14} strokeWidth={2.5} />
              </a>
            </div>
            <CopiarLink url={l.url} />
          </div>
        ))}
      </div>

      {/* Participantes */}
      <div>
        <div style={{ background: 'var(--ink)', padding: '10px 16px', marginBottom: 12 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', margin: 0, color: '#fff', fontFamily: 'Red Hat Display, sans-serif' }}>Participantes</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {(['A', 'B', 'C', 'D'] as Rol[]).map(rol => (
            <Card key={rol}>
              <CardContent style={{ padding: '6px 16px 8px' }}>
                <p className="page-header__eyebrow" style={{ margin: '0 0 4px', fontWeight: 800 }}>{ROL_INFO[rol].label}</p>
                <p style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-2px', margin: 0, lineHeight: 1 }}>{conteoRoles[rol]}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Preguntas */}
      <div>
        <div style={{ background: 'var(--ink)', padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', margin: 0, color: '#fff', fontFamily: 'Red Hat Display, sans-serif' }}>Preguntas</h2>
          <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', color: d.color_neon, fontFamily: 'Red Hat Display, sans-serif' }}>{ps.length}</span>
        </div>
        {DIMENSIONES.map((dim, idx) => (
          <div key={dim.id} style={{ marginBottom: 40, borderTop: idx === 0 ? 'none' : '2px solid var(--ink)', paddingTop: idx === 0 ? 16 : 16 }}>
            <p className="page-header__eyebrow" style={{ margin: '0 0 4px' }}>{dim.subtitulo}</p>
            <h3 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 20px', fontFamily: 'Red Hat Display, sans-serif' }}>{dim.nombre}</h3>
            {(['A', 'B', 'C', 'D'] as Rol[]).map(rol => {
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
                  neonColor={d.color_neon}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
