use sqlx::PgPool;
use testcontainers_modules::{
    postgres::Postgres,
    testcontainers::runners::AsyncRunner,
    testcontainers::ContainerAsync,
};
use sqlx::postgres::PgPoolOptions;

// Test helper to set up a test database with testcontainers
pub async fn setup_test_db() -> (PgPool, ContainerAsync<Postgres>) {
    let container = Postgres::default().start().await.unwrap();
    
    // Get connection details from the container
    let host_port = container.get_host_port_ipv4(5432).await.unwrap();
    let database_url = format!(
        "postgres://postgres:postgres@localhost:{}/postgres",
        host_port
    );
    
    // Create a connection pool
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to test database");

    // Run migrations
    sqlx::migrate!("./tests/migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    (pool, container)
}