'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Equipo, TipoDiagnostico } from '@/types'
import { TIPOS_DIAGNOSTICO } from '@/lib/tipos-diagnostico'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import InvitarEquipoDialog from './InvitarEquipoDialog'
import EnviarDescripcionDialog from './EnviarDescripcionDialog'
import CopiarLink from './CopiarLink'
import { Plus, Trash2, ArrowUpRight, Users } from 'lucide-react'
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
  const [crearOpen, setCrearOpen] = useState(false)
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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
          <Button
            onClick={() => setCrearOpen(true)}
            style={{ background: '#fff', color: 'var(--ink)', border: '1.5px solid #fff' }}
          >
            <Plus size={14} strokeWidth={2.5} /> Crear equipo
          </Button>
        </div>
      </div>

      {equipos.length === 0 ? (
        <div style={{
          border: '1.5px dashed var(--ink)', padding: 32, textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <Users size={28} strokeWidth={1.5} />
          <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Aún no hay equipos en esta compañía.</p>
          <p className="text-mute" style={{ fontSize: 12, margin: 0, maxWidth: '40ch' }}>
            Crea uno para empezar a enviar invitaciones. Todos los equipos comparten
            el mismo set de preguntas; cada uno tiene su propio link y dashboard.
          </p>
          <Button onClick={() => setCrearOpen(true)} style={{ marginTop: 4 }}>
            <Plus size={14} strokeWidth={2.5} /> Crear primer equipo
          </Button>
        </div>
      ) : (
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

      <DialogCrearEquipo
        open={crearOpen}
        onOpenChange={setCrearOpen}
        diagnosticoId={diagnosticoId}
        existentes={equipos.length}
        onCreado={(equipo) => {
          setEquipos(prev => [...prev, equipo])
          setCrearOpen(false)
          router.refresh()
        }}
      />

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
      padding: '12px 16px',
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
      padding: '12px 16px',
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
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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

// ─── Diálogo de crear equipo ─────────────────────────────────────────
function DialogCrearEquipo({
  open, onOpenChange, diagnosticoId, existentes, onCreado,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  diagnosticoId: string
  existentes: number
  onCreado: (equipo: Equipo) => void
}) {
  const [nombre, setNombre] = useState('')
  const [numero, setNumero] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  function reset() { setNombre(''); setNumero(''); setError('') }

  async function guardar() {
    const limpio = nombre.trim()
    if (!limpio) { setError('El nombre del equipo es obligatorio.'); return }
    setGuardando(true); setError('')
    const { data, error: err } = await supabase
      .from('equipos')
      .insert({
        diagnostico_id: diagnosticoId,
        nombre: limpio,
        numero_participantes: numero ? parseInt(numero, 10) : null,
        estado: 'activo',
      })
      .select()
      .single()
    setGuardando(false)
    if (err || !data) { setError(err?.message || 'Error al crear el equipo'); return }
    onCreado(data as Equipo)
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset() }}>
      <DialogContent style={{ maxWidth: 480 }}>
        <DialogHeader>
          <DialogTitle style={{ fontWeight: 800 }}>
            {existentes === 0 ? 'Primer equipo de la compañía' : 'Nuevo equipo'}
          </DialogTitle>
          <DialogDescription style={{ color: 'var(--ink)' }}>
            Nombre con el que reconocerás a este equipo. El número de participantes es opcional.
          </DialogDescription>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0 4px' }}>
          <Input
            autoFocus
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Nombre del equipo (ej. Marketing)"
            onKeyDown={e => { if (e.key === 'Enter') guardar() }}
          />
          <Input
            type="number"
            min={1}
            value={numero}
            onChange={e => setNumero(e.target.value)}
            placeholder="Número de participantes"
          />
        </div>

        {error && <p style={{ fontSize: 12, fontWeight: 700, color: '#FF3366', margin: '0 0 4px' }}>{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={guardando}>Cancelar</Button>
          <Button onClick={guardar} disabled={guardando || !nombre.trim()}>
            {guardando ? 'Creando…' : 'Crear equipo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
