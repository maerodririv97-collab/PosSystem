-- Continuidad de la caja entre turnos:
--   valor_retirado      = efectivo que se llevó quien cerró el turno. Lo que queda
--                         (valor_final - valor_retirado) es la base del siguiente.
--   base_esperada       = lo que dejó el turno anterior (NULL si no se sabe, p. ej.
--                         turnos anteriores a este cambio).
--   diferencia_apertura = valor_inicial contado - base_esperada (faltante/sobrante
--                         entre turnos).
ALTER TABLE turnos ADD COLUMN valor_retirado INTEGER;
ALTER TABLE turnos ADD COLUMN base_esperada INTEGER;
ALTER TABLE turnos ADD COLUMN diferencia_apertura INTEGER;

-- De dónde salió el dinero de cada operación: 'Efectivo' o 'Transferencia'.
-- Las de caja de turno siempre son en efectivo (las existentes quedan así).
ALTER TABLE operaciones ADD COLUMN forma_pago TEXT NOT NULL DEFAULT 'Efectivo';
