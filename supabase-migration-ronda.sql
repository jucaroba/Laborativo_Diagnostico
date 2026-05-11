-- ====================================================================
-- Antes y Después: encadenar diagnósticos en rondas
-- Permite crear un diagnóstico hijo (Ronda 2, 3, …) clonando las
-- preguntas del padre. Habilita la vista comparativa en el dashboard.
-- ====================================================================

alter table diagnosticos
  add column if not exists diagnostico_padre_id uuid references diagnosticos(id) on delete set null,
  add column if not exists ronda int not null default 1;

-- Índice para encontrar rápidamente los hijos de un padre
create index if not exists diagnosticos_padre_idx on diagnosticos(diagnostico_padre_id);
