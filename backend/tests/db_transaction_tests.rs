
use chrono::{NaiveDate, Datelike};
use time::Month;
use sqlx::types::time::Date;
use sqlx::types::BigDecimal;
use transaction_server::db_models::{DbCategory, DbTransaction};
mod common;
use common::test_utils::setup_test_db;


#[tokio::test]
async fn test_create_transaction() {
    // Set up test database
    let (pool, container) = setup_test_db().await;
    
    // First create a category
    let category = DbCategory::create(
        "Test Category".to_string(),
        Some("Test Description".to_string()),
        Some("test-icon".to_string()),
        Some("#FF0000".to_string()),
        &pool
    )
    .await
    .expect("Failed to create test category");

    // Create a transaction
    let today = Date::from_ordinal_date(2025, 1).unwrap();
    let amount = BigDecimal::from(1000);
    
    let transaction = DbTransaction::create(
        amount.clone(),
        "Test Transaction".to_string(),
        today,
        category.id,
        &pool
    )
    .await
    .expect("Failed to create transaction");

    // Verify the transaction was created correctly
    assert_eq!(transaction.amount, amount);
    assert_eq!(transaction.description, "Test Transaction");
    assert_eq!(transaction.date, today);
    assert_eq!(transaction.category_id, category.id);
    assert_eq!(transaction.category_name, Some("Test Category".to_string()));
    
    drop(container);
}

#[tokio::test]
async fn test_update_transaction() {
    // Set up test database
    let (pool, container) = setup_test_db().await;
    
    // Create a category
    let category = DbCategory::create(
        "Test Category".to_string(),
        None,
        None,
        None,
        &pool
    )
    .await
    .expect("Failed to create test category");

    // Create a transaction
    let today = Date::from_ordinal_date(2025, 1).unwrap();
    let transaction = DbTransaction::create(
        BigDecimal::from(1000),
        "Test Transaction".to_string(),
        today,
        category.id,
        &pool
    )
    .await
    .expect("Failed to create transaction");

    // Update the transaction
    let new_amount = BigDecimal::from(2000);
    let new_date = Date::from_ordinal_date(2025, 2).unwrap();
    
    let updated = DbTransaction::update(
        transaction.id,
        new_amount.clone(),
        "Updated Transaction".to_string(),
        new_date,
        category.id,
        &pool
    )
    .await
    .expect("Failed to update transaction");

    // Verify the update
    assert_eq!(updated.id, transaction.id);
    assert_eq!(updated.amount, new_amount);
    assert_eq!(updated.description, "Updated Transaction");
    assert_eq!(updated.date, new_date);
    
    drop(container);
}

#[tokio::test]
async fn test_transactions_by_category() {
    // Set up test database
    let (pool, container) = setup_test_db().await;
    
    // Create two categories
    let category1 = DbCategory::create(
        "Category 1".to_string(),
        None,
        None,
        None,
        &pool
    )
    .await
    .expect("Failed to create category 1");
    
    let category2 = DbCategory::create(
        "Category 2".to_string(),
        None,
        None,
        None,
        &pool
    )
    .await
    .expect("Failed to create category 2");

    // Create transactions in both categories
    let today = Date::from_ordinal_date(2025, 1).unwrap();
    
    // Two transactions in category 1
    for _ in 0..2 {
        DbTransaction::create(
            BigDecimal::from(1000),
            "Test Transaction".to_string(),
            today,
            category1.id,
            &pool
        )
        .await
        .expect("Failed to create transaction");
    }
    
    // One transaction in category 2
    DbTransaction::create(
        BigDecimal::from(2000),
        "Test Transaction 2".to_string(),
        today,
        category2.id,
        &pool
    )
    .await
    .expect("Failed to create transaction");

    // Get transactions for category 1
    let category1_transactions = DbTransaction::by_category_id(category1.id, &pool)
        .await
        .expect("Failed to get transactions by category");
    
    assert_eq!(category1_transactions.len(), 2);
    assert!(category1_transactions.iter().all(|t| t.category_id == category1.id));
    
    drop(container);
}

