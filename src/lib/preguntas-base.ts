import { Rol } from '@/types'

export interface PreguntasGeneradas {
  dimension_id: number
  rol: Rol
  preguntas: string[]
}

export const PREGUNTAS_BASE: PreguntasGeneradas[] = [
  { dimension_id: 1, rol: 'A', preguntas: [
    'Tengo claridad sobre hacia dónde se dirige nuestra organización',
    'El propósito de la empresa resuena con mis valores personales',
    'El equipo comparte una visión común del futuro',
  ]},
  { dimension_id: 1, rol: 'B', preguntas: [
    'El equipo comprende claramente los objetivos estratégicos de la organización',
    'Las personas del equipo alinean su trabajo diario con la visión de la empresa',
    'El equipo actúa con sentido de propósito compartido',
  ]},
  { dimension_id: 1, rol: 'C', preguntas: [
    'Mi líder comunica con claridad hacia dónde vamos como organización',
    'Mi líder conecta el trabajo del equipo con el propósito mayor de la empresa',
    'Mi líder inspira con su visión del futuro',
  ]},
  { dimension_id: 1, rol: 'D', preguntas: [
    'Comunico con claridad la dirección estratégica a mi equipo',
    'Conecto consistentemente el trabajo diario con el propósito de la organización',
    'Tengo una visión clara de hacia dónde quiero llevar a mi equipo',
  ]},
  { dimension_id: 2, rol: 'A', preguntas: [
    'Me siento motivado para dar lo mejor de mí en esta organización',
    'Encuentro energía y significado en el trabajo que realizo',
    'Las condiciones de trabajo me permiten mantener mi motivación',
  ]},
  { dimension_id: 2, rol: 'B', preguntas: [
    'El equipo muestra genuino entusiasmo por su trabajo',
    'Las personas del equipo van más allá de lo estrictamente requerido',
    'El equipo mantiene su energía incluso en momentos de dificultad',
  ]},
  { dimension_id: 2, rol: 'C', preguntas: [
    'Mi líder reconoce y celebra los logros del equipo',
    'Mi líder genera condiciones para que el equipo se sienta motivado',
    'Mi líder muestra genuino interés por el bienestar del equipo',
  ]},
  { dimension_id: 2, rol: 'D', preguntas: [
    'Genero activamente condiciones para que mi equipo se mantenga motivado',
    'Reconozco oportunamente los logros y esfuerzos de las personas',
    'Mi propio nivel de energía y motivación impulsa positivamente al equipo',
  ]},
  { dimension_id: 3, rol: 'A', preguntas: [
    'La comunicación dentro del equipo es abierta y fluida',
    'Existe confianza entre los miembros del equipo',
    'Los conflictos se abordan de manera constructiva en el equipo',
  ]},
  { dimension_id: 3, rol: 'B', preguntas: [
    'El equipo colabora efectivamente entre sí',
    'Las personas del equipo se apoyan mutuamente en los momentos difíciles',
    'El equipo construye relaciones de confianza con otras áreas',
  ]},
  { dimension_id: 3, rol: 'C', preguntas: [
    'Mi líder es accesible y está disponible cuando lo necesitamos',
    'Mi líder escucha activamente las ideas y preocupaciones del equipo',
    'Mi líder construye relaciones de confianza con el equipo',
  ]},
  { dimension_id: 3, rol: 'D', preguntas: [
    'Mantengo canales de comunicación abiertos con mi equipo',
    'Escucho activamente antes de tomar decisiones que afectan al equipo',
    'Gestiono los conflictos del equipo de manera constructiva',
  ]},
  { dimension_id: 4, rol: 'A', preguntas: [
    'El equipo cumple consistentemente con los compromisos adquiridos',
    'Tomamos decisiones con agilidad cuando la situación lo requiere',
    'Aprendemos y nos adaptamos rápido ante los errores o cambios',
  ]},
  { dimension_id: 4, rol: 'B', preguntas: [
    'El equipo ejecuta con disciplina y consistencia',
    'Las personas del equipo toman iniciativa sin necesidad de supervisión constante',
    'El equipo se adapta rápidamente a los cambios y nuevas demandas',
  ]},
  { dimension_id: 4, rol: 'C', preguntas: [
    'Mi líder toma decisiones con claridad y oportunidad',
    'Mi líder nos da autonomía para actuar y experimentar',
    'Mi líder modela con su comportamiento lo que espera del equipo',
  ]},
  { dimension_id: 4, rol: 'D', preguntas: [
    'Tomo decisiones con la información disponible sin paralizarme',
    'Doy autonomía a mi equipo para actuar y aprender de los errores',
    'Mi comportamiento es coherente con los valores que declaro',
  ]},
]
