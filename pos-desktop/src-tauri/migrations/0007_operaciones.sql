-- Equivalente SQLite de operaciones/conceptos_operaciones (models/mappins/Operaciones.hbm.xml, ConceptosOperaciones.hbm.xml)
-- Ingresos y egresos manuales de caja dentro de un turno.

CREATE TABLE IF NOT EXISTS conceptos_operaciones (
    id_concepto_operacion INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre                TEXT NOT NULL,
    descripcion           TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS operaciones (
    id_operacion  INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_concepto INTEGER NOT NULL REFERENCES conceptos_operaciones (id_concepto_operacion),
    turno         INTEGER NOT NULL REFERENCES turnos (id_turno),
    administrador INTEGER NOT NULL REFERENCES usuarios (id_usuario),
    tipo          TEXT NOT NULL, -- 'Ingreso' / 'Egreso'
    valor         INTEGER NOT NULL,
    fecha         TEXT NOT NULL,
    concepto      TEXT NOT NULL DEFAULT '' -- observaciones libres
);

CREATE INDEX IF NOT EXISTS idx_operaciones_turno ON operaciones (turno);
