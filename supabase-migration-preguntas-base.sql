-- =============================================
-- Migration: tabla preguntas_base (plantilla global)
-- Ejecutar en Supabase SQL Editor
-- =============================================

create table preguntas_base (
  id             uuid primary key default gen_random_uuid(),
  dimension_id   int  not null references dimensiones(id),
  rol            text not null check (rol in ('A','B','C','D')),
  texto          text not null,
  orden          int  not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index on preguntas_base (dimension_id, rol, orden);

alter table preguntas_base enable row level security;

-- App usa anon key (sin login). Politica permisiva como el resto de tablas.
create policy "preguntas_base_all" on preguntas_base for all using (true) with check (true);

-- =============================================
-- Seed: preguntas actuales desde src/lib/preguntas-base.ts
-- =============================================

insert into preguntas_base (dimension_id, rol, texto, orden) values
  -- Dimensión 1 · Intención
  (1, 'A', 'Tengo claridad sobre hacia dónde se dirige nuestra organización', 1),
  (1, 'A', 'El propósito de la empresa resuena con mis valores personales', 2),
  (1, 'A', 'El equipo comparte una visión común del futuro', 3),

  (1, 'B', 'El equipo comprende claramente los objetivos estratégicos de la organización', 1),
  (1, 'B', 'Las personas del equipo alinean su trabajo diario con la visión de la empresa', 2),
  (1, 'B', 'El equipo actúa con sentido de propósito compartido', 3),

  (1, 'C', 'Mi líder comunica con claridad hacia dónde vamos como organización', 1),
  (1, 'C', 'Mi líder conecta el trabajo del equipo con el propósito mayor de la empresa', 2),
  (1, 'C', 'Mi líder inspira con su visión del futuro', 3),

  (1, 'D', 'Comunico con claridad la dirección estratégica a mi equipo', 1),
  (1, 'D', 'Conecto consistentemente el trabajo diario con el propósito de la organización', 2),
  (1, 'D', 'Tengo una visión clara de hacia dónde quiero llevar a mi equipo', 3),

  -- Dimensión 2 · Motivación
  (2, 'A', 'Me siento motivado para dar lo mejor de mí en esta organización', 1),
  (2, 'A', 'Encuentro energía y significado en el trabajo que realizo', 2),
  (2, 'A', 'Las condiciones de trabajo me permiten mantener mi motivación', 3),

  (2, 'B', 'El equipo muestra genuino entusiasmo por su trabajo', 1),
  (2, 'B', 'Las personas del equipo van más allá de lo estrictamente requerido', 2),
  (2, 'B', 'El equipo mantiene su energía incluso en momentos de dificultad', 3),

  (2, 'C', 'Mi líder reconoce y celebra los logros del equipo', 1),
  (2, 'C', 'Mi líder genera condiciones para que el equipo se sienta motivado', 2),
  (2, 'C', 'Mi líder muestra genuino interés por el bienestar del equipo', 3),

  (2, 'D', 'Genero activamente condiciones para que mi equipo se mantenga motivado', 1),
  (2, 'D', 'Reconozco oportunamente los logros y esfuerzos de las personas', 2),
  (2, 'D', 'Mi propio nivel de energía y motivación impulsa positivamente al equipo', 3),

  -- Dimensión 3 · Interacción
  (3, 'A', 'La comunicación dentro del equipo es abierta y fluida', 1),
  (3, 'A', 'Existe confianza entre los miembros del equipo', 2),
  (3, 'A', 'Los conflictos se abordan de manera constructiva en el equipo', 3),

  (3, 'B', 'El equipo colabora efectivamente entre sí', 1),
  (3, 'B', 'Las personas del equipo se apoyan mutuamente en los momentos difíciles', 2),
  (3, 'B', 'El equipo construye relaciones de confianza con otras áreas', 3),

  (3, 'C', 'Mi líder es accesible y está disponible cuando lo necesitamos', 1),
  (3, 'C', 'Mi líder escucha activamente las ideas y preocupaciones del equipo', 2),
  (3, 'C', 'Mi líder construye relaciones de confianza con el equipo', 3),

  (3, 'D', 'Mantengo canales de comunicación abiertos con mi equipo', 1),
  (3, 'D', 'Escucho activamente antes de tomar decisiones que afectan al equipo', 2),
  (3, 'D', 'Gestiono los conflictos del equipo de manera constructiva', 3),

  -- Dimensión 4 · Acción
  (4, 'A', 'El equipo cumple consistentemente con los compromisos adquiridos', 1),
  (4, 'A', 'Tomamos decisiones con agilidad cuando la situación lo requiere', 2),
  (4, 'A', 'Aprendemos y nos adaptamos rápido ante los errores o cambios', 3),

  (4, 'B', 'El equipo ejecuta con disciplina y consistencia', 1),
  (4, 'B', 'Las personas del equipo toman iniciativa sin necesidad de supervisión constante', 2),
  (4, 'B', 'El equipo se adapta rápidamente a los cambios y nuevas demandas', 3),

  (4, 'C', 'Mi líder toma decisiones con claridad y oportunidad', 1),
  (4, 'C', 'Mi líder nos da autonomía para actuar y experimentar', 2),
  (4, 'C', 'Mi líder modela con su comportamiento lo que espera del equipo', 3),

  (4, 'D', 'Tomo decisiones con la información disponible sin paralizarme', 1),
  (4, 'D', 'Doy autonomía a mi equipo para actuar y aprender de los errores', 2),
  (4, 'D', 'Mi comportamiento es coherente con los valores que declaro', 3);
