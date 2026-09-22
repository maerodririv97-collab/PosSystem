-- Esquema inicial: equivalente SQLite de categorias/productos (models/mappins/*.hbm.xml)

CREATE TABLE IF NOT EXISTS categorias (
    id_categoria INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre       TEXT NOT NULL,
    tipo         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS productos (
    id_producto   INTEGER PRIMARY KEY AUTOINCREMENT,
    categoria     INTEGER NOT NULL REFERENCES categorias (id_categoria),
    codigo_barras TEXT NOT NULL,
    nombre        TEXT NOT NULL,
    costo         INTEGER NOT NULL,
    valor         INTEGER NOT NULL,
    stock         REAL NOT NULL,
    servicio      INTEGER NOT NULL DEFAULT 0,
    tipo_venta    TEXT NOT NULL,
    imagen        TEXT NOT NULL DEFAULT '',
    estado        TEXT NOT NULL DEFAULT 'Activo'
);

CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos (categoria);

-- Cola de sincronización asíncrona hacia la nube (fase 6 de la hoja de ruta)
CREATE TABLE IF NOT EXISTS sync_outbox (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    tabla         TEXT NOT NULL,
    operacion     TEXT NOT NULL CHECK (operacion IN ('insert', 'update', 'delete')),
    registro_id   INTEGER NOT NULL,
    payload_json  TEXT NOT NULL,
    creado_en     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    sincronizado  INTEGER NOT NULL DEFAULT 0
);
