-- ====================================================================
-- Compañías y Equipos
--
-- Refactor estructural: el `diagnostico` deja de ser "compañía + 1 equipo"
-- y pasa a ser solo la **compañía cliente**. Los equipos a evaluar viven
-- en una nueva tabla `equipos`, N por compañía.
--
-- Esta migración es **aditiva** (Fase A1): crea la tabla, migra los
-- datos existentes 1-a-1, agrega `equipo_id` a `invitaciones` y
-- `participantes`. NO dropea columnas viejas — eso se hace en una
-- segunda migración (`supabase-migration-equipos-cleanup.sql`) una vez
-- que el código nuevo esté en producción.
--
-- Datos legacy:
--   - Cada diagnóstico existente → 1 equipo "Equipo principal".
--   - El equipo hereda color_neon, estado, numero_participantes y los
--     códigos del diagnóstico de origen.
--   - Las URLs públicas /d/[codigo] y /r/[codigo] siguen funcionando
--     (apuntan al equipo migrado).
-- ====================================================================

begin;

-- 1) Tabla equipos
create table if not exists equipos (
  id                    uuid primary key default gen_random_uuid(),
  diagnostico_id        uuid not null references diagnosticos(id) on delete cascade,
  nombre                text not null,
  color_neon            text not null default '#39FF14',
  numero_participantes  integer,
  estado                text not null default 'borrador' check (estado in ('borrador','activo','completado')),
  codigo_participacion  text not null unique default substring(gen_random_uuid()::text, 1, 8),
  codigo_resultados     text not null unique default substring(gen_random_uuid()::text, 1, 8),
  created_at            timestamptz not null default now()
);
create index if not exists equipos_diagnostico_idx on equipos(diagnostico_id);

-- 2) Migrar diagnósticos existentes → 1 equipo cada uno (idempotente)
insert into equipos (diagnostico_id, nombre, color_neon, numero_participantes, estado, codigo_participacion, codigo_resultados, created_at)
select
  d.id,
  'Equipo principal',
  d.color_neon,
  d.numero_participantes,
  d.estado,
  d.codigo_participacion,
  d.codigo_resultados,
  d.created_at
from diagnosticos d
where not exists (select 1 from equipos e where e.diagnostico_id = d.id);

-- 3) Agregar equipo_id (nullable) a invitaciones y participantes
alter table invitaciones  add column if not exists equipo_id uuid references equipos(id) on delete cascade;
alter table participantes add column if not exists equipo_id uuid references equipos(id) on delete cascade;

-- 4) Poblar equipo_id (relación 1-a-1 por la migración inicial)
update invitaciones inv
set equipo_id = e.id
from equipos e
where inv.diagnostico_id = e.diagnostico_id
  and inv.equipo_id is null;

update participantes p
set equipo_id = e.id
from equipos e
where p.diagnostico_id = e.diagnostico_id
  and p.equipo_id is null;

-- 5) NOT NULL (todos los rows ya tienen valor)
alter table invitaciones  alter column equipo_id set not null;
alter table participantes alter column equipo_id set not null;

-- 6) Unique (equipo_id, email) en invitaciones — el viejo (diagnostico_id, email)
--    queda activo durante la transición; se elimina en cleanup.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'invitaciones_equipo_id_email_key') then
    alter table invitaciones add constraint invitaciones_equipo_id_email_key unique (equipo_id, email);
  end if;
end $$;

-- 7) Índices nuevos
create index if not exists invitaciones_equipo_id_idx on invitaciones(equipo_id);
create index if not exists participantes_equipo_idx on participantes(equipo_id, rol);

-- 8) Vista comparativa /r/c/[codigo] — código a nivel compañía
alter table diagnosticos
  add column if not exists codigo_resultados_comparativo text default substring(gen_random_uuid()::text, 1, 8);

update diagnosticos
set codigo_resultados_comparativo = substring(gen_random_uuid()::text, 1, 8)
where codigo_resultados_comparativo is null;

alter table diagnosticos alter column codigo_resultados_comparativo set not null;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'diagnosticos_codigo_resultados_comparativo_key') then
    alter table diagnosticos add constraint diagnosticos_codigo_resultados_comparativo_key unique (codigo_resultados_comparativo);
  end if;
end $$;

-- 9) RLS en equipos (mismo patrón que diagnosticos/preguntas:
--    abierto a nivel RLS; la auth real se hace en el middleware de /admin/*).
alter table equipos enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'equipos_all' and tablename = 'equipos') then
    create policy "equipos_all" on equipos for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'equipos_publico_select' and tablename = 'equipos') then
    create policy "equipos_publico_select" on equipos for select using (true);
  end if;
end $$;

commit;

-- ====================================================================
-- Cleanup posterior (correr SOLO cuando el código nuevo esté en prod):
--
--   supabase-migration-equipos-cleanup.sql:
--     alter table diagnosticos drop column color_neon;
--     alter table diagnosticos drop column numero_participantes;
--     alter table diagnosticos drop column estado;
--     alter table diagnosticos drop column codigo_participacion;
--     alter table diagnosticos drop column codigo_resultados;       -- (o renombrar)
--     alter table invitaciones  drop column diagnostico_id;
--     alter table participantes drop column diagnostico_id;
--     drop table grupos cascade;
-- ====================================================================
