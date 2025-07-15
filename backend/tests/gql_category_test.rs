use juniper::{InputValue, Variables};
use std::sync::Arc;
use transaction_server::{
    db_models::DbCategory,
    db_traits::{MockCategoryRepository, MockTransactionRepository},
    gql_schema::create_schema,
};

mod common;
use common::test_utils::get_context;


fn assert_category_object(
    obj: &juniper::Object<juniper::DefaultScalarValue>,
    expected: &DbCategory,
    i: usize,
) {
    assert_scalar_value!(obj, "id", i32, expected.id, format!("category at index {}", i));
    assert_scalar_value!(obj, "name", String, expected.name, format!("category at index {}", i));
    assert_optional_scalar_value!(obj, "description", String, &expected.description, format!("category at index {}", i));
    assert_optional_scalar_value!(obj, "icon", String, &expected.icon, format!("category at index {}", i));
    assert_optional_scalar_value!(obj, "color", String, &expected.color, format!("category at index {}", i));

    fn format_datetime_opt(dt: &Option<time::OffsetDateTime>) -> Option<String> {
        dt.map(|d| d.format(&time::format_description::well_known::Rfc3339).unwrap())
    }

    let expected_created = format_datetime_opt(&expected.created_at);
    let expected_updated = format_datetime_opt(&expected.updated_at);

    assert_optional_scalar_value!(obj, "created_at", String, expected_created, format!("category at index {}", i));
    assert_optional_scalar_value!(obj, "updated_at", String, expected_updated, format!("category at index {}", i));
}

#[tokio::test]
async fn test_all() {
    let mut mock_category_repository = Arc::new(MockCategoryRepository::new());
    let mock_transaction_repository = Arc::new(MockTransactionRepository::new());
    let mock =
        Arc::get_mut(&mut mock_category_repository).expect("Failed to get mutable reference");

    let categories = vec![
        DbCategory {
            id: 1,
            name: "Test Category".to_string(),
            description: None,
            icon: None,
            color: None,
            created_at: None,
            updated_at: None,
        },
        DbCategory {
            id: 2,
            name: "Test Category 2".to_string(),
            description: Some("A description for test 2".to_string()),
            icon: None,
            color: None,
            created_at: None,
            updated_at: None,
        },
        DbCategory {
            id: 3,
            name: "Test Category 3".to_string(),
            description: None,
            icon: None,
            color: None,
            created_at: None,
            updated_at: None,
        },
    ];

    // due to borrowing we need to clone the test_category
    let expected_categories = categories.clone();
    mock.expect_all()
        .returning(move || Ok(expected_categories.clone()));

    // must be created after expect setup for borrow checker.
    let context_mock = get_context(
        mock_category_repository.clone(),
        mock_transaction_repository.clone(),
    );
    let schema = create_schema();

    let query = r#"
        query AllCategories {
            categories {
                id
                name
                description
                icon
                color
            }
        }
    "#;

    let variables = Variables::new();
    let result = juniper::execute(query, None, &schema, &variables, &context_mock).await;

    let (data, errors) = result.expect("Query execution failed");
    assert!(errors.is_empty(), "Unexpected GraphQL errors: {:?}", errors);

    //assert_category_fields!(data, "categories", categories);
    assert_object_fields!(data, "categories", categories, assert_category_object);
}

#[tokio::test]
async fn test_find_by_name() {
    let mut mock_category_repository = Arc::new(MockCategoryRepository::new());
    let mock_transaction_repository = Arc::new(MockTransactionRepository::new());
    let mock =
        Arc::get_mut(&mut mock_category_repository).expect("Failed to get mutable reference");

    let test_category = DbCategory {
        id: 1,
        name: "Test Category".to_string(),
        description: None,
        icon: None,
        color: None,
        created_at: None,
        updated_at: None,
    };

    // due to borrowing we need to clone the test_category
    let expected_category = test_category.clone();
    mock.expect_find_by_name()
        .returning(move |_name| Ok(expected_category.clone()));

    // must be created after expect setup for borrow checker.
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

    let (data, errors) = result.expect("Query execution failed");
    assert!(errors.is_empty(), "Unexpected GraphQL errors: {:?}", errors);

    let test_category_vec = vec![test_category];

    assert_object_fields!(data, "categoryByName", test_category_vec, assert_category_object);
}
