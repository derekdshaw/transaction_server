use transaction_server::{
    db_models::PgCategoryRepository,
    db_traits::CategoryRepository,
};
// Import from the current test crate
mod common;
use crate::common::test_utils::setup_test_db;

#[tokio::test]
async fn test_create_category() {
    // Set up test database
    let (pool, container) = setup_test_db().await;

    let category_repository = PgCategoryRepository { pool: pool.clone() };
    // Test creating a category
    let category = category_repository
        .create(
            "Test Category".to_string(),
            Some("Test Description".to_string()),
            Some("test-icon".to_string()),
            Some("#FF0000".to_string()),
        )
        .await
        .expect("Failed to create test category");

    // Verify the retrieved category matches what we created
    assert_eq!(category.name, "Test Category");
    assert_eq!(category.description, Some("Test Description".to_string()));
    assert_eq!(category.icon, Some("test-icon".to_string()));
    assert_eq!(category.color, Some("#FF0000".to_string()));

    // Test retrieving all categories
    let categories = category_repository
        .all()
        .await
        .expect("Failed to get categories");

    assert_eq!(categories.len(), 1);
    assert_eq!(categories[0].name, "Test Category");

    drop(container);
}

#[tokio::test]
async fn test_update_category() {
    // Set up test database
    let (pool, container) = setup_test_db().await;

    let category_repository = PgCategoryRepository { pool: pool.clone() };
    // Test creating a category
    let category = category_repository
        .create(
            "Test Category".to_string(),
            Some("Test Description".to_string()),
            Some("test-icon".to_string()),
            Some("#FF0000".to_string()),
        )
        .await
        .expect("Failed to create test category");

    // Test updating the category
    let updated = category_repository
        .update(
            category.id,
            "Updated Category".to_string(),
            Some("Updated Description".to_string()),
            Some("updated-icon".to_string()),
            Some("#00FF00".to_string()),
        )
        .await
        .expect("Failed to update test category");

    // Verify the updated category matches what we updated
    assert_eq!(updated.name, "Updated Category");
    assert_eq!(updated.description, Some("Updated Description".to_string()));
    assert_eq!(updated.icon, Some("updated-icon".to_string()));
    assert_eq!(updated.color, Some("#00FF00".to_string()));

    drop(container);
}

#[tokio::test]
async fn test_get_category_by_name() {
    // Set up test database
    let (pool, container) = setup_test_db().await;

    let category_repository = PgCategoryRepository { pool: pool.clone() };
    // Test creating a category
    let _category = category_repository
        .create(
            "Test Category".to_string(),
            Some("Test Description".to_string()),
            Some("test-icon".to_string()),
            Some("#FF0000".to_string()),
        )
        .await
        .expect("Failed to create test category");

    // Test retrieving the category by name
    let retrieved = category_repository
        .find_by_name("Test Category")
        .await
        .expect("Failed to get category by name");

    // Verify the retrieved category matches what we created
    assert_eq!(retrieved.name, "Test Category");
    assert_eq!(retrieved.description, Some("Test Description".to_string()));
    assert_eq!(retrieved.icon, Some("test-icon".to_string()));
    assert_eq!(retrieved.color, Some("#FF0000".to_string()));

    drop(container);
}
