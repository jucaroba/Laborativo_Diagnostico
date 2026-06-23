'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Equipo, TipoDiagnostico } from '@/types'
import { TIPOS_DIAGNOSTICO } from '@/lib/tipos-diagnostico'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import InvitarEquipoDialog from './InvitarEquipoDialog'
import CargarParticipantesDialog from './CargarParticipantesDialog'
import EnviarDescripcionDialog from './EnviarDescripcionDialog'
import CopiarLink from './CopiarLink'
import { Trash2, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://diagnostico.laborativo.com'

interface Props {
  diagnosticoId: string
  tipo: TipoDiagnostico
  codigoResultadosComparativo: string
  equiposIniciales: Equipo[]
  completadosPorEquipo: Record<string, number>
}

export default function EquiposSection({ diagnosticoId, tipo, codigoResultadosComparativo, equiposIniciales, completadosPorEquipo }: Props) {
  const router = useRouter()
  const [equipos, setEquipos] = useState<Equipo[]>(equiposIniciales)
  const [eliminar, setEliminar] = useState<Equipo | null>(null)
  const [eliminarConRespuestas, setEliminarConRespuestas] = useState(false)

  const tipoConfig = TIPOS_DIAGNOSTICO[tipo]
  const hayMultiples = equipos.length >= 2

  async function abrirEliminar(e: Equipo) {
    // Detecta si el equipo ya tiene respuestas (para mostrar confirmación reforzada).
    const { count } = await supabase
      .from('participantes')
      .select('id', { count: 'exact', head: true })
      .eq('equipo_id', e.id)
    setEliminar(e)
    setEliminarConRespuestas((count ?? 0) > 0)
  }

  async function confirmarEliminar() {
    if (!eliminar) return
    const { error } = await supabase.from('equipos').delete().eq('id', eliminar.id)
    if (!error) {
      setEquipos(prev => prev.filter(e => e.id !== eliminar.id))
      setEliminar(null)
      setEliminarConRespuestas(false)
      router.refresh()
    }
  }

  return (
    <div>
      <div style={{
        background: 'var(--ink)', padding: '10px 16px', marginBottom: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, flexWrap: 'wrap',
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '0', margin: 0, color: '#fff', fontFamily: 'Red Hat Display, sans-serif' }}>
          Equipos <span style={{ fontWeight: 700 }}>/ {equipos.length}</span>
        </h2>
        {hayMultiples && (
          <Link
            href={`/r/c/${codigoResultadosComparativo}`}
            target="_blank"
            style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
              color: '#fff', textDecoration: 'none', border: '1.5px solid #fff', padding: '6px 10px',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            Comparativo <ArrowUpRight size={13} strokeWidth={2.5} />
          </Link>
        )}
      </div>

      {equipos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          {equipos.map(e => (
            <EquipoCard
              key={e.id}
              equipo={e}
              diagnosticoId={diagnosticoId}
              tipoConfig={tipoConfig}
              completados={completadosPorEquipo[e.id] ?? 0}
              onEliminar={() => abrirEliminar(e)}
            />
          ))}
        </div>
      )}

      {/* Cargar participantes: debajo de la lista de equipos */}
      <div style={{ marginTop: 12, display: 'flex' }}>
        <CargarParticipantesDialog diagnosticoId={diagnosticoId} variant="primary" />
      </div>

      <Dialog open={!!eliminar} onOpenChange={(v) => { if (!v) { setEliminar(null); setEliminarConRespuestas(false) } }}>
        <DialogContent style={{ maxWidth: 480 }}>
          <DialogHeader>
            <DialogTitle style={{ fontWeight: 800 }}>Eliminar equipo</DialogTitle>
            <DialogDescription style={{ color: 'var(--ink)' }}>
              {eliminar && (
                <>
                  Vas a eliminar <strong>{eliminar.nombre}</strong>.
                  {eliminarConRespuestas && (
                    <>
                      {' '}Este equipo <strong style={{ color: '#FF3366' }}>ya tiene respuestas registradas</strong>;
                      se borrarán todas en cascada (participantes y respuestas).
                    </>
                  )}
                  {' '}Esta acción no se puede deshacer.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEliminar(null)}>Cancelar</Button>
            <Button onClick={confirmarEliminar} style={{ background: '#FF3366', color: '#fff', borderColor: '#FF3366' }}>
              Eliminar equipo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

type TipoConfig = (typeof TIPOS_DIAGNOSTICO)[TipoDiagnostico]

// ─── Card de cada equipo ─────────────────────────────────────────────
function EquipoCard({
  equipo, diagnosticoId, tipoConfig, completados, onEliminar,
}: { equipo: Equipo; diagnosticoId: string; tipoConfig: TipoConfig | undefined; completados: number; onEliminar: () => void }) {
  const linkParticipacion = `${BASE_URL}/d/${equipo.codigo_participacion}`
  const linkFormulario   = `${BASE_URL}/d/${equipo.codigo_participacion}/intake`
  const linkDashboard    = `${BASE_URL}/r/${equipo.codigo_resultados}`
  const linkRespuestas   = `/admin/${diagnosticoId}/respuestas/${equipo.id}`
  void tipoConfig // reservado para futuras estadísticas por equipo

  return (
    <div style={{ border: '1.5px solid var(--ink)', background: 'var(--card)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
        borderBottom: '1.5px solid var(--ink)',
      }}>
        <h3 style={{ fontSize: 17, fontWeight: 900, margin: 0, fontFamily: 'Red Hat Display, sans-serif', flex: 1 }}>
          {equipo.nombre}
        </h3>
        <span style={{
          fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 700,
          background: equipo.estado === 'activo' ? 'var(--ink)' : 'transparent',
          color: equipo.estado === 'activo' ? '#fff' : 'var(--ink)',
          border: equipo.estado === 'activo' ? '1.5px solid var(--ink)' : '1.5px solid var(--ink)',
          padding: '2px 8px',
        }}>{equipo.estado}</span>
        {equipo.numero_participantes != null && (
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
            <span title="Cuestionarios completados">{completados} respuestas</span>{' '}
            <span style={{ color: 'var(--mute)', fontWeight: 600 }}>/</span>{' '}
            <span title="Participantes esperados">{equipo.numero_participantes} participantes</span>
          </span>
        )}
        <button
          onClick={onEliminar}
          title="Eliminar equipo"
          aria-label="Eliminar equipo"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: '#FF3366' }}
        >
          <Trash2 size={15} strokeWidth={2} />
        </button>
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0,
      }}>
        <EnviarDescripcionDialog
          equipoId={equipo.id}
          linkUrl={linkParticipacion}
        />
        <InvitarEquipoDialog
          equipoId={equipo.id}
          variant="cardWithCopy"
          copyUrl={linkParticipacion}
        />
        <LinkCard label="Formulario" url={linkFormulario} />
        <InternalLinkCard label="Respuestas" href={linkRespuestas} />
        <LinkCard label="Dashboard"  url={linkDashboard} />
      </div>
    </div>
  )
}

