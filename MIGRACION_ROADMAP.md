# Hoja de Ruta: Migración SistemaPOS a Rust + Tauri + React

*2026-09-20*

Doc en línea (editable/comentable): https://claude.ai/artifact/9Su58PmrPMXftWgpL6bity

## Resumen ejecutivo

SistemaPOS pasa de una aplicación Java Swing de escritorio (Hibernate 3.x + MySQL) a una aplicación Tauri (backend Rust + frontend React) con la misma lógica de negocio y el mismo modelo de datos, pero con una interfaz táctil responsive y una arquitectura offline-first que sincroniza contra una base de datos en la nube.

**Por qué:** el stack actual (Swing, sin Maven, sin capa de servicios, credenciales en texto plano en `hibernate.cfg.xml`) es difícil de mantener y no está pensado para pantallas táctiles ni para operar sin conexión estable a internet.

**Alcance:** migrar los 14 módulos de negocio (Productos, Categorías, Mesas, Pedidos, Ventas, Turnos, Usuarios, Operaciones, Facturas, etc.), reemplazar los reportes JasperReports, y diseñar una capa de sincronización asíncrona local ↔ nube. No cambia el modelo de negocio del restaurante/bar, solo la tecnología.

## Estado actual (análisis del código)

- **Tamaño:** ~17.000 líneas de Java en 62 archivos, proyecto NetBeans sin Maven/Gradle (dependencias como jars sueltos en `libs`).
- **Persistencia:** Hibernate 3.x con mapeo XML (`.hbm.xml`, sin anotaciones), `hbm2ddl.auto=update` (el esquema se autogenera/ajusta en caliente), pool C3P0.
- **Modelo de datos:** 14 entidades — Categorias, Productos, Subproductos, ProductosEspeciales, PreciosEspeciales, Ingresoproductos, Mesas, Pedidos, Ventas, Turnos, Usuarios, Operaciones, ConceptosOperaciones, Facturas, Servicios.
- **UI:** formularios Swing generados por el editor de NetBeans (`.form` + `.java`), sin separación de capas: los formularios abren la `Session` de Hibernate directamente y contienen la lógica de negocio (`mainMesero.java` con 996 líneas, `Home_Administracion.java` con 824, varios formularios de administración de 400–700 líneas cada uno).
- **Reportes:** JasperReports (`.jrxml`/`.jasper`) para tickets, cortes de turno, ingresos de producto, cortesías, etc.
- **Conexión a base de datos:** MySQL 5.7 vía JDBC. Hoy apunta a `localhost`; existe una URL de Digital Ocean (puerto 25060) comentada en el mismo archivo de configuración — es decir, ya se probó la nube pero no quedó activa.
- **Riesgo de seguridad inmediato:** `hibernate.cfg.xml` tiene usuario y contraseña de MySQL local y de Digital Ocean en texto plano dentro del repositorio. Esto hay que resolverlo *antes* o durante la migración, independientemente del nuevo stack.
- **Dolor técnico para migrar:** al no haber capa de servicios/DAO, la lógica de negocio (cálculo de cuentas, descuentos, turnos, cuadres de caja) está entrelazada con el código de UI Swing. Extraer esa lógica a Rust será el trabajo más grande de la migración, no la reescritura visual.

## Arquitectura objetivo

| Capa | Tecnología | Rol |
| --- | --- | --- |
| Shell de escritorio | Tauri 2 | Empaqueta la app para Windows (touch), sustituye al runtime Swing; binario liviano, acceso nativo al sistema de archivos e impresoras |
| Backend | Rust (comandos Tauri + `sqlx`/`sea-orm`) | Toda la lógica de negocio migrada desde los `.java` de `models/` y de los formularios: cálculo de cuentas, turnos, descuentos, cuadres |
| Frontend | React + TypeScript | Pantallas táctiles (mesero, caja, administración), gráficos de ventas, formularios de CRUD |
| Estado/datos en frontend | React Query o similar, consumiendo comandos Tauri (no HTTP) | Caché de UI y sincronización con el backend local |
| Base de datos local | SQLite (embebida, vive junto al binario) | Fuente de verdad operativa del punto de venta, funciona sin internet |
| Base de datos en la nube | PostgreSQL o MySQL gestionado (Digital Ocean u otro) | Respaldo, consolidación multi-sede y reportes centralizados |
| Reportes | Generación de PDF en Rust (`printpdf`/`genpdf`) o plantillas HTML impresas desde React | Reemplaza JasperReports |

