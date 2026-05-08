import Anthropic from '@anthropic-ai/sdk'
import { PreguntasGeneradas } from '@/lib/preguntas-base'
import { Rol } from '@/types'

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

export async function generarPreguntas(params: {
  tema: string
  vertical: string
  contexto: string
}): Promise<PreguntasGeneradas[]> {
  const { tema, vertical, contexto } = params

  const prompt = `Eres un experto en cultura organizacional y diagnóstico de equipos.

Vas a generar preguntas de diagnóstico para el tema "${tema}"${vertical ? ` aplicado al sector "${vertical}"` : ''}.

${contexto ? `Contexto y enfoque del tema:\n${contexto}\n` : ''}
El diagnóstico evalúa 4 dimensiones desde 4 perspectivas (roles):
- Rol A: Equipo haciendo auto-evaluación
- Rol B: Líder evaluando al equipo
- Rol C: Equipo evaluando al líder
- Rol D: Líder haciendo auto-evaluación

Las 4 dimensiones:
1. Intención (Sentido) — ¿A dónde vamos?
2. Motivación (Energía) — ¿Por qué?
3. Interacción (Vínculos) — ¿Con quién?
4. Acción (Comportamiento) — ¿Qué?

Genera 3 preguntas por cada combinación dimensión × rol (48 preguntas en total).
Las preguntas deben:
- Responderse en escala 1-10
- Ser afirmaciones que el participante evalúa (no preguntas abiertas)
- Estar contextualizadas al tema${vertical ? ` y al sector` : ''}
- Variar en perspectiva según el rol (misma temática, diferente ángulo)

Responde ÚNICAMENTE con un JSON con esta estructura exacta:
{
  "preguntas": [
    { "dimension_id": 1, "rol": "A", "texto": "..." },
    ...
  ]
}
`

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Respuesta inesperada de Claude')

  const cleaned = content.text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()
  const json = JSON.parse(cleaned)

  const mapa: Record<string, PreguntasGeneradas> = {}
  for (const p of json.preguntas) {
    const key = `${p.dimension_id}-${p.rol}`
    if (!mapa[key]) mapa[key] = { dimension_id: p.dimension_id, rol: p.rol, preguntas: [] }
    mapa[key].preguntas.push(p.texto)
  }

  return Object.values(mapa)
}

// ──────────────────────────────────────────────────────────────
// Regenerar la interpretación de un arquetipo (brechas o
// relaciones) con los mismos datos pero un ángulo distinto.
// No cambia tag ni patrón (son data); cambia solo el copy.
// ──────────────────────────────────────────────────────────────

export type ArquetipoFields = {
  titulo: string
  resumen: string
  cuerpo: string
  cita: string
  accion: string
}

const ROL_LABEL: Record<Rol, string> = {
  A: 'Equipo auto',
  B: 'Líder → Equipo',
  C: 'Equipo → Líder',
  D: 'Líder auto',
}
const DIM_LABEL: Record<number, string> = {
  1: 'Intención (sentido)',
  2: 'Motivación (energía)',
  3: 'Interacción (vínculos)',
  4: 'Acción (comportamiento)',
}

const round1 = (n: number | null): string => n === null ? '—' : (Math.round(n * 10) / 10).toFixed(1)

