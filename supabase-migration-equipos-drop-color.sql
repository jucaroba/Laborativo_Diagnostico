-- Quitamos el concepto de color de la app: no hay color por compañía ni por equipo.
-- El dashboard sigue usando la paleta fija por rol (cyan/naranja/rojo/verde),
-- pero esa vive en código (no en BD).
alter table equipos drop column if exists color_neon;
