-- Equivalente SQLite de usuarios/mesas (models/mappins/Usuarios.hbm.xml, Mesas.hbm.xml)

CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
    nombres    TEXT NOT NULL,
    apellidos  TEXT NOT NULL,
    pin        INTEGER NOT NULL UNIQUE,
    perfil     TEXT NOT NULL,
    estado     TEXT NOT NULL DEFAULT 'Activo'
);

CREATE TABLE IF NOT EXISTS mesas (
    id_mesa INTEGER PRIMARY KEY AUTOINCREMENT,
    numero  TEXT NOT NULL UNIQUE,
    tipo    TEXT NOT NULL,
    estado  TEXT NOT NULL DEFAULT 'Activa'
);
