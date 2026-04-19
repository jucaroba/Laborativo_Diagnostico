import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { Diagnostico, Pregunta, DIMENSIONES, ROL_INFO, Rol } from '@/types'
import AccionesDiagnostico from '@/components/admin/AccionesDiagnostico'

export const revalidate = 0

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://diagnostico.laborativo.com'

export default async function DiagnosticoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: diag } = await supabase.from('diagnosticos').select('*').eq('id', id).single()
  if (!diag) notFound()

  const { data: preguntas } = await supabase
    .from('preguntas')
    .select('*')
    .eq('diagnostico_id', id)
    .order('orden')

  const { data: participantes } = await supabase
    .from('participantes')
    .select('rol')
    .eq('diagnostico_id', id)

  const conteoRoles = { A: 0, B: 0, C: 0, D: 0 }
  for (const p of participantes ?? []) conteoRoles[p.rol as Rol]++

  const d = diag as Diagnostico
  const ps = (preguntas ?? []) as Pregunta[]

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl" style={{ color: 'var(--brown)' }}>{d.nombre_compania}</h1>
          <p className="font-sans text-sm mt-1" style={{ color: 'var(--brown-light)' }}>
            {d.contacto_nombre} · {d.contacto_cargo} · {d.contacto_email}
          </p>
        </div>
        <AccionesDiagnostico diagnostico={d} />
      </div>

      {/* Links */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl" style={{ background: 'white', border: '1px solid var(--cream-dark)' }}>
          <p className="text-xs font-sans uppercase tracking-wide mb-2" style={{ color: 'var(--brown-light)' }}>
            Link de participación
          </p>
          <p className="text-sm font-sans break-all" style={{ color: 'var(--brown-mid)' }}>
            {BASE_URL}/d/{d.codigo_participacion}
          </p>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'white', border: '1px solid var(--cream-dark)' }}>
          <p className="text-xs font-sans uppercase tracking-wide mb-2" style={{ color: 'var(--brown-light)' }}>
            Link de resultados
          </p>
          <p className="text-sm font-sans break-all" style={{ color: 'var(--brown-mid)' }}>
            {BASE_URL}/r/{d.codigo_resultados}
          </p>
        </div>
      </div>

      {/* Participantes */}
      <div>
        <h2 className="text-lg mb-3" style={{ color: 'var(--brown)' }}>Participantes</h2>
        <div className="grid grid-cols-4 gap-3">
          {(['A', 'B', 'C', 'D'] as Rol[]).map(rol => (
            <div key={rol} className="p-4 rounded-xl text-center"
              style={{ background: 'white', border: '1px solid var(--cream-dark)' }}>
              <p className="text-3xl font-medium mb-1" style={{ color: ROL_INFO[rol].color }}>
                {conteoRoles[rol]}
              </p>
              <p className="text-xs font-sans" style={{ color: 'var(--brown-light)' }}>
                {ROL_INFO[rol].label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Preguntas por dimensión */}
      <div>
        <h2 className="text-lg mb-4" style={{ color: 'var(--brown)' }}>
          Preguntas ({ps.length})
        </h2>
        {DIMENSIONES.map(dim => (
          <div key={dim.id} className="mb-6">
            <div className="mb-2">
              <span className="font-medium" style={{ color: 'var(--brown)' }}>{dim.nombre}</span>
              <span className="text-sm font-sans ml-2" style={{ color: 'var(--brown-light)' }}>{dim.subtitulo}</span>
            </div>
            {(['A', 'B', 'C', 'D'] as Rol[]).map(rol => {
              const grupo = ps.filter(p => p.dimension_id === dim.id && p.rol === rol)
              if (!grupo.length) return null
              return (
                <div key={rol} className="mb-3">
                  <p className="text-xs font-sans uppercase tracking-wide mb-1.5"
                    style={{ color: ROL_INFO[rol].color }}>
                    {rol} — {ROL_INFO[rol].label}
                  </p>
                  <div className="flex flex-col gap-1">
                    {grupo.map((p, i) => (
                      <p key={p.id} className="text-sm font-sans pl-3 py-1.5 rounded"
                        style={{ background: 'white', color: 'var(--brown-mid)', border: '1px solid var(--cream-dark)' }}>
                        {i + 1}. {p.texto}
                      </p>
                    ))}
                  </div>
                </div>
              )
            })}
            <div style={{ borderBottom: '1px solid var(--cream-dark)' }} className="mt-4 mb-2" />
          </div>
        ))}
      </div>
    </div>
  )
}