// Igual que LinkCard pero para una ruta interna del admin (misma pestaña, sin copiar).
function InternalLinkCard({ label, href }: { label: string; href: string }) {
  return (
    <div style={{
      borderLeft: '1.5px solid var(--ink)',
      padding: '12px 8px 12px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    }}>
      <Link href={href} style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', textDecoration: 'none', outline: 'none' }}>
        {label}
      </Link>
      <Link href={href} title="Ver respuestas por persona (uso interno)" aria-label={label} style={{ display: 'flex', padding: 4, color: 'var(--ink)', outline: 'none' }}>
        <ArrowUpRight size={16} strokeWidth={2.5} />
      </Link>
    </div>
  )
}

function LinkCard({ label, url }: { label: string; url: string }) {
  return (
    <div style={{
      borderLeft: '1.5px solid var(--ink)',
      padding: '12px 8px 12px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    }}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', textDecoration: 'none', outline: 'none' }}
      >
        {label}
      </a>
      <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <CopiarLink url={url} />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          title="Abrir link"
          aria-label="Abrir link"
          style={{ display: 'flex', padding: 4, color: 'var(--ink)', outline: 'none' }}
        >
          <ArrowUpRight size={16} strokeWidth={2.5} />
        </a>
      </span>
    </div>
  )
}
