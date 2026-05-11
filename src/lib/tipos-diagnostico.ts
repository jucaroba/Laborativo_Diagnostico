// ─────────────────────────────────────────────────────────────────
// Catálogo de tipos de diagnóstico.
// Las llaves son las almacenadas en DB; los nombres son comerciales.
// ─────────────────────────────────────────────────────────────────

export type TipoDiagnostico =
  | 'cultura_360'
  | 'pulso_colectivo'
  | 'equipo_en_espejo'
  | 'termometro_4'

export type RolPregunta = 'A' | 'B' | 'C' | 'D' | 'X' | 'YO' | 'EQUIPO'

export type TipoConfig = {
  key: TipoDiagnostico
  nombre: string            // Nombre comercial (badge / títulos)
  bullet: string            // Subtítulo corto para la card
  descripcion: string       // Texto largo para la card
  // Roles de pregunta que existen en este tipo (qué llena el cuestionario)
  rolesPregunta: ReadonlyArray<RolPregunta>
  // Roles que se asignan al participante (qué se guarda en participantes.rol).
  // Para tipos sin distinción de líder/equipo el participante queda como 'X'
  // y responde todos los rolesPregunta.
  rolesParticipante: ReadonlyArray<RolPregunta>
  // Si false, aparece como tarjeta pero no se puede seleccionar.
  disponible: boolean
  // Etiqueta corta (para chips/badges)
  etiqueta: string
}

export const TIPOS_DIAGNOSTICO: Record<TipoDiagnostico, TipoConfig> = {
  cultura_360: {
    key: 'cultura_360',
    nombre: 'Cultura 360°',
    bullet: 'Cuatro perspectivas cruzadas',
    descripcion: 'El equipo se autoevalúa, el líder se autoevalúa, el líder evalúa al equipo y el equipo evalúa al líder. Cuatro miradas sobre las mismas dimensiones — donde no coinciden, hay una brecha.',
    rolesPregunta: ['A', 'B', 'C', 'D'],
    rolesParticipante: ['A', 'D'],
    disponible: true,
    etiqueta: '360°',
  },
  pulso_colectivo: {
    key: 'pulso_colectivo',
    nombre: 'Pulso Colectivo',
    bullet: 'Una sola mirada del grupo',
    descripcion: 'Todo el equipo responde las mismas preguntas, sin distinguir líder o miembros. Mide la sensación general del grupo en las cuatro dimensiones de cultura.',
    rolesPregunta: ['X'],
    rolesParticipante: ['X'],
    disponible: false,
    etiqueta: 'Pulso',
  },
  equipo_en_espejo: {
    key: 'equipo_en_espejo',
    nombre: 'Equipo en Espejo',
    bullet: 'Yo individual vs equipo colectivo',
    descripcion: 'Cada persona responde dos veces: cómo se ve a sí misma y cómo ve al equipo. El líder participa como uno más. La distancia entre lo individual y lo colectivo es lo que se mide.',
    rolesPregunta: ['YO', 'EQUIPO'],
    rolesParticipante: ['X'],
    disponible: false,
    etiqueta: 'Espejo',
  },
  termometro_4: {
    key: 'termometro_4',
    nombre: 'Termómetro de 4',
    bullet: 'Cuatro preguntas, una por dimensión',
    descripcion: 'Pulso ultracorto, una pregunta por dimensión. Pensado para check-ins recurrentes que no reemplazan un diagnóstico profundo pero detectan movimiento.',
    rolesPregunta: ['X'],
    rolesParticipante: ['X'],
    disponible: false,
    etiqueta: 'Termómetro',
  },
}

export const TIPOS_LIST: TipoConfig[] = [
  TIPOS_DIAGNOSTICO.cultura_360,
  TIPOS_DIAGNOSTICO.pulso_colectivo,
  TIPOS_DIAGNOSTICO.equipo_en_espejo,
  TIPOS_DIAGNOSTICO.termometro_4,
]
