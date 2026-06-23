'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import AccionesRow from './AccionesRow'

export type FilaDiag = {
  id: string
  empresa: string
  tipoEtiqueta: string
  contacto: string
  fechaIso: string
  fecha: string
  equiposN: number
  equiposActivos: number
  invitados: number
  completados: number
}

type SortKey = 'empresa' | 'tipo' | 'contacto' | 'fecha'

const COLS: { label: string; key: SortKey | null; center?: boolean }[] = [
  { label: 'Empresa', key: 'empresa' },
  { label: 'Tipo', key: 'tipo' },
  { label: 'Contacto', key: 'contacto' },
  { label: 'Fecha', key: 'fecha' },
  { label: 'Equipos', key: null, center: true },
  { label: 'PAX', key: null, center: true },
  { label: '', key: null },
]

export default function TablaDiagnosticos({ filas }: { filas: FilaDiag[] }) {
  // Por defecto: fecha descendente (orden actual del listado).
  const [sortBy, setSortBy] = useState<SortKey>('fecha')
  const [dir, setDir] = useState<'asc' | 'desc'>('desc')

  function toggle(key: SortKey) {
    if (sortBy === key) setDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(key); setDir(key === 'fecha' ? 'desc' : 'asc') }
  }

  const ordenadas = [...filas].sort((a, b) => {
    let cmp = 0
    if (sortBy === 'fecha') cmp = a.fechaIso.localeCompare(b.fechaIso)
    else if (sortBy === 'empresa') cmp = a.empresa.localeCompare(b.empresa, 'es', { sensitivity: 'base' })
    else if (sortBy === 'tipo') cmp = a.tipoEtiqueta.localeCompare(b.tipoEtiqueta, 'es', { sensitivity: 'base' })
    else cmp = a.contacto.localeCompare(b.contacto, 'es', { sensitivity: 'base' })
    return dir === 'asc' ? cmp : -cmp
  })

  return (
    <div className="admin-table-scroll">
      <Table>
        <TableHeader>
          <TableRow style={{ background: '#0A0A0A', borderBottom: 'none' }}>
            {COLS.map(c => {
              const active = c.key && sortBy === c.key
              return (
                <TableHead
                  key={c.label || 'acc'}
                  onClick={c.key ? () => toggle(c.key as SortKey) : undefined}
                  style={{
                    color: '#fff', fontWeight: 700, fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', background: 'transparent',
                    textAlign: c.center ? 'center' : 'left',
                    cursor: c.key ? 'pointer' : 'default', userSelect: 'none',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, justifyContent: c.center ? 'center' : 'flex-start' }}>
                    {c.label}
                    {c.key && (
                      <span style={{ fontSize: 9, lineHeight: 1, opacity: active ? 1 : 0.4 }}>
                        {active ? (dir === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    )}
                  </span>
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordenadas.map(f => (
            <TableRow key={f.id}>
              <TableCell>
                <Link href={`/admin/${f.id}`} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 500, fontSize: 14 }}>
                  {f.empresa}
                </Link>
              </TableCell>
              <TableCell>
                <span style={{
                  display: 'inline-block', padding: '2px 8px',
                  fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase',
                  fontWeight: 700, background: 'var(--ink)', color: '#fff',
                }}>{f.tipoEtiqueta}</span>
              </TableCell>
              <TableCell style={{ color: 'var(--ink)', fontWeight: 500, fontSize: 14 }}>{f.contacto}</TableCell>
              <TableCell style={{ color: 'var(--ink)', fontWeight: 500, fontSize: 14 }}>{f.fecha}</TableCell>
              <TableCell style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                  {f.equiposN}{' '}
                  <span style={{ color: 'var(--mute)', fontWeight: 600 }}>/</span>{' '}
                  {f.equiposActivos} activo{f.equiposActivos === 1 ? '' : 's'}
                </span>
              </TableCell>
              <TableCell style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                  {f.invitados}{' '}
                  <span style={{ color: 'var(--mute)', fontWeight: 600 }}>/</span>{' '}
                  <span title="Cuestionarios completados">{f.completados}</span>
                </span>
              </TableCell>
              <TableCell>
                <AccionesRow id={f.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
