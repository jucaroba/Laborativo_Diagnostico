import Anthropic from '@anthropic-ai/sdk'
import { PreguntasGeneradas } from '@/lib/preguntas-base'

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
