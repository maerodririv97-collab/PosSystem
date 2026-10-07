use regex::Regex;
use sqlx::SqlitePool;
use tauri::State;

use crate::models::{
    Categoria, CerrarVenta, ConceptoOperacion, DesglosePago, DetalleDia, Mesa, MovimientoInventario, NuevaCategoria,
    NuevaMesa, NuevaOperacion, NuevoConceptoOperacion, NuevoProducto, NuevoUsuario, Operacion, Pedido, Producto,
    ResumenCajaGeneral, ResumenTurno, RetiroTurno, Turno, AlertaCaja, Usuario, Venta, VentaAbierta, VentaDetalle, VentaDia, VentaProducto,
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

/// Unidades vendidas por producto en los últimos 15 días (solo ventas pagadas),
/// para ordenar el catálogo de la pantalla de venta por popularidad reciente
/// en vez de alfabéticamente.
#[tauri::command]
pub async fn ranking_ventas_productos(pool: State<'_, SqlitePool>) -> Result<Vec<VentaProducto>, String> {
    let desde = (chrono::Local::now() - chrono::Duration::days(15))
        .format("%Y-%m-%d %H:%M:%S")
        .to_string();

    sqlx::query_as::<_, VentaProducto>(
        "SELECT pe.producto AS producto, SUM(pe.cantidad) AS total_vendido
         FROM pedidos pe
         JOIN ventas v ON v.id_venta = pe.venta
         WHERE v.estado = 'Pagada' AND v.fecha >= ?1
         GROUP BY pe.producto",
    )
    .bind(&desde)
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

/// Consulta SQL: ¿el producto lleva inventario? Los de categorías tipo 'Sin Stock'
/// (cafés, bebidas preparadas, brunch...) no: no se valida ni se mueve su stock.
const SQL_CONTROLA_STOCK: &str = "SELECT COALESCE(c.tipo, '') <> 'Sin Stock' FROM productos p
         LEFT JOIN categorias c ON c.id_categoria = p.categoria WHERE p.id_producto = ?1";

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

    let controla_stock: bool = sqlx::query_scalar(SQL_CONTROLA_STOCK)
        .bind(id_producto)
        .fetch_one(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    // Los productos de categorías 'Contable' no se pueden vender sin stock.
    if controla_stock && producto.stock < cantidad as f64 {
        return Err(format!("STOCK_INSUFICIENTE|{}", producto.stock));
    }

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

    if controla_stock {
        sqlx::query("UPDATE productos SET stock = stock - ?1 WHERE id_producto = ?2")
            .bind(cantidad as f64)
            .bind(id_producto)
            .execute(pool.inner())
            .await
            .map_err(|e| e.to_string())?;
    }

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

    let controla_stock: bool = sqlx::query_scalar(SQL_CONTROLA_STOCK)
        .bind(id_producto)
        .fetch_one(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    if controla_stock {
        sqlx::query("UPDATE productos SET stock = stock + ?1 WHERE id_producto = ?2")
            .bind(cantidad as f64)
            .bind(id_producto)
            .execute(pool.inner())
            .await
            .map_err(|e| e.to_string())?;
    }

    sqlx::query("DELETE FROM pedidos WHERE id_pedido = ?1")
        .bind(id_pedido)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// Suma o resta unidades a una línea de pedido (botones +/− del resumen), conservando
/// el precio unitario con el que se registró la línea y ajustando el stock.
/// Al sumar un producto de categoría 'Contable', si el stock no alcanza devuelve
/// `STOCK_INSUFICIENTE|<stock>` y no se agrega. Los de categorías 'Sin Stock' no se validan.
#[tauri::command]
pub async fn cambiar_cantidad_pedido(
    pool: State<'_, SqlitePool>,
    id_pedido: i64,
    delta: i64,
) -> Result<(), String> {
    let mut tx = pool.inner().begin().await.map_err(|e| e.to_string())?;

    let (id_producto, cantidad, valor, compra, estado_venta): (i64, i64, i64, i64, String) = sqlx::query_as(
        "SELECT pe.producto, pe.cantidad, pe.valor, pe.compra, v.estado
         FROM pedidos pe JOIN ventas v ON v.id_venta = pe.venta
         WHERE pe.id_pedido = ?1",
    )
    .bind(id_pedido)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    if estado_venta != "Abierta" {
        return Err("La venta ya fue cobrada; no se puede modificar.".to_string());
    }
    let nueva = cantidad + delta;
    if nueva < 1 {
        return Err("La cantidad mínima es 1; usa Quitar para eliminar el producto.".to_string());
    }

    let controla_stock: bool = sqlx::query_scalar(SQL_CONTROLA_STOCK)
        .bind(id_producto)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    if controla_stock && delta > 0 {
        let stock: f64 = sqlx::query_scalar("SELECT stock FROM productos WHERE id_producto = ?1")
            .bind(id_producto)
            .fetch_one(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
        if stock < delta as f64 {
            return Err(format!("STOCK_INSUFICIENTE|{stock}"));
        }
    }

    let valor_unitario = if cantidad > 0 { valor / cantidad } else { 0 };
    let costo_unitario = if cantidad > 0 { compra / cantidad } else { 0 };
    sqlx::query("UPDATE pedidos SET cantidad = ?1, valor = ?2, compra = ?3 WHERE id_pedido = ?4")
        .bind(nueva)
        .bind(valor_unitario * nueva)
        .bind(costo_unitario * nueva)
        .bind(id_pedido)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    if controla_stock {
        sqlx::query("UPDATE productos SET stock = stock - ?1 WHERE id_producto = ?2")
            .bind(delta as f64)
            .bind(id_producto)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    tx.commit().await.map_err(|e| e.to_string())
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
        "SELECT id_turno, apertura, cierre, valor_inicial, estado, valor_final, diferencia,
                cerrado_por, NULL AS nombre_cerrado_por, valor_retirado, base_esperada, diferencia_apertura,
                abierto_por, NULL AS nombre_abierto_por, motivo_apertura
         FROM turnos WHERE estado = 'Abierto' LIMIT 1",
    )
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| e.to_string())
}

/// Efectivo que dejó en caja el último turno cerrado (contado − retiro): es la
/// base con la que debería abrir el siguiente. `None` si el último turno se
/// cerró sin registrar retiro (turnos anteriores a este cambio) o no hay turnos.
async fn calcular_base_esperada(pool: &SqlitePool) -> Result<Option<i64>, String> {
    let ultimo: Option<(Option<i64>, Option<i64>)> = sqlx::query_as(
        "SELECT valor_final, valor_retirado FROM turnos WHERE estado = 'Cerrado' ORDER BY id_turno DESC LIMIT 1",
    )
    .fetch_optional(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(match ultimo {
        Some((Some(final_), Some(retirado))) => Some(final_ - retirado),
        _ => None,
    })
}

#[tauri::command]
pub async fn base_esperada_turno(pool: State<'_, SqlitePool>) -> Result<Option<i64>, String> {
    calcular_base_esperada(pool.inner()).await
}

#[tauri::command]
pub async fn abrir_turno(
    pool: State<'_, SqlitePool>,
    valor_inicial: i64,
    actor_id: i64,
    motivo: Option<String>,
) -> Result<Turno, String> {
    let existente = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM turnos WHERE estado = 'Abierto'")
        .fetch_one(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    if existente > 0 {
        return Err("Ya hay un turno abierto".to_string());
    }

    let apertura = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let base_esperada = calcular_base_esperada(pool.inner()).await?;
    let diferencia_apertura = base_esperada.map(|b| valor_inicial - b);
    let motivo = motivo.unwrap_or_default().trim().to_string();
    if diferencia_apertura.unwrap_or(0) != 0 && motivo.is_empty() {
        return Err("Indica el motivo por el que la caja no tiene lo que dejó el turno anterior.".to_string());
    }

    sqlx::query_as::<_, Turno>(
        "INSERT INTO turnos (apertura, cierre, valor_inicial, estado, base_esperada, diferencia_apertura,
                             abierto_por, motivo_apertura)
         VALUES (?1, NULL, ?2, 'Abierto', ?3, ?4, ?5, ?6)
         RETURNING id_turno, apertura, cierre, valor_inicial, estado, valor_final, diferencia,
                   cerrado_por, NULL AS nombre_cerrado_por, valor_retirado, base_esperada, diferencia_apertura,
                abierto_por, NULL AS nombre_abierto_por, motivo_apertura",
    )
    .bind(&apertura)
    .bind(valor_inicial)
    .bind(base_esperada)
    .bind(diferencia_apertura)
    .bind(actor_id)
    .bind(&motivo)
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

    let desglose_propinas_raw: Vec<(String, f64)> = sqlx::query_as(
        "SELECT forma_pago, COALESCE(SUM(valor_propina), 0.0) AS total
         FROM ventas WHERE turno = ?1 AND estado = 'Pagada'
         GROUP BY forma_pago",
    )
    .bind(id_turno)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;
    let desglose_propinas: Vec<DesglosePago> = desglose_propinas_raw
        .into_iter()
        .map(|(forma_pago, total)| DesglosePago { forma_pago, total: total.round() as i64 })
        .collect();

    let total_efectivo_ventas = desglose
        .iter()
        .find(|d| d.forma_pago == "Efectivo")
        .map(|d| d.total)
        .unwrap_or(0);

    let total_ingresos: i64 =
        sqlx::query_scalar("SELECT COALESCE(SUM(valor), 0) FROM operaciones WHERE turno = ?1 AND caja = 'Turno' AND tipo = 'Ingreso'")
            .bind(id_turno)
            .fetch_one(pool)
            .await
            .map_err(|e| e.to_string())?;

    let total_egresos: i64 =
        sqlx::query_scalar("SELECT COALESCE(SUM(valor), 0) FROM operaciones WHERE turno = ?1 AND caja = 'Turno' AND tipo = 'Egreso'")
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
        desglose_propinas,
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
                o.tipo, o.valor, o.fecha, o.concepto, o.caja, o.forma_pago
         FROM operaciones o
         JOIN conceptos_operaciones c ON c.id_concepto_operacion = o.tipo_concepto
         WHERE o.turno = ?1 AND o.caja = 'Turno'
         ORDER BY o.id_operacion DESC",
    )
    .bind(id_turno)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn crear_operacion(pool: State<'_, SqlitePool>, operacion: NuevaOperacion) -> Result<Operacion, String> {
    match operacion.caja.as_str() {
        "Turno" => {}
        // La caja general es solo del administrador y solo registra gastos.
        "General" => {
            verificar_admin(pool.inner(), operacion.administrador).await?;
            if operacion.tipo != "Egreso" {
                return Err("En la caja general solo se registran egresos.".to_string());
            }
        }
        otra => return Err(format!("Caja inválida: {otra}")),
    }
    if operacion.forma_pago != "Efectivo" && operacion.forma_pago != "Transferencia" {
        return Err(format!("Forma de pago inválida: {}", operacion.forma_pago));
    }
    // La caja del turno solo maneja efectivo.
    if operacion.caja == "Turno" && operacion.forma_pago != "Efectivo" {
        return Err("Las operaciones de la caja de turno son siempre en efectivo.".to_string());
    }

    let fecha = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    let id_operacion: i64 = sqlx::query_scalar(
        "INSERT INTO operaciones (tipo_concepto, turno, administrador, tipo, valor, fecha, concepto, caja, forma_pago)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
         RETURNING id_operacion",
    )
    .bind(operacion.tipo_concepto)
    .bind(operacion.turno)
    .bind(operacion.administrador)
    .bind(&operacion.tipo)
    .bind(operacion.valor)
    .bind(&fecha)
    .bind(&operacion.concepto)
    .bind(&operacion.caja)
    .bind(&operacion.forma_pago)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query_as::<_, Operacion>(
        "SELECT o.id_operacion, o.tipo_concepto, c.nombre AS nombre_concepto, o.turno, o.administrador,
                o.tipo, o.valor, o.fecha, o.concepto, o.caja, o.forma_pago
         FROM operaciones o
         JOIN conceptos_operaciones c ON c.id_concepto_operacion = o.tipo_concepto
         WHERE o.id_operacion = ?1",
    )
    .bind(id_operacion)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| e.to_string())
}

/// Gastos de la caja general en el rango [desde, hasta] (AAAA-MM-DD, inclusive).
#[tauri::command]
pub async fn listar_operaciones_caja_general(
    pool: State<'_, SqlitePool>,
    actor_id: i64,
    desde: String,
    hasta: String,
) -> Result<Vec<Operacion>, String> {
    verificar_admin(pool.inner(), actor_id).await?;
    sqlx::query_as::<_, Operacion>(
        "SELECT o.id_operacion, o.tipo_concepto, COALESCE(c.nombre, 'Sin concepto') AS nombre_concepto, o.turno,
                o.administrador, o.tipo, o.valor, o.fecha, o.concepto, o.caja, o.forma_pago
         FROM operaciones o
         LEFT JOIN conceptos_operaciones c ON c.id_concepto_operacion = o.tipo_concepto
         WHERE o.caja = 'General' AND substr(o.fecha, 1, 10) BETWEEN ?1 AND ?2
         ORDER BY o.fecha DESC",
    )
    .bind(&desde)
    .bind(&hasta)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())
}

/// Ventas pagadas (sin propinas) contra gastos de la caja general en el rango
/// [desde, hasta]. Ganancia = ventas − gastos.
#[tauri::command]
pub async fn resumen_caja_general(
    pool: State<'_, SqlitePool>,
    actor_id: i64,
    desde: String,
    hasta: String,
) -> Result<ResumenCajaGeneral, String> {
    let pool = pool.inner();
    verificar_admin(pool, actor_id).await?;

    // Ventas sin propinas por forma de pago.
    let ventas: Vec<(String, i64)> = sqlx::query_as(
        "SELECT v.forma_pago, CAST(COALESCE(SUM(p.valor), 0) AS INTEGER)
         FROM pedidos p JOIN ventas v ON v.id_venta = p.venta
         WHERE v.estado = 'Pagada' AND substr(v.fecha, 1, 10) BETWEEN ?1 AND ?2
         GROUP BY v.forma_pago",
    )
    .bind(&desde)
    .bind(&hasta)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let total_propinas: i64 = sqlx::query_scalar(
        "SELECT CAST(ROUND(COALESCE(SUM(valor_propina), 0)) AS INTEGER)
         FROM ventas WHERE estado = 'Pagada' AND substr(fecha, 1, 10) BETWEEN ?1 AND ?2",
    )
    .bind(&desde)
    .bind(&hasta)
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    let egresos: Vec<(String, i64)> = sqlx::query_as(
        "SELECT forma_pago, COALESCE(SUM(valor), 0) FROM operaciones
         WHERE caja = 'General' AND tipo = 'Egreso' AND substr(fecha, 1, 10) BETWEEN ?1 AND ?2
         GROUP BY forma_pago",
    )
    .bind(&desde)
    .bind(&hasta)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let total_retiros: i64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(valor_retirado), 0) FROM turnos
         WHERE estado = 'Cerrado' AND substr(cierre, 1, 10) BETWEEN ?1 AND ?2",
    )
    .bind(&desde)
    .bind(&hasta)
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    let por_forma = |lista: &[(String, i64)], forma: &str| -> i64 {
        lista.iter().filter(|(f, _)| f == forma).map(|(_, v)| v).sum()
    };
    let total_ventas: i64 = ventas.iter().map(|(_, v)| v).sum();
    let total_egresos: i64 = egresos.iter().map(|(_, v)| v).sum();

    Ok(ResumenCajaGeneral {
        total_ventas,
        ventas_efectivo: por_forma(&ventas, "Efectivo"),
        ventas_transferencia: por_forma(&ventas, "Transferencia"),
        total_propinas,
        total_egresos,
        egresos_efectivo: por_forma(&egresos, "Efectivo"),
        egresos_transferencia: por_forma(&egresos, "Transferencia"),
        total_retiros,
        ganancia: total_ventas - total_egresos,
    })
}

/// Retiros de efectivo hechos al cerrar turno en el rango [desde, hasta].
#[tauri::command]
pub async fn listar_retiros_caja_general(
    pool: State<'_, SqlitePool>,
    actor_id: i64,
    desde: String,
    hasta: String,
) -> Result<Vec<RetiroTurno>, String> {
    verificar_admin(pool.inner(), actor_id).await?;
    sqlx::query_as::<_, RetiroTurno>(
        "SELECT t.id_turno, t.cierre, (u.nombres || ' ' || u.apellidos) AS nombre_cerrado_por, t.valor_retirado
         FROM turnos t
         LEFT JOIN usuarios u ON u.id_usuario = t.cerrado_por
         WHERE t.estado = 'Cerrado' AND t.valor_retirado > 0 AND substr(t.cierre, 1, 10) BETWEEN ?1 AND ?2
         ORDER BY t.cierre DESC",
    )
    .bind(&desde)
    .bind(&hasta)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())
}

