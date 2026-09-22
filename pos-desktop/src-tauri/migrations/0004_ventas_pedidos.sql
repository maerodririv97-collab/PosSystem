-- Equivalente SQLite de ventas/pedidos (models/mappins/Ventas.hbm.xml, Pedidos.hbm.xml)
-- Nota: "turno" se omite por ahora (se agrega en la fase de Caja y Turnos).
-- Una mesa está "ocupada" si tiene una venta con estado = 'Abierta'; no es una columna, se calcula.

CREATE TABLE IF NOT EXISTS ventas (
    id_venta      INTEGER PRIMARY KEY AUTOINCREMENT,
    mesa          INTEGER NOT NULL REFERENCES mesas (id_mesa),
    mesero        INTEGER NOT NULL REFERENCES usuarios (id_usuario),
    fecha         TEXT NOT NULL,
    forma_pago    TEXT NOT NULL DEFAULT 'Efectivo',
    valor_propina REAL NOT NULL DEFAULT 0,
    estado        TEXT NOT NULL DEFAULT 'Abierta'
);

CREATE TABLE IF NOT EXISTS pedidos (
    id_pedido     INTEGER PRIMARY KEY AUTOINCREMENT,
    producto      INTEGER NOT NULL REFERENCES productos (id_producto),
    venta         INTEGER NOT NULL REFERENCES ventas (id_venta),
    valor         INTEGER NOT NULL,
    cantidad      INTEGER NOT NULL,
    compra        INTEGER NOT NULL DEFAULT 0,
    impreso       INTEGER NOT NULL DEFAULT 0,
    descuento     INTEGER,
    concepto_desc TEXT
);

CREATE INDEX IF NOT EXISTS idx_pedidos_venta ON pedidos (venta);
CREATE INDEX IF NOT EXISTS idx_ventas_mesa_estado ON ventas (mesa, estado);
