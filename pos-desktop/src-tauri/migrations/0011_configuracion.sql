-- Configuración general clave/valor de la app (por ahora: cuenta SMTP para
-- enviar los reportes por correo).
CREATE TABLE IF NOT EXISTS configuracion (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL DEFAULT ''
);
