-- ====================================================================
-- Comparativo entre Equipos
-- Tabla `grupos` para agrupar varios diagnósticos del mismo tipo
-- y compararlos en un solo dashboard.
-- ====================================================================

create table if not exists grupos (
  id                 uuid primary key default gen_random_uuid(),
  nombre             text not null,
  cliente            text,
  tipo               text not null check (tipo in ('cultura_360','pulso_colectivo','equipo_en_espejo','termometro_4')),
  codigo_resultados  text not null unique default substring(gen_random_uuid()::text, 1, 8),
  created_at         timestamptz not null default now()
);

create index if not exists grupos_tipo_idx on grupos(tipo);
create index if not exists grupos_nombre_idx on grupos(nombre);

alter table diagnosticos
  add column if not exists grupo_id uuid references grupos(id) on delete set null;

create index if not exists diagnosticos_grupo_idx on diagnosticos(grupo_id);
