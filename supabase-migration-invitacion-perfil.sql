-- =============================================================
-- Migration: perfil (líder/miembro) en invitaciones
--
-- Cuando los equipos se crean por área desde el cargue de participantes,
-- el rol de cada persona (líder o miembro del equipo) viene definido en la
-- lista, no se elige en el intake. Se guarda aquí para que el cuestionario
-- asigne el rol correcto (miembro → A, líder → D) automáticamente.
--
-- Nullable: las invitaciones sin perfil siguen pidiendo el rol en el intake.
-- Ejecutar en Supabase SQL Editor.
-- =============================================================

alter table invitaciones
  add column if not exists perfil text;

do $$ begin
  alter table invitaciones drop constraint if exists invitaciones_perfil_check;
  alter table invitaciones add constraint invitaciones_perfil_check
    check (perfil is null or perfil in ('lider', 'miembro'));
end $$;
