-- Quién abrió cada turno y, si abrió con un valor distinto al que dejó el turno
-- anterior (diferencia_apertura), el motivo que indicó. Se muestra como alerta
-- de caja en el cuadre, la caja general y los reportes.
ALTER TABLE turnos ADD COLUMN abierto_por INTEGER REFERENCES usuarios (id_usuario);
ALTER TABLE turnos ADD COLUMN motivo_apertura TEXT NOT NULL DEFAULT '';
