-- Equivalente SQLite de turnos (models/mappins/Turnos.hbm.xml)
-- estado: 'Abierto' / 'Cerrado' (distinto de ventas.estado que usa 'Abierta'/'Pagada')

CREATE TABLE IF NOT EXISTS turnos (
    id_turno      INTEGER PRIMARY KEY AUTOINCREMENT,
    apertura      TEXT NOT NULL,
    cierre        TEXT,
    valor_inicial INTEGER NOT NULL,
    estado        TEXT NOT NULL DEFAULT 'Abierto'
);

ALTER TABLE ventas ADD COLUMN turno INTEGER REFERENCES turnos (id_turno);
