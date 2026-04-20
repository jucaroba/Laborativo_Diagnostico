import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { Diagnostico, Pregunta, DIMENSIONES, ROL_INFO, Rol } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import AccionesDiagnostico from '@/components/admin/AccionesDiagnostico'
import EliminarDiagnostico from '@/components/admin/EliminarDiagnostico'

export const revalidate = 0

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://diagnostico.laborativo.com'

export default async function DiagnosticoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: diag } = await supabase.from('diagnosticos').select('*').eq('id', id).single()
  if (!diag) notFound()

  const { data: preguntas } = await supabase
    .from('preguntas').select('*').eq('diagnostico_id', id).order('orden')

  const { data: participantes } = await supabase
    .from('participantes').select('rol').eq('diagnostico_id', id)

  const conteoRoles = { A: 0, B: 0, C: 0, D: 0 }
  for (const p of participantes ?? []) conteoRoles[p.rol as Rol]++

  const d = diag as Diagnostico
  const ps = (preguntas ?? []) as Pregunta[]

  return (
    <div style={{ fontFamily: "'Red Hat Display', sans-serif", display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1px', margin: '0 0 6px' }}>{d.nombre_compania}</h1>
          <p style={{ fontSize: 13, color: 'var(--mute)', fontWeight: 500, margin: 0 }}>
            {d.contacto_nombre} · {d.contacto_cargo} · {d.contacto_email}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <EliminarDiagnostico id={d.id} />
          <AccionesDiagnostico diagnostico={d} />
        </div>
      </div>

      {/* Links */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[
          { label: 'Link de participación', url: `${BASE_URL}/d/${d.codigo_participacion}` },
          { label: 'Link de resultados', url: `${BASE_URL}/r/${d.codigo_resultados}` },
        ].map(l => (
          <Card key={l.label}>
            <CardHeader style={{ paddingBottom: 8 }}>
              <CardTitle style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--mute)' }}>
                {l.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ fontSize: 13, wordBreak: 'break-all', fontWeight: 500, margin: 0 }}>{l.url}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Participantes */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.02em', margin: '0 0 12px' }}>Participantes</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {(['A', 'B', 'C', 'D'] as Rol[]).map(rol => (
            <Card key={rol}>
              <CardContent style={{ textAlign: 'center', paddingTop: 20 }}>
                <p style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-1px', margin: '0 0 4px' }}>{conteoRoles[rol]}</p>
                <p style={{ fontSize: 11, color: 'var(--mute)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', margin: 0 }}>{ROL_INFO[rol].label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Preguntas */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.02em', margin: '0 0 16px' }}>
          Preguntas <Badge variant="secondary">{ps.length}</Badge>
        </h2>
        {DIMENSIONES.map(dim => (
          <div key={dim.id} style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 800 }}>{dim.nombre}</span>
              <span style={{ fontSize: 11, color: 'var(--mute)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{dim.subtitulo}</span>
            </div>
            {(['A', 'B', 'C', 'D'] as Rol[]).map(rol => {
              const grupo = ps.filter(p => p.dimension_id === dim.id && p.rol === rol)
              if (!grupo.length) return null
              return (
                <div key={rol} style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--mute)', margin: '0 0 8px' }}>
                    {rol} — {ROL_INFO[rol].label}
                  </p>
                  <Table>
                    <TableBody>
                      {grupo.map((p, i) => (
                        <TableRow key={p.id}>
                          <TableCell style={{ width: 32, color: 'var(--mute)', fontWeight: 700, fontSize: 12 }}>{i + 1}</TableCell>
                          <TableCell style={{ fontSize: 13, fontWeight: 500 }}>{p.texto}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
