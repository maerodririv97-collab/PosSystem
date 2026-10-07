-- Separa las operaciones en dos cajas:
--   'Turno'   = ingresos/egresos dentro del turno; entran al cuadre de caja.
--   'General' = gastos del negocio que registra el administrador; no afectan
--               el cuadre del turno y se restan de las ventas para la ganancia.
-- Las operaciones existentes quedan en 'Turno' (era el único tipo de caja).
ALTER TABLE operaciones ADD COLUMN caja TEXT NOT NULL DEFAULT 'Turno';

CREATE INDEX IF NOT EXISTS idx_operaciones_caja_fecha ON operaciones (caja, fecha);
