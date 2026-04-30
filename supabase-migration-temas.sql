-- =============================================
-- Migration: temas (sets de preguntas base)
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Tabla de temas
create table temas (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null unique,
  descripcion text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table temas enable row level security;

create policy "temas_all" on temas for all using (true) with check (true);

-- 2. Columna tema_id en preguntas_base (nullable temporal para backfill)
alter table preguntas_base
  add column tema_id uuid references temas(id) on delete cascade;

-- 3. Backfill: tema por defecto y asignación de las 48 preguntas existentes
do $$
declare
  default_tema_id uuid;
begin
  insert into temas (nombre, descripcion)
  values ('Cultura general', 'Plantilla genérica de Laborativo')
  returning id into default_tema_id;

  update preguntas_base set tema_id = default_tema_id where tema_id is null;
end $$;

-- 4. Hacer tema_id obligatorio
alter table preguntas_base alter column tema_id set not null;

-- 5. Índice
create index on preguntas_base (tema_id, dimension_id, rol, orden);
