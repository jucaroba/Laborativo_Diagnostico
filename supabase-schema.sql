-- =============================================
-- LABORATIVO DIAGNOSTICO - Schema
-- =============================================

-- Dimensiones (4 fijas, se insertan como seed)
create table dimensiones (
  id        serial primary key,
  nombre    text not null,
  subtitulo text not null,
  pregunta  text not null,
  orden     int  not null unique
);

insert into dimensiones (nombre, subtitulo, pregunta, orden) values
  ('Intención',   'Sentido',       '¿A dónde vamos?', 1),
  ('Motivación',  'Energía',       '¿Por qué?',        2),
  ('Interacción', 'Vínculos',      '¿Con quién?',      3),
  ('Acción',      'Comportamiento','¿Qué?',            4);

-- Diagnósticos
create table diagnosticos (
  id                    uuid primary key default gen_random_uuid(),
  nombre_compania       text not null,
  contacto_nombre       text not null,
  contacto_cargo        text not null,
  contacto_email        text not null,
  codigo_participacion  text not null unique default substring(gen_random_uuid()::text, 1, 8),
  codigo_resultados     text not null unique default substring(gen_random_uuid()::text, 1, 8),
  estado                text not null default 'borrador' check (estado in ('borrador','activo','completado')),
  color_neon            text not null default '#39FF14',
  vertical              text,
  contexto_ia           text,
  created_at            timestamptz not null default now()
);

-- Preguntas por diagnóstico (copiadas de base o generadas por IA)
create table preguntas (
  id             uuid primary key default gen_random_uuid(),
  diagnostico_id uuid not null references diagnosticos(id) on delete cascade,
  dimension_id   int  not null references dimensiones(id),
  rol            text not null check (rol in ('A','B','C','D')),
  texto          text not null,
  orden          int  not null,
  created_at     timestamptz not null default now()
);

-- Participantes anónimos
create table participantes (
  id             uuid primary key default gen_random_uuid(),
  diagnostico_id uuid not null references diagnosticos(id) on delete cascade,
  rol            text not null check (rol in ('A','B','C','D')),
  created_at     timestamptz not null default now()
);

-- Respuestas
create table respuestas (
  id              uuid primary key default gen_random_uuid(),
  participante_id uuid not null references participantes(id) on delete cascade,
  pregunta_id     uuid not null references preguntas(id) on delete cascade,
  valor           int  not null check (valor between 1 and 10),
  created_at      timestamptz not null default now(),
  unique (participante_id, pregunta_id)
);

-- =============================================
-- RLS
-- =============================================

alter table diagnosticos  enable row level security;
alter table preguntas      enable row level security;
alter table participantes  enable row level security;
alter table respuestas     enable row level security;
alter table dimensiones    enable row level security;

-- Dimensiones: lectura pública
create policy "dimensiones_lectura" on dimensiones for select using (true);

-- Diagnósticos: solo admin autenticado gestiona, público puede leer por código
create policy "diagnosticos_admin" on diagnosticos for all using (auth.role() = 'authenticated');
create policy "diagnosticos_publico_participacion" on diagnosticos for select using (true);

-- Preguntas: admin gestiona, público lee
create policy "preguntas_admin"   on preguntas for all using (auth.role() = 'authenticated');
create policy "preguntas_publico" on preguntas for select using (true);

-- Participantes: inserción pública, lectura pública (para contar en resultados)
create policy "participantes_insert" on participantes for insert with check (true);
create policy "participantes_select" on participantes for select using (true);

-- Respuestas: inserción pública, lectura pública (resultados son públicos por diseño)
create policy "respuestas_insert" on respuestas for insert with check (true);
create policy "respuestas_select" on respuestas for select using (true);

-- =============================================
-- Índices
-- =============================================
create index on preguntas (diagnostico_id, dimension_id, rol);
create index on respuestas (participante_id);
create index on participantes (diagnostico_id, rol);
