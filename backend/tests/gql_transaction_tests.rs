use chrono::NaiveDate;
use juniper::{InputValue, Variables};
use std::sync::Arc;
use transaction_server::{
    db_models::{DbTransaction, DbCategorySummary},
    db_traits::{MockCategoryRepository, MockTransactionRepository},
    gql_schema::create_schema,
};
use sqlx::types::time::Date;
use sqlx::types::BigDecimal;
use time::{format_description, Month};
mod common;
use common::test_utils::get_context;
use bigdecimal::{ToPrimitive, FromPrimitive};

fn format_date(date: &Date) -> String {
    let format = format_description::parse("[year]-[month]-[day]").unwrap();
    date.format(&format).unwrap()
}

fn assert_transaction_object(
    obj: &juniper::Object<juniper::DefaultScalarValue>,
    expected: &DbTransaction,
    i: usize,
) {
    let context = format!("transaction at index {}", i);
    assert_scalar_value!(obj, "id", i32, expected.id, &context);
    assert_scalar_value!(obj, "amount", f64, expected.amount.to_f64().unwrap(), &context);
    assert_scalar_value!(obj, "description", String, expected.description, &context);
    assert_scalar_value!(obj, "date", String, format_date(&expected.date), &context);
    assert_scalar_value!(obj, "categoryId", i32, expected.category_id, &context);
    assert_optional_scalar_value!(obj, "categoryName", String, &expected.category_name, &context);

    fn format_datetime_opt(dt: &Option<time::OffsetDateTime>) -> Option<String> {
        dt.map(|d| d.format(&time::format_description::well_known::Rfc3339).unwrap())
    }

    let expected_created = format_datetime_opt(&expected.created_at);
    let expected_updated = format_datetime_opt(&expected.updated_at);

    assert_optional_scalar_value!(obj, "createdAt", String, expected_created, &context);
    assert_optional_scalar_value!(obj, "updatedAt", String, expected_updated, &context);
}

fn assert_summary_object(
    obj: &juniper::Object<juniper::DefaultScalarValue>,
    expected: &DbCategorySummary,
    i: usize,
) {
    let context = format!("category summary at index {}", i);
    
    assert_scalar_value!(obj, "categoryId", i32, expected.category_id, &context);
    assert_optional_scalar_value!(obj, "categoryName", String, &expected.category_name, &context);
    
    // For non-nullable fields that are wrapped in Option in the DB model
    let total_amount = expected.total_amount.clone().expect("Total amount should not be null").to_f64().unwrap();
    assert_scalar_value!(obj, "totalAmount", f64, total_amount, &context);
    
    let transaction_count = expected.transaction_count.expect("Transaction count should not be null").to_i32().unwrap();
    assert_scalar_value!(obj, "transactionCount", i32, transaction_count, &context);
}

#[tokio::test]
async fn test_all() {
    let mock_category_repository = Arc::new(MockCategoryRepository::new());
    let mut mock_transaction_repository = Arc::new(MockTransactionRepository::new());
    let mock =
        Arc::get_mut(&mut mock_transaction_repository).expect("Failed to get mutable reference");

    let transactions = vec![
        DbTransaction {
            id: 1,
            amount: BigDecimal::from_f64(100.0).unwrap(),
            description: "Text one description".to_string(),
            date: Date::from_calendar_date(2025, Month::May, 15).unwrap(),
            category_id: 1,
            category_name: None,
            created_at: None,
            updated_at: None,
        },
        DbTransaction {
            id: 2,
            amount: BigDecimal::from_f64(200.0).unwrap(),
            description: "Text two description".to_string(),
            date: Date::from_calendar_date(2025, Month::May, 15).unwrap(),
            category_id: 2,
            category_name: None,
            created_at: None,
            updated_at: None,
        },
        DbTransaction {
            id: 3,
            amount: BigDecimal::from_f64(300.0).unwrap(),
            description: "Text three description".to_string(),
            date: Date::from_calendar_date(2025, Month::May, 15).unwrap(),
            category_id: 3,
            category_name: None,
            created_at: None,
            updated_at: None,
        },
    ];

    // due to borrowing we need to clone the test_category
    let expected_transactions = transactions.clone();
    mock.expect_all()
        .returning(move || Ok(expected_transactions.clone()));

    // must be created after expect setup for borrow checker.
    let context_mock = get_context(
        mock_category_repository.clone(),
        mock_transaction_repository.clone(),
    );
    let schema = create_schema();

    let query = r#"
        query AllTransactions {
            allTransactions {
                id
                date
                amount
                description
                categoryName
                categoryId
            }
        }
    "#;

    let variables = Variables::new();
    let result = juniper::execute(query, None, &schema, &variables, &context_mock).await;

    let (data, errors) = result.expect("Query execution failed");
    assert!(errors.is_empty(), "Unexpected GraphQL errors: {:?}", errors);

    //assert_transaction_fields!(data, "transactions", transactions);
    assert_object_fields!(data, "allTransactions", transactions, assert_transaction_object);
}

