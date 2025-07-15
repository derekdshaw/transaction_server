use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use testcontainers_modules::{
    postgres::Postgres, testcontainers::runners::AsyncRunner, testcontainers::ContainerAsync,
};
use std::sync::Arc;
use transaction_server::{
    db_traits::{MockCategoryRepository, MockTransactionRepository},
    graphql::GraphQLContext,
};
use crate::common::db_mocks::{LocalMockCategoryRepository, LocalMockTransactionRepository};

// Test helper to set up a test database with testcontainers
#[allow(dead_code)]
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

#[allow(dead_code)]
pub fn get_context(
    mock_category_repository: Arc<MockCategoryRepository>,
    mock_transaction_repository: Arc<MockTransactionRepository>,
) -> GraphQLContext {
    let wrapped_category_mock = LocalMockCategoryRepository {
        inner: mock_category_repository,
    };
    let wrapped_transaction_mock = LocalMockTransactionRepository {
        inner: mock_transaction_repository,
    };

    GraphQLContext {
        category_repository: Arc::new(wrapped_category_mock),
        transaction_repository: Arc::new(wrapped_transaction_mock),
    }
}
