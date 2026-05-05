-- Persistir el número de participantes ingresado en el formulario de creación
alter table diagnosticos
  add column if not exists numero_participantes integer;
