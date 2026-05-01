-- Tabla de invitaciones a participantes del diagnóstico.
-- Independiente de `participantes` (que registra sesiones anónimas de respuesta).
-- Aquí guardamos a quiénes se invitó por email, con su nombre, y cuándo se envió.

create table invitaciones (
  id              uuid primary key default gen_random_uuid(),
  diagnostico_id  uuid not null references diagnosticos(id) on delete cascade,
  nombre          text not null,
  email           text not null,
  enviado_at      timestamptz,
  created_at      timestamptz not null default now(),
  unique (diagnostico_id, email)
);

create index invitaciones_diagnostico_id_idx on invitaciones (diagnostico_id);

alter table invitaciones enable row level security;

-- Solo admin autenticado gestiona (lectura/escritura), siguiendo el patrón de `diagnosticos_admin`.
create policy "invitaciones_admin" on invitaciones for all using (auth.role() = 'authenticated');