#[tokio::test]
async fn test_by_category() {
    let mock_category_repository = Arc::new(MockCategoryRepository::new());
    let mut mock_transaction_repository = Arc::new(MockTransactionRepository::new());
    let mock =
        Arc::get_mut(&mut mock_transaction_repository).expect("Failed to get mutable reference");

    let transactions = vec![
        DbTransaction {
            id: 1,
            amount: BigDecimal::from_f64(100.0).unwrap(),
            description: "Text one description".to_string(),
            date: Date::from_calendar_date(2025, Month::May, 15).unwrap(),
            category_id: 1,
            category_name: Some("Category 1".to_string()),
            created_at: None,
            updated_at: None,
        },
        DbTransaction {
            id: 2,
            amount: BigDecimal::from_f64(200.0).unwrap(),
            description: "Text two description".to_string(),
            date: Date::from_calendar_date(2025, Month::May, 15).unwrap(),
            category_id: 1,
            category_name: Some("Category 1".to_string()),
            created_at: None,
            updated_at: None,
        },
        DbTransaction {
            id: 3,
            amount: BigDecimal::from_f64(300.0).unwrap(),
            description: "Text three description".to_string(),
            date: Date::from_calendar_date(2025, Month::May, 15).unwrap(),
            category_id: 1,
            category_name: Some("Category 1".to_string()),
            created_at: None,
            updated_at: None,
        },
    ];

    // due to borrowing we need to clone the test_category
    let expected_transactions = transactions.clone();
    mock.expect_by_category_id()
        .returning(move |_category_id| Ok(expected_transactions.clone()));

    // must be created after expect setup for borrow checker.
    let context_mock = get_context(
        mock_category_repository.clone(),
        mock_transaction_repository.clone(),
    );
    let schema = create_schema();

    let query = r#"
        query TransactionsByCategory($categoryId: Int!) {
            transactionsByCategory(categoryId: $categoryId) {
                id
                date
                amount
                description
                categoryName
                categoryId
            }
        }
    "#;

    let mut variables = Variables::new();
    variables.insert("categoryId".to_string(), InputValue::scalar(transactions[0].category_id));
    let result = juniper::execute(query, None, &schema, &variables, &context_mock).await;

    let (data, errors) = result.expect("Query execution failed");
    assert!(errors.is_empty(), "Unexpected GraphQL errors: {:?}", errors);

    //assert_transaction_fields!(data, "transactions", transactions);
    assert_object_fields!(data, "transactionsByCategory", transactions, assert_transaction_object);
}

