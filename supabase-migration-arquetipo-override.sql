-- Override del copy de los arquetipos (brechas y relaciones) por diagnóstico.
-- Cuando un usuario regenera la lectura, se persiste el resultado para que
-- la próxima vez que abra /r/[codigo] vea la última versión.

alter table diagnosticos
  add column if not exists arquetipo_brechas_override jsonb,
  add column if not exists arquetipo_relaciones_override jsonb;

-- Estructura esperada del JSONB:
-- { "titulo": "...", "resumen": "...", "cuerpo": "...", "cita": "...", "accion": "..." }
