import { DIMENSIONES, Rol } from '@/types'

export type ArquetipoCtx = {
  promedioDim: Record<number, number | null>
  deltaDim: Record<number, number>
  promediosPorRol: Record<Rol, Record<number, number | null>>
  promedioGlobalPorRol: Record<Rol, number | null>
}

export type Arquetipo = {
  id: string
  tag: string
  titulo: string
  resumen: string
  cuerpo: string
  cita: string
  patron: string
  accion: string
}

const dimNombre = (id: number) => DIMENSIONES.find(d => d.id === id)?.nombre ?? ''

// ─────────────────────────────────────────────────────────
// 1) Brechas entre perspectivas — par de roles más distante
//    medido sobre el promedio global por rol (todas las dims)
// ─────────────────────────────────────────────────────────

const ROL_LABEL_CORTO: Record<Rol, string> = {
  A: 'Equipo auto',
  B: 'Líder → Equipo',
  C: 'Equipo → Líder',
  D: 'Líder auto',
}

const ORDEN_ROL: Rol[] = ['A', 'B', 'C', 'D']

type ParKey = 'A-B' | 'A-C' | 'A-D' | 'B-C' | 'B-D' | 'C-D'

const PARES_TEXTOS: Record<ParKey, Omit<Arquetipo, 'patron' | 'tag'>> = {
  'A-B': {
    id: 'espejo-equipo',
    titulo: 'El equipo y su reflejo',
    resumen: 'Lo que el equipo siente de sí mismo no coincide con cómo lo lee el líder.',
    cuerpo: 'La autoevaluación del equipo y la mirada del líder hacia él se alejan globalmente. Hay una desconexión entre la experiencia interna del grupo y la lectura que hace quien lo lidera.',
    cita: 'Lo que vivimos no es lo que se está leyendo.',
    accion: 'Espacio de escucha entre líder y equipo',
  },
  'A-C': {
    id: 'equipo-doble-mirada',
    titulo: 'El equipo se mira distinto al líder',
    resumen: 'El equipo se evalúa de un modo y evalúa al líder de otro muy distinto.',
    cuerpo: 'Cuando el equipo habla de sí mismo y cuando habla de su líder, da dos lecturas que no convergen. La distancia revela que la relación con quien lidera ocupa un lugar muy particular en su experiencia.',
    cita: 'Una cosa somos nosotros. Otra muy distinta es el liderazgo.',
    accion: 'Conversar el rol del líder en la experiencia del equipo',
  },
  'A-D': {
    id: 'niveles-en-paralelo',
    titulo: 'Niveles que no se hablan',
    resumen: 'El líder y el equipo se evalúan a sí mismos desde lugares muy distintos.',
    cuerpo: 'Cuando el equipo se mira a sí mismo y cuando el líder se mira a sí mismo, las lecturas se alejan. Cada nivel está habitando una versión distinta de la misma organización.',
    cita: 'Trabajamos en la misma compañía. No sé si en la misma realidad.',
    accion: 'Espacios de encuentro entre niveles',
  },
  'B-C': {
    id: 'miradas-cruzadas',
    titulo: 'Las miradas cruzadas no se cruzan',
    resumen: 'El líder ve al equipo de un modo y el equipo lee al líder de otro muy distinto.',
    cuerpo: 'Las dos miradas externas — la del líder hacia su gente y la del equipo hacia su líder — divergen. La forma en que cada uno percibe al otro está construyendo realidades en paralelo.',
    cita: 'Si yo te miro así y tú me ves así, ¿en qué quedamos?',
    accion: 'Diálogo de feedback bidireccional',
  },
  'B-D': {
    id: 'lider-dos-espejos',
    titulo: 'El líder en dos espejos',
    resumen: 'El líder se evalúa a sí mismo de un modo y al equipo de otro muy distinto.',
    cuerpo: 'Cuando el líder mira hacia adentro y cuando mira hacia su gente, las notas se separan. Esa distancia muestra cómo percibe su rol frente a cómo percibe al colectivo que conduce.',
    cita: 'Yo voy bien. El equipo, otra historia.',
    accion: 'Reflexión sobre el rol del líder respecto al equipo',
  },
  'C-D': {
    id: 'lecturas-no-cruzan',
    titulo: 'Lecturas que no se cruzan',
    resumen: 'El líder y el equipo no están viendo el liderazgo del mismo modo.',
    cuerpo: 'El líder se evalúa con notas distintas a las que recibe del equipo. La autopercepción y la lectura externa están en planos diferentes — lo que se siente como fortaleza desde adentro no se está leyendo así desde afuera.',
    cita: 'Yo creía que íbamos bien en eso.',
    accion: 'Conversación de feedback entre líder y equipo',
  },
}

