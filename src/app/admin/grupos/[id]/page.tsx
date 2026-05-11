import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Grupo, Diagnostico } from '@/types'
import { TIPOS_DIAGNOSTICO } from '@/lib/tipos-diagnostico'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowUpRight, ArrowLeft } from 'lucide-react'

export const revalidate = 0

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://diagnostico.laborativo.com'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const fechaCorta = (iso: string) => {
  const d = new Date(iso)
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

const ESTADO_LABEL: Record<string, string> = {
  borrador: 'Borrador', activo: 'Activo', completado: 'Completado',
}
const ESTADO_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  borrador: 'outline', activo: 'default', completado: 'secondary',
}

export default async function GrupoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: grupo } = await supabase.from('grupos').select('*').eq('id', id).maybeSingle()
  if (!grupo) notFound()
  const g = grupo as Grupo
  const tipoConfig = TIPOS_DIAGNOSTICO[g.tipo]

  const { data: diags } = await supabase
    .from('diagnosticos')
    .select('*')
    .eq('grupo_id', id)
    .order('created_at', { ascending: false })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      <div>
        <Link href="/admin/grupos" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--mute)', textDecoration: 'none', marginBottom: 8 }}>
          <ArrowLeft size={13} strokeWidth={2.5} /> Grupos
        </Link>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{
              display: 'inline-block', padding: '2px 8px',
              fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase',
              fontWeight: 700, background: 'var(--ink)', color: '#fff',
              marginBottom: 8,
            }}>{tipoConfig?.etiqueta ?? g.tipo}</span>
            <h1 className="page-header__title" style={{ fontSize: 32, letterSpacing: '0px' }}>{g.nombre}</h1>
            <p className="page-header__subtitle">
              {tipoConfig?.nombre ?? g.tipo} · {diags?.length ?? 0} {diags?.length === 1 ? 'diagnóstico' : 'diagnósticos'}
            </p>
          </div>
          <Link href={`/r/grupo/${g.codigo_resultados}`} target="_blank"
            style={{
              fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
              color: '#fff', background: 'var(--ink)', textDecoration: 'none',
              padding: '10px 16px',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
            Ver comparativo <ArrowUpRight size={14} strokeWidth={2.5} />
          </Link>
        </div>
      </div>

      <div>
        <div style={{ background: 'var(--ink)', padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: 0, margin: 0, color: '#fff', fontFamily: 'Red Hat Display, sans-serif' }}>Diagnósticos del grupo</h2>
          <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: 0, color: '#fff' }}>{diags?.length ?? 0}</span>
        </div>

        {!diags?.length ? (
          <p className="text-mute" style={{ fontSize: 14 }}>Aún no hay diagnósticos asignados a este grupo.</p>
        ) : (
          <div className="admin-table-scroll">
            <Table>
              <TableHeader>
                <TableRow style={{ background: '#0A0A0A', borderBottom: 'none' }}>
                  {['Empresa', 'Contacto', 'Fecha', 'Estado', ''].map(h => (
                    <TableHead key={h} style={{ color: '#fff', fontWeight: 700, fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', background: 'transparent' }}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(diags as Diagnostico[]).map(d => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <Link href={`/admin/${d.id}`} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 500, fontSize: 14 }}>
                        {d.nombre_compania}{d.ronda && d.ronda > 1 ? ` · Ronda ${d.ronda}` : ''}
                      </Link>
                    </TableCell>
                    <TableCell style={{ fontSize: 14, fontWeight: 500 }}>{d.contacto_nombre}</TableCell>
                    <TableCell style={{ fontSize: 14, fontWeight: 500 }}>{fechaCorta(d.created_at)}</TableCell>
                    <TableCell>
                      <Badge variant={ESTADO_VARIANT[d.estado]}>{ESTADO_LABEL[d.estado]}</Badge>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <a
                        href={`${BASE_URL}/r/${d.codigo_resultados}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir dashboard del diagnóstico"
                        style={{ display: 'inline-flex', color: 'var(--ink)' }}
                      >
                        <ArrowUpRight size={16} strokeWidth={2.5} />
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
