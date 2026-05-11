import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Diagnostico } from '@/types'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import AccionesRow from '@/components/admin/AccionesRow'
import { TIPOS_DIAGNOSTICO } from '@/lib/tipos-diagnostico'

export const revalidate = 0

const ESTADO_LABEL: Record<string, string> = {
  borrador: 'Borrador', activo: 'Activo', completado: 'Completado',
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const fechaCorta = (iso: string) => {
  const d = new Date(iso)
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}
const ESTADO_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  borrador: 'outline', activo: 'default', completado: 'secondary',
}

export default async function AdminPage() {
  const { data: diagnosticos } = await supabase
    .from('diagnosticos').select('*').order('created_at', { ascending: false })

  return (
    <div>
      <div className="page-header admin-list-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="page-header__eyebrow">Panel</span>
          <div className="page-header__rule" />
          <h1 className="page-header__title">Diagnósticos</h1>
        </div>
        <Link href="/admin/nuevo" className={buttonVariants()} style={{ background: '#0A0A0A', color: '#ffffff', border: '1px solid #0A0A0A' }}>+ Nuevo diagnóstico</Link>
      </div>

      {!diagnosticos?.length ? (
        <p className="text-mute" style={{ fontSize: 14 }}>Aún no hay diagnósticos.</p>
      ) : (
        <div className="admin-table-scroll">
        <Table>
          <TableHeader>
            <TableRow style={{ background: '#0A0A0A', borderBottom: 'none' }}>
              {['Empresa', 'Tipo', 'Contacto', 'Fecha', 'Estado', 'Color', ''].map(h => (
                <TableHead key={h} style={{ color: '#fff', fontWeight: 700, fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', background: 'transparent' }}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {diagnosticos.map((d: Diagnostico) => {
              const tipoConfig = TIPOS_DIAGNOSTICO[(d.tipo ?? 'cultura_360') as keyof typeof TIPOS_DIAGNOSTICO]
              return (
              <TableRow key={d.id}>
                <TableCell>
                  <Link href={`/admin/${d.id}`} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 500, fontSize: 14 }}>
                    {d.nombre_compania}
                  </Link>
                </TableCell>
                <TableCell>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px',
                    fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase',
                    fontWeight: 700, background: 'var(--ink)', color: '#fff',
                  }}>{tipoConfig?.etiqueta ?? '360°'}</span>
                </TableCell>
                <TableCell style={{ color: 'var(--ink)', fontWeight: 500, fontSize: 14 }}>{d.contacto_nombre}</TableCell>
                <TableCell style={{ color: 'var(--ink)', fontWeight: 500, fontSize: 14 }}>
                  {fechaCorta(d.created_at)}
                </TableCell>
                <TableCell>
                  <Badge variant={ESTADO_VARIANT[d.estado]}>{ESTADO_LABEL[d.estado]}</Badge>
                </TableCell>
                <TableCell style={{ textAlign: 'center', paddingRight: 35 }}>
                  <span style={{ width: 14, height: 14, background: d.color_neon, display: 'inline-block' }} />
                </TableCell>
                <TableCell>
                  <AccionesRow id={d.id} />
                </TableCell>
              </TableRow>
              )
            })}
          </TableBody>
        </Table>
        </div>
      )}
    </div>
  )
}