#[tokio::test]
async fn test_transactions_by_date_range() {
    // Set up test database
    let (pool, container) = setup_test_db().await;
    
    // Create a category
    let category = DbCategory::create(
        "Test Category".to_string(),
        None,
        None,
        None,
        &pool
    )
    .await
    .expect("Failed to create test category");

    // Create transactions on different dates
    let base_date = Date::from_ordinal_date(2025, 1).unwrap();
    
    // Create 3 transactions on consecutive days
    for day_offset in 0..3 {
        let date = base_date.checked_add(time::Duration::days(day_offset.into()));
        DbTransaction::create(
            BigDecimal::from(1000 * (day_offset + 1)),
            format!("Transaction {}", day_offset + 1),
            date.expect("Failed to add days"),
            category.id,
            &pool
        )
        .await
        .expect("Failed to create transaction");
    }
    
    // Get transactions for a date range
    use chrono::NaiveDate;
    let start_date = NaiveDate::from_ymd_opt(2025, 1, 1).unwrap();
    let end_date = NaiveDate::from_ymd_opt(2025, 1, 2).unwrap();
    
    let transactions = DbTransaction::by_date_range(&start_date, &end_date, &pool)
        .await
        .expect("Failed to get transactions by date range");
    
    // Should get transactions for Jan 1 and Jan 2 (2 transactions)
    assert_eq!(transactions.len(), 2);
    
    // Verify the transactions are ordered by date descending (newest first)
    assert!(transactions[0].date >= transactions[1].date);
    
    drop(container);
}

#[tokio::test]
async fn test_transaction_summary_by_category() {
    // Set up test database
    let (pool, container) = setup_test_db().await;
    
    // Create two categories
    let category1 = DbCategory::create(
        "Category 1".to_string(),
        None,
        None,
        None,
        &pool
    )
    .await
    .expect("Failed to create category 1");
    
    let category2 = DbCategory::create(
        "Category 2".to_string(),
        None,
        None,
        None,
        &pool
    )
    .await
    .expect("Failed to create category 2");

    // Create transactions in both categories
    let today = NaiveDate::from_ymd_opt(2025, 1, 1).unwrap();
    let date = Date::from_calendar_date(today.year(), Month::try_from(today.month() as u8).unwrap(), today.day() as u8).unwrap();

    // Two transactions in category 1 (total 2000)
    for _ in 0..2 {
        DbTransaction::create(
            BigDecimal::from(1000),
            "Test Transaction".to_string(),
            date,
            category1.id,
            &pool
        )
        .await
        .expect("Failed to create transaction");
    }
    
    // One transaction in category 2 (total 3000)
    DbTransaction::create(
        BigDecimal::from(3000),
        "Test Transaction 2".to_string(),
        date,
        category2.id,
        &pool
    )
    .await
    .expect("Failed to create transaction");

    // Get summary
    let start_date = NaiveDate::from_ymd_opt(2025, 1, 1).unwrap();
    let end_date = NaiveDate::from_ymd_opt(2025, 1, 31).unwrap();
    
    let summary = DbTransaction::sum_by_category(&start_date, &end_date, &pool)
        .await
        .expect("Failed to get transaction summary by category");
    
    // Should have 2 categories in summary
    assert_eq!(summary.len(), 2);
    
    // Find each category in the summary and verify amounts
    let cat1_summary = summary.iter().find(|s| s.category_id == category1.id).unwrap();
    let cat2_summary = summary.iter().find(|s| s.category_id == category2.id).unwrap();
    
    assert_eq!(cat1_summary.total_amount, Some(BigDecimal::from(2000)));
    assert_eq!(cat1_summary.transaction_count, Some(2));
    assert_eq!(cat2_summary.total_amount, Some(BigDecimal::from(3000)));
    assert_eq!(cat2_summary.transaction_count, Some(1));
    
    drop(container);
}
