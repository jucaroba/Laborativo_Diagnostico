-- =============================================================
-- Migration: respuestas identificadas (uso interno de Laborativo)
--
-- Permite asociar cada participante (y por ende sus respuestas) con la
-- invitación de la persona (nombre / email / área). El detalle es RESERVADO
-- para Laborativo: el cliente solo ve resultados agregados.
--
-- El vínculo se hace vía un `token` único en la invitación, que viaja en el
-- link personalizado del email (/d/{codigo}/intake?t={token}). Al iniciar el
-- cuestionario se guarda `invitacion_id` en el participante.
--
-- Ejecutar en Supabase SQL Editor.
-- =============================================================

-- 1) Invitaciones: área (la da el cliente, estructurada) + token del link +
--    marca de cuándo respondió.
alter table invitaciones
  add column if not exists area         text,
  add column if not exists token        text,
  add column if not exists respondido_at timestamptz;

-- 2) Token único por invitación. Backfill de las existentes y default para nuevas.
update invitaciones
  set token = replace(gen_random_uuid()::text, '-', '')
  where token is null;

alter table invitaciones
  alter column token set default replace(gen_random_uuid()::text, '-', ''),
  alter column token set not null;

create unique index if not exists invitaciones_token_key on invitaciones (token);

-- 3) Participantes: vínculo opcional a la invitación.
--    Nullable a propósito: si alguien entra con un link genérico (reenviado,
--    sin token), responde igual pero queda anónimo (invitacion_id = null).
alter table participantes
  add column if not exists invitacion_id uuid references invitaciones(id) on delete set null;

create index if not exists participantes_invitacion_id_idx on participantes (invitacion_id);
