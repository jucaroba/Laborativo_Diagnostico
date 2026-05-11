-- ====================================================================
-- Seed inicial para Termómetro de 4
-- Crea un tema "Termómetro" con 4 preguntas (1 por dimensión)
-- Rol = 'X' (una sola perspectiva colectiva).
-- Idempotente: si ya existe un tema de tipo termometro_4, no hace nada.
-- ====================================================================

do $$
declare
  v_tema_id uuid;
begin
  if not exists (select 1 from temas where tipo = 'termometro_4') then
    insert into temas (nombre, tipo)
    values ('Termómetro', 'termometro_4')
    returning id into v_tema_id;

    insert into preguntas_base (tema_id, dimension_id, rol, texto, orden, tipo) values
      (v_tema_id, 1, 'X', 'Como equipo, sabemos hacia dónde vamos y por qué.',          0, 'termometro_4'),
      (v_tema_id, 2, 'X', 'Hay energía y ganas en el trabajo del equipo.',              1, 'termometro_4'),
      (v_tema_id, 3, 'X', 'Conversamos entre nosotros con franqueza y confianza.',      2, 'termometro_4'),
      (v_tema_id, 4, 'X', 'Lo que decimos se traduce en lo que hacemos.',               3, 'termometro_4');
  end if;
end $$;
