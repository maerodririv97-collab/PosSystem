use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Categoria {
    pub id_categoria: i64,
    pub nombre: String,
    pub tipo: String,
}

#[derive(Debug, Deserialize)]
pub struct NuevaCategoria {
    pub nombre: String,
    pub tipo: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Producto {
    pub id_producto: i64,
    pub categoria: i64,
    pub codigo_barras: String,
    pub nombre: String,
    pub costo: i64,
    pub valor: i64,
    pub stock: f64,
    pub servicio: bool,
    pub tipo_venta: String,
    pub imagen: String,
    pub estado: String,
}

#[derive(Debug, Deserialize)]
pub struct NuevoProducto {
    pub categoria: i64,
    pub codigo_barras: String,
    pub nombre: String,
    pub costo: i64,
    pub valor: i64,
    pub stock: f64,
    pub servicio: bool,
    pub tipo_venta: String,
    pub imagen: String,
    pub estado: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Usuario {
    pub id_usuario: i64,
    pub nombres: String,
    pub apellidos: String,
    pub pin: i64,
    pub perfil: String,
    pub estado: String,
}

#[derive(Debug, Deserialize)]
pub struct NuevoUsuario {
    pub nombres: String,
    pub apellidos: String,
    pub pin: i64,
    pub perfil: String,
    pub estado: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Mesa {
    pub id_mesa: i64,
    pub numero: String,
    pub tipo: String,
    pub estado: String,
}

#[derive(Debug, Deserialize)]
pub struct NuevaMesa {
    pub numero: String,
    pub tipo: String,
    pub estado: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Venta {
    pub id_venta: i64,
    pub mesa: i64,
    pub mesero: i64,
    pub fecha: String,
    pub forma_pago: String,
    pub valor_propina: f64,
    pub estado: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct VentaAbierta {
    pub id_venta: i64,
    pub mesa: i64,
    pub numero_mesa: String,
    pub mesero: i64,
    pub nombre_mesero: String,
    pub fecha: String,
    pub total: i64,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Pedido {
    pub id_pedido: i64,
    pub producto: i64,
    pub nombre_producto: String,
    pub venta: i64,
    pub valor: i64,
    pub cantidad: i64,
    pub compra: i64,
    pub impreso: bool,
    pub descuento: Option<i64>,
    pub concepto_desc: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CerrarVenta {
    pub id_venta: i64,
    pub forma_pago: String,
    pub valor_propina: f64,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Turno {
    pub id_turno: i64,
    pub apertura: String,
    pub cierre: Option<String>,
    pub valor_inicial: i64,
    pub estado: String,
    pub valor_final: Option<i64>,
    pub diferencia: Option<i64>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct DesglosePago {
    pub forma_pago: String,
    pub total: i64,
}

#[derive(Debug, Serialize)]
pub struct ResumenTurno {
    pub valor_inicial: i64,
    pub total_ventas: i64,
    pub total_propinas: i64,
    pub total_ingresos: i64,
    pub total_egresos: i64,
    pub efectivo_esperado: i64,
    pub desglose: Vec<DesglosePago>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ConceptoOperacion {
    pub id_concepto_operacion: i64,
    pub nombre: String,
    pub descripcion: String,
}

#[derive(Debug, Deserialize)]
pub struct NuevoConceptoOperacion {
    pub nombre: String,
    pub descripcion: String,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Operacion {
    pub id_operacion: i64,
    pub tipo_concepto: i64,
    pub nombre_concepto: String,
    pub turno: i64,
    pub administrador: i64,
    pub tipo: String,
    pub valor: i64,
    pub fecha: String,
    pub concepto: String,
}

#[derive(Debug, Deserialize)]
pub struct NuevaOperacion {
    pub tipo_concepto: i64,
    pub turno: i64,
    pub administrador: i64,
    pub tipo: String,
    pub valor: i64,
    pub concepto: String,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct MovimientoInventario {
    pub id_movimiento: i64,
    pub producto: i64,
    pub nombre_producto: String,
    pub usuario: i64,
    pub nombre_usuario: String,
    pub tipo: String,
    pub stock_anterior: f64,
    pub stock_nuevo: f64,
    pub motivo: String,
    pub fecha: String,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct VentaDia {
    pub fecha: String,
    pub total: f64,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct VentaDetalle {
    pub id_venta: i64,
    pub numero_mesa: String,
    pub nombre_mesero: String,
    pub forma_pago: String,
    pub valor_propina: f64,
    pub total: f64,
    pub fecha: String,
}

#[derive(Debug, Serialize)]
pub struct DetalleDia {
    pub fecha: String,
    pub total_ventas: f64,
    pub total_propinas: f64,
    pub desglose: Vec<DesglosePago>,
    pub ventas: Vec<VentaDetalle>,
}
