-- ====================================================================
-- Seed inicial para Pulso Colectivo
-- Crea un tema "General" con 12 preguntas (4 dimensiones × 3 preguntas)
-- Rol = 'X' (una sola perspectiva colectiva).
-- Idempotente: si ya existe un tema de tipo pulso_colectivo, no hace nada.
-- ====================================================================

-- Ampliar el CHECK de preguntas_base.rol (la migración de Fase 1
-- no incluía esta tabla por error). Idempotente.
do $$ begin
  alter table preguntas_base drop constraint if exists preguntas_base_rol_check;
  alter table preguntas_base add constraint preguntas_base_rol_check
    check (rol in ('A','B','C','D','X','YO','EQUIPO'));
end $$;

do $$
declare
  v_tema_id uuid;
begin
  if not exists (select 1 from temas where tipo = 'pulso_colectivo') then
    insert into temas (nombre, tipo)
    values ('General', 'pulso_colectivo')
    returning id into v_tema_id;

    insert into preguntas_base (tema_id, dimension_id, rol, texto, orden, tipo) values
      -- Intención
      (v_tema_id, 1, 'X', 'Como equipo, tenemos claridad sobre el rumbo que queremos tomar.',                     0, 'pulso_colectivo'),
      (v_tema_id, 1, 'X', 'Las decisiones que tomamos están alineadas con un propósito compartido.',              1, 'pulso_colectivo'),
      (v_tema_id, 1, 'X', 'Cuando avanzamos, sabemos para qué lo estamos haciendo.',                              2, 'pulso_colectivo'),
      -- Motivación
      (v_tema_id, 2, 'X', 'Hay energía y ganas en lo que hacemos como equipo.',                                   3, 'pulso_colectivo'),
      (v_tema_id, 2, 'X', 'Lo que hacemos nos importa más allá del resultado inmediato.',                          4, 'pulso_colectivo'),
      (v_tema_id, 2, 'X', 'Estamos conectados emocionalmente con el trabajo que llevamos adelante.',              5, 'pulso_colectivo'),
      -- Interacción
      (v_tema_id, 3, 'X', 'Como equipo, conversamos con franqueza y confianza.',                                  6, 'pulso_colectivo'),
      (v_tema_id, 3, 'X', 'Cuando hay desacuerdo, lo abordamos sin que se vuelva personal.',                      7, 'pulso_colectivo'),
      (v_tema_id, 3, 'X', 'Pedimos y damos ayuda con facilidad entre nosotros.',                                  8, 'pulso_colectivo'),
      -- Acción
      (v_tema_id, 4, 'X', 'Lo que decidimos se traduce en lo que pasa en el día a día.',                          9, 'pulso_colectivo'),
      (v_tema_id, 4, 'X', 'Como equipo, cumplimos los acuerdos que hacemos entre nosotros.',                     10, 'pulso_colectivo'),
      (v_tema_id, 4, 'X', 'Tenemos hábitos y rituales que nos hacen funcionar mejor.',                            11, 'pulso_colectivo');
  end if;
end $$;
