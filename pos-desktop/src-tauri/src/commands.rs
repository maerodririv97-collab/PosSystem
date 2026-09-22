use regex::Regex;
use sqlx::SqlitePool;
use tauri::State;

use crate::models::{
    Categoria, CerrarVenta, ConceptoOperacion, DesglosePago, DetalleDia, Mesa, MovimientoInventario, NuevaCategoria,
    NuevaMesa, NuevaOperacion, NuevoConceptoOperacion, NuevoProducto, NuevoUsuario, Operacion, Pedido, Producto,
    ResumenTurno, Turno, Usuario, Venta, VentaAbierta, VentaDetalle, VentaDia,
};

#[tauri::command]
pub async fn listar_categorias(pool: State<'_, SqlitePool>) -> Result<Vec<Categoria>, String> {
    sqlx::query_as::<_, Categoria>("SELECT id_categoria, nombre, tipo FROM categorias ORDER BY lower(nombre)")
        .fetch_all(pool.inner())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn crear_categoria(
    pool: State<'_, SqlitePool>,
    categoria: NuevaCategoria,
) -> Result<Categoria, String> {
    let rec = sqlx::query_as::<_, Categoria>(
        "INSERT INTO categorias (nombre, tipo) VALUES (?1, ?2)
         RETURNING id_categoria, nombre, tipo",
    )
    .bind(&categoria.nombre)
    .bind(&categoria.tipo)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    Ok(rec)
}

#[tauri::command]
pub async fn actualizar_categoria(
    pool: State<'_, SqlitePool>,
    categoria: Categoria,
) -> Result<Categoria, String> {
    sqlx::query("UPDATE categorias SET nombre = ?1, tipo = ?2 WHERE id_categoria = ?3")
        .bind(&categoria.nombre)
        .bind(&categoria.tipo)
        .bind(categoria.id_categoria)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    Ok(categoria)
}

#[tauri::command]
pub async fn eliminar_categoria(pool: State<'_, SqlitePool>, id_categoria: i64) -> Result<(), String> {
    sqlx::query("DELETE FROM categorias WHERE id_categoria = ?1")
        .bind(id_categoria)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn listar_productos(pool: State<'_, SqlitePool>) -> Result<Vec<Producto>, String> {
    sqlx::query_as::<_, Producto>(
        "SELECT id_producto, categoria, codigo_barras, nombre, costo, valor, stock, servicio, tipo_venta, imagen, estado
         FROM productos ORDER BY lower(nombre)",
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn crear_producto(
    pool: State<'_, SqlitePool>,
    producto: NuevoProducto,
) -> Result<Producto, String> {
    let rec = sqlx::query_as::<_, Producto>(
        "INSERT INTO productos (categoria, codigo_barras, nombre, costo, valor, stock, servicio, tipo_venta, imagen, estado)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
         RETURNING id_producto, categoria, codigo_barras, nombre, costo, valor, stock, servicio, tipo_venta, imagen, estado",
    )
    .bind(producto.categoria)
    .bind(&producto.codigo_barras)
    .bind(&producto.nombre)
    .bind(producto.costo)
    .bind(producto.valor)
    .bind(producto.stock)
    .bind(producto.servicio)
    .bind(&producto.tipo_venta)
    .bind(&producto.imagen)
    .bind(&producto.estado)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    Ok(rec)
}

#[tauri::command]
pub async fn actualizar_producto(pool: State<'_, SqlitePool>, producto: Producto) -> Result<Producto, String> {
    sqlx::query(
        "UPDATE productos SET categoria = ?1, codigo_barras = ?2, nombre = ?3, costo = ?4, valor = ?5,
         stock = ?6, servicio = ?7, tipo_venta = ?8, imagen = ?9, estado = ?10 WHERE id_producto = ?11",
    )
    .bind(producto.categoria)
    .bind(&producto.codigo_barras)
    .bind(&producto.nombre)
    .bind(producto.costo)
    .bind(producto.valor)
    .bind(producto.stock)
    .bind(producto.servicio)
    .bind(&producto.tipo_venta)
    .bind(&producto.imagen)
    .bind(&producto.estado)
    .bind(producto.id_producto)
    .execute(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    Ok(producto)
}

#[tauri::command]
pub async fn eliminar_producto(pool: State<'_, SqlitePool>, id_producto: i64) -> Result<(), String> {
    sqlx::query("DELETE FROM productos WHERE id_producto = ?1")
        .bind(id_producto)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

async fn verificar_admin(pool: &SqlitePool, actor_id: i64) -> Result<(), String> {
    let perfil: String = sqlx::query_scalar("SELECT perfil FROM usuarios WHERE id_usuario = ?1")
        .bind(actor_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Usuario no encontrado".to_string())?;

    if perfil != "Administrador" && perfil != "Desarrollador" {
        return Err("Solo un Administrador puede hacer esto".to_string());
    }

    Ok(())
}

#[tauri::command]
pub async fn ajustar_stock(
    pool: State<'_, SqlitePool>,
    id_producto: i64,
    nuevo_stock: f64,
    motivo: String,
    actor_id: i64,
) -> Result<Producto, String> {
    verificar_admin(pool.inner(), actor_id).await?;

    let stock_anterior: f64 = sqlx::query_scalar("SELECT stock FROM productos WHERE id_producto = ?1")
        .bind(id_producto)
        .fetch_optional(pool.inner())
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Producto no encontrado".to_string())?;

    let fecha = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    sqlx::query("UPDATE productos SET stock = ?1 WHERE id_producto = ?2")
        .bind(nuevo_stock)
        .bind(id_producto)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query(
        "INSERT INTO movimientos_inventario (producto, usuario, tipo, stock_anterior, stock_nuevo, motivo, fecha)
         VALUES (?1, ?2, 'Ajuste', ?3, ?4, ?5, ?6)",
    )
    .bind(id_producto)
    .bind(actor_id)
    .bind(stock_anterior)
    .bind(nuevo_stock)
    .bind(&motivo)
    .bind(&fecha)
    .execute(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query_as::<_, Producto>(
        "SELECT id_producto, categoria, codigo_barras, nombre, costo, valor, stock, servicio, tipo_venta, imagen, estado
         FROM productos WHERE id_producto = ?1",
    )
    .bind(id_producto)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn dar_de_baja_stock(
    pool: State<'_, SqlitePool>,
    id_producto: i64,
    cantidad: f64,
    motivo: String,
    actor_id: i64,
) -> Result<Producto, String> {
    verificar_admin(pool.inner(), actor_id).await?;

    let stock_anterior: f64 = sqlx::query_scalar("SELECT stock FROM productos WHERE id_producto = ?1")
        .bind(id_producto)
        .fetch_optional(pool.inner())
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Producto no encontrado".to_string())?;

    let stock_nuevo = stock_anterior - cantidad;
    let fecha = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    sqlx::query("UPDATE productos SET stock = ?1 WHERE id_producto = ?2")
        .bind(stock_nuevo)
        .bind(id_producto)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query(
        "INSERT INTO movimientos_inventario (producto, usuario, tipo, stock_anterior, stock_nuevo, motivo, fecha)
         VALUES (?1, ?2, 'Baja', ?3, ?4, ?5, ?6)",
    )
    .bind(id_producto)
    .bind(actor_id)
    .bind(stock_anterior)
    .bind(stock_nuevo)
    .bind(&motivo)
    .bind(&fecha)
    .execute(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query_as::<_, Producto>(
        "SELECT id_producto, categoria, codigo_barras, nombre, costo, valor, stock, servicio, tipo_venta, imagen, estado
         FROM productos WHERE id_producto = ?1",
    )
    .bind(id_producto)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn listar_movimientos_inventario(pool: State<'_, SqlitePool>) -> Result<Vec<MovimientoInventario>, String> {
    sqlx::query_as::<_, MovimientoInventario>(
        "SELECT m.id_movimiento, m.producto, p.nombre AS nombre_producto, m.usuario,
                (u.nombres || ' ' || u.apellidos) AS nombre_usuario, m.tipo, m.stock_anterior, m.stock_nuevo,
                m.motivo, m.fecha
         FROM movimientos_inventario m
         JOIN productos p ON p.id_producto = m.producto
         JOIN usuarios u ON u.id_usuario = m.usuario
         ORDER BY m.id_movimiento DESC",
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn listar_usuarios(pool: State<'_, SqlitePool>) -> Result<Vec<Usuario>, String> {
    sqlx::query_as::<_, Usuario>(
        "SELECT id_usuario, nombres, apellidos, pin, perfil, estado FROM usuarios
         WHERE perfil != 'Desarrollador' ORDER BY lower(nombres)",
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn crear_usuario(pool: State<'_, SqlitePool>, usuario: NuevoUsuario) -> Result<Usuario, String> {
    sqlx::query_as::<_, Usuario>(
        "INSERT INTO usuarios (nombres, apellidos, pin, perfil, estado) VALUES (?1, ?2, ?3, ?4, ?5)
         RETURNING id_usuario, nombres, apellidos, pin, perfil, estado",
    )
    .bind(&usuario.nombres)
    .bind(&usuario.apellidos)
    .bind(usuario.pin)
    .bind(&usuario.perfil)
    .bind(&usuario.estado)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn actualizar_usuario(
    pool: State<'_, SqlitePool>,
    actor_id: i64,
    usuario: Usuario,
) -> Result<Usuario, String> {
    let actor_perfil: String =
        sqlx::query_scalar("SELECT perfil FROM usuarios WHERE id_usuario = ?1")
            .bind(actor_id)
            .fetch_optional(pool.inner())
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "Usuario no encontrado".to_string())?;

    if actor_perfil != "Administrador" && actor_perfil != "Desarrollador" {
        return Err("Solo un Administrador puede editar estos datos".to_string());
    }

    sqlx::query(
        "UPDATE usuarios SET nombres = ?1, apellidos = ?2, pin = ?3, perfil = ?4, estado = ?5 WHERE id_usuario = ?6",
    )
    .bind(&usuario.nombres)
    .bind(&usuario.apellidos)
    .bind(usuario.pin)
    .bind(&usuario.perfil)
    .bind(&usuario.estado)
    .bind(usuario.id_usuario)
    .execute(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    Ok(usuario)
}

#[tauri::command]
pub async fn actualizar_mis_datos(
    pool: State<'_, SqlitePool>,
    id_usuario: i64,
    nombres: String,
    apellidos: String,
    pin: i64,
) -> Result<Usuario, String> {
    sqlx::query_as::<_, Usuario>(
        "UPDATE usuarios SET nombres = ?1, apellidos = ?2, pin = ?3 WHERE id_usuario = ?4
         RETURNING id_usuario, nombres, apellidos, pin, perfil, estado",
    )
    .bind(&nombres)
    .bind(&apellidos)
    .bind(pin)
    .bind(id_usuario)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn eliminar_usuario(pool: State<'_, SqlitePool>, id_usuario: i64) -> Result<(), String> {
    sqlx::query("DELETE FROM usuarios WHERE id_usuario = ?1")
        .bind(id_usuario)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn listar_mesas(pool: State<'_, SqlitePool>) -> Result<Vec<Mesa>, String> {
    sqlx::query_as::<_, Mesa>("SELECT id_mesa, numero, tipo, estado FROM mesas ORDER BY numero")
        .fetch_all(pool.inner())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn crear_mesa(pool: State<'_, SqlitePool>, mesa: NuevaMesa) -> Result<Mesa, String> {
    sqlx::query_as::<_, Mesa>(
        "INSERT INTO mesas (numero, tipo, estado) VALUES (?1, ?2, ?3)
         RETURNING id_mesa, numero, tipo, estado",
    )
    .bind(&mesa.numero)
    .bind(&mesa.tipo)
    .bind(&mesa.estado)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn actualizar_mesa(pool: State<'_, SqlitePool>, mesa: Mesa) -> Result<Mesa, String> {
    sqlx::query("UPDATE mesas SET numero = ?1, tipo = ?2, estado = ?3 WHERE id_mesa = ?4")
        .bind(&mesa.numero)
        .bind(&mesa.tipo)
        .bind(&mesa.estado)
        .bind(mesa.id_mesa)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    Ok(mesa)
}

#[tauri::command]
pub async fn eliminar_mesa(pool: State<'_, SqlitePool>, id_mesa: i64) -> Result<(), String> {
    sqlx::query("DELETE FROM mesas WHERE id_mesa = ?1")
        .bind(id_mesa)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn listar_ventas_abiertas(pool: State<'_, SqlitePool>) -> Result<Vec<VentaAbierta>, String> {
    sqlx::query_as::<_, VentaAbierta>(
        "SELECT v.id_venta, v.mesa, m.numero AS numero_mesa, v.mesero, (u.nombres || ' ' || u.apellidos) AS nombre_mesero,
                v.fecha, COALESCE((SELECT SUM(p.valor) FROM pedidos p WHERE p.venta = v.id_venta), 0) AS total
         FROM ventas v
         JOIN mesas m ON m.id_mesa = v.mesa
         JOIN usuarios u ON u.id_usuario = v.mesero
         WHERE v.estado = 'Abierta'
         ORDER BY v.fecha",
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn abrir_venta(pool: State<'_, SqlitePool>, mesa: i64, mesero: i64, turno: i64) -> Result<Venta, String> {
    let existente = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM ventas WHERE mesa = ?1 AND estado = 'Abierta'")
        .bind(mesa)
        .fetch_one(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    if existente > 0 {
        return Err("La mesa ya tiene una venta abierta".to_string());
    }

    let fecha = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    sqlx::query_as::<_, Venta>(
        "INSERT INTO ventas (mesa, mesero, turno, fecha, forma_pago, valor_propina, estado)
         VALUES (?1, ?2, ?3, ?4, 'Efectivo', 0, 'Abierta')
         RETURNING id_venta, mesa, mesero, fecha, forma_pago, valor_propina, estado",
    )
    .bind(mesa)
    .bind(mesero)
    .bind(turno)
    .bind(&fecha)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn listar_pedidos(pool: State<'_, SqlitePool>, id_venta: i64) -> Result<Vec<Pedido>, String> {
    sqlx::query_as::<_, Pedido>(
        "SELECT pe.id_pedido, pe.producto, pr.nombre AS nombre_producto, pe.venta, pe.valor, pe.cantidad,
                pe.compra, pe.impreso, pe.descuento, pe.concepto_desc
         FROM pedidos pe
         JOIN productos pr ON pr.id_producto = pe.producto
         WHERE pe.venta = ?1
         ORDER BY pe.id_pedido",
    )
    .bind(id_venta)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn agregar_pedido(
    pool: State<'_, SqlitePool>,
    id_venta: i64,
    id_producto: i64,
    cantidad: i64,
) -> Result<Pedido, String> {
    let producto = sqlx::query_as::<_, Producto>(
        "SELECT id_producto, categoria, codigo_barras, nombre, costo, valor, stock, servicio, tipo_venta, imagen, estado
         FROM productos WHERE id_producto = ?1",
    )
    .bind(id_producto)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    let valor = producto.valor * cantidad;
    let compra = producto.costo * cantidad;

    let pedido_id: i64 = sqlx::query_scalar(
        "INSERT INTO pedidos (producto, venta, valor, cantidad, compra, impreso) VALUES (?1, ?2, ?3, ?4, ?5, 0)
         RETURNING id_pedido",
    )
    .bind(id_producto)
    .bind(id_venta)
    .bind(valor)
    .bind(cantidad)
    .bind(compra)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query("UPDATE productos SET stock = stock - ?1 WHERE id_producto = ?2")
        .bind(cantidad as f64)
        .bind(id_producto)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query_as::<_, Pedido>(
        "SELECT pe.id_pedido, pe.producto, pr.nombre AS nombre_producto, pe.venta, pe.valor, pe.cantidad,
                pe.compra, pe.impreso, pe.descuento, pe.concepto_desc
         FROM pedidos pe JOIN productos pr ON pr.id_producto = pe.producto WHERE pe.id_pedido = ?1",
    )
    .bind(pedido_id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn eliminar_pedido(pool: State<'_, SqlitePool>, id_pedido: i64) -> Result<(), String> {
    let (id_producto, cantidad): (i64, i64) =
        sqlx::query_as("SELECT producto, cantidad FROM pedidos WHERE id_pedido = ?1")
            .bind(id_pedido)
            .fetch_one(pool.inner())
            .await
            .map_err(|e| e.to_string())?;

    sqlx::query("UPDATE productos SET stock = stock + ?1 WHERE id_producto = ?2")
        .bind(cantidad as f64)
        .bind(id_producto)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query("DELETE FROM pedidos WHERE id_pedido = ?1")
        .bind(id_pedido)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn cerrar_venta(pool: State<'_, SqlitePool>, cierre: CerrarVenta) -> Result<(), String> {
    sqlx::query("UPDATE ventas SET estado = 'Pagada', forma_pago = ?1, valor_propina = ?2 WHERE id_venta = ?3")
        .bind(&cierre.forma_pago)
        .bind(cierre.valor_propina)
        .bind(cierre.id_venta)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn cancelar_venta(pool: State<'_, SqlitePool>, id_venta: i64) -> Result<(), String> {
    let pedidos: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM pedidos WHERE venta = ?1")
        .bind(id_venta)
        .fetch_one(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    if pedidos > 0 {
        return Err("La venta tiene pedidos; quitalos antes de cancelarla".to_string());
    }

    sqlx::query("DELETE FROM ventas WHERE id_venta = ?1 AND estado = 'Abierta'")
        .bind(id_venta)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn login_pin(pool: State<'_, SqlitePool>, pin: i64) -> Result<Usuario, String> {
    let usuario = sqlx::query_as::<_, Usuario>(
        "SELECT id_usuario, nombres, apellidos, pin, perfil, estado FROM usuarios WHERE pin = ?1",
    )
    .bind(pin)
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    match usuario {
        Some(u) if u.estado.eq_ignore_ascii_case("Activo") => Ok(u),
        Some(_) => Err("Usuario inactivo".to_string()),
        None => Err("PIN incorrecto".to_string()),
    }
}

#[tauri::command]
pub async fn obtener_turno_abierto(pool: State<'_, SqlitePool>) -> Result<Option<Turno>, String> {
    sqlx::query_as::<_, Turno>(
        "SELECT id_turno, apertura, cierre, valor_inicial, estado, valor_final, diferencia FROM turnos WHERE estado = 'Abierto' LIMIT 1",
    )
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn abrir_turno(pool: State<'_, SqlitePool>, valor_inicial: i64) -> Result<Turno, String> {
    let existente = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM turnos WHERE estado = 'Abierto'")
        .fetch_one(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    if existente > 0 {
        return Err("Ya hay un turno abierto".to_string());
    }

    let apertura = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    sqlx::query_as::<_, Turno>(
        "INSERT INTO turnos (apertura, cierre, valor_inicial, estado) VALUES (?1, NULL, ?2, 'Abierto')
         RETURNING id_turno, apertura, cierre, valor_inicial, estado, valor_final, diferencia",
    )
    .bind(&apertura)
    .bind(valor_inicial)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())
}

async fn calcular_resumen_turno(pool: &SqlitePool, id_turno: i64) -> Result<ResumenTurno, String> {
    let valor_inicial: i64 = sqlx::query_scalar("SELECT valor_inicial FROM turnos WHERE id_turno = ?1")
        .bind(id_turno)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    let desglose = sqlx::query_as::<_, DesglosePago>(
        "SELECT v.forma_pago AS forma_pago, COALESCE(SUM(p.valor), 0) AS total
         FROM ventas v
         JOIN pedidos p ON p.venta = v.id_venta
         WHERE v.turno = ?1 AND v.estado = 'Pagada'
         GROUP BY v.forma_pago",
    )
    .bind(id_turno)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let total_propinas: f64 =
        sqlx::query_scalar("SELECT COALESCE(SUM(valor_propina), 0.0) FROM ventas WHERE turno = ?1 AND estado = 'Pagada'")
            .bind(id_turno)
            .fetch_one(pool)
            .await
            .map_err(|e| e.to_string())?;
    let total_propinas = total_propinas.round() as i64;

    let total_ventas: i64 = desglose.iter().map(|d| d.total).sum::<i64>() + total_propinas;

    let efectivo_propinas: f64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(valor_propina), 0.0) FROM ventas WHERE turno = ?1 AND estado = 'Pagada' AND forma_pago = 'Efectivo'",
    )
    .bind(id_turno)
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    let total_efectivo_ventas = desglose
        .iter()
        .find(|d| d.forma_pago == "Efectivo")
        .map(|d| d.total)
        .unwrap_or(0);

    let total_ingresos: i64 =
        sqlx::query_scalar("SELECT COALESCE(SUM(valor), 0) FROM operaciones WHERE turno = ?1 AND tipo = 'Ingreso'")
            .bind(id_turno)
            .fetch_one(pool)
            .await
            .map_err(|e| e.to_string())?;

    let total_egresos: i64 =
        sqlx::query_scalar("SELECT COALESCE(SUM(valor), 0) FROM operaciones WHERE turno = ?1 AND tipo = 'Egreso'")
            .bind(id_turno)
            .fetch_one(pool)
            .await
            .map_err(|e| e.to_string())?;

    let efectivo_esperado = valor_inicial + total_efectivo_ventas + efectivo_propinas.round() as i64
        + total_ingresos
        - total_egresos;

    Ok(ResumenTurno {
        valor_inicial,
        total_ventas,
        total_propinas,
        total_ingresos,
        total_egresos,
        efectivo_esperado,
        desglose,
    })
}

#[tauri::command]
pub async fn listar_conceptos_operaciones(pool: State<'_, SqlitePool>) -> Result<Vec<ConceptoOperacion>, String> {
    sqlx::query_as::<_, ConceptoOperacion>(
        "SELECT id_concepto_operacion, nombre, descripcion FROM conceptos_operaciones ORDER BY lower(nombre)",
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn crear_concepto_operacion(
    pool: State<'_, SqlitePool>,
    concepto: NuevoConceptoOperacion,
) -> Result<ConceptoOperacion, String> {
    sqlx::query_as::<_, ConceptoOperacion>(
        "INSERT INTO conceptos_operaciones (nombre, descripcion) VALUES (?1, ?2)
         RETURNING id_concepto_operacion, nombre, descripcion",
    )
    .bind(&concepto.nombre)
    .bind(&concepto.descripcion)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn eliminar_concepto_operacion(pool: State<'_, SqlitePool>, id_concepto_operacion: i64) -> Result<(), String> {
    sqlx::query("DELETE FROM conceptos_operaciones WHERE id_concepto_operacion = ?1")
        .bind(id_concepto_operacion)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn listar_operaciones(pool: State<'_, SqlitePool>, id_turno: i64) -> Result<Vec<Operacion>, String> {
    sqlx::query_as::<_, Operacion>(
        "SELECT o.id_operacion, o.tipo_concepto, c.nombre AS nombre_concepto, o.turno, o.administrador,
                o.tipo, o.valor, o.fecha, o.concepto
         FROM operaciones o
         JOIN conceptos_operaciones c ON c.id_concepto_operacion = o.tipo_concepto
         WHERE o.turno = ?1
         ORDER BY o.id_operacion DESC",
    )
    .bind(id_turno)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn crear_operacion(pool: State<'_, SqlitePool>, operacion: NuevaOperacion) -> Result<Operacion, String> {
    let fecha = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    let id_operacion: i64 = sqlx::query_scalar(
        "INSERT INTO operaciones (tipo_concepto, turno, administrador, tipo, valor, fecha, concepto)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
         RETURNING id_operacion",
    )
    .bind(operacion.tipo_concepto)
    .bind(operacion.turno)
    .bind(operacion.administrador)
    .bind(&operacion.tipo)
    .bind(operacion.valor)
    .bind(&fecha)
    .bind(&operacion.concepto)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query_as::<_, Operacion>(
        "SELECT o.id_operacion, o.tipo_concepto, c.nombre AS nombre_concepto, o.turno, o.administrador,
                o.tipo, o.valor, o.fecha, o.concepto
         FROM operaciones o
         JOIN conceptos_operaciones c ON c.id_concepto_operacion = o.tipo_concepto
         WHERE o.id_operacion = ?1",
    )
    .bind(id_operacion)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn resumen_turno(pool: State<'_, SqlitePool>, id_turno: i64) -> Result<ResumenTurno, String> {
    calcular_resumen_turno(pool.inner(), id_turno).await
}

#[tauri::command]
pub async fn cerrar_turno(pool: State<'_, SqlitePool>, id_turno: i64, valor_final: i64) -> Result<(), String> {
    let ventas_abiertas = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM ventas WHERE turno = ?1 AND estado = 'Abierta'",
    )
    .bind(id_turno)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    if ventas_abiertas > 0 {
        return Err("No puede cerrar el turno: hay ventas abiertas pendientes de cobrar".to_string());
    }

    let resumen = calcular_resumen_turno(pool.inner(), id_turno).await?;
    let diferencia = valor_final - resumen.efectivo_esperado;

    let cierre = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    sqlx::query(
        "UPDATE turnos SET cierre = ?1, estado = 'Cerrado', valor_final = ?2, diferencia = ?3 WHERE id_turno = ?4",
    )
    .bind(&cierre)
    .bind(valor_final)
    .bind(diferencia)
    .bind(id_turno)
    .execute(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

const SEED_IMPORT_SQL: &str = include_str!("../seed_import.sql");
const SEED_HISTORICO_SQL: &str = include_str!("../seed_historico.sql");

#[tauri::command]
pub async fn importar_catalogo_real(pool: State<'_, SqlitePool>) -> Result<String, String> {
    sqlx::query("DELETE FROM operaciones").execute(pool.inner()).await.map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM conceptos_operaciones").execute(pool.inner()).await.map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM pedidos").execute(pool.inner()).await.map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM ventas").execute(pool.inner()).await.map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM turnos").execute(pool.inner()).await.map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM productos").execute(pool.inner()).await.map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM categorias").execute(pool.inner()).await.map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM usuarios WHERE perfil != 'Desarrollador'")
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM mesas").execute(pool.inner()).await.map_err(|e| e.to_string())?;

    sqlx::raw_sql(SEED_IMPORT_SQL)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    sqlx::raw_sql(SEED_HISTORICO_SQL)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    let categorias: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM categorias")
        .fetch_one(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    let productos: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM productos")
        .fetch_one(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    let usuarios: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM usuarios")
        .fetch_one(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    let mesas: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM mesas")
        .fetch_one(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    let turnos: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM turnos")
        .fetch_one(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    let ventas: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM ventas")
        .fetch_one(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    Ok(format!(
        "Importado: {} categorías, {} productos, {} usuarios, {} mesas, {} turnos, {} ventas históricas",
        categorias, productos, usuarios, mesas, turnos, ventas
    ))
}

fn extraer_tabla(sql: &str, tabla: &str) -> Option<String> {
    let patron = format!(r"(?s)(INSERT INTO `{tabla}` \([^)]*\) VALUES)\n(.*?);\n");
    let re = Regex::new(&patron).ok()?;

    let mut encabezado: Option<String> = None;
    let mut valores: Vec<String> = Vec::new();

    for caps in re.captures_iter(sql) {
        if encabezado.is_none() {
            encabezado = Some(caps[1].to_string());
        }
        valores.push(caps[2].trim().trim_end_matches(',').to_string());
    }

    let encabezado = encabezado?;
    if valores.is_empty() {
        return None;
    }

    Some(format!("{}\n{};\n", encabezado, valores.join(",\n")))
}

#[tauri::command]
pub async fn importar_desde_archivo(
    pool: State<'_, SqlitePool>,
    path: String,
    actor_id: i64,
) -> Result<String, String> {
    verificar_admin(pool.inner(), actor_id).await?;

    let contenido =
        std::fs::read_to_string(&path).map_err(|e| format!("No se pudo leer el archivo: {e}"))?;
    let contenido = contenido.replace("\r\n", "\n");

    let categorias_sql = extraer_tabla(&contenido, "categorias");
    let productos_sql = extraer_tabla(&contenido, "productos");
    let usuarios_sql = extraer_tabla(&contenido, "usuarios");
    let mesas_sql = extraer_tabla(&contenido, "mesas");
    let conceptos_sql = extraer_tabla(&contenido, "conceptos_operaciones");
    let turnos_sql = extraer_tabla(&contenido, "turnos");
    let ventas_sql = extraer_tabla(&contenido, "ventas");
    let pedidos_sql = extraer_tabla(&contenido, "pedidos");
    let operaciones_sql = extraer_tabla(&contenido, "operaciones").map(|s| {
        let re_tipo = Regex::new(r"(\(\d+, )'Salida'").expect("regex válida");
        re_tipo.replace_all(&s, "$1'Egreso'").to_string()
    });

    if categorias_sql.is_none() || productos_sql.is_none() || usuarios_sql.is_none() || mesas_sql.is_none() {
        return Err(
            "El archivo no tiene el formato esperado: faltan categorías, productos, usuarios o mesas"
                .to_string(),
        );
    }

    sqlx::query("DELETE FROM operaciones").execute(pool.inner()).await.map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM conceptos_operaciones").execute(pool.inner()).await.map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM pedidos").execute(pool.inner()).await.map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM ventas").execute(pool.inner()).await.map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM turnos").execute(pool.inner()).await.map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM productos").execute(pool.inner()).await.map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM categorias").execute(pool.inner()).await.map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM usuarios WHERE perfil != 'Desarrollador'")
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM mesas").execute(pool.inner()).await.map_err(|e| e.to_string())?;

    for sql_opt in [
        &categorias_sql,
        &productos_sql,
        &usuarios_sql,
        &mesas_sql,
        &conceptos_sql,
        &turnos_sql,
        &ventas_sql,
        &pedidos_sql,
        &operaciones_sql,
    ] {
        if let Some(s) = sql_opt {
            sqlx::raw_sql(s).execute(pool.inner()).await.map_err(|e| e.to_string())?;
        }
    }

    let categorias: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM categorias")
        .fetch_one(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    let productos: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM productos")
        .fetch_one(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    let usuarios: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM usuarios")
        .fetch_one(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    let mesas: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM mesas")
        .fetch_one(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    let turnos: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM turnos")
        .fetch_one(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    let ventas: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM ventas")
        .fetch_one(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    Ok(format!(
        "Importado desde {}: {} categorías, {} productos, {} usuarios, {} mesas, {} turnos, {} ventas históricas",
        path, categorias, productos, usuarios, mesas, turnos, ventas
    ))
}

#[tauri::command]
pub async fn resumen_ventas_mes(pool: State<'_, SqlitePool>, anio: i32, mes: i32) -> Result<Vec<VentaDia>, String> {
    let periodo = format!("{:04}-{:02}", anio, mes);

    sqlx::query_as::<_, VentaDia>(
        "SELECT dia AS fecha, SUM(total_venta) AS total FROM (
            SELECT substr(v.fecha, 1, 10) AS dia,
                   COALESCE((SELECT SUM(p.valor) FROM pedidos p WHERE p.venta = v.id_venta), 0) + v.valor_propina
                       AS total_venta
            FROM ventas v
            WHERE v.estado = 'Pagada' AND substr(v.fecha, 1, 7) = ?1
         ) t
         GROUP BY dia
         ORDER BY dia",
    )
    .bind(periodo)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn detalle_dia(pool: State<'_, SqlitePool>, fecha: String) -> Result<DetalleDia, String> {
    let ventas = sqlx::query_as::<_, VentaDetalle>(
        "SELECT v.id_venta, m.numero AS numero_mesa, (u.nombres || ' ' || u.apellidos) AS nombre_mesero,
                v.forma_pago, v.valor_propina,
                COALESCE((SELECT SUM(p.valor) FROM pedidos p WHERE p.venta = v.id_venta), 0) + v.valor_propina
                    AS total,
                v.fecha
         FROM ventas v
         JOIN mesas m ON m.id_mesa = v.mesa
         JOIN usuarios u ON u.id_usuario = v.mesero
         WHERE v.estado = 'Pagada' AND substr(v.fecha, 1, 10) = ?1
         ORDER BY v.fecha",
    )
    .bind(&fecha)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    let desglose = sqlx::query_as::<_, DesglosePago>(
        "SELECT v.forma_pago AS forma_pago, COALESCE(SUM(p.valor), 0) AS total
         FROM ventas v
         JOIN pedidos p ON p.venta = v.id_venta
         WHERE v.estado = 'Pagada' AND substr(v.fecha, 1, 10) = ?1
         GROUP BY v.forma_pago",
    )
    .bind(&fecha)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    let total_propinas: f64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(valor_propina), 0.0) FROM ventas WHERE estado = 'Pagada' AND substr(fecha, 1, 10) = ?1",
    )
    .bind(&fecha)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    let total_ventas: f64 = ventas.iter().map(|v| v.total).sum();

    Ok(DetalleDia {
        fecha,
        total_ventas,
        total_propinas,
        desglose,
        ventas,
    })
}

#[tauri::command]
pub async fn listar_ventas_cerradas_turno(
    pool: State<'_, SqlitePool>,
    id_turno: i64,
) -> Result<Vec<VentaDetalle>, String> {
    sqlx::query_as::<_, VentaDetalle>(
        "SELECT v.id_venta, m.numero AS numero_mesa, (u.nombres || ' ' || u.apellidos) AS nombre_mesero,
                v.forma_pago, v.valor_propina,
                COALESCE((SELECT SUM(p.valor) FROM pedidos p WHERE p.venta = v.id_venta), 0) + v.valor_propina
                    AS total,
                v.fecha
         FROM ventas v
         JOIN mesas m ON m.id_mesa = v.mesa
         JOIN usuarios u ON u.id_usuario = v.mesero
         WHERE v.estado = 'Pagada' AND v.turno = ?1
         ORDER BY v.fecha DESC",
    )
    .bind(id_turno)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())
}
