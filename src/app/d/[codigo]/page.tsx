import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import SeleccionRol from '@/components/diagnostico/SeleccionRol'

export default async function ParticipantePage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params

  const { data: diag } = await supabase
    .from('diagnosticos')
    .select('id, nombre_compania, estado')
    .eq('codigo_participacion', codigo)
    .single()

  if (!diag || diag.estado !== 'activo') notFound()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--cream)' }}>
      <header className="px-8 py-5" style={{ borderBottom: '1px solid var(--cream-dark)' }}>
        <span className="text-xs font-sans tracking-widest uppercase" style={{ color: 'var(--brown-light)' }}>
          Laborativo · Diagnóstico
        </span>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          <p className="text-sm font-sans mb-2" style={{ color: 'var(--brown-light)' }}>
            {diag.nombre_compania}
          </p>
          <h1 className="text-3xl mb-2" style={{ color: 'var(--brown)' }}>
            ¿Desde qué perspectiva participas?
          </h1>
          <p className="text-sm font-sans mb-8" style={{ color: 'var(--brown-mid)' }}>
            Selecciona tu rol. Las preguntas se adaptarán a tu perspectiva.
          </p>
          <SeleccionRol diagnosticoId={diag.id} />
        </div>
      </main>
    </div>
  )
}
