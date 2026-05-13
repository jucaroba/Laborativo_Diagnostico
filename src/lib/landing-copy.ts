// ─────────────────────────────────────────────────────────────
// Copy de la landing del participante por tipo de diagnóstico.
// El layout y los estilos son los mismos; cambia el texto y la
// forma de presentar las perspectivas y el proceso.
// ─────────────────────────────────────────────────────────────

import type { TipoDiagnostico } from '@/types'

export type NivelCard = {
  tag: string   // "Mirada 01 · Yo"
  h: string     // "Yo individual"
  p: string     // descripción
}

export type FaseCard = {
  n: string     // "01"
  h: string     // título
  p: string     // descripción
  meta: string  // "5 min · por persona"
}

export type ProductoHeader = {
  producto: string  // "Diagnóstico de Cultura"
  formato: string   // "Mirada 360°"
  tiempo: string    // "5–10 minutos"
}

export type LandingCopy = {
  header: ProductoHeader
  hero: [string, string, string]               // 3 líneas del h1
  introBold: string                              // ej. "4C"
  introTexto: string
  introCierre: string
  eyebrowPerspectivas: string
  tituloPerspectivas: string
  subtituloPerspectivas: string
  niveles: NivelCard[]
  tituloProceso: string
  proceso: FaseCard[]
  // Las dimensiones son fijas (4 dimensiones de cultura) — no van acá.
  tituloDimensiones: string
}

// ─── Cultura 360° (modelo original, 4 perspectivas cruzadas) ────

const CULTURA_360: LandingCopy = {
  header: {
    producto: 'Diagnóstico de Cultura',
    formato: 'Mirada 360°',
    tiempo: '5–10 minutos',
  },
  hero: [
    'exploremos las visiones,',
    'entendamos las oportunidades,',
    'fortalezcamos la cultura.',
  ],
  introBold: '4C',
  introTexto: 'es un modelo de diagnóstico que integra la percepción del equipo y su líder a través de cuatro dimensiones de cultura, haciendo visibles las brechas y habilitando acciones para transformarla.',
  introCierre: 'Un modelo de consultoría creativa basada en la emoción.',
  eyebrowPerspectivas: 'Mirada 360°',
  tituloPerspectivas: 'cuatro puntos de vista\nsobre la misma cultura.',
  subtituloPerspectivas: 'Donde estas miradas coinciden, hay alineación. Donde no, hay una brecha y ahí empieza el trabajo.',
  niveles: [
    { tag: 'Nivel 01 · Individuo',   h: 'Autoevaluación personal', p: 'Cada miembro del equipo se observa a sí mismo en las cuatro dimensiones.' },
    { tag: 'Nivel 02 · Líder',       h: 'Autoevaluación del líder', p: 'El líder se observa a sí mismo en las cuatro dimensiones.' },
    { tag: 'Nivel 03 · Descendente', h: 'Líder evalúa al equipo', p: 'La mirada del líder sobre las conductas colectivas que observa en el equipo.' },
    { tag: 'Nivel 04 · Ascendente',  h: 'Equipo evalúa al líder', p: 'La mirada del equipo sobre las conductas que observa de su líder.' },
  ],
  tituloProceso: 'cuatro fases del diagnóstico.',
  proceso: [
    { n: '01', h: 'Invitación y roles', p: 'Cada persona entra con el enlace compartido y selecciona si responde como miembro del equipo o como líder.', meta: '2 min · administrativo' },
    { n: '02', h: 'Perspectivas del tema', p: 'Autoevaluación de los integrantes del equipo, autoevaluación del líder,\nel líder evalúa al equipo y equipo evalúa al líder.\nDe ahí nacen las brechas.', meta: '4–8 min · por persona' },
    { n: '03', h: 'Preguntas por dimensión', p: 'Cada pregunta se ancla a una de las cuatro dimensiones. Las respuestas se cruzan entre perspectivas para detectar dónde la percepción no coincide con la experiencia.', meta: '4 dimensiones · {N} preguntas' },
    { n: '04', h: 'Mapa de brechas', p: 'Entregamos un reporte visual con las brechas por dimensión, la salud cultural por perspectiva y acciones concretas para cerrar las distancias más críticas.', meta: 'Entrega inmediata · Dashboard' },
  ],
  tituloDimensiones: 'cuatro dimensiones de cultura\npara abordar cualquier reto.',
}

// ─── Pulso Colectivo (una sola mirada del grupo) ───────────────

const PULSO_COLECTIVO: LandingCopy = {
  header: {
    producto: 'Pulso Colectivo',
    formato: 'Una sola mirada',
    tiempo: '4–6 minutos',
  },
  hero: [
    'tomemos el pulso,',
    'leamos lo que sentimos,',
    'movamos lo que falta.',
  ],
  introBold: 'Pulso',
  introTexto: 'es un diagnóstico colectivo que recoge la sensación del equipo en las cuatro dimensiones de cultura. Todos responden las mismas preguntas, sin distinguir líder o miembros.',
  introCierre: 'Una mirada compartida, sin exponer a nadie.',
  eyebrowPerspectivas: 'Mirada colectiva',
  tituloPerspectivas: 'una mirada compartida sobre la cultura.',
  subtituloPerspectivas: 'No hay perspectivas cruzadas. Lo que se mide es el sentir del grupo como un solo cuerpo.',
  niveles: [
    { tag: 'Mirada · Colectiva', h: 'El equipo como un solo cuerpo', p: 'Todas las personas — incluido el líder — responden las mismas preguntas. Lo que sale es el pulso del grupo, sin distinción de rol jerárquico.' },
  ],
  tituloProceso: 'cuatro fases del pulso.',
  proceso: [
    { n: '01', h: 'Invitación', p: 'Cada persona entra con el enlace compartido. No hay selección de rol — todos responden lo mismo.', meta: '30 seg · administrativo' },
    { n: '02', h: 'Una mirada colectiva', p: 'Sin distinguir líder o miembros. El equipo responde como un solo cuerpo.', meta: '4–6 min · por persona' },
    { n: '03', h: 'Preguntas por dimensión', p: 'Cada pregunta se ancla a una de las cuatro dimensiones. Las respuestas se promedian para detectar el pulso del equipo.', meta: '4 dimensiones · {N} preguntas' },
    { n: '04', h: 'Pulso del equipo', p: 'Entregamos un reporte visual con el promedio del equipo por dimensión y la dispersión interna de las respuestas.', meta: 'Entrega inmediata · Dashboard' },
  ],
  tituloDimensiones: 'cuatro dimensiones de cultura, una sola mirada.',
}

