-- Equivalente SQLite de subproductos / precios_especiales / productos_especiales

CREATE TABLE IF NOT EXISTS subproductos (
    id_subproducto INTEGER PRIMARY KEY AUTOINCREMENT,
    producto        INTEGER NOT NULL REFERENCES productos (id_producto),
    subproducto     INTEGER NOT NULL REFERENCES productos (id_producto),
    cantidad        REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS precios_especiales (
    id_precio_especial INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha_inicio        TEXT NOT NULL,
    fecha_fin            TEXT NOT NULL,
    estado               TEXT NOT NULL DEFAULT 'Activo'
);

CREATE TABLE IF NOT EXISTS productos_especiales (
    id_producto_especial INTEGER PRIMARY KEY AUTOINCREMENT,
    precio_especial        INTEGER NOT NULL REFERENCES precios_especiales (id_precio_especial),
    producto               INTEGER NOT NULL REFERENCES productos (id_producto),
    valor                  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_productos_especiales_precio ON productos_especiales (precio_especial);