**Por qué Rust + Tauri en vez de Electron:** el POS corre en hardware de punto de venta (táctil, a veces limitado); Tauri usa el WebView del sistema en vez de empaquetar Chromium completo, consume mucha menos RAM y el binario es mucho más liviano — relevante para equipos de bar/restaurante que no son gama alta.

**Por qué no seguir con Java:** se puede modernizar Java (JavaFX + Spring), pero el pedido explícito es Rust/Tauri/React, y ese stack da mejor rendimiento en dispositivos táctiles de gama media y un ecosistema de UI (React) mucho más maduro para responsive design que Swing.

## Estrategia de base de datos: local + nube, sincronización asíncrona

**Esquema:** se conserva la misma estructura relacional (las 14 tablas y sus relaciones) para no perder lógica de negocio ya validada. Se traduce de HQL/Hibernate a SQL tipado con `sqlx` (Rust), con migraciones versionadas (`sqlx-cli` o `refinery`) en vez de `hbm2ddl.auto=update`, que es riesgoso en producción.

**Patrón offline-first (retomando la idea asíncrona que se había planteado antes):**

1. Cada terminal POS escribe siempre primero en su **SQLite local** — la venta, el pedido o el cierre de turno nunca esperan a la nube para completarse. Esto es crítico en un bar/restaurante: si se cae el internet, la operación no se detiene.
2. Cada escritura local genera un registro en una **tabla de cola/outbox** (`sync_outbox`) con el cambio y un timestamp.
3. Un worker asíncrono en Rust (tarea en segundo plano dentro del propio backend Tauri) drena esa cola contra la base de datos en la nube cuando hay conexión, con reintentos y backoff.
4. La nube consolida todas las sedes/terminales y sirve como respaldo y como fuente para reportes centralizados; si el equipo crece a varias sedes, también como vista consolidada de inventario y ventas.
5. Resolución de conflictos: dado que las mesas/turnos son manejados por una terminal a la vez, se recomienda **last-writer-wins por registro con timestamp**, evitando merges complejos; casos que sí chocan (p. ej. mismo producto editado desde dos sedes) se resuelven marcando el registro para revisión manual en vez de sobreescribir en silencio.

**Motor de base de datos en la nube — punto a decidir:** Digital Ocean Managed MySQL funciona, pero **PostgreSQL** tiene mejor soporte en el ecosistema Rust (`sqlx`, tipos, extensiones como `pg_cron` para tareas de consolidación) y Digital Ocean también ofrece Postgres gestionado con el mismo nivel de servicio. Alternativas válidas si se quiere comparar: Supabase (Postgres gestionado + backups + panel), Neon (Postgres serverless, bueno para picos) o mantener MySQL si se prioriza no tocar el dump SQL existente. Recomendación: Postgres gestionado en Digital Ocean, migrando el dump de `pos_system.sql` con una herramienta de conversión MySQL→Postgres, salvo que haya una razón de peso para quedarse en MySQL.

**Seguridad:** las credenciales de base de datos pasan de estar en el repositorio (`hibernate.cfg.xml`) a variables de entorno o a un gestor de secretos local (`keyring`/`tauri-plugin-store` cifrado), nunca versionadas.

## Fases de migración

