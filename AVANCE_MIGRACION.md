# Avance de la migración — SistemaPOS a Rust + Tauri + React

*Última sesión: 2026-09-20*

Hoja de ruta completa: `MIGRACION_ROADMAP.md` (este archivo). Proyecto nuevo: `pos-desktop/` (junto a `CodigoFuente/`, el sistema Java original que sigue intacto).

## Cómo continuar mañana

```bash
cd pos-desktop
npm run tauri dev
```

Primer arranque del día: compila rápido si no tocaste `src-tauri/` (solo Vite). Si tocas archivos `.rs`, Cargo recompila incremental (~1–2 min en esta máquina; la primera compilación desde cero tarda 6–10 min por las pocas RAM disponibles, ~6 GB — ver nota abajo). No cierres la terminal mientras desarrollas: recarga en caliente tanto el frontend (Vite) como el backend (cargo watch integrado de Tauri).

**Pendiente inmediato (lo dejamos a medias hoy):**

1. Abrir la app y en la pantalla de login tocar **"Importar catálogo real (reemplaza datos de prueba)"**. Carga los datos de `DataBase/pos_system (7).sql` (15 categorías, ~81 productos, 10 usuarios, 7 mesas — el catálogo real de Maison du Café, no el de 2018). Borra antes los datos de prueba (categorías/productos/usuarios/mesas y las ventas/pedidos/turnos asociados a ellos).
2. Verificar que el login funcione con un PIN real (ej. `2488` = Jessica, Administradora) y que categorías/productos/mesas se vean bien.
3. **Quitar el botón y el código de importación** una vez confirmado que funcionó — es temporal, no debe quedar en la app final:
   - `pos-desktop/src/components/Login.tsx`: quitar el botón "Importar catálogo real" y la función `importarCatalogo`.
   - `pos-desktop/src-tauri/src/commands.rs`: quitar el comando `importar_catalogo_real` y la constante `SEED_IMPORT_SQL`.
   - `pos-desktop/src-tauri/src/lib.rs`: quitar `commands::importar_catalogo_real` del `invoke_handler`.
   - Borrar `pos-desktop/src-tauri/seed_import.sql` (o dejarlo como respaldo fuera del build si se prefiere).

## Qué está construido y funcionando

**Stack:** Tauri 2 + Rust (`sqlx` + SQLite local) + React + TypeScript + Vite. Sin Postgres/nube todavía (fase 6 del roadmap).

**Módulos con CRUD completo (fase 2):**
- Categorías, Productos (con selector de categoría), Usuarios (con PIN y perfil), Mesas (Activa/Inactiva).

**Removido a pedido del usuario (no prioridad):** Recetas/Subproductos y Precios Especiales — el código y la UI se quitaron, pero las tablas `subproductos`, `precios_especiales` y `productos_especiales` siguen en el esquema SQLite (migración `0003`) sin usarse, por compatibilidad con la base local ya migrada.

**Login y turnos (fase 4, adelantada):**
- Login por PIN (teclado táctil), valida contra `usuarios.pin` + `estado='Activo'`.
- Al entrar, si no hay turno con `estado='Abierto'`, pide valor inicial de caja y lo abre. Si ya hay uno abierto, se reutiliza (compartido entre usuarios).
- Pestañas visibles según `perfil`: solo `Administrador` ve Categorías/Productos/Usuarios/Mesas y puede cerrar turno. Los demás perfiles (Barista, Gerente) solo ven Ventas.
- Cerrar turno se bloquea si hay ventas con `estado='Abierta'` sin cobrar (igual que `Home_Administracion.java` del sistema original).

**Ventas (fase 3):**
- Mesa "ocupada" se calcula en vivo (existe una venta `Abierta` para esa mesa), **no es una columna guardada** — igual que `frmMesas.java` original.
- Tocar mesa libre abre venta con el mesero = usuario logueado (ya no se pregunta).
- Selector de cantidad táctil al tocar un producto (como `frmCantidad.java`), sin necesidad de tocar N veces.
- Agregar pedido descuenta stock, quitarlo lo repone — **sin bloquear la venta aunque el stock quede negativo** (igual que el original; solo se muestra en rojo como referencia visual).
- Relación real: una venta tiene muchos pedidos, cada pedido apunta a un solo producto (con cantidad y valor de línea) — igual que `Pedidos.hbm.xml`.
- Cobro: checkbox de propina con 5/8/10% sobre el total (mejora nueva, no estaba en el original). Si la forma de pago es Efectivo, pide cuánto paga (con teclado numérico en pantalla) y calcula las vueltas en vivo, bloqueando el cobro si el dinero es insuficiente (igual que `frmVueltas.java`).
- Teclado numérico en pantalla (`TecladoNumerico.tsx`) reutilizado en "¿con cuánto paga?" y en el valor inicial de caja — pensado para kiosco táctil sin teclado físico.

## Qué falta (siguiente prioridad sugerida: terminar fase 3/4, luego fase 5)

- **Turno**: falta la pantalla de cuadre de caja al cerrar turno (total ventas por forma de pago, propinas, comparar contra valor inicial) — existe en el Java original (`Home_Administracion.java`, `frmValorTurno.java`) pero no se portó aún.
- **Operaciones de caja** (ingresos/egresos manuales, tabla `operaciones`/`conceptos_operaciones`) — no empezado.
- **Facturas** — no empezado.
- **Reportes** (fase 5): reemplazo de JasperReports, aún no iniciado.
- **Sincronización nube** (fase 6): tabla `sync_outbox` ya existe en el esquema (migración `0001`) pero no hay worker que la use todavía.
- **Descuentos por línea de pedido**: columna `descuento`/`concepto_desc` existe en `pedidos` pero no está conectada a la UI.

## Notas técnicas para la próxima sesión

- La máquina de desarrollo tiene **~6 GB de RAM** — las compilaciones completas de Rust (`cargo run` desde cero) son lentas (6–10 min) por swapping. Las incrementales (solo tocar `.rs` sin cambiar dependencias) son rápidas (1–2 min). Los cambios de solo React/CSS son instantáneos (Vite HMR, sin recompilar Rust).
- Cerrar la ventana de la app mata el proceso `npm run tauri dev` completo (no queda en segundo plano) — hay que volver a correr `npm run tauri dev` para retomar.
- Base de datos local SQLite en: `%APPDATA%\com.manuel_rodriguez.pos-desktop\pos_local.db` (se crea sola al primer arranque, corre las migraciones de `src-tauri/migrations/` automáticamente).
- Dump de datos reales del negocio: `DataBase/pos_system (7).sql` (MariaDB 10.4, 21-09-2026) — mismo esquema de columnas que nuestro SQLite para `categorias`, `productos`, `usuarios`, `mesas`, así que los `INSERT` se pueden ejecutar tal cual (SQLite acepta identificadores con backtick).
- Pendiente de decidir: motor de base de datos en la nube (Postgres recomendado vs. MySQL) — ver `MIGRACION_ROADMAP.md`, sección "Riesgos y decisiones abiertas". Todavía sin confirmar.
- Riesgo de seguridad abierto (independiente de esta migración): `CodigoFuente/src/hibernate.cfg.xml` tiene credenciales de MySQL en texto plano en el repo — pendiente de rotar.
