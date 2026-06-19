// Crea el set de preguntas base "Cultura 360 / 2" (tema nuevo, tipo cultura_360)
// para revisarlo completo sin tocar el set existente "Cultura general".
//
// Estructura espejo: cada dimensión tiene 3 ejes (orden 1, 2, 3) y cada eje se
// formula desde las 4 perspectivas con una FRASE INVARIANTE compartida, de modo
// que la correlación entre roles sea evidente. Las parejas espejo naturales son:
//   A (equipo auto)  ↔ B (líder→equipo)  → ambas sobre EL EQUIPO
//   C (equipo→líder) ↔ D (líder auto)    → ambas sobre EL LÍDER
//
// Orden de presentación (config en tipos-diagnostico.ts): A, C, D, B.
//
// Uso:
//   node --env-file=.env.local --experimental-strip-types --no-warnings scripts/seed-cultura-360-v2.ts

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
if (!url || !serviceKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}
const supabase = createClient(url, serviceKey)

const TEMA_NOMBRE = 'Cultura 360'
const TEMA_DESC = 'Set espejo: cada eje (orden 1/2/3) formula la misma afirmación desde las 4 perspectivas para que la correlación entre roles sea evidente.'

type Rol = 'A' | 'B' | 'C' | 'D'

// Por dimensión, una entrada por eje. Cada eje define la pregunta para los 4 roles.
//   A = equipo auto · C = equipo→líder · D = líder auto · B = líder→equipo
const EJES: Record<number, { A: string; C: string; D: string; B: string }[]> = {
  // ── Dimensión 1 · Intención (Sentido — ¿A dónde vamos?) ──
  1: [
    {
      A: 'Me interesa tener claridad sobre hacia dónde se dirige la organización',
      C: 'Mi líder transmite con claridad hacia dónde se dirige la organización',
      D: 'Transmito con claridad a mi equipo hacia dónde se dirige la organización',
      B: 'Mi equipo tiene claridad sobre hacia dónde se dirige la organización',
    },
    {
      A: 'Me esfuerzo por contribuir con mi trabajo diario al propósito de la organización',
      C: 'Mi líder ayuda a conectar nuestro trabajo diario con el propósito de la organización',
      D: 'Ayudo a mi equipo a conectar su trabajo diario con el propósito de la organización',
      B: 'Mi equipo conecta su trabajo diario con el propósito de la organización',
    },
    {
      A: 'Me involucro con la visión de futuro de la organización',
      C: 'Mi líder transmite una visión de futuro que me entusiasma',
      D: 'Transmito a mi equipo una visión de futuro que los entusiasma',
      B: 'A mi equipo lo entusiasma la visión de futuro que tenemos como organización',
    },
  ],
  // ── Dimensión 2 · Motivación (Energía — ¿Por qué?) ──
  2: [
    {
      A: 'Pongo energía y entusiasmo en mi trabajo diario',
      C: 'Mi líder transmite energía y entusiasmo al equipo',
      D: 'Transmito energía y entusiasmo a mi equipo',
      B: 'Mi equipo trabaja con energía y entusiasmo en su día a día',
    },
    {
      A: 'Reconozco y valoro el esfuerzo y los logros de mis compañeros',
      C: 'Mi líder reconoce oportunamente el esfuerzo y los logros del equipo',
      D: 'Reconozco oportunamente el esfuerzo y los logros de mi equipo',
      B: 'Mi equipo se siente reconocido por su esfuerzo y sus logros',
    },
    {
      A: 'Doy más de lo estrictamente requerido cuando se necesita',
      C: 'Mi líder genera las condiciones para que el equipo dé lo mejor de sí',
      D: 'Genero las condiciones para que mi equipo dé lo mejor de sí',
      B: 'Mi equipo da más de lo estrictamente requerido',
    },
  ],
  // ── Dimensión 3 · Interacción (Vínculos — ¿Con quién?) ──
  3: [
    {
      A: 'Me comunico de forma abierta y honesta con mi equipo',
      C: 'Mi líder mantiene una comunicación abierta y honesta con el equipo',
      D: 'Mantengo una comunicación abierta y honesta con mi equipo',
      B: 'Mi equipo se comunica de forma abierta y honesta',
    },
    {
      A: 'Contribuyo a generar confianza dentro del equipo',
      C: 'Mi líder genera confianza en su relación con el equipo',
      D: 'Genero confianza en mi relación con el equipo',
      B: 'En mi equipo las personas se tienen confianza entre sí',
    },
    {
      A: 'Abordo los desacuerdos del equipo de forma constructiva',
      C: 'Mi líder escucha y aborda los desacuerdos de forma constructiva',
      D: 'Escucho y abordo los desacuerdos del equipo de forma constructiva',
      B: 'Mi equipo aborda los desacuerdos de forma constructiva',
    },
  ],
  // ── Dimensión 4 · Acción (Comportamiento — ¿Qué?) ──
  4: [
    {
      A: 'Cumplo consistentemente con los compromisos que adquiero',
      C: 'Mi líder cumple consistentemente con los compromisos que adquiere',
      D: 'Cumplo consistentemente con los compromisos que adquiero',
      B: 'Mi equipo cumple consistentemente con los compromisos que adquiere',
    },
    {
      A: 'Tomo la iniciativa para actuar y decidir en mi trabajo',
      C: 'Mi líder nos da autonomía para actuar y tomar decisiones',
      D: 'Doy a mi equipo autonomía para actuar y tomar decisiones',
      B: 'Mi equipo actúa con autonomía y toma decisiones por su cuenta',
    },
    {
      A: 'Me adapto con rapidez a los cambios y aprendo de mis errores',
      C: 'Mi líder ayuda al equipo a adaptarse a los cambios y aprender de los errores',
      D: 'Ayudo a mi equipo a adaptarse a los cambios y aprender de los errores',
      B: 'Mi equipo se adapta con rapidez a los cambios y aprende de los errores',
    },
  ],
}