#[tokio::test]
async fn test_by_date_range() {
    let mock_category_repository = Arc::new(MockCategoryRepository::new());
    let mut mock_transaction_repository = Arc::new(MockTransactionRepository::new());
    let mock =
        Arc::get_mut(&mut mock_transaction_repository).expect("Failed to get mutable reference");

    let transactions = vec![
        DbTransaction {
            id: 1,
            amount: BigDecimal::from_f64(100.0).unwrap(),
            description: "Text one description".to_string(),
            date: Date::from_calendar_date(2025, Month::May, 15).unwrap(),
            category_id: 1,
            category_name: None,
            created_at: None,
            updated_at: None,
        },
        DbTransaction {
            id: 2,
            amount: BigDecimal::from_f64(200.0).unwrap(),
            description: "Text two description".to_string(),
            date: Date::from_calendar_date(2025, Month::May, 15).unwrap(),
            category_id: 1,
            category_name: None,
            created_at: None,
            updated_at: None,
        },
        DbTransaction {
            id: 3,
            amount: BigDecimal::from_f64(300.0).unwrap(),
            description: "Text three description".to_string(),
            date: Date::from_calendar_date(2025, Month::May, 16).unwrap(),
            category_id: 1,
            category_name: None,
            created_at: None,
            updated_at: None,
        },
    ];

    // due to borrowing we need to clone the test_category
    let expected_transactions = transactions.clone();
    mock.expect_by_date_range()
        .returning(move |_start_date: &NaiveDate, _end_date: &NaiveDate| Ok(expected_transactions.clone()));

    // must be created after expect setup for borrow checker.
    let context_mock = get_context(
        mock_category_repository.clone(),
        mock_transaction_repository.clone(),
    );
    let schema = create_schema();

    let query = r#"
        query TransactionsByDateRange($startDate: String!, $endDate: String!) {
            transactionsByDateRange(startDate: $startDate, endDate: $endDate) {
                id
                date
                amount
                description
                categoryName
                categoryId
            }
        }
    "#;

    let mut variables = Variables::new();
    variables.insert("startDate".to_string(), InputValue::scalar(format_date(&transactions[0].date)));
    variables.insert("endDate".to_string(), InputValue::scalar(format_date(&transactions[2].date)));
    let result = juniper::execute(query, None, &schema, &variables, &context_mock).await;

    let (data, errors) = result.expect("Query execution failed");
    assert!(errors.is_empty(), "Unexpected GraphQL errors: {:?}", errors);

    //assert_transaction_fields!(data, "transactions", transactions);
    assert_object_fields!(data, "transactionsByDateRange", transactions, assert_transaction_object);
}

#[tokio::test]
async fn test_summary_by_category() {
    let mock_category_repository = Arc::new(MockCategoryRepository::new());
    let mut mock_transaction_repository = Arc::new(MockTransactionRepository::new());
    let mock =
        Arc::get_mut(&mut mock_transaction_repository).expect("Failed to get mutable reference");

    let summaries = vec![
        DbCategorySummary {
            category_id: 1,
            category_name: Some("Housewares".to_string()),
            total_amount: Some(BigDecimal::from_f64(1001.0).unwrap()),
            transaction_count: Some(1),
        },
        DbCategorySummary {
            category_id: 2,
            category_name: Some("Utilities".to_string()),
            total_amount: Some(BigDecimal::from_f64(250.0).unwrap()),
            transaction_count: Some(5),
        },
        DbCategorySummary {
            category_id: 3,
            category_name: Some("Groceries".to_string()),
            total_amount: Some(BigDecimal::from_f64(982.45).unwrap()),
            transaction_count: Some(55),
        },
    ];

    // due to borrowing we need to clone the test_category
    let expected_summaries = summaries.clone();
    mock.expect_sum_by_category()
        .returning(move |_start_date: &NaiveDate, _end_date: &NaiveDate| Ok(expected_summaries.clone()));

    // must be created after expect setup for borrow checker.
    let context_mock = get_context(
        mock_category_repository.clone(),
        mock_transaction_repository.clone(),
    );
    let schema = create_schema();

    let query = r#"
        query TransactionsSummaryByCategory($startDate: String!, $endDate: String!) {
            transactionsSummaryByCategory(startDate: $startDate, endDate: $endDate) {
                categoryId
                categoryName
                totalAmount
                transactionCount
            }
        }
    "#;

    let mut variables = Variables::new();
    variables.insert("startDate".to_string(), InputValue::scalar("2025-01-01".to_string()));
    variables.insert("endDate".to_string(), InputValue::scalar("2025-01-31".to_string()));
    let result = juniper::execute(query, None, &schema, &variables, &context_mock).await;

    let (data, errors) = result.expect("Query execution failed");
    assert!(errors.is_empty(), "Unexpected GraphQL errors: {:?}", errors);

    assert_object_fields!(data, "transactionsSummaryByCategory", summaries, assert_summary_object);
}

