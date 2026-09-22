-- Cuadre de caja al cerrar turno: valor contado por el usuario y diferencia contra lo esperado.
ALTER TABLE turnos ADD COLUMN valor_final INTEGER;
ALTER TABLE turnos ADD COLUMN diferencia INTEGER;