export function evaluarBrechas(ctx: ArquetipoCtx): Arquetipo {
  const conValor = ORDEN_ROL.filter(r => typeof ctx.promedioGlobalPorRol[r] === 'number')

  if (conValor.length < 2) {
    return {
      id: 'sin-datos-perspectivas',
      tag: 'Perspectivas',
      titulo: 'Aún no hay suficiente lectura',
      resumen: 'Faltan perspectivas para detectar la relación más distante.',
      cuerpo: 'Para identificar la brecha entre miradas hace falta tener al menos dos perspectivas con respuestas. Cuando se completen, esta lectura podrá hacerse.',
      cita: 'Todavía no se puede decir mucho.',
      patron: '—',
      accion: 'Completar las perspectivas pendientes',
    }
  }

  let mejor: { a: Rol; b: Rol; diff: number } | null = null
  for (let i = 0; i < conValor.length; i++) {
    for (let j = i + 1; j < conValor.length; j++) {
      const a = conValor[i], b = conValor[j]
      const va = ctx.promedioGlobalPorRol[a]!
      const vb = ctx.promedioGlobalPorRol[b]!
      const diff = Math.abs(va - vb)
      if (!mejor || diff > mejor.diff) mejor = { a, b, diff }
    }
  }

  if (!mejor || mejor.diff < 1) {
    return {
      id: 'lecturas-convergentes',
      tag: 'Todas las perspectivas',
      titulo: 'Mirada compartida',
      resumen: 'Las perspectivas convergen en cómo leen la organización.',
      cuerpo: 'Las diferencias entre las miradas son bajas. No significa que todo esté resuelto, pero sí que existe una base común desde la cual conversar y construir.',
      cita: 'Cuando todos vemos lo mismo, lo difícil deja de ser ponerse de acuerdo.',
      patron: `Distancia máxima entre roles = ${(mejor?.diff ?? 0).toFixed(1)}`,
      accion: 'Aprovechar el alineamiento para abordar retos de fondo',
    }
  }

  const [r1, r2] = [mejor.a, mejor.b].sort((x, y) => ORDEN_ROL.indexOf(x) - ORDEN_ROL.indexOf(y))
  const key = `${r1}-${r2}` as ParKey
  const texto = PARES_TEXTOS[key]
  const v1 = ctx.promedioGlobalPorRol[r1]!
  const v2 = ctx.promedioGlobalPorRol[r2]!

  return {
    ...texto,
    tag: `${ROL_LABEL_CORTO[r1]} ↔ ${ROL_LABEL_CORTO[r2]}`,
    patron: `${ROL_LABEL_CORTO[r1]} = ${v1.toFixed(1)} · ${ROL_LABEL_CORTO[r2]} = ${v2.toFixed(1)} · Δ = ${mejor.diff.toFixed(1)}`,
  }
}

// ─────────────────────────────────────────────────────────
// 2) Dimensiones — la dimensión con menor promedio
// ─────────────────────────────────────────────────────────

