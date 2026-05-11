import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Grupo } from '@/types'
import { TIPOS_DIAGNOSTICO } from '@/lib/tipos-diagnostico'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export const revalidate = 0

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const fechaCorta = (iso: string) => {
  const d = new Date(iso)
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

export default async function GruposPage() {
  const { data: grupos } = await supabase
    .from('grupos')
    .select('*')
    .order('created_at', { ascending: false })

  const gruposIds = (grupos ?? []).map(g => g.id)
  const { data: diags } = gruposIds.length > 0
    ? await supabase.from('diagnosticos').select('id, grupo_id').in('grupo_id', gruposIds)
    : { data: [] as { id: string; grupo_id: string }[] }

  const conteoPorGrupo: Record<string, number> = {}
  for (const d of diags ?? []) {
    if (d.grupo_id) conteoPorGrupo[d.grupo_id] = (conteoPorGrupo[d.grupo_id] ?? 0) + 1
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="page-header__eyebrow">Comparativo</span>
          <div className="page-header__rule" />
          <h1 className="page-header__title">Grupos</h1>
          <p className="page-header__subtitle">
            Agrupa varios diagnósticos del mismo tipo para compararlos en una sola vista.
          </p>
        </div>
      </div>

      {!grupos?.length ? (
        <p className="text-mute" style={{ fontSize: 14 }}>
          Aún no hay grupos. Crea uno asignando un nombre de grupo al crear un nuevo diagnóstico.
        </p>
      ) : (
        <div className="admin-table-scroll">
          <Table>
            <TableHeader>
              <TableRow style={{ background: '#0A0A0A', borderBottom: 'none' }}>
                {['Grupo', 'Tipo', 'Diagnósticos', 'Creado', ''].map(h => (
                  <TableHead key={h} style={{ color: '#fff', fontWeight: 700, fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', background: 'transparent' }}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(grupos as Grupo[]).map(g => {
                const tipoConfig = TIPOS_DIAGNOSTICO[g.tipo]
                const cuenta = conteoPorGrupo[g.id] ?? 0
                return (
                  <TableRow key={g.id}>
                    <TableCell>
                      <Link href={`/admin/grupos/${g.id}`} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 600, fontSize: 14 }}>
                        {g.nombre}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px',
                        fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase',
                        fontWeight: 700, background: 'var(--ink)', color: '#fff',
                      }}>{tipoConfig?.etiqueta ?? g.tipo}</span>
                    </TableCell>
                    <TableCell style={{ fontSize: 14, fontWeight: 500 }}>
                      {cuenta} {cuenta === 1 ? 'diagnóstico' : 'diagnósticos'}
                    </TableCell>
                    <TableCell style={{ fontSize: 14, fontWeight: 500 }}>{fechaCorta(g.created_at)}</TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <Link href={`/r/grupo/${g.codigo_resultados}`}
                        target="_blank"
                        style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink)', textDecoration: 'none', border: '1.5px solid var(--ink)', padding: '6px 10px' }}>
                        Comparativo
                      </Link>
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
