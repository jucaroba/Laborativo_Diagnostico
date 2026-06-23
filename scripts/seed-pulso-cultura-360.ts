// Crea el set de preguntas base "Cultura 360" para PULSO COLECTIVO.
// Es una versión de una sola perspectiva (rol X) del set 360, redactada en
// primera persona del plural y a nivel ORGANIZACIÓN/EMPRESA (no "equipo").
//
// Tema SEPARADO del "Cultura 360" de tipo cultura_360: se distingue por
// (nombre, tipo) para no tocar el set existente. Idempotente.
//
// Uso:
//   node --env-file=.env.local --experimental-strip-types --no-warnings scripts/seed-pulso-cultura-360.ts

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
if (!url || !serviceKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}
const supabase = createClient(url, serviceKey)

const TEMA_NOMBRE = 'Cultura 360 (Pulso)'
const TEMA_TIPO = 'pulso_colectivo'
const TEMA_DESC = 'Versión pulso (perspectiva colectiva) del set Cultura 360: una afirmación por eje, en primera persona del plural a nivel organización.'

// 4 dimensiones × 3 ejes. Mismo orden temático que el set 360, en plural/empresa.
const PREGUNTAS: Record<number, string[]> = {
  // 1 · Intención (Sentido)
  1: [
    'Tenemos claridad sobre hacia dónde se dirige la organización',
    'Conectamos nuestro trabajo diario con el propósito de la organización',
    'Nos entusiasma la visión de futuro de la organización',
  ],
  // 2 · Motivación (Energía)
  2: [
    'Ponemos energía y entusiasmo en nuestro trabajo diario',
    'Reconocemos y valoramos el esfuerzo y los logros de las personas',
    'Damos más de lo estrictamente requerido cuando se necesita',
  ],
  // 3 · Interacción (Vínculos)
  3: [
    'Nos comunicamos de forma abierta y honesta',
    'Nos tenemos confianza entre nosotros',
    'Abordamos los desacuerdos de forma constructiva',
  ],
  // 4 · Acción (Comportamiento)
  4: [
    'Cumplimos consistentemente con los compromisos que adquirimos',
    'Actuamos con autonomía y tomamos decisiones por nuestra cuenta',
    'Nos adaptamos con rapidez a los cambios y aprendemos de los errores',
  ],
}

async function main() {
  // 1) Tema (idempotente por nombre + tipo, sin tocar el "Cultura 360" de 360)
  const { data: existente } = await supabase
    .from('temas')
    .select('id')
    .eq('nombre', TEMA_NOMBRE)
    .eq('tipo', TEMA_TIPO)
    .maybeSingle()

  let temaId: string
  if (existente) {
    temaId = existente.id
    await supabase.from('preguntas_base').delete().eq('tema_id', temaId)
    await supabase.from('temas').update({ descripcion: TEMA_DESC, tipo: TEMA_TIPO }).eq('id', temaId)
    console.log(`Tema pulso existente reutilizado (${temaId}); preguntas anteriores eliminadas.`)
  } else {
    const { data: nuevo, error } = await supabase
      .from('temas')
      .insert({ nombre: TEMA_NOMBRE, descripcion: TEMA_DESC, tipo: TEMA_TIPO })
      .select('id')
      .single()
    if (error || !nuevo) {
      console.error('No se pudo crear el tema:', error?.message)
      process.exit(1)
    }
    temaId = nuevo.id
    console.log(`Tema pulso creado: "${TEMA_NOMBRE}" (${temaId})`)
  }

  // 2) Preguntas base (rol X, una por eje)
  const filas: { tema_id: string; tipo: string; dimension_id: number; rol: string; texto: string; orden: number }[] = []
  for (const dimStr of Object.keys(PREGUNTAS)) {
    const dimId = Number(dimStr)
    PREGUNTAS[dimId].forEach((texto, i) => {
      filas.push({ tema_id: temaId, tipo: TEMA_TIPO, dimension_id: dimId, rol: 'X', texto, orden: i + 1 })
    })
  }

  const { error: insErr } = await supabase.from('preguntas_base').insert(filas)
  if (insErr) {
    console.error('No se pudieron insertar las preguntas base:', insErr.message)
    process.exit(1)
  }
  console.log(`Insertadas ${filas.length} preguntas base (rol X) para el pulso "Cultura 360".`)
}

main().then(() => process.exit(0))