| Fase | Contenido | Entregable |
| --- | --- | --- |
| 0. Base y seguridad | Sacar credenciales del repo, congelar y documentar el esquema actual (`pos_system.sql` como referencia), definir motor de nube (Postgres vs MySQL) | Esquema documentado, secretos fuera del código |
| 1. Cimientos | Proyecto Tauri + Rust + React inicial; capa de acceso a datos SQLite local con `sqlx`; migraciones versionadas; login/autenticación de usuarios | App vacía que abre, conecta a SQLite local y autentica |
| 2. CRUDs maestros | Productos, Subproductos, Categorías, Precios Especiales, Usuarios, Mesas, Servicios | Módulos de administración básicos funcionando end-to-end |
| 3. Operación diaria | Pedidos, Ventas, mainMesero (toma de pedidos en mesa/barra), aplicación de descuentos, modos de pago | Flujo completo de mesero funcionando en pantalla táctil |
| 4. Caja y turnos | Turnos, Operaciones/ConceptosOperaciones (ingresos/egresos de caja), Facturas, Ingresoproductos | Cuadre de caja y cierre de turno replicados fielmente |
| 5. Reportes | Reemplazo de JasperReports: tickets de impresión, gráfico de ventas, cortes de turno, cortesías | Reportes equivalentes a los actuales en PDF/impresión térmica |
| 6. Sincronización | Outbox local, worker asíncrono, base de datos en la nube activa, monitoreo de sync | Respaldo en la nube funcionando con la operación local intacta |
| 7. UI/UX táctil definitiva | Pulido responsive, tamaños de botón, temas claro/oscuro si aplica, accesos rápidos | Interfaz validada en la pantalla táctil real del negocio |
| 8. Migración de datos y corte | Migrar datos históricos de MySQL al nuevo motor, correr ambos sistemas en paralelo un periodo corto, capacitar al equipo, apagar Java | Sistema Java dado de baja, Rust/Tauri en producción |

Cada fase deja un entregable usable, no un prototipo desechable — esto permite validar con el equipo del restaurante en pantalla táctil real desde la fase 3, mucho antes de tener todo migrado.

## Diseño UI/UX responsive táctil

- **Grid fluido**, no píxeles fijos: layout basado en CSS Grid/Flexbox con unidades relativas (`rem`, `%`, `clamp()`), para que la misma pantalla sirva en un monitor táctil de 15", una tablet o un monitor de administración de escritorio.
- **Área mínima de toque de 44×44px** (estándar de accesibilidad táctil) en todos los botones de operación — mesas, productos, cantidades — con separación suficiente para evitar toques accidentales en el flujo de alto volumen (hora pico).
- **Jerarquía visual por frecuencia de uso:** las acciones más usadas por el mesero (agregar producto, cobrar, imprimir) van más grandes y accesibles con el pulgar; las administrativas (editar, eliminar) más pequeñas y con confirmación.
- **Sin hover, todo con estados de toque:** feedback visual inmediato (cambio de color/escala) al presionar, porque no hay cursor que anticipe la acción.
- **Modo quiosco:** Tauri permite pantalla completa fija sin barra de título/bordes del SO, evitando que el mesero cierre o minimice la app por error.
- **Componentes reutilizables en React** (botón grande, selector de cantidad, grilla de mesas, grilla de productos) construidos una vez y reusados en los módulos de mesero, caja y administración, en vez de repetir el patrón de cada formulario Swing actual.

## Riesgos y decisiones abiertas

- **Decisión abierta — motor de nube:** Postgres gestionado en Digital Ocean (recomendado) vs. mantener MySQL vs. evaluar Supabase/Neon. Afecta las migraciones y el tipo de `sqlx`.
- **Decisión abierta — alcance de la capacitación del equipo Rust:** si nadie en el equipo tiene experiencia previa en Rust, la curva de aprendizaje impacta directamente el cronograma de las fases 1–4.
- **Riesgo — impresoras térmicas y periféricos:** el sistema actual imprime tickets (JasperReports); hay que validar temprano que los drivers/protocolos de la impresora térmica funcionan igual de bien desde Rust/Tauri antes de comprometerse a reemplazar Jasper.
- **Riesgo — continuidad operativa:** el restaurante no puede parar; se recomienda operar Java y Rust en paralelo durante la fase 8, con el Java como respaldo hasta validar el nuevo sistema en un turno completo real.
- **Riesgo — conflictos de sincronización:** si en el futuro hay más de una terminal escribiendo la misma mesa/turno simultáneamente, el esquema last-writer-wins puede no ser suficiente; se puede revisar si eso aplica al negocio actual.

## Próximos pasos inmediatos

1. Rotar y sacar del repositorio las credenciales de `hibernate.cfg.xml` (local y Digital Ocean) — esto es independiente de la migración y urgente.
2. Confirmar motor de base de datos en la nube (Postgres en Digital Ocean vs. otra opción).
3. Crear el esqueleto del proyecto Tauri + Rust + React (fase 1) y validar que SQLite local + `sqlx` funcionan con una tabla de prueba.
4. Elegir el primer módulo a migrar por completo (Productos/Categorías es el más simple para validar el patrón CRUD de punta a punta) antes de escalar al resto.