#[tokio::test]
async fn test_create() {
    let mock_category_repository = Arc::new(MockCategoryRepository::new());
    let mut mock_transaction_repository = Arc::new(MockTransactionRepository::new());
    let mock =
        Arc::get_mut(&mut mock_transaction_repository).expect("Failed to get mutable reference");

    let transaction = DbTransaction {
        id: 1,
        amount: BigDecimal::from_f64(100.0).unwrap(),
        description: "Text one description".to_string(),
        date: Date::from_calendar_date(2025, Month::May, 15).unwrap(),
        category_id: 1,
        category_name: None,
        created_at: None,
        updated_at: None,
    };

    let expected_transaction = transaction.clone();
    
    mock.expect_create()
        .returning(move |_amount: BigDecimal, _description: String, _date: Date, _category_id: i32| {
            Ok(expected_transaction.clone())
        });

    let context_mock = get_context(
        mock_category_repository.clone(),
        mock_transaction_repository.clone(),
    );
    let schema = create_schema();

    let query = r#"
        mutation CreateTransaction($amount: Float!, $description: String!, $date: String!, $categoryId: Int!) {
            createTransaction(
                amount: $amount,
                description: $description,
                date: $date,
                categoryId: $categoryId
            ) {
                id
                date
                amount
                description
                categoryName
                categoryId
            }
        }
    "#;

    let mut variables = Variables::new();
    variables.insert("amount".to_string(), InputValue::scalar(transaction.amount.to_f64().unwrap()));
    variables.insert("description".to_string(), InputValue::scalar(transaction.description.clone()));
    variables.insert("date".to_string(), InputValue::scalar(format_date(&transaction.date)));
    variables.insert("categoryId".to_string(), InputValue::scalar(transaction.category_id));
    let result = juniper::execute(query, None, &schema, &variables, &context_mock).await;

    let (data, errors) = result.expect("Query execution failed");
    assert!(errors.is_empty(), "Unexpected GraphQL errors: {:?}", errors);

    let expected_transaction_vec = vec![transaction];
    assert_object_fields!(data, "createTransaction", expected_transaction_vec, assert_transaction_object);
}

#[tokio::test]
async fn test_update() {
    let mock_category_repository = Arc::new(MockCategoryRepository::new());
    let mut mock_transaction_repository = Arc::new(MockTransactionRepository::new());
    let mock =
        Arc::get_mut(&mut mock_transaction_repository).expect("Failed to get mutable reference");
    
    let transaction = DbTransaction {
        id: 1,
        amount: BigDecimal::from_f64(100.0).unwrap(),
        description: "Text one description".to_string(),
        date: Date::from_calendar_date(2025, Month::May, 15).unwrap(),
        category_id: 1,
        category_name: None,
        created_at: None,
        updated_at: None,
    };

    let expected_transaction = transaction.clone();
    
    mock.expect_update()
        .returning(move |_id: i32, _amount: BigDecimal, _description: String, _date: Date, _category_id: i32| {
            Ok(expected_transaction.clone())
        });

    let context_mock = get_context(
        mock_category_repository.clone(),
        mock_transaction_repository.clone(),
    );
    let schema = create_schema();

    let query = r#"
        mutation UpdateTransaction($id: Int!, $amount: Float!, $description: String!, $date: String!, $categoryId: Int!) {
            updateTransaction(
                id: $id,
                amount: $amount,
                description: $description,
                date: $date,
                categoryId: $categoryId
            ) {
                id
                date
                amount
                description
                categoryName
                categoryId
            }
        }
    "#;

    let mut variables = Variables::new();
    variables.insert("id".to_string(), InputValue::scalar(transaction.id));
    variables.insert("amount".to_string(), InputValue::scalar(transaction.amount.to_f64().unwrap()));
    variables.insert("description".to_string(), InputValue::scalar(transaction.description.clone()));
    variables.insert("date".to_string(), InputValue::scalar(format_date(&transaction.date)));
    variables.insert("categoryId".to_string(), InputValue::scalar(transaction.category_id));
    let result = juniper::execute(query, None, &schema, &variables, &context_mock).await;

    let (data, errors) = result.expect("Query execution failed");
    assert!(errors.is_empty(), "Unexpected GraphQL errors: {:?}", errors);

    let expected_transaction_vec = vec![transaction];
    assert_object_fields!(data, "updateTransaction", expected_transaction_vec, assert_transaction_object);
}
