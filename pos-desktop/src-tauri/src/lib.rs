mod commands;
mod db;
mod models;
mod reportes;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("no se pudo resolver el directorio de datos de la app");

            let pool = tauri::async_runtime::block_on(db::init_pool(app_data_dir))
                .expect("fallo al inicializar SQLite local");

            app.manage(pool);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::listar_categorias,
            commands::crear_categoria,
            commands::actualizar_categoria,
            commands::eliminar_categoria,
            commands::listar_productos,
            commands::ranking_ventas_productos,
            commands::crear_producto,
            commands::actualizar_producto,
            commands::eliminar_producto,
            commands::ajustar_stock,
            commands::dar_de_baja_stock,
            commands::listar_movimientos_inventario,
            commands::listar_usuarios,
            commands::crear_usuario,
            commands::actualizar_usuario,
            commands::actualizar_mis_datos,
            commands::eliminar_usuario,
            commands::listar_mesas,
            commands::crear_mesa,
            commands::actualizar_mesa,
            commands::eliminar_mesa,
            commands::listar_ventas_abiertas,
            commands::abrir_venta,
            commands::listar_pedidos,
            commands::agregar_pedido,
            commands::eliminar_pedido,
            commands::cambiar_cantidad_pedido,
            commands::cerrar_venta,
            commands::cancelar_venta,
            commands::login_pin,
            commands::obtener_turno_abierto,
            commands::abrir_turno,
            commands::resumen_turno,
            commands::cerrar_turno,
            commands::listar_turnos_dia,
            commands::listar_conceptos_operaciones,
            commands::crear_concepto_operacion,
            commands::eliminar_concepto_operacion,
            commands::listar_operaciones,
            commands::listar_operaciones_caja_general,
            commands::resumen_caja_general,
            commands::listar_retiros_caja_general,
            commands::base_esperada_turno,
            commands::listar_alertas_caja,
            commands::crear_operacion,
            commands::resumen_ventas_mes,
            commands::detalle_dia,
            commands::listar_ventas_cerradas_turno,
            commands::imprimir_recibo_termico,
            commands::importar_catalogo_real,
            commands::importar_desde_archivo,
            reportes::datos_reporte,
            reportes::guardar_reporte_pdf,
            reportes::exportar_reporte_pdf,
            reportes::obtener_config_correo,
            reportes::guardar_config_correo,
            reportes::probar_config_correo,
            reportes::enviar_reporte_correo,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
