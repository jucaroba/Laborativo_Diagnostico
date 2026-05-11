-- ====================================================================
-- Benchmark Laborativo
-- Toggle por diagnóstico para mostrar comparación contra el promedio
-- histórico de todos los OTROS diagnósticos del mismo tipo.
-- ====================================================================

alter table diagnosticos
  add column if not exists benchmark_habilitado boolean not null default false;