const ROLES: Rol[] = ['A', 'C', 'D', 'B'] // orden de presentación

async function main() {
  // 1) ¿Ya existe el tema? (idempotente: si existe, se borran sus preguntas y se recrean)
  const { data: existente } = await supabase
    .from('temas')
    .select('id')
    .eq('nombre', TEMA_NOMBRE)
    .maybeSingle()

  let temaId: string
  if (existente) {
    temaId = existente.id
    await supabase.from('preguntas_base').delete().eq('tema_id', temaId)
    await supabase.from('temas').update({ descripcion: TEMA_DESC, tipo: 'cultura_360' }).eq('id', temaId)
    console.log(`Tema existente reutilizado (${temaId}); preguntas anteriores eliminadas.`)
  } else {
    const { data: nuevo, error } = await supabase
      .from('temas')
      .insert({ nombre: TEMA_NOMBRE, descripcion: TEMA_DESC, tipo: 'cultura_360' })
      .select('id')
      .single()
    if (error || !nuevo) {
      console.error('No se pudo crear el tema:', error?.message)
      process.exit(1)
    }
    temaId = nuevo.id
    console.log(`Tema creado: "${TEMA_NOMBRE}" (${temaId})`)
  }

  // 2) Construir las 48 filas. orden = índice del eje (1,2,3) dentro de (dimensión, rol).
  const filas: { tema_id: string; tipo: string; dimension_id: number; rol: Rol; texto: string; orden: number }[] = []
  for (const dimIdStr of Object.keys(EJES)) {
    const dimId = Number(dimIdStr)
    EJES[dimId].forEach((eje, i) => {
      for (const rol of ROLES) {
        filas.push({ tema_id: temaId, tipo: 'cultura_360', dimension_id: dimId, rol, texto: eje[rol], orden: i + 1 })
      }
    })
  }

  const { error: insErr } = await supabase.from('preguntas_base').insert(filas)
  if (insErr) {
    console.error('Error insertando preguntas:', insErr.message)
    process.exit(1)
  }

  console.log(`✓ Insertadas ${filas.length} preguntas en "${TEMA_NOMBRE}".`)
  console.log('Revísalo en /admin/preguntas-base')
}

main()
