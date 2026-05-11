-- ====================================================================
-- Seed inicial para Equipo en Espejo
-- Crea un tema "Espejo" con 24 preguntas:
--   4 dimensiones × 2 perspectivas (YO, EQUIPO) × 3 preguntas
-- Cada participante responde las 24 (líder incluido como uno más).
-- Idempotente.
-- ====================================================================

do $$
declare
  v_tema_id uuid;
begin
  if not exists (select 1 from temas where tipo = 'equipo_en_espejo') then
    insert into temas (nombre, tipo)
    values ('Espejo', 'equipo_en_espejo')
    returning id into v_tema_id;

    insert into preguntas_base (tema_id, dimension_id, rol, texto, orden, tipo) values
      -- ─── Intención ───────────────────────────────────────────
      -- YO
      (v_tema_id, 1, 'YO',     'Tengo claridad personal sobre el rumbo que estoy tomando en este equipo.',  0, 'equipo_en_espejo'),
      (v_tema_id, 1, 'YO',     'Las decisiones que tomo están alineadas con un propósito que me importa.',  1, 'equipo_en_espejo'),
      (v_tema_id, 1, 'YO',     'Sé para qué hago lo que hago aquí.',                                         2, 'equipo_en_espejo'),
      -- EQUIPO
      (v_tema_id, 1, 'EQUIPO', 'El equipo tiene claridad sobre el rumbo que estamos tomando.',               3, 'equipo_en_espejo'),
      (v_tema_id, 1, 'EQUIPO', 'Las decisiones del equipo están alineadas con un propósito compartido.',     4, 'equipo_en_espejo'),
      (v_tema_id, 1, 'EQUIPO', 'Cuando avanzamos como equipo, sabemos para qué lo estamos haciendo.',        5, 'equipo_en_espejo'),

      -- ─── Motivación ──────────────────────────────────────────
      -- YO
      (v_tema_id, 2, 'YO',     'Tengo energía y ganas en lo que hago en este equipo.',                       6, 'equipo_en_espejo'),
      (v_tema_id, 2, 'YO',     'Lo que hago me importa más allá del resultado inmediato.',                   7, 'equipo_en_espejo'),
      (v_tema_id, 2, 'YO',     'Estoy conectado emocionalmente con el trabajo que llevo adelante.',          8, 'equipo_en_espejo'),
      -- EQUIPO
      (v_tema_id, 2, 'EQUIPO', 'El equipo tiene energía y ganas en lo que hace.',                            9, 'equipo_en_espejo'),
      (v_tema_id, 2, 'EQUIPO', 'Lo que el equipo hace nos importa más allá del resultado inmediato.',       10, 'equipo_en_espejo'),
      (v_tema_id, 2, 'EQUIPO', 'El equipo está conectado emocionalmente con el trabajo que lleva adelante.', 11, 'equipo_en_espejo'),

      -- ─── Interacción ─────────────────────────────────────────
      -- YO
      (v_tema_id, 3, 'YO',     'Converso con franqueza y confianza con quienes trabajo.',                   12, 'equipo_en_espejo'),
      (v_tema_id, 3, 'YO',     'Cuando hay desacuerdo, lo abordo sin que se vuelva personal.',              13, 'equipo_en_espejo'),
      (v_tema_id, 3, 'YO',     'Pido y doy ayuda con facilidad.',                                            14, 'equipo_en_espejo'),
      -- EQUIPO
      (v_tema_id, 3, 'EQUIPO', 'Como equipo, conversamos con franqueza y confianza.',                       15, 'equipo_en_espejo'),
      (v_tema_id, 3, 'EQUIPO', 'Cuando hay desacuerdo, el equipo lo aborda sin que se vuelva personal.',    16, 'equipo_en_espejo'),
      (v_tema_id, 3, 'EQUIPO', 'Como equipo, pedimos y damos ayuda con facilidad entre nosotros.',          17, 'equipo_en_espejo'),

      -- ─── Acción ──────────────────────────────────────────────
      -- YO
      (v_tema_id, 4, 'YO',     'Lo que yo decido se traduce en lo que hago día a día.',                     18, 'equipo_en_espejo'),
      (v_tema_id, 4, 'YO',     'Cumplo los acuerdos que hago.',                                              19, 'equipo_en_espejo'),
      (v_tema_id, 4, 'YO',     'Tengo hábitos y rituales que me hacen funcionar mejor.',                    20, 'equipo_en_espejo'),
      -- EQUIPO
      (v_tema_id, 4, 'EQUIPO', 'Lo que el equipo decide se traduce en lo que hacemos día a día.',           21, 'equipo_en_espejo'),
      (v_tema_id, 4, 'EQUIPO', 'Como equipo, cumplimos los acuerdos que hacemos entre nosotros.',           22, 'equipo_en_espejo'),
      (v_tema_id, 4, 'EQUIPO', 'Tenemos hábitos y rituales que nos hacen funcionar mejor como equipo.',     23, 'equipo_en_espejo');
  end if;
end $$;
