import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { Diagnostico, Equipo } from '@/types'
import { TIPOS_DIAGNOSTICO } from '@/lib/tipos-diagnostico'
import EliminarDiagnostico from '@/components/admin/EliminarDiagnostico'
import EditarDiagnostico from '@/components/admin/EditarDiagnostico'
import ActivarDiagnostico from '@/components/admin/ActivarDiagnostico'
import RespuestasInternas from '@/components/admin/RespuestasInternas'
import EnlaceColectivo from '@/components/admin/EnlaceColectivo'
import CargarParticipantesDialog from '@/components/admin/CargarParticipantesDialog'
import IniciarRondaButton from '@/components/admin/IniciarRondaButton'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const revalidate = 0

export default async function DiagnosticoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: diag } = await supabase.from('diagnosticos').select('*').eq('id', id).single()
  if (!diag) notFound()

  const { data: equipos } = await supabase
    .from('equipos').select('*').eq('diagnostico_id', id).order('created_at')

  const d = diag as Diagnostico
  const eqs = (equipos ?? []) as Equipo[]
  const tipoConfig = TIPOS_DIAGNOSTICO[d.tipo ?? 'cultura_360']
  const es360 = (d.tipo ?? 'cultura_360') === 'cultura_360'

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
          {/* 360 activado: invitar/cargar participantes crea los grupos por área
              desde el administrador, sin vista intermedia de equipos. */}
          {d.activado && es360 && (
            <CargarParticipantesDialog diagnosticoId={d.id} variant="primary" />
          )}
          {d.activado ? <IniciarRondaButton padre={d} /> : <ActivarDiagnostico id={d.id} />}
        </div>
      </div>

      {/* Tras activar: el 360 entra directo a la vista interna (respuestas por
          persona, agrupadas por equipo/área); los tipos colectivos usan un
          único link de participación. */}
      {d.activado && (
        es360 ? (
          <RespuestasInternas
            diagnosticoId={d.id}
            codigoResultadosComparativo={d.codigo_resultados_comparativo}
          />
        ) : (
          <EnlaceColectivo
            diagnosticoId={d.id}
            nombreCompania={d.nombre_compania}
            equipo={eqs[0] ?? null}
          />
        )
      )}
    </div>
  )
}
