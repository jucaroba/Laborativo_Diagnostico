import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { Diagnostico, Equipo, Pregunta, Rol } from '@/types'
import { TIPOS_DIAGNOSTICO } from '@/lib/tipos-diagnostico'
import EliminarDiagnostico from '@/components/admin/EliminarDiagnostico'
import EditarDiagnostico from '@/components/admin/EditarDiagnostico'
import ActivarDiagnostico from '@/components/admin/ActivarDiagnostico'
import EquiposSection from '@/components/admin/EquiposSection'
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

  // ─── Cuántos participantes completaron el cuestionario por equipo.
  // Un participante "completó" cuando respondió todas las preguntas que le
  // corresponden según su rol (A responde A+C, D responde D+B, X/YO/EQUIPO
  // responden solo su propio rol).
  const equipoIds = eqs.map(e => e.id)
  const { data: parts } = equipoIds.length > 0
    ? await supabase
        .from('participantes')
        .select('id, equipo_id, rol')
        .in('equipo_id', equipoIds)
    : { data: [] as { id: string; equipo_id: string; rol: Rol }[] }
  const partIds = (parts ?? []).map(p => p.id)
  const { data: resps } = partIds.length > 0
    ? await supabase
        .from('respuestas')
        .select('participante_id, pregunta_id')
        .in('participante_id', partIds)
    : { data: [] as { participante_id: string; pregunta_id: string }[] }

  const preguntasPorRol: Record<Rol, Set<string>> = {
    A: new Set(), B: new Set(), C: new Set(), D: new Set(),
    X: new Set(), YO: new Set(), EQUIPO: new Set(),
  }
  for (const p of ps) preguntasPorRol[p.rol].add(p.id)

  const respPorParticipante: Record<string, Set<string>> = {}
  for (const r of resps ?? []) {
    if (!respPorParticipante[r.participante_id]) respPorParticipante[r.participante_id] = new Set()
    respPorParticipante[r.participante_id].add(r.pregunta_id)
  }

  const completadosPorEquipo: Record<string, number> = {}
  for (const p of parts ?? []) {
    const r = p.rol as Rol
    const esperadas: Set<string> = r === 'A'
      ? new Set<string>([...preguntasPorRol.A, ...preguntasPorRol.C])
      : r === 'D'
      ? new Set<string>([...preguntasPorRol.D, ...preguntasPorRol.B])
      : new Set<string>([...preguntasPorRol[r]])
    if (esperadas.size === 0) continue
    const dadas = respPorParticipante[p.id] ?? new Set<string>()
    let completo = true
    for (const pid of esperadas) if (!dadas.has(pid)) { completo = false; break }
    if (completo) {
      completadosPorEquipo[p.equipo_id] = (completadosPorEquipo[p.equipo_id] ?? 0) + 1
    }
  }

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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 700,
              background: 'var(--ink)', color: '#fff', padding: '3px 8px',
            }}>{tipoConfig?.etiqueta ?? d.tipo}</span>
            {ronda > 1 && padreData && (
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
            {ronda > 1 && (
              <span style={{
                fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 700,
                background: 'transparent', color: 'var(--ink)', border: '1.5px solid var(--ink)', padding: '2px 8px',
              }}>Ronda {ronda}</span>
            )}
          </div>
          <h1 className="page-header__title" style={{ fontSize: 32, letterSpacing: '0px' }}>{d.nombre_compania}</h1>
          <p className="page-header__subtitle">{d.contacto_nombre} / {d.contacto_cargo} / {d.contacto_email}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <EditarDiagnostico diagnostico={d} />
          <EliminarDiagnostico id={d.id} />
          {d.activado ? <IniciarRondaButton padre={d} /> : <ActivarDiagnostico id={d.id} />}
        </div>
      </div>

      {/* Equipos — solo en la etapa de envío (diagnóstico activado) */}
      {d.activado && (
        <EquiposSection
          diagnosticoId={d.id}
          tipo={d.tipo ?? 'cultura_360'}
          codigoResultadosComparativo={d.codigo_resultados_comparativo}
          equiposIniciales={eqs}
          completadosPorEquipo={completadosPorEquipo}
        />
      )}
    </div>
  )
}
