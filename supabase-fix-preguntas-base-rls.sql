-- =============================================
-- Fix RLS para preguntas_base
-- Las políticas originales requerían auth.role() = 'authenticated',
-- pero la app usa anon key, así que las escrituras fallaban en silencio.
-- Esto las hace permisivas (igual que las otras tablas del proyecto).
-- Ejecutar UNA VEZ en el SQL Editor de Supabase.
-- =============================================

drop policy if exists "preguntas_base_admin"   on preguntas_base;
drop policy if exists "preguntas_base_publico" on preguntas_base;

create policy "preguntas_base_all" on preguntas_base
  for all using (true) with check (true);
