import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Diagnostico } from '@/types'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export const revalidate = 0

const ESTADO_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  activo: 'Activo',
  completado: 'Completado',
}

const ESTADO_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  borrador: 'outline',
  activo: 'default',
  completado: 'secondary',
}

export default async function AdminPage() {
  const { data: diagnosticos } = await supabase
    .from('diagnosticos')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div style={{ fontFamily: "'Red Hat Display', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40 }}>
        <div>
          <p style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--mute)', fontWeight: 600, margin: '0 0 10px' }}>Panel</p>
          <div style={{ width: 24, height: 2, background: 'var(--ink)', marginBottom: 12 }} />
          <h1 style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1, margin: 0 }}>Diagnósticos</h1>
        </div>
        <Link href="/admin/nuevo" className={buttonVariants()}>+ Nuevo</Link>
      </div>

      {!diagnosticos?.length ? (
        <p style={{ color: 'var(--mute)', fontSize: 14, fontWeight: 500 }}>Aún no hay diagnósticos.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Compañía</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Neón</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {diagnosticos.map((d: Diagnostico) => (
              <TableRow key={d.id}>
                <TableCell>
                  <Link href={`/admin/${d.id}`} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 800, fontSize: 15 }}>
                    {d.nombre_compania}
                  </Link>
                </TableCell>
                <TableCell style={{ fontWeight: 500, fontSize: 13 }}>{d.contacto_nombre}</TableCell>
                <TableCell>
                  <Badge variant={ESTADO_VARIANT[d.estado]}>{ESTADO_LABEL[d.estado]}</Badge>
                </TableCell>
                <TableCell style={{ fontSize: 12, color: 'var(--mute)', fontWeight: 500 }}>
                  {new Date(d.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                </TableCell>
                <TableCell>
                  <span style={{ width: 14, height: 14, background: d.color_neon, border: '1.5px solid var(--ink)', display: 'inline-block' }} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