export async function regenerarArquetipo(params: {
  tipo: 'brechas' | 'relaciones'
  promediosPorRol: Record<Rol, Record<number, number | null>>
  promedioGlobalPorRol: Record<Rol, number | null>
  promedioDim: Record<number, number | null>
  deltaDim: Record<number, number>
  actual: ArquetipoFields & { tag: string }
}): Promise<ArquetipoFields> {
  const { tipo, promediosPorRol, promedioGlobalPorRol, promedioDim, deltaDim, actual } = params

  const filaRol = (r: Rol) => `${ROL_LABEL[r].padEnd(16)} Int=${round1(promediosPorRol[r][1])}  Mot=${round1(promediosPorRol[r][2])}  Inte=${round1(promediosPorRol[r][3])}  Acc=${round1(promediosPorRol[r][4])}  | global=${round1(promedioGlobalPorRol[r])}`

  const tablaDatos = `
Promedios por (perspectiva × dimensión) — escala 1–10:
${(['A','B','C','D'] as Rol[]).map(filaRol).join('\n')}

Promedio global por dimensión:
Intención=${round1(promedioDim[1])}  Motivación=${round1(promedioDim[2])}  Interacción=${round1(promedioDim[3])}  Acción=${round1(promedioDim[4])}

Brechas (Δ entre perspectivas) por dimensión:
Intención Δ=${deltaDim[1].toFixed(1)}  Motivación Δ=${deltaDim[2].toFixed(1)}  Interacción Δ=${deltaDim[3].toFixed(1)}  Acción Δ=${deltaDim[4].toFixed(1)}
`.trim()

  const focoTexto = tipo === 'brechas'
    ? 'BRECHAS ENTRE PERSPECTIVAS — qué nos dice la distancia entre cómo se miran los distintos roles, sobre todo el par más distante mencionado en el tag.'
    : 'RELACIONES ENTRE DIMENSIONES — cómo se sostienen entre sí las cuatro dimensiones; qué dice la dimensión más floja sobre el resto.'

  const prompt = `Eres un consultor experto de Laborativo en cultura organizacional, diagnóstico de equipos y consultoría creativa basada en la emoción.

CONTEXTO DEL DIAGNÓSTICO
Cada diagnóstico evalúa cuatro dimensiones desde cuatro perspectivas:
- A · Equipo auto: cómo el equipo se mira a sí mismo
- B · Líder → Equipo: cómo el líder ve al equipo
- C · Equipo → Líder: cómo el equipo ve al líder
- D · Líder auto: cómo el líder se mira a sí mismo

Las cuatro dimensiones:
${Object.entries(DIM_LABEL).map(([id, l]) => `- ${id}. ${l}`).join('\n')}

DATOS REALES DEL DIAGNÓSTICO
${tablaDatos}

LECTURA PREVIA (la que NO debes repetir)
Tag: ${actual.tag}
Título: ${actual.titulo}
Resumen: ${actual.resumen}
Cuerpo: ${actual.cuerpo}
Cita: ${actual.cita}
Acción sugerida: ${actual.accion}

TU TAREA
Ofrece OTRA lectura del mismo dato, con foco en ${focoTexto}
No es una versión "mejor" — es otra angulación. Cambia el ángulo, la metáfora y el énfasis, pero mantén la coherencia con las cifras.

Estilo Laborativo:
- Profesional, cálido, directo, sin lugares comunes ni jerga consultora.
- Evita repetir frases de la lectura previa ("dos espejos", "motor frío", "lo que se dice no llega al hacer", etc.).
- Sin emojis. Sin signos de exclamación. Tono adulto.

Responde ÚNICAMENTE con un JSON con esta estructura exacta y nada más:
{
  "titulo": "máx 7 palabras, sin punto final",
  "resumen": "una frase, máx 25 palabras",
  "cuerpo": "2 a 3 oraciones, máx 70 palabras",
  "cita": "una frase corta entre comillas, en voz natural",
  "accion": "máx 9 palabras, en sustantivo (ej: 'Espacio de escucha entre líder y equipo')"
}`

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Respuesta inesperada de Claude')

  const cleaned = content.text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()

  const json = JSON.parse(cleaned) as ArquetipoFields
  return {
    titulo:  String(json.titulo  ?? '').trim(),
    resumen: String(json.resumen ?? '').trim(),
    cuerpo:  String(json.cuerpo  ?? '').trim(),
    cita:    String(json.cita    ?? '').trim(),
    accion:  String(json.accion  ?? '').trim(),
  }
}
