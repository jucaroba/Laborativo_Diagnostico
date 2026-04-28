import { Rol } from '@/types'

// Preguntas base ahora viven en la tabla `preguntas_base` de Supabase.
// Editables desde /admin/preguntas-base. Esta interface se mantiene
// porque la usa la generación con IA en src/lib/claude.ts.

export interface PreguntasGeneradas {
  dimension_id: number
  rol: Rol
  preguntas: string[]
}
