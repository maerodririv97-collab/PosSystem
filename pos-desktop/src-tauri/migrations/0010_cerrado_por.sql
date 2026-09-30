-- Registra quién cerró cada turno. Ahora cualquier rol puede cerrar turno
-- (antes era exclusivo del administrador), así que queda en el histórico
-- quién lo hizo en cada caso.
ALTER TABLE turnos ADD COLUMN cerrado_por INTEGER REFERENCES usuarios (id_usuario);
