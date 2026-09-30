//! Reportes en PDF (general / detallado) por rango de fechas: datos agregados,
//! archivo del PDF generado en el frontend y envío por correo vía SMTP.

use lettre::message::header::ContentType;
use lettre::message::{Attachment, Mailbox, MultiPart, SinglePart};
use lettre::transport::smtp::authentication::Credentials;
use lettre::{AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, State};

// ---------------------------------------------------------------------------
// Datos del reporte
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct DiaReporte {
    pub fecha: String,
    pub n_ventas: i64,
    pub n_turnos: i64,
    pub total: f64,
    pub propinas: f64,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct FormaPagoReporte {
    pub forma_pago: String,
    pub n_ventas: i64,
    pub total: f64,
    pub propinas: f64,
}

/// Ventas de un producto dentro de una quincena. `periodo` = 'AAAA-MM-1' (días
/// 1-15) o 'AAAA-MM-2' (día 16 a fin de mes).
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct ProductoPeriodo {
    pub periodo: String,
    pub producto: String,
    pub categoria: String,
    pub unidades: f64,
    pub ingreso: f64,
}

/// Venta acumulada por día de la semana (0 = domingo … 6 = sábado) y hora.
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct VentaHora {
    pub dia_semana: i64,
    pub hora: i64,
    pub n_ventas: i64,
    pub total: f64,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct OperacionReporte {
    pub fecha: String,
    pub tipo: String,
    pub concepto: String,
    pub observacion: String,
    pub valor: f64,
    pub administrador: String,
    pub turno: i64,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct TurnoReporte {
    pub id_turno: i64,
    pub apertura: String,
    pub cierre: Option<String>,
    pub estado: String,
    pub valor_inicial: f64,
    pub valor_final: Option<f64>,
    pub diferencia: Option<f64>,
    pub cerrado_por: Option<String>,
    pub n_ventas: i64,
    pub total: f64,
    pub propinas: f64,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct MeseroReporte {
    pub mesero: String,
    pub n_ventas: i64,
    pub total: f64,
    pub propinas: f64,
}

#[derive(Debug, Serialize)]
pub struct DatosReporte {
    pub desde: String,
    pub hasta: String,
    pub generado: String,
    pub dias: Vec<DiaReporte>,
    pub formas_pago: Vec<FormaPagoReporte>,
    pub productos: Vec<ProductoPeriodo>,
    pub horas: Vec<VentaHora>,
    pub operaciones: Vec<OperacionReporte>,
    pub turnos: Vec<TurnoReporte>,
    pub meseros: Vec<MeseroReporte>,
}

/// Total de cada venta (suma de sus pedidos, sin propina). Se une a `ventas`.
const TOTALES_VENTA: &str = "LEFT JOIN (SELECT venta, SUM(valor) AS total FROM pedidos GROUP BY venta) tv
                               ON tv.venta = v.id_venta";

fn validar_fecha(f: &str) -> Result<(), String> {
    chrono::NaiveDate::parse_from_str(f, "%Y-%m-%d")
        .map(|_| ())
        .map_err(|_| format!("Fecha inválida: {f} (se espera AAAA-MM-DD)"))
}

/// Todos los datos que necesitan los reportes general y detallado para el rango
/// [desde, hasta] (ambos inclusive, formato AAAA-MM-DD). Solo ventas 'Pagada'.
/// El frontend agrupa por mes / quincena / día de la semana a partir de esto.
#[tauri::command]
pub async fn datos_reporte(pool: State<'_, SqlitePool>, desde: String, hasta: String) -> Result<DatosReporte, String> {
    validar_fecha(&desde)?;
    validar_fecha(&hasta)?;
    if desde > hasta {
        return Err("La fecha de inicio no puede ser posterior a la fecha fin.".to_string());
    }
    let pool = pool.inner();
    let filtro_ventas = "v.estado = 'Pagada' AND substr(v.fecha, 1, 10) BETWEEN ?1 AND ?2";

    let dias = sqlx::query_as::<_, DiaReporte>(&format!(
        "SELECT substr(v.fecha, 1, 10) AS fecha,
                COUNT(*) AS n_ventas,
                COUNT(DISTINCT v.turno) AS n_turnos,
                CAST(COALESCE(SUM(tv.total), 0) AS REAL) AS total,
                CAST(COALESCE(SUM(v.valor_propina), 0) AS REAL) AS propinas
         FROM ventas v {TOTALES_VENTA}
         WHERE {filtro_ventas}
         GROUP BY 1 ORDER BY 1"
    ))
    .bind(&desde)
    .bind(&hasta)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let formas_pago = sqlx::query_as::<_, FormaPagoReporte>(&format!(
        "SELECT v.forma_pago AS forma_pago,
                COUNT(*) AS n_ventas,
                CAST(COALESCE(SUM(tv.total), 0) AS REAL) AS total,
                CAST(COALESCE(SUM(v.valor_propina), 0) AS REAL) AS propinas
         FROM ventas v {TOTALES_VENTA}
         WHERE {filtro_ventas}
         GROUP BY v.forma_pago ORDER BY total DESC"
    ))
    .bind(&desde)
    .bind(&hasta)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let productos = sqlx::query_as::<_, ProductoPeriodo>(&format!(
        "SELECT substr(v.fecha, 1, 7) ||
                    CASE WHEN CAST(substr(v.fecha, 9, 2) AS INTEGER) <= 15 THEN '-1' ELSE '-2' END AS periodo,
                pr.nombre AS producto,
                COALESCE(c.nombre, '') AS categoria,
                CAST(SUM(p.cantidad) AS REAL) AS unidades,
                CAST(SUM(p.valor) AS REAL) AS ingreso
         FROM pedidos p
         JOIN ventas v ON v.id_venta = p.venta
         JOIN productos pr ON pr.id_producto = p.producto
         LEFT JOIN categorias c ON c.id_categoria = pr.categoria
         WHERE {filtro_ventas}
         GROUP BY periodo, p.producto
         ORDER BY periodo, unidades DESC"
    ))
    .bind(&desde)
    .bind(&hasta)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let horas = sqlx::query_as::<_, VentaHora>(&format!(
        "SELECT CAST(strftime('%w', v.fecha) AS INTEGER) AS dia_semana,
                CAST(substr(v.fecha, 12, 2) AS INTEGER) AS hora,
                COUNT(*) AS n_ventas,
                CAST(COALESCE(SUM(tv.total), 0) AS REAL) AS total
         FROM ventas v {TOTALES_VENTA}
         WHERE {filtro_ventas}
         GROUP BY 1, 2 ORDER BY 1, 2"
    ))
    .bind(&desde)
    .bind(&hasta)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let operaciones = sqlx::query_as::<_, OperacionReporte>(
        "SELECT o.fecha, o.tipo,
                COALESCE(c.nombre, 'Sin concepto') AS concepto,
                o.concepto AS observacion,
                CAST(o.valor AS REAL) AS valor,
                COALESCE(u.nombres || ' ' || u.apellidos, '') AS administrador,
                o.turno
         FROM operaciones o
         LEFT JOIN conceptos_operaciones c ON c.id_concepto_operacion = o.tipo_concepto
         LEFT JOIN usuarios u ON u.id_usuario = o.administrador
         WHERE substr(o.fecha, 1, 10) BETWEEN ?1 AND ?2
         ORDER BY o.fecha",
    )
    .bind(&desde)
    .bind(&hasta)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let turnos = sqlx::query_as::<_, TurnoReporte>(
        "SELECT t.id_turno, t.apertura, t.cierre, t.estado,
                CAST(t.valor_inicial AS REAL) AS valor_inicial,
                CAST(t.valor_final AS REAL) AS valor_final,
                CAST(t.diferencia AS REAL) AS diferencia,
                u.nombres || ' ' || u.apellidos AS cerrado_por,
                (SELECT COUNT(*) FROM ventas v WHERE v.turno = t.id_turno AND v.estado = 'Pagada') AS n_ventas,
                CAST(COALESCE((SELECT SUM(p.valor) FROM pedidos p JOIN ventas v ON v.id_venta = p.venta
                               WHERE v.turno = t.id_turno AND v.estado = 'Pagada'), 0) AS REAL) AS total,
                CAST(COALESCE((SELECT SUM(v.valor_propina) FROM ventas v
                               WHERE v.turno = t.id_turno AND v.estado = 'Pagada'), 0) AS REAL) AS propinas
         FROM turnos t
         LEFT JOIN usuarios u ON u.id_usuario = t.cerrado_por
         WHERE substr(t.apertura, 1, 10) BETWEEN ?1 AND ?2
         ORDER BY t.apertura",
    )
    .bind(&desde)
    .bind(&hasta)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let meseros = sqlx::query_as::<_, MeseroReporte>(&format!(
        "SELECT COALESCE(u.nombres || ' ' || u.apellidos, 'Sin asignar') AS mesero,
                COUNT(*) AS n_ventas,
                CAST(COALESCE(SUM(tv.total), 0) AS REAL) AS total,
                CAST(COALESCE(SUM(v.valor_propina), 0) AS REAL) AS propinas
         FROM ventas v {TOTALES_VENTA}
         LEFT JOIN usuarios u ON u.id_usuario = v.mesero
         WHERE {filtro_ventas}
         GROUP BY v.mesero ORDER BY total DESC"
    ))
    .bind(&desde)
    .bind(&hasta)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(DatosReporte {
        desde,
        hasta,
        generado: chrono::Local::now().format("%Y-%m-%d %H:%M").to_string(),
        dias,
        formas_pago,
        productos,
        horas,
        operaciones,
        turnos,
        meseros,
    })
}

// ---------------------------------------------------------------------------
// Archivo PDF
// ---------------------------------------------------------------------------

/// Carpeta donde queda una copia de cada reporte generado (%APPDATA%\...\reportes).
fn carpeta_reportes(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?.join("reportes");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

/// Solo nombres simples (sin rutas) para no escribir/leer fuera de la carpeta de reportes.
fn ruta_reporte(app: &AppHandle, nombre_archivo: &str) -> Result<PathBuf, String> {
    let valido = nombre_archivo.ends_with(".pdf")
        && nombre_archivo
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '_' | '-' | '.'))
        && !nombre_archivo.contains("..");
    if !valido {
        return Err(format!("Nombre de archivo inválido: {nombre_archivo}"));
    }
    Ok(carpeta_reportes(app)?.join(nombre_archivo))
}

/// Recibe los bytes del PDF como cuerpo binario (header `nombre-archivo`) y lo
/// guarda en la carpeta de reportes de la app. Devuelve la ruta completa.
#[tauri::command]
pub async fn guardar_reporte_pdf(app: AppHandle, request: tauri::ipc::Request<'_>) -> Result<String, String> {
    let tauri::ipc::InvokeBody::Raw(bytes) = request.body() else {
        return Err("Se esperaba el PDF como datos binarios.".to_string());
    };
    let nombre = request
        .headers()
        .get("nombre-archivo")
        .and_then(|v| v.to_str().ok())
        .ok_or("Falta el nombre del archivo.")?;
    let ruta = ruta_reporte(&app, nombre)?;
    std::fs::write(&ruta, bytes).map_err(|e| e.to_string())?;
    Ok(ruta.display().to_string())
}

/// Copia un reporte ya generado a la ruta que eligió el usuario en el diálogo "Guardar".
#[tauri::command]
pub async fn exportar_reporte_pdf(app: AppHandle, nombre_archivo: String, destino: String) -> Result<(), String> {
    let origen = ruta_reporte(&app, &nombre_archivo)?;
    std::fs::copy(&origen, &destino).map_err(|e| format!("No se pudo guardar el archivo: {e}"))?;
    Ok(())
}

// ---------------------------------------------------------------------------
// Correo (SMTP)
// ---------------------------------------------------------------------------

/// Configuración SMTP tal como se muestra en pantalla: la clave nunca sale del backend.
#[derive(Debug, Serialize)]
pub struct ConfigCorreo {
    pub servidor: String,
    pub puerto: i64,
    pub usuario: String,
    pub tiene_clave: bool,
    pub nombre_remitente: String,
    pub destinatarios: String,
}

#[derive(Debug, Deserialize)]
pub struct GuardarConfigCorreo {
    pub servidor: String,
    pub puerto: i64,
    pub usuario: String,
    /// Vacío o ausente = conservar la clave guardada.
    pub clave: Option<String>,
    pub nombre_remitente: String,
    pub destinatarios: String,
}

async fn leer_config(pool: &SqlitePool, clave: &str) -> Result<String, String> {
    let valor: Option<String> = sqlx::query_scalar("SELECT valor FROM configuracion WHERE clave = ?1")
        .bind(clave)
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(valor.unwrap_or_default())
}

async fn escribir_config(pool: &SqlitePool, clave: &str, valor: &str) -> Result<(), String> {
    sqlx::query(
        "INSERT INTO configuracion (clave, valor) VALUES (?1, ?2)
         ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor",
    )
    .bind(clave)
    .bind(valor)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn obtener_config_correo(pool: State<'_, SqlitePool>) -> Result<ConfigCorreo, String> {
    let pool = pool.inner();
    Ok(ConfigCorreo {
        servidor: leer_config(pool, "smtp_servidor").await?,
        puerto: leer_config(pool, "smtp_puerto").await?.parse().unwrap_or(587),
        usuario: leer_config(pool, "smtp_usuario").await?,
        tiene_clave: !leer_config(pool, "smtp_clave").await?.is_empty(),
        nombre_remitente: leer_config(pool, "smtp_nombre_remitente").await?,
        destinatarios: leer_config(pool, "correo_destinatarios").await?,
    })
}

#[tauri::command]
pub async fn guardar_config_correo(pool: State<'_, SqlitePool>, config: GuardarConfigCorreo) -> Result<(), String> {
    let pool = pool.inner();
    escribir_config(pool, "smtp_servidor", config.servidor.trim()).await?;
    escribir_config(pool, "smtp_puerto", &config.puerto.to_string()).await?;
    escribir_config(pool, "smtp_usuario", config.usuario.trim()).await?;
    escribir_config(pool, "smtp_nombre_remitente", config.nombre_remitente.trim()).await?;
    escribir_config(pool, "correo_destinatarios", config.destinatarios.trim()).await?;
    if let Some(clave) = config.clave.filter(|c| !c.is_empty()) {
        // Las contraseñas de aplicación de Gmail se muestran con espacios; no forman parte de la clave.
        let clave = if config.servidor.contains("gmail") { clave.replace(' ', "") } else { clave };
        escribir_config(pool, "smtp_clave", &clave).await?;
    }
    Ok(())
}

async fn transporte_smtp(pool: &SqlitePool) -> Result<(AsyncSmtpTransport<Tokio1Executor>, Mailbox), String> {
    let servidor = leer_config(pool, "smtp_servidor").await?;
    let usuario = leer_config(pool, "smtp_usuario").await?;
    let clave = leer_config(pool, "smtp_clave").await?;
    let puerto: u16 = leer_config(pool, "smtp_puerto").await?.parse().unwrap_or(587);
    let nombre = leer_config(pool, "smtp_nombre_remitente").await?;
    if servidor.is_empty() || usuario.is_empty() || clave.is_empty() {
        return Err("Falta configurar el correo (servidor, usuario y clave) en Reportes → Configurar correo.".to_string());
    }

    // 465 = TLS implícito; cualquier otro puerto (587) = STARTTLS.
    let builder = if puerto == 465 {
        AsyncSmtpTransport::<Tokio1Executor>::relay(&servidor)
    } else {
        AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(&servidor)
    }
    .map_err(|e| format!("Servidor SMTP inválido: {e}"))?;

    let transporte = builder.port(puerto).credentials(Credentials::new(usuario.clone(), clave)).build();
    let remitente = Mailbox::new(
        if nombre.is_empty() { None } else { Some(nombre) },
        usuario.parse().map_err(|_| format!("El usuario SMTP no es un correo válido: {usuario}"))?,
    );
    Ok((transporte, remitente))
}

/// Verifica que servidor/usuario/clave guardados permitan iniciar sesión en el SMTP.
#[tauri::command]
pub async fn probar_config_correo(pool: State<'_, SqlitePool>) -> Result<(), String> {
    let (transporte, _) = transporte_smtp(pool.inner()).await?;
    match transporte.test_connection().await {
        Ok(true) => Ok(()),
        Ok(false) => Err("El servidor SMTP no respondió.".to_string()),
        Err(e) => Err(format!("No se pudo conectar: {e}")),
    }
}

/// Envía un reporte ya generado (carpeta de reportes) como adjunto.
/// `destinatarios`: uno o varios correos separados por coma o punto y coma.
#[tauri::command]
pub async fn enviar_reporte_correo(
    app: AppHandle,
    pool: State<'_, SqlitePool>,
    nombre_archivo: String,
    destinatarios: String,
    asunto: String,
    cuerpo: String,
) -> Result<(), String> {
    let ruta = ruta_reporte(&app, &nombre_archivo)?;
    let pdf = std::fs::read(&ruta).map_err(|e| format!("No se encontró el reporte generado: {e}"))?;
    let (transporte, remitente) = transporte_smtp(pool.inner()).await?;

    let mut mensaje = Message::builder().from(remitente).subject(asunto);
    let mut alguno = false;
    for d in destinatarios.split([',', ';']).map(str::trim).filter(|d| !d.is_empty()) {
        mensaje = mensaje.to(d.parse().map_err(|_| format!("Correo inválido: {d}"))?);
        alguno = true;
    }
    if !alguno {
        return Err("Escribe al menos un destinatario.".to_string());
    }

    let correo = mensaje
        .multipart(
            MultiPart::mixed()
                .singlepart(SinglePart::plain(cuerpo))
                .singlepart(Attachment::new(nombre_archivo).body(pdf, ContentType::parse("application/pdf").unwrap())),
        )
        .map_err(|e| e.to_string())?;

    transporte
        .send(correo)
        .await
        .map_err(|e| format!("No se pudo enviar el correo: {e}"))?;
    Ok(())
}
