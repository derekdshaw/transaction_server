use std::sync::Arc;

use juniper::{InputValue, Variables};

use transaction_server::{
    db_models::DbCategory,
    db_traits::{MockCategoryRepository, MockTransactionRepository},
    gql_schema::create_schema,
    graphql::GraphQLContext,
};
mod common;
use common::db_mocks::{LocalMockCategoryRepository, LocalMockTransactionRepository};
use sqlx::types::time::OffsetDateTime;

fn get_context(
    mock_category_repository: Arc<MockCategoryRepository>,
    mock_transaction_repository: Arc<MockTransactionRepository>,
) -> GraphQLContext {
    let wrapped_category_mock = LocalMockCategoryRepository {
        inner: mock_category_repository,
    };
    let wrapped_transaction_mock = LocalMockTransactionRepository {
        inner: mock_transaction_repository,
    };

    let context = GraphQLContext {
        category_repository: Arc::new(wrapped_category_mock),
        transaction_repository: Arc::new(wrapped_transaction_mock),
    };
    context
}

#[tokio::test]
async fn test_find_by_name() {
    let mut mock_category_repository = Arc::new(MockCategoryRepository::new());
    let mock_transaction_repository = Arc::new(MockTransactionRepository::new());
    let mock =
        Arc::get_mut(&mut mock_category_repository).expect("Failed to get mutable reference");
    mock.expect_find_by_name().returning(|_name| {
        Ok(DbCategory {
            id: 1,
            name: "Test Category".to_string(),
            description: None,
            icon: None,
            color: None,
            created_at: Some(OffsetDateTime::now_utc()),
            updated_at: Some(OffsetDateTime::now_utc()),
        })
    });

    let context_mock = get_context(
        mock_category_repository.clone(),
        mock_transaction_repository.clone(),
    );
    let schema = create_schema();

    let query = r#"
        query CategoryByName($name: String!) {
            categoryByName(name: $name) {
                id
                name
                description
                icon
                color
            }
        }
    "#;
    let mut variables = Variables::new();
    variables.insert(
        "name".to_string(),
        InputValue::scalar("Test Category".to_string()),
    );

    let result = juniper::execute(query, None, &schema, &variables, &context_mock).await;

    match result {
        Ok(_) => {
            assert!(true);
        }
        Err(e) => {
            panic!("Query execution failed: {:?}", e);
        }
    }
}
