import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import IntakeForm from '@/components/diagnostico/IntakeForm'
import EstadoNoDisponible from '@/components/diagnostico/EstadoNoDisponible'
import type { TipoDiagnostico } from '@/types'

export default async function IntakePage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params

  // Resolución por equipo: el código identifica a UN equipo dentro de una compañía.
  const { data: equipo } = await supabase
    .from('equipos')
    .select('id, diagnostico_id, estado')
    .eq('codigo_participacion', codigo)
    .single()

  if (!equipo) notFound()

  const { data: diag } = await supabase
    .from('diagnosticos')
    .select('id, nombre_compania, tipo')
    .eq('id', equipo.diagnostico_id)
    .single()

  if (!diag) notFound()
  if (equipo.estado !== 'activo') {
    return <EstadoNoDisponible estado={equipo.estado as 'borrador' | 'completado'} nombreCompania={diag.nombre_compania} />
  }

  const { data: preguntas } = await supabase
    .from('preguntas')
    .select('rol')
    .eq('diagnostico_id', diag.id)

  const conteo: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, X: 0, YO: 0, EQUIPO: 0 }
  for (const p of preguntas ?? []) conteo[p.rol] = (conteo[p.rol] ?? 0) + 1

  // Para tipos sin perfil (pulso, termómetro, espejo) el "preguntasColectivo"
  // es la suma de todos los roles del tipo. Espejo tiene YO + EQUIPO; los
  // demás tienen solo X.
  const tipoActual = (diag.tipo ?? 'cultura_360') as TipoDiagnostico
  const preguntasColectivo =
    tipoActual === 'equipo_en_espejo' ? conteo.YO + conteo.EQUIPO
    : conteo.X

  return (
    <IntakeForm
      equipoId={equipo.id}
      nombreCompania={diag.nombre_compania}
      codigo={codigo}
      tipo={tipoActual}
      preguntasEquipo={conteo.A + conteo.C}
      preguntasLider={conteo.D + conteo.B}
      preguntasColectivo={preguntasColectivo}
    />
  )
}