const DIM_TEXTOS: Record<number, Omit<Arquetipo, 'patron' | 'tag'>> = {
  // 1 · Intención (Sentido)
  1: {
    id: 'dim-baja-intencion',
    titulo: 'Sin un norte compartido',
    resumen: 'La dirección a dónde se va es la pieza más floja de la organización.',
    cuerpo: 'De las cuatro dimensiones, Intención sostiene la nota más baja. La organización avanza, pero el sentido de hacia dónde va está más débil que su energía, sus vínculos o sus comportamientos. Sin un norte claro, el resto se gasta en círculos.',
    cita: 'Si no sabemos a dónde vamos, cualquier camino sirve.',
    accion: 'Construir un propósito y dirección compartidos',
  },
  // 2 · Motivación (Energía)
  2: {
    id: 'dim-baja-motivacion',
    titulo: 'El motor frío',
    resumen: 'La energía es la pieza más débil. Hay dirección y vínculos, pero falta gasolina.',
    cuerpo: 'Motivación es la dimensión con la nota más baja. La organización tiene ideas, sabe a dónde ir y tiene relaciones, pero la energía para sostener el movimiento se ha desgastado. Sin esa fuerza, todo lo demás se vuelve más pesado de cargar.',
    cita: 'Sabemos qué hacer. Solo falta querer hacerlo otra vez.',
    accion: 'Recuperar la conexión emocional con el trabajo',
  },
  // 3 · Interacción (Vínculos)
  3: {
    id: 'dim-baja-interaccion',
    titulo: 'El tejido frágil',
    resumen: 'Los vínculos son la pieza más débil. La organización avanza, pero menos como tejido.',
    cuerpo: 'Interacción es la dimensión con la nota más baja. Hay propósito, energía y ejecución, pero la calidad de las relaciones entre las personas no acompaña al resto. Cuando el vínculo flaquea, sostener cualquier avance se vuelve costoso.',
    cita: 'Cumplimos. Cada quien por su lado.',
    accion: 'Reconstrucción del vínculo y la confianza',
  },
  // 4 · Acción (Comportamiento)
  4: {
    id: 'dim-baja-accion',
    titulo: 'Lo que se dice no llega al hacer',
    resumen: 'El comportamiento es la pieza más floja. Hay claridad y energía, pero no se traduce en práctica.',
    cuerpo: 'Acción es la dimensión con la nota más baja. Existe sentido, ganas y vínculos, pero todo eso no termina de aterrizar en hábitos, decisiones y entregas concretas. Lo que se dice en la sala no se ve en el día a día.',
    cita: 'Suena bien. Pero al lunes no llega.',
    accion: 'Diseño de rituales y acuerdos operativos',
  },
}

export function evaluarRelaciones(ctx: ArquetipoCtx): Arquetipo {
  const conValor: Array<{ id: number; val: number }> = []
  for (const d of DIMENSIONES) {
    const val = ctx.promedioDim[d.id]
    if (typeof val === 'number') conValor.push({ id: d.id, val })
  }

  if (conValor.length === 0) {
    return {
      id: 'sin-datos-dim',
      tag: 'Dimensiones',
      titulo: 'Sin lecturas todavía',
      resumen: 'No hay datos suficientes para detectar la dimensión más débil.',
      cuerpo: 'Cuando lleguen las respuestas se podrá ver qué dimensión sostiene el promedio más bajo.',
      cita: '—',
      patron: '—',
      accion: 'Esperar a que ingresen las respuestas',
    }
  }

  const ordenadas = [...conValor].sort((a, b) => a.val - b.val)
  const baja = ordenadas[0]
  const max = Math.max(...conValor.map(x => x.val))
  const rango = max - baja.val

  if (rango < 0.8) {
    return {
      id: 'equilibrio',
      tag: 'Todas las dimensiones',
      titulo: 'Movimiento integrado',
      resumen: 'Las cuatro dimensiones se sostienen entre sí, sin contrastes marcados.',
      cuerpo: 'No hay una dimensión que esté muy por debajo del resto. La organización avanza con un equilibrio razonable entre sentido, energía, vínculo y comportamiento. Cuando una pieza cojea, las otras la sostienen.',
      cita: 'Cuando todo se sostiene, el siguiente nivel es atreverse a más.',
      patron: `Rango entre dimensiones = ${rango.toFixed(1)}`,
      accion: 'Identificar la próxima ambición que estire al equipo',
    }
  }

  const texto = DIM_TEXTOS[baja.id]
  return {
    ...texto,
    tag: dimNombre(baja.id),
    patron: `${dimNombre(baja.id)} = ${baja.val.toFixed(1)} · más baja de las cuatro dimensiones`,
  }
}
