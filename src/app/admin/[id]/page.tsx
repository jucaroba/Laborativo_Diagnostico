import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { Diagnostico, Pregunta, DIMENSIONES, ROL_INFO, Rol } from '@/types'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import AccionesDiagnostico from '@/components/admin/AccionesDiagnostico'
import CopiarLink from '@/components/admin/CopiarLink'
import EliminarDiagnostico from '@/components/admin/EliminarDiagnostico'
import EditarDiagnostico from '@/components/admin/EditarDiagnostico'
import InvitarEquipoDialog from '@/components/admin/InvitarEquipoDialog'
import EnviarDescripcionDialog from '@/components/admin/EnviarDescripcionDialog'
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
    .from('participantes').select('id, rol').eq('diagnostico_id', id)

  const conteoRoles = { A: 0, B: 0, C: 0, D: 0 }
  for (const p of (participantes ?? []) as { id: string; rol: Rol }[]) conteoRoles[p.rol]++

  const { count: invitacionesEnviadas } = await supabase
    .from('invitaciones')
    .select('id', { count: 'exact', head: true })
    .eq('diagnostico_id', id)
    .not('enviado_at', 'is', null)

  const preguntasPorRol: Record<Rol, Set<string>> = { A: new Set(), B: new Set(), C: new Set(), D: new Set() }
  for (const p of (preguntas ?? []) as Pregunta[]) preguntasPorRol[p.rol].add(p.id)

  const partIds = ((participantes ?? []) as { id: string }[]).map(p => p.id)
  const { data: respuestas } = partIds.length > 0
    ? await supabase.from('respuestas').select('participante_id, pregunta_id').in('participante_id', partIds)
    : { data: [] as { participante_id: string; pregunta_id: string }[] }

  const respuestasPorParticipante: Record<string, Set<string>> = {}
  for (const r of respuestas ?? []) {
    if (!respuestasPorParticipante[r.participante_id]) respuestasPorParticipante[r.participante_id] = new Set()
    respuestasPorParticipante[r.participante_id].add(r.pregunta_id)
  }

  let cuestionariosDiligenciados = 0
  for (const p of (participantes ?? []) as { id: string; rol: Rol }[]) {
    const esperadas = p.rol === 'A'
      ? new Set<string>([...preguntasPorRol.A, ...preguntasPorRol.C])
      : p.rol === 'D'
      ? new Set<string>([...preguntasPorRol.D, ...preguntasPorRol.B])
      : new Set<string>([...preguntasPorRol[p.rol]])
    if (esperadas.size === 0) continue
    const dadas = respuestasPorParticipante[p.id] ?? new Set<string>()
    let completo = true
    for (const pid of esperadas) if (!dadas.has(pid)) { completo = false; break }
    if (completo) cuestionariosDiligenciados++
  }

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
          <EditarDiagnostico diagnostico={d} />
          <EliminarDiagnostico id={d.id} />
          <AccionesDiagnostico diagnostico={d} />
        </div>
      </div>

      {/* Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <EnviarDescripcionDialog
          diagnosticoId={d.id}
          linkUrl={`${BASE_URL}/d/${d.codigo_participacion}`}
        />
        <InvitarEquipoDialog
          diagnosticoId={d.id}
          variant="cardWithCopy"
          copyUrl={`${BASE_URL}/d/${d.codigo_participacion}/intake`}
        />
        {[
          { label: 'Formulario', url: `${BASE_URL}/d/${d.codigo_participacion}/intake`, href: `${BASE_URL}/d/${d.codigo_participacion}/intake` },
          { label: 'Dashboard', url: `${BASE_URL}/r/${d.codigo_resultados}`, href: `${BASE_URL}/r/${d.codigo_resultados}` },
        ].map(l => (
          <div key={l.label} style={{
            border: '1.5px solid var(--ink)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <a
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', textDecoration: 'none' }}
            >
              {l.label}
            </a>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <CopiarLink url={l.url} />
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir link"
                aria-label="Abrir link"
                style={{ display: 'flex', padding: 4, color: 'var(--ink)' }}
              >
                <ArrowUpRight size={16} strokeWidth={2.5} />
              </a>
            </span>
          </div>
        ))}
      </div>

      {/* Participantes */}
      <div>
        <div style={{ background: 'var(--ink)', padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '0', margin: 0, color: '#fff', fontFamily: 'Red Hat Display, sans-serif' }}>Participantes</h2>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#fff', fontFamily: 'Red Hat Display, sans-serif' }}>
            {invitacionesEnviadas ?? 0} invitaciones · {cuestionariosDiligenciados} diligenciados
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {(['A', 'C', 'D', 'B'] as Rol[]).map(rol => (
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
          <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '0', margin: 0, color: '#fff', fontFamily: 'Red Hat Display, sans-serif' }}>Preguntas</h2>
          <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: '0', color: '#fff', fontFamily: 'Red Hat Display, sans-serif' }}>{ps.length}</span>
        </div>
        {DIMENSIONES.map((dim, idx) => (
          <div key={dim.id} style={{ marginBottom: 40, borderTop: idx === 0 ? 'none' : '2px solid var(--ink)', paddingTop: idx === 0 ? 16 : 16 }}>
            <p className="page-header__eyebrow" style={{ margin: '0 0 4px' }}>{dim.subtitulo}</p>
            <h3 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '0', margin: '0 0 20px', fontFamily: 'Red Hat Display, sans-serif' }}>{dim.nombre}</h3>
            {(['A', 'C', 'D', 'B'] as Rol[]).map(rol => {
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