// ─── Termómetro de 4 (pulso ultracorto) ────────────────────────

const TERMOMETRO_4: LandingCopy = {
  header: {
    producto: 'Termómetro de 4',
    formato: 'Pulso recurrente',
    tiempo: '30 segundos',
  },
  hero: [
    'un termómetro,',
    'una lectura,',
    'un movimiento.',
  ],
  introBold: 'Termómetro',
  introTexto: 'es un pulso ultracorto: una pregunta por cada dimensión de cultura. Pensado para check-ins recurrentes que detectan movimiento sin reemplazar un diagnóstico profundo.',
  introCierre: 'Cuatro preguntas. Treinta segundos. Repetible.',
  eyebrowPerspectivas: 'Pulso recurrente',
  tituloPerspectivas: 'cuatro preguntas, un termómetro.',
  subtituloPerspectivas: 'Una sola respuesta por dimensión. Diseñado para repetirse en el tiempo y leer movimiento, no profundidad.',
  niveles: [
    { tag: 'Termómetro · Cuatro lecturas', h: 'Una pregunta por dimensión', p: 'No hay perspectivas cruzadas. Cuatro preguntas, una por cada dimensión. Pensado para repetirse cada mes o cada cierre de ciclo.' },
  ],
  tituloProceso: 'tres pasos para tomar la temperatura.',
  proceso: [
    { n: '01', h: 'Invitación', p: 'Cada persona entra con el enlace compartido. Responde 4 preguntas, una por dimensión.', meta: '10 seg · administrativo' },
    { n: '02', h: 'Cuatro respuestas', p: 'Una pregunta por dimensión, escala 1 a 10. Sin más capas.', meta: '30 seg · por persona' },
    { n: '03', h: 'Termómetro del equipo', p: 'Entregamos una lectura visual con la temperatura del equipo en cada dimensión, con marcas claras de "caliente", "tibio" y "frío".', meta: 'Entrega inmediata · Dashboard' },
  ],
  tituloDimensiones: 'cuatro dimensiones, cuatro preguntas.',
}

// ─── Equipo en Espejo (yo vs el equipo) ────────────────────────

const EQUIPO_EN_ESPEJO: LandingCopy = {
  header: {
    producto: 'Equipo en Espejo',
    formato: 'Dos miradas',
    tiempo: '8–12 minutos',
  },
  hero: [
    'mírate a ti,',
    'mira al equipo,',
    'encuentra la distancia.',
  ],
  introBold: 'Espejo',
  introTexto: 'es un diagnóstico que recoge dos miradas por cada persona: cómo te ves a ti mismo y cómo ves al equipo. La distancia entre ambas es lo que se mide.',
  introCierre: 'El líder participa como uno más.',
  eyebrowPerspectivas: 'Dos miradas',
  tituloPerspectivas: 'dos miradas que se encuentran.',
  subtituloPerspectivas: 'No hay líder y equipo. Hay un yo individual y un yo colectivo. Donde se separan, hay tensión; donde se encuentran, hay equipo.',
  niveles: [
    { tag: 'Mirada 01 · Yo',     h: 'Cómo me veo a mí mismo', p: 'Cada persona se observa a sí misma en las cuatro dimensiones, en su comportamiento individual dentro del equipo.' },
    { tag: 'Mirada 02 · Equipo', h: 'Cómo veo al equipo',      p: 'Cada persona observa al equipo como conjunto en las cuatro dimensiones. El líder responde lo mismo, no se distingue.' },
  ],
  tituloProceso: 'cuatro fases del espejo.',
  proceso: [
    { n: '01', h: 'Invitación', p: 'Cada persona entra con el enlace compartido. No hay selección de rol — el líder participa como uno más.', meta: '1 min · administrativo' },
    { n: '02', h: 'Dos miradas', p: 'Cada persona responde dos veces: primero sobre sí misma, después sobre el equipo. Misma temática, distinto sujeto.', meta: '8–12 min · por persona' },
    { n: '03', h: 'Preguntas por dimensión', p: 'Cada pregunta se ancla a una de las cuatro dimensiones. Las respuestas se cruzan entre las dos miradas para detectar la distancia.', meta: '4 dimensiones · {N} preguntas' },
    { n: '04', h: 'Mapa del espejo', p: 'Entregamos un reporte visual con la brecha entre la mirada individual y la colectiva en cada dimensión.', meta: 'Entrega inmediata · Dashboard' },
  ],
  tituloDimensiones: 'cuatro dimensiones de cultura, vistas en dos espejos.',
}

export const LANDING_COPY: Record<TipoDiagnostico, LandingCopy> = {
  cultura_360: CULTURA_360,
  pulso_colectivo: PULSO_COLECTIVO,
  termometro_4: TERMOMETRO_4,
  equipo_en_espejo: EQUIPO_EN_ESPEJO,
}
