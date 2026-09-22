-- Historial de movimientos de inventario: ajustes de stock y bajas de productos.
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id_movimiento  INTEGER PRIMARY KEY AUTOINCREMENT,
    producto       INTEGER NOT NULL REFERENCES productos (id_producto),
    usuario        INTEGER NOT NULL REFERENCES usuarios (id_usuario),
    tipo           TEXT NOT NULL, -- 'Ajuste' / 'Baja'
    stock_anterior REAL NOT NULL,
    stock_nuevo    REAL NOT NULL,
    motivo         TEXT NOT NULL DEFAULT '',
    fecha          TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_producto ON movimientos_inventario (producto);
