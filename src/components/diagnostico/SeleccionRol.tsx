'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ROL_INFO, Rol } from '@/types'
import { ArrowRight } from 'lucide-react'

export default function SeleccionRol({ diagnosticoId }: { diagnosticoId: string }) {
  const router = useRouter()
  const [seleccionado, setSeleccionado] = useState<Rol | null>(null)
  const [loading, setLoading] = useState(false)

  async function comenzar() {
    if (!seleccionado) return
    setLoading(true)

    const { data: participante } = await supabase
      .from('participantes')
      .insert({ diagnostico_id: diagnosticoId, rol: seleccionado })
      .select()
      .single()

    if (participante) {
      localStorage.setItem('participante_id', participante.id)
      router.push(`?rol=${seleccionado}&pid=${participante.id}`)
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-3">
      {(['A', 'B', 'C', 'D'] as Rol[]).map(rol => {
        const info = ROL_INFO[rol]
        const activo = seleccionado === rol
        return (
          <button key={rol} onClick={() => setSeleccionado(rol)}
            className="text-left p-4 rounded-xl border-2 transition-all"
            style={{
              borderColor: activo ? info.color : 'var(--cream-dark)',
              background: activo ? `${info.color}10` : 'white',
            }}>
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-sans font-medium text-white"
                style={{ background: info.color }}>
                {rol}
              </span>
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--brown)' }}>{info.label}</p>
                <p className="text-xs font-sans" style={{ color: 'var(--brown-light)' }}>{info.descripcion}</p>
              </div>
            </div>
          </button>
        )
      })}
      <button onClick={comenzar} disabled={!seleccionado || loading}
        className="mt-2 font-sans text-sm px-5 py-3 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40"
        style={{ background: 'var(--brown)', color: 'var(--cream)' }}>
        {loading ? 'Cargando…' : <>Comenzar evaluación <ArrowRight size={15} strokeWidth={2.5} /></>}
      </button>
    </div>
  )
}
