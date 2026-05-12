// Roles de pregunta/participante.
//   A/B/C/D pertenecen a Cultura 360°.
//   X      perspectiva colectiva única (Pulso, Termómetro).
//   YO     auto-mirada individual (Equipo en Espejo).
//   EQUIPO mirada del grupo (Equipo en Espejo).
// Subtipo de Rol exclusivo de Cultura 360°. Útil para tipar maps que solo
// deben contener las 4 perspectivas cruzadas.
export type Rol360 = 'A' | 'B' | 'C' | 'D'
export type Rol = Rol360 | 'X' | 'YO' | 'EQUIPO'
export type EstadoDiagnostico = 'borrador' | 'activo' | 'completado'

export const ROL_INFO: Record<Rol, { label: string; descripcion: string; color: string }> = {
  A: { label: 'Equipo auto',     descripcion: 'Auto-evaluación del equipo',          color: '#4A7FA5' },
  B: { label: 'Líder → Equipo', descripcion: 'El líder evalúa al equipo',            color: '#8B7355' },
  C: { label: 'Equipo → Líder', descripcion: 'El equipo evalúa al líder',            color: '#7D3C3C' },
  D: { label: 'Líder auto',     descripcion: 'Auto-evaluación del líder',            color: '#3D6B4F' },
  X: { label: 'Colectivo',      descripcion: 'Todo el equipo responde lo mismo',     color: '#0A0A0A' },
  YO: { label: 'Yo individual', descripcion: 'Cómo me veo a mí mismo en el equipo',  color: '#0A0A0A' },
  EQUIPO: { label: 'El equipo', descripcion: 'Cómo veo al equipo en general',        color: '#0A0A0A' },
}

export const DIMENSIONES = [
  { id: 1, nombre: 'Intención',   subtitulo: 'Sentido',        pregunta: '¿A dónde vamos?' },
  { id: 2, nombre: 'Motivación',  subtitulo: 'Energía',        pregunta: '¿Por qué?' },
  { id: 3, nombre: 'Interacción', subtitulo: 'Vínculos',       pregunta: '¿Con quién?' },
  { id: 4, nombre: 'Acción',      subtitulo: 'Comportamiento', pregunta: '¿Qué?' },
] as const

// ─── Modelo de datos ────────────────────────────────────────────────
//   Diagnóstico = compañía cliente (datos de contacto, tipo, contexto IA, preguntas).
//   Equipo      = unidad evaluada dentro de la compañía (color, link de
//                 participación, link de resultados, estado, conteo).
//   Una compañía puede tener N equipos; las preguntas se comparten entre ellos.
export interface Diagnostico {
  id: string
  nombre_compania: string
  contacto_nombre: string
  contacto_cargo: string
  contacto_email: string
  /** Código público de la vista comparativa entre equipos: `/r/c/[codigo]`. */
  codigo_resultados_comparativo: string
  vertical: string | null
  contexto_ia: string | null
  tipo: TipoDiagnostico
  diagnostico_padre_id?: string | null
  ronda?: number
  benchmark_habilitado?: boolean
  created_at: string
}

export interface Equipo {
  id: string
  diagnostico_id: string
  nombre: string
  color_neon: string
  numero_participantes: number | null
  estado: EstadoDiagnostico
  codigo_participacion: string
  codigo_resultados: string
  created_at: string
}

export type TipoDiagnostico =
  | 'cultura_360'
  | 'pulso_colectivo'
  | 'equipo_en_espejo'
  | 'termometro_4'

export interface Pregunta {
  id: string
  diagnostico_id: string
  dimension_id: number
  rol: Rol
  texto: string
  orden: number
}

export interface Tema {
  id: string
  nombre: string
  descripcion: string | null
  tipo?: TipoDiagnostico
  created_at: string
}

export interface Participante {
  id: string
  equipo_id: string
  rol: Rol
  created_at: string
}

export interface Respuesta {
  id: string
  participante_id: string
  pregunta_id: string
  valor: number
}

export interface ResultadoDimension {
  dimension_id: number
  nombre: string
  subtitulo: string
  promedios: Record<Rol, number | null>
  delta: number
}
