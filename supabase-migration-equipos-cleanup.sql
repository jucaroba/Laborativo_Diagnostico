-- ====================================================================
-- Cleanup post-refactor de Compañías + Equipos
--
-- Ejecutar DESPUÉS de que el código nuevo (que lee desde `equipos`)
-- esté en producción. Esta migración elimina:
--   - Las columnas legacy en `diagnosticos` que se movieron a `equipos`.
--   - El FK `diagnostico_id` en `invitaciones` y `participantes`.
--   - La tabla `grupos` (absorbida por la jerarquía compañía → equipos).
-- ====================================================================

begin;

-- 1) Drop columnas migradas a `equipos`
alter table diagnosticos drop column if exists color_neon;
alter table diagnosticos drop column if exists numero_participantes;
alter table diagnosticos drop column if exists estado;
alter table diagnosticos drop column if exists codigo_participacion;
alter table diagnosticos drop column if exists codigo_resultados;

-- 2) Drop FK legacy `diagnostico_id` en tablas que ahora viven bajo equipos
alter table invitaciones  drop column if exists diagnostico_id;
alter table participantes drop column if exists diagnostico_id;

-- 3) Drop concepto de grupos (la compañía es ahora el agrupador)
alter table diagnosticos drop column if exists grupo_id;
drop table if exists grupos cascade;

commit;
