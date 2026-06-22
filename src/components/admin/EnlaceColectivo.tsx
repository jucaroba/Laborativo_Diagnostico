'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Equipo } from '@/types'
import { Button } from '@/components/ui/button'
import CopiarLink from './CopiarLink'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://diagnostico.laborativo.com'

// Panel de administración para los tipos COLECTIVOS (no 360): todos responden
// el mismo cuestionario de forma anónima, así que no hay equipos por área ni
// cargue de participantes — solo un único link de participación para difundir.
export default function EnlaceColectivo({
  diagnosticoId, nombreCompania, equipo,
}: { diagnosticoId: string; nombreCompania: string; equipo: Equipo | null }) {
  const router = useRouter()
  const [generando, setGenerando] = useState(false)

  // Fallback para diagnósticos colectivos creados antes de auto-generar el
  // equipo: crea el equipo (la DB asigna sus códigos) y refresca.
  async function generar() {
    setGenerando(true)
    const { error } = await supabase.from('equipos').insert({
      diagnostico_id: diagnosticoId,
      nombre: nombreCompania,
      estado: 'activo',
    })
    setGenerando(false)
    if (!error) router.refresh()
  }

  return (
    <div>
      <div style={{ background: 'var(--ink)', padding: '10px 16px', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '0', margin: 0, color: '#fff', fontFamily: 'Red Hat Display, sans-serif' }}>
          Participación
        </h2>
      </div>

      {equipo ? (
        <div style={{ border: '1.5px solid var(--ink)', background: 'var(--card)' }}>
          <EnlaceRow label="Link de participación" url={`${BASE_URL}/d/${equipo.codigo_participacion}`} />
          <InternalRow label="Respuestas" href={`/admin/${diagnosticoId}/respuestas/${equipo.id}`} top />
          <EnlaceRow label="Dashboard" url={`${BASE_URL}/r/${equipo.codigo_resultados}`} top />
        </div>
      ) : (
        <div style={{
          border: '1.5px solid var(--ink)', background: 'var(--card)', padding: '20px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
        }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
            Este diagnóstico colectivo aún no tiene su link de participación.
          </p>
          <Button onClick={generar} disabled={generando}>
            {generando ? 'Generando…' : 'Generar link de participación'}
          </Button>
        </div>
      )}
    </div>
  )
}

function EnlaceRow({ label, url, top = false }: { label: string; url: string; top?: boolean }) {
  return (
    <div style={{
      borderTop: top ? '1.5px solid var(--ink)' : 'none',
      padding: '14px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    }}>
      <a href={url} target="_blank" rel="noopener noreferrer"
        style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', textDecoration: 'none', outline: 'none' }}>
        {label}
      </a>
      <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <CopiarLink url={url} />
        <a href={url} target="_blank" rel="noopener noreferrer" title="Abrir link" aria-label="Abrir link"
          style={{ display: 'flex', padding: 4, color: 'var(--ink)', outline: 'none' }}>
          <ArrowUpRight size={16} strokeWidth={2.5} />
        </a>
      </span>
    </div>
  )
}

function InternalRow({ label, href, top = false }: { label: string; href: string; top?: boolean }) {
  return (
    <div style={{
      borderTop: top ? '1.5px solid var(--ink)' : 'none',
      padding: '14px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    }}>
      <Link href={href} style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', textDecoration: 'none', outline: 'none' }}>
        {label}
      </Link>
      <Link href={href} title="Ver respuestas por persona (uso interno)" aria-label={label}
        style={{ display: 'flex', padding: 4, color: 'var(--ink)', outline: 'none' }}>
        <ArrowUpRight size={16} strokeWidth={2.5} />
      </Link>
    </div>
  )
}