/// Turnos del rango [desde, hasta] (por fecha de apertura) que abrieron o
/// cerraron con diferencia de caja.
#[tauri::command]
pub async fn listar_alertas_caja(
    pool: State<'_, SqlitePool>,
    actor_id: i64,
    desde: String,
    hasta: String,
) -> Result<Vec<AlertaCaja>, String> {
    verificar_admin(pool.inner(), actor_id).await?;
    sqlx::query_as::<_, AlertaCaja>(
        "SELECT t.id_turno, t.apertura, t.cierre,
                (ua.nombres || ' ' || ua.apellidos) AS nombre_abierto_por,
                (uc.nombres || ' ' || uc.apellidos) AS nombre_cerrado_por,
                t.base_esperada, t.valor_inicial, t.diferencia_apertura, t.motivo_apertura, t.diferencia
         FROM turnos t
         LEFT JOIN usuarios ua ON ua.id_usuario = t.abierto_por
         LEFT JOIN usuarios uc ON uc.id_usuario = t.cerrado_por
         WHERE (COALESCE(t.diferencia_apertura, 0) <> 0 OR COALESCE(t.diferencia, 0) <> 0)
           AND substr(t.apertura, 1, 10) BETWEEN ?1 AND ?2
         ORDER BY t.apertura DESC",
    )
    .bind(&desde)
    .bind(&hasta)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn resumen_turno(pool: State<'_, SqlitePool>, id_turno: i64) -> Result<ResumenTurno, String> {
    calcular_resumen_turno(pool.inner(), id_turno).await
}

/// Turnos cerrados en una fecha dada (para poder reimprimir su reporte de cierre
/// desde el calendario de reportes).
#[tauri::command]
pub async fn listar_turnos_dia(pool: State<'_, SqlitePool>, fecha: String) -> Result<Vec<Turno>, String> {
    sqlx::query_as::<_, Turno>(
        "SELECT t.id_turno, t.apertura, t.cierre, t.valor_inicial, t.estado, t.valor_final, t.diferencia,
                t.cerrado_por, (u.nombres || ' ' || u.apellidos) AS nombre_cerrado_por,
                t.valor_retirado, t.base_esperada, t.diferencia_apertura,
                t.abierto_por, (ua.nombres || ' ' || ua.apellidos) AS nombre_abierto_por, t.motivo_apertura
         FROM turnos t
         LEFT JOIN usuarios u ON u.id_usuario = t.cerrado_por
         LEFT JOIN usuarios ua ON ua.id_usuario = t.abierto_por
         WHERE t.estado = 'Cerrado' AND substr(t.cierre, 1, 10) = ?1
         ORDER BY t.cierre",
    )
    .bind(&fecha)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cerrar_turno(
    pool: State<'_, SqlitePool>,
    id_turno: i64,
    valor_final: i64,
    valor_retirado: i64,
    actor_id: i64,
) -> Result<(), String> {
    if valor_retirado < 0 || valor_retirado > valor_final {
        return Err("El retiro no puede ser mayor que el efectivo contado en caja.".to_string());
    }

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
        "UPDATE turnos SET cierre = ?1, estado = 'Cerrado', valor_final = ?2, diferencia = ?3, cerrado_por = ?4,
                           valor_retirado = ?6
         WHERE id_turno = ?5",
    )
    .bind(&cierre)
    .bind(valor_final)
    .bind(diferencia)
    .bind(actor_id)
    .bind(id_turno)
    .bind(valor_retirado)
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

/// Convierte el logo embebido a comandos ESC/POS de imagen rasterizada (GS v 0).
///
/// El logo real es un emblema circular con el disco de fondo oscuro y el texto/
/// borde en dorado. Imprimir eso tal cual (oscuro = tinta) sale como una mancha
/// negra sólida y gasta mucho térmico. En vez de eso invertimos la selección:
/// se imprime como tinta negra el texto/borde dorado (que es lo que se necesita
/// leer), y se deja en blanco tanto el disco de fondo oscuro como todo lo que
/// esté fuera del círculo (transparente en el PNG) — el resultado es el emblema
/// dibujado en línea fina sobre el papel, no un cuadro/disco relleno.
/// Se aplica difuminado Floyd-Steinberg para conservar los bordes suaves del
/// texto en vez de un simple umbral. Se usa la versión de 220x220 (no la
/// miniatura de 60x60) para evitar el desenfoque de estirar una imagen muy
/// pequeña. 220 puntos de ancho es conservador: cabe tanto en impresoras de
/// 58mm (384 puntos) como de 80mm (576 puntos) a 203dpi. Incluye los comandos
/// para centrarlo en el papel.
#[cfg(windows)]
fn logo_raster_escpos() -> Vec<u8> {
    use image::imageops::colorops::{dither, BiLevel};
    use image::{GenericImageView, Luma};

    const LOGO_PNG: &[u8] = include_bytes!("../assets/logo_termico.png");
    const ANCHO_DESTINO: u32 = 220;

    let Ok(img) = image::load_from_memory(LOGO_PNG) else {
        return Vec::new();
    };
    let alto_destino = ((img.height() as u64 * ANCHO_DESTINO as u64) / img.width() as u64).max(1) as u32;
    let redimensionada = img.resize_exact(ANCHO_DESTINO, alto_destino, image::imageops::FilterType::Lanczos3);

    let mut gris = image::ImageBuffer::<Luma<u8>, Vec<u8>>::new(ANCHO_DESTINO, alto_destino);
    for (x, y, px) in redimensionada.pixels() {
        let [r, g, b, a] = px.0;
        let alpha = a as f32 / 255.0;
        if alpha < 0.5 {
            // Fuera del círculo (transparente): nunca imprimir.
            gris.put_pixel(x, y, Luma([255]));
            continue;
        }
        let luminancia = 0.299 * r as f32 + 0.587 * g as f32 + 0.114 * b as f32;
        // Invertido: lo claro (dorado) queda con valor bajo -> el dither lo marca
        // como tinta; lo oscuro (disco de fondo) queda alto -> se deja en blanco.
        let invertido = (255.0 - luminancia).clamp(0.0, 255.0);
        gris.put_pixel(x, y, Luma([invertido.round() as u8]));
    }
    dither(&mut gris, &BiLevel);

    let ancho_bytes = (ANCHO_DESTINO as usize).div_ceil(8);
    let mut bitmap = vec![0u8; ancho_bytes * alto_destino as usize];

    for y in 0..alto_destino {
        for x in 0..ANCHO_DESTINO {
            // Tras el dither, cada pixel queda en 0 (negro) o 255 (blanco).
            if gris.get_pixel(x, y).0[0] == 0 {
                let indice = y as usize * ancho_bytes + (x as usize / 8);
                let bit = 7 - (x % 8);
                bitmap[indice] |= 1 << bit;
            }
        }
    }

    let xl = (ancho_bytes & 0xFF) as u8;
    let xh = ((ancho_bytes >> 8) & 0xFF) as u8;
    let yl = (alto_destino as usize & 0xFF) as u8;
    let yh = ((alto_destino as usize >> 8) & 0xFF) as u8;

    let mut comando = vec![0x1B, 0x61, 0x01]; // ESC a 1 : centrar
    comando.extend_from_slice(&[0x1D, 0x76, 0x30, 0x00, xl, xh, yl, yh]);
    comando.extend_from_slice(&bitmap);
    comando.extend_from_slice(&[0x1B, 0x61, 0x00]); // ESC a 0 : volver a alinear a la izquierda
    comando
}

/// Envía bytes directamente a la impresora predeterminada de Windows usando la API
/// RAW del spooler (WinSpool), sin abrir ningún diálogo. Es la técnica estándar
/// para imprimir recibos en impresoras térmicas de punto de venta.
#[cfg(windows)]
fn enviar_bytes_a_impresora_predeterminada(datos: &[u8]) -> Result<(), String> {
    use windows::core::PCWSTR;
    use windows::Win32::Graphics::Printing::{
        ClosePrinter, EndDocPrinter, EndPagePrinter, GetDefaultPrinterW, OpenPrinterW,
        StartDocPrinterW, StartPagePrinter, WritePrinter, DOC_INFO_1W,
    };

    unsafe {
        let mut len: u32 = 0;
        let _ = GetDefaultPrinterW(None, &mut len);
        if len == 0 {
            return Err("No hay una impresora predeterminada configurada en Windows.".to_string());
        }

        let mut nombre_buf: Vec<u16> = vec![0; len as usize];
        if !GetDefaultPrinterW(Some(windows::core::PWSTR(nombre_buf.as_mut_ptr())), &mut len).as_bool() {
            return Err("No se pudo leer la impresora predeterminada de Windows.".to_string());
        }
        // GetDefaultPrinterW incluye el terminador nulo; lo quitamos para reutilizar el buffer.
        if let Some(fin) = nombre_buf.iter().position(|&c| c == 0) {
            nombre_buf.truncate(fin);
        }
        nombre_buf.push(0);

        let mut handle = Default::default();
        OpenPrinterW(PCWSTR(nombre_buf.as_ptr()), &mut handle, None).map_err(|e| e.to_string())?;

        let mut doc_name: Vec<u16> = "Recibo Maison du Café".encode_utf16().chain(std::iter::once(0)).collect();
        let mut datatype: Vec<u16> = "RAW".encode_utf16().chain(std::iter::once(0)).collect();
        let doc_info = DOC_INFO_1W {
            pDocName: windows::core::PWSTR(doc_name.as_mut_ptr()),
            pOutputFile: windows::core::PWSTR::null(),
            pDatatype: windows::core::PWSTR(datatype.as_mut_ptr()),
        };

        let job_id = StartDocPrinterW(handle, 1, &doc_info);
        if job_id == 0 {
            let _ = ClosePrinter(handle);
            return Err("No se pudo iniciar el trabajo de impresión.".to_string());
        }

        if !StartPagePrinter(handle).as_bool() {
            let _ = EndDocPrinter(handle);
            let _ = ClosePrinter(handle);
            return Err("No se pudo iniciar la página de impresión.".to_string());
        }

        let mut escritos: u32 = 0;
        let escribio_bien =
            WritePrinter(handle, datos.as_ptr() as *const _, datos.len() as u32, &mut escritos).as_bool();

        let _ = EndPagePrinter(handle);
        let _ = EndDocPrinter(handle);
        let _ = ClosePrinter(handle);

        if !escribio_bien {
            return Err("Falló el envío del recibo a la impresora.".to_string());
        }
    }

    Ok(())
}

/// Imprime el recibo directamente en la impresora térmica predeterminada, sin
/// mostrar ningún diálogo de impresión al cajero. Arma el trabajo con comandos
/// ESC/POS: inicialización, logo (opcional), el texto y el corte de papel al final,
/// ya que al enviar datos RAW se salta el driver de Windows (y con él, el logo y el
/// corte automático que el driver aplicaba antes).
#[tauri::command]
pub async fn imprimir_recibo_termico(texto: String, con_logo: bool) -> Result<(), String> {
    #[cfg(windows)]
    {
        tauri::async_runtime::spawn_blocking(move || {
            let mut datos: Vec<u8> = Vec::new();
            datos.extend_from_slice(&[0x1B, 0x40]); // ESC @ : inicializar impresora
            if con_logo {
                datos.extend_from_slice(&logo_raster_escpos());
                datos.push(b'\n');
            }
            datos.extend_from_slice(texto.as_bytes());
            datos.extend_from_slice(&[0x1B, 0x64, 0x04]); // ESC d 4 : alimentar 4 líneas
            datos.extend_from_slice(&[0x1D, 0x56, 0x01]); // GS V 1 : corte parcial de papel

            enviar_bytes_a_impresora_predeterminada(&datos)
        })
        .await
        .map_err(|e| e.to_string())?
    }
    #[cfg(not(windows))]
    {
        let _ = (texto, con_logo);
        Err("La impresión directa solo está disponible en Windows.".to_string())
    }
}
