-- =============================================================
-- Migration: etapa de activación del diagnóstico
--
-- Durante la configuración (activado = false) no se muestra la sección de
-- equipos. Al activar, aparece "Cargar participantes". Así el setup se enfoca
-- primero en las preguntas y luego en los participantes.
--
-- Ejecutar en Supabase SQL Editor.
-- =============================================================

alter table diagnosticos
  add column if not exists activado boolean not null default false;

-- Diagnósticos existentes que YA tienen equipos quedan activados (para no
-- ocultarles lo que ya estaba en uso). Los demás arrancan en configuración.
update diagnosticos d set activado = true
  where exists (select 1 from equipos e where e.diagnostico_id = d.id);
