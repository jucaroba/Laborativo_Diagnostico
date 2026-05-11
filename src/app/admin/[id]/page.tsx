import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { Diagnostico, Pregunta, DIMENSIONES, Rol } from '@/types'
import { TIPOS_DIAGNOSTICO } from '@/lib/tipos-diagnostico'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import AccionesDiagnostico from '@/components/admin/AccionesDiagnostico'
import CopiarLink from '@/components/admin/CopiarLink'
import EliminarDiagnostico from '@/components/admin/EliminarDiagnostico'
import EditarDiagnostico from '@/components/admin/EditarDiagnostico'
import InvitarEquipoDialog from '@/components/admin/InvitarEquipoDialog'
import EnviarDescripcionDialog from '@/components/admin/EnviarDescripcionDialog'
import GrupoPreguntas from '@/components/admin/GrupoPreguntas'
import IniciarRondaButton from '@/components/admin/IniciarRondaButton'
import Link from 'next/link'
import { ArrowUpRight, ArrowLeft } from 'lucide-react'

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

  const { count: invitacionesEnviadas } = await supabase
    .from('invitaciones')
    .select('id', { count: 'exact', head: true })
    .eq('diagnostico_id', id)
    .not('enviado_at', 'is', null)

  const preguntasPorRol: Record<Rol, Set<string>> = {
    A: new Set(), B: new Set(), C: new Set(), D: new Set(),
    X: new Set(), YO: new Set(), EQUIPO: new Set(),
  }
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
  let formulariosLider = 0
  let formulariosEquipo = 0
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
    if (completo) {
      cuestionariosDiligenciados++
      if (p.rol === 'D') formulariosLider++
      else if (p.rol === 'A') formulariosEquipo++
    }
  }

  const d = diag as Diagnostico
  const ps = (preguntas ?? []) as Pregunta[]
  const tipoConfig = TIPOS_DIAGNOSTICO[d.tipo ?? 'cultura_360']
  const rolesIter = tipoConfig?.rolesPregunta ?? (['A', 'C', 'D', 'B'] as const)

  // Padre (si esta es una ronda 2+) — para el badge "Ronda N · ← ver ronda anterior"
  const { data: padreData } = d.diagnostico_padre_id
    ? await supabase
        .from('diagnosticos')
        .select('id, nombre_compania, ronda, codigo_resultados')
        .eq('id', d.diagnostico_padre_id)
        .maybeSingle()
    : { data: null }

  const ronda = d.ronda ?? 1

  // Grupo (si pertenece a uno) — para el badge "Grupo · ver comparativo"
  const { data: grupoData } = d.grupo_id
    ? await supabase
        .from('grupos')
        .select('id, nombre, codigo_resultados')
        .eq('id', d.grupo_id)
        .maybeSingle()
    : { data: null }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          {(ronda > 1 || grupoData) && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              {ronda > 1 && (
                <>
                  <span style={{
                    fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 700,
                    background: 'var(--ink)', color: '#fff', padding: '3px 8px',
                  }}>Ronda {ronda}</span>
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
                </>
              )}
              {grupoData && (
                <Link
                  href={`/admin/grupos/${grupoData.id}`}
                  style={{
                    fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 700,
                    background: 'transparent', color: 'var(--ink)', padding: '3px 8px',
                    border: '1.5px solid var(--ink)',
                    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}
                >
                  Grupo · {grupoData.nombre}
                </Link>
              )}
            </div>
          )}
          <h1 className="page-header__title" style={{ fontSize: 32, letterSpacing: '0px' }}>{d.nombre_compania}</h1>
          <p className="page-header__subtitle">{d.contacto_nombre} / {d.contacto_cargo} / {d.contacto_email}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <EditarDiagnostico diagnostico={d} />
          <EliminarDiagnostico id={d.id} />
          <AccionesDiagnostico diagnostico={d} />
          {d.estado === 'completado' && <IniciarRondaButton padre={d} />}
        </div>
      </div>

      {/* Links */}
      <div className="admin-grid-cards admin-grid-cards--4">
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
        <div className="admin-grid-cards admin-grid-cards--4" style={{ gap: 12 }}>
          {[
            { label: 'Participantes', valor: d.numero_participantes ?? 0 },
            { label: 'Invitaciones enviadas', valor: invitacionesEnviadas ?? 0 },
            { label: 'Formularios líder', valor: formulariosLider },
            { label: 'Formularios equipo', valor: formulariosEquipo },
          ].map(c => (
            <Card key={c.label}>
              <CardContent style={{ padding: '6px 16px 8px' }}>
                <p className="page-header__eyebrow" style={{ margin: '0 0 4px', fontWeight: 800 }}>{c.label}</p>
                <p style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-2px', margin: 0, lineHeight: 1 }}>{c.valor}</p>
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
