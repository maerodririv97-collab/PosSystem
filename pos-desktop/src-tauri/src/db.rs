use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::SqlitePool;
use std::path::PathBuf;
use std::str::FromStr;

pub async fn init_pool(app_data_dir: PathBuf) -> Result<SqlitePool, sqlx::Error> {
    std::fs::create_dir_all(&app_data_dir).expect("no se pudo crear el directorio de datos de la app");

    let db_path = app_data_dir.join("pos_local.db");
    let options = SqliteConnectOptions::from_str(&format!("sqlite://{}", db_path.display()))?
        .create_if_missing(true)
        .foreign_keys(false);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(options)
        .await?;

    sqlx::migrate!("./migrations").run(&pool).await?;

    Ok(pool)
}
