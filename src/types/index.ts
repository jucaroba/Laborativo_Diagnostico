export type Rol = 'A' | 'B' | 'C' | 'D'
export type EstadoDiagnostico = 'borrador' | 'activo' | 'completado'

export const ROL_INFO: Record<Rol, { label: string; descripcion: string; color: string }> = {
  A: { label: 'Equipo',          descripcion: 'Auto-evaluación del equipo',          color: '#4A7FA5' },
  B: { label: 'Líder → Equipo', descripcion: 'El líder evalúa al equipo',           color: '#8B7355' },
  C: { label: 'Equipo → Líder', descripcion: 'El equipo evalúa al líder',           color: '#7D3C3C' },
  D: { label: 'Líder auto',     descripcion: 'Auto-evaluación del líder',           color: '#3D6B4F' },
}

export const DIMENSIONES = [
  { id: 1, nombre: 'Intención',   subtitulo: 'Sentido',        pregunta: '¿A dónde vamos?' },
  { id: 2, nombre: 'Motivación',  subtitulo: 'Energía',        pregunta: '¿Por qué?' },
  { id: 3, nombre: 'Interacción', subtitulo: 'Vínculos',       pregunta: '¿Con quién?' },
  { id: 4, nombre: 'Acción',      subtitulo: 'Comportamiento', pregunta: '¿Qué?' },
] as const

export interface Diagnostico {
  id: string
  nombre_compania: string
  contacto_nombre: string
  contacto_cargo: string
  contacto_email: string
  codigo_participacion: string
  codigo_resultados: string
  estado: EstadoDiagnostico
  vertical: string | null
  contexto_ia: string | null
  created_at: string
}

export interface Pregunta {
  id: string
  diagnostico_id: string
  dimension_id: number
  rol: Rol
  texto: string
  orden: number
}

export interface Participante {
  id: string
  diagnostico_id: string
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
