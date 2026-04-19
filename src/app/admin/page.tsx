import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Diagnostico } from '@/types'

const ESTADO_LABEL: Record<string, { label: string; color: string }> = {
  borrador:   { label: 'Borrador',   color: '#9B8B74' },
  activo:     { label: 'Activo',     color: '#3D6B4F' },
  completado: { label: 'Completado', color: '#4A7FA5' },
}

export const revalidate = 0

export default async function AdminPage() {
  const { data: diagnosticos } = await supabase
    .from('diagnosticos')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl" style={{ color: 'var(--brown)' }}>Diagnósticos</h1>
          <p className="text-sm font-sans mt-1" style={{ color: 'var(--brown-light)' }}>
            {diagnosticos?.length ?? 0} en total
          </p>
        </div>
        <Link href="/admin/nuevo"
          className="font-sans text-sm px-5 py-2.5 rounded-lg transition-opacity hover:opacity-80"
          style={{ background: 'var(--brown)', color: 'var(--cream)' }}>
          + Nuevo diagnóstico
        </Link>
      </div>

      {!diagnosticos?.length ? (
        <div className="text-center py-20" style={{ color: 'var(--brown-light)' }}>
          <p className="text-lg">Aún no hay diagnósticos</p>
          <p className="text-sm font-sans mt-1">Crea el primero para comenzar</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {diagnosticos.map((d: Diagnostico) => {
            const estado = ESTADO_LABEL[d.estado]
            return (
              <Link key={d.id} href={`/admin/${d.id}`}
                className="flex items-center justify-between px-6 py-4 rounded-xl transition-opacity hover:opacity-80"
                style={{ background: 'white', border: '1px solid var(--cream-dark)' }}>
                <div>
                  <p className="font-medium" style={{ color: 'var(--brown)' }}>{d.nombre_compania}</p>
                  <p className="text-sm font-sans mt-0.5" style={{ color: 'var(--brown-light)' }}>
                    {d.contacto_nombre} · {d.contacto_cargo}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-sans" style={{ color: 'var(--brown-light)' }}>
                    {new Date(d.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="text-xs font-sans px-3 py-1 rounded-full"
                    style={{ background: `${estado.color}18`, color: estado.color }}>
                    {estado.label}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
