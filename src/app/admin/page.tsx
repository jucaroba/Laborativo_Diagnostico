import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Diagnostico } from '@/types'

const ESTADO_LABEL: Record<string, string> = {
  borrador:   'Borrador',
  activo:     'Activo',
  completado: 'Completado',
}

export const revalidate = 0

export default async function AdminPage() {
  const { data: diagnosticos } = await supabase
    .from('diagnosticos')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--gray-mid)' }}>
            Panel
          </p>
          <div style={{ borderBottom: '2px solid var(--black)', width: 32, marginBottom: 12 }} />
          <h1 className="text-5xl font-black">Diagnósticos</h1>
        </div>
        <Link href="/admin/nuevo"
          className="font-black text-sm px-6 py-3 transition-opacity hover:opacity-70 border-2 border-black"
          style={{ background: 'var(--black)', color: 'var(--bg)' }}>
          + NUEVO
        </Link>
      </div>

      {!diagnosticos?.length ? (
        <div className="py-20 border-t border-black">
          <p className="text-lg font-bold">Aún no hay diagnósticos.</p>
          <p className="text-sm mt-1" style={{ color: 'var(--gray-mid)' }}>Crea el primero para comenzar.</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Header tabla */}
          <div className="grid grid-cols-12 py-2 border-t border-b border-black text-xs font-black uppercase tracking-widest"
            style={{ color: 'var(--gray-mid)' }}>
            <span className="col-span-4">Compañía</span>
            <span className="col-span-3">Contacto</span>
            <span className="col-span-2">Estado</span>
            <span className="col-span-2">Fecha</span>
            <span className="col-span-1">Neón</span>
          </div>

          {diagnosticos.map((d: Diagnostico) => (
            <Link key={d.id} href={`/admin/${d.id}`}
              className="grid grid-cols-12 py-4 border-b border-black hover:bg-black hover:text-white transition-colors items-center group">
              <span className="col-span-4 font-black">{d.nombre_compania}</span>
              <span className="col-span-3 text-sm" style={{ color: 'var(--gray-mid)' }}>
                <span className="group-hover:text-white transition-colors">{d.contacto_nombre}</span>
              </span>
              <span className="col-span-2 text-xs font-bold uppercase tracking-wide">
                {ESTADO_LABEL[d.estado]}
              </span>
              <span className="col-span-2 text-xs" style={{ color: 'var(--gray-mid)' }}>
                <span className="group-hover:text-white transition-colors">
                  {new Date(d.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </span>
              <span className="col-span-1">
                <span className="w-4 h-4 block rounded-sm" style={{ background: d.color_neon }} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
