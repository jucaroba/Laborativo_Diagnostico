import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Diagnostico } from '@/types'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import AccionesRow from '@/components/admin/AccionesRow'

export const revalidate = 0

const ESTADO_LABEL: Record<string, string> = {
  borrador: 'Borrador', activo: 'Activo', completado: 'Completado',
}
const ESTADO_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  borrador: 'outline', activo: 'default', completado: 'secondary',
}

export default async function AdminPage() {
  const { data: diagnosticos } = await supabase
    .from('diagnosticos').select('*').order('created_at', { ascending: false })

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <span className="page-header__eyebrow">Panel</span>
          <div className="page-header__rule" />
          <h1 className="page-header__title">Diagnósticos</h1>
        </div>
        <Link href="/admin/nuevo" className={buttonVariants()}>+ Nuevo</Link>
      </div>

      {!diagnosticos?.length ? (
        <p className="text-mute" style={{ fontSize: 14 }}>Aún no hay diagnósticos.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow style={{ background: '#0A0A0A', borderBottom: 'none' }}>
              {['Compañía', 'Contacto', 'Estado', 'Fecha', 'Color', ''].map(h => (
                <TableHead key={h} style={{ color: '#fff', fontWeight: 700, fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', background: 'transparent' }}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {diagnosticos.map((d: Diagnostico) => (
              <TableRow key={d.id}>
                <TableCell>
                  <Link href={`/admin/${d.id}`} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 500, fontSize: 14 }}>
                    {d.nombre_compania}
                  </Link>
                </TableCell>
                <TableCell className="table-cell">{d.contacto_nombre}</TableCell>
                <TableCell>
                  <Badge variant={ESTADO_VARIANT[d.estado]}>{ESTADO_LABEL[d.estado]}</Badge>
                </TableCell>
                <TableCell className="table-cell-mute">
                  {new Date(d.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                </TableCell>
                <TableCell>
                  <span style={{ width: 14, height: 14, background: d.color_neon, display: 'inline-block' }} />
                </TableCell>
                <TableCell>
                  <AccionesRow id={d.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
