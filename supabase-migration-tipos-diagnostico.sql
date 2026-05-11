-- ====================================================================
-- Tipos de diagnóstico (Fase 1: foundation)
--
-- Llaves internas (nombres comerciales en src/lib/tipos-diagnostico.ts):
--   cultura_360       → "Cultura 360°"        (el actual)
--   pulso_colectivo   → "Pulso Colectivo"
--   equipo_en_espejo  → "Equipo en Espejo"
--   termometro_4      → "Termómetro de 4"
--
-- Esta migración solo introduce el campo `tipo` y abre los roles para
-- admitir las nuevas perspectivas. No siembra preguntas base para los
-- tipos nuevos — eso se hace cuando se active cada tipo en su fase.
-- ====================================================================

-- 1) Campo tipo en diagnosticos
alter table diagnosticos
  add column if not exists tipo text not null default 'cultura_360';

do $$ begin
  alter table diagnosticos drop constraint if exists diagnosticos_tipo_check;
  alter table diagnosticos add constraint diagnosticos_tipo_check
    check (tipo in ('cultura_360', 'pulso_colectivo', 'equipo_en_espejo', 'termometro_4'));
end $$;

-- 2) Campo tipo en preguntas_base (cada tema vivirá ligado a un tipo)
alter table preguntas_base
  add column if not exists tipo text not null default 'cultura_360';

do $$ begin
  alter table preguntas_base drop constraint if exists preguntas_base_tipo_check;
  alter table preguntas_base add constraint preguntas_base_tipo_check
    check (tipo in ('cultura_360', 'pulso_colectivo', 'equipo_en_espejo', 'termometro_4'));
end $$;

-- 3) Campo tipo en temas
alter table temas
  add column if not exists tipo text not null default 'cultura_360';

do $$ begin
  alter table temas drop constraint if exists temas_tipo_check;
  alter table temas add constraint temas_tipo_check
    check (tipo in ('cultura_360', 'pulso_colectivo', 'equipo_en_espejo', 'termometro_4'));
end $$;

-- 4) Ampliar el dominio de `rol` en preguntas y participantes para admitir
--    las perspectivas nuevas (X = colectivo único; YO/EQUIPO = pareja espejo)
do $$ begin
  alter table preguntas drop constraint if exists preguntas_rol_check;
  alter table preguntas add constraint preguntas_rol_check
    check (rol in ('A','B','C','D','X','YO','EQUIPO'));
end $$;

do $$ begin
  alter table participantes drop constraint if exists participantes_rol_check;
  alter table participantes add constraint participantes_rol_check
    check (rol in ('A','B','C','D','X','YO','EQUIPO'));
end $$;
