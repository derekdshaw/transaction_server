use juniper::{FieldResult, GraphQLObject};
use sqlx::types::time::Date;
use crate::db_models::{DbTransaction, DbCategory, DbCategorySummary};
use chrono::{NaiveDate, NaiveDateTime};
use sqlx::types::BigDecimal;
use std::str::FromStr;
use time::macros::format_description;
use rust_decimal::prelude::ToPrimitive;

#[derive(GraphQLObject)]
pub struct Transaction {
    pub id: i32,
    pub amount: f64,
    pub description: String,
    pub date: NaiveDate,
    pub category_id: i32,
    pub category_name: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(GraphQLObject)]
pub struct Category {
    pub id: i32,
    pub name: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(GraphQLObject)]
pub struct CategorySummary {
    pub category_id: i32,
    pub category_name: String,
    pub total_amount: f64,
    pub transaction_count: i32,
}

// Implement From traits for conversions
impl From<DbTransaction> for Transaction {
    fn from(tx: DbTransaction) -> Self {
        Self {
            id: tx.id,
            amount: tx.amount.to_f64().unwrap_or(0.0),
            description: tx.description,
            date: NaiveDate::from_ymd_opt(
                tx.date.year(),
                tx.date.month() as u32,
                tx.date.day() as u32
            ).unwrap_or_else(|| NaiveDate::from_ymd_opt(1970, 1, 1).unwrap()),
            category_id: tx.category_id,
            category_name: tx.category_name,
            created_at: tx.created_at.map(|dt| 
                NaiveDate::from_ymd_opt(dt.year(), dt.month() as u32, dt.day() as u32)
                    .unwrap()
                    .and_hms_opt(dt.hour() as u32, dt.minute() as u32, dt.second() as u32)
                    .unwrap()
            ),
            updated_at: tx.updated_at.map(|dt| 
                NaiveDate::from_ymd_opt(dt.year(), dt.month() as u32, dt.day() as u32)
                    .unwrap()
                    .and_hms_opt(dt.hour() as u32, dt.minute() as u32, dt.second() as u32)
                    .unwrap()
            ),
        }
    }
}

impl From<DbCategory> for Category {
    fn from(cat: DbCategory) -> Self {
        Self {
            id: cat.id,
            name: cat.name,
            description: cat.description,
            icon: cat.icon,
            color: cat.color,
            created_at: cat.created_at.map(|dt| 
                NaiveDate::from_ymd_opt(dt.year(), dt.month() as u32, dt.day() as u32)
                    .unwrap()
                    .and_hms_opt(dt.hour() as u32, dt.minute() as u32, dt.second() as u32)
                    .unwrap()
            ),
            updated_at: cat.updated_at.map(|dt| 
                NaiveDate::from_ymd_opt(dt.year(), dt.month() as u32, dt.day() as u32)
                    .unwrap()
                    .and_hms_opt(dt.hour() as u32, dt.minute() as u32, dt.second() as u32)
                    .unwrap()
            ),
        }
    }
}

impl From<DbCategorySummary> for CategorySummary {
    fn from(cat: DbCategorySummary) -> Self {
        Self {
            category_id: cat.category_id,
            category_name: cat.category_name.expect("Category name should not be null"),
            total_amount: cat.total_amount.expect("Total amount should not be null").to_f64().unwrap(),
            transaction_count: cat.transaction_count.expect("Transaction count should not be null").to_i32().unwrap(),
        }
    }
}

// GraphQL Context
#[derive(Clone)]
pub struct GraphQLContext {
    pub pool: sqlx::PgPool,
}

// Implement Juniper's Context trait for our context
impl juniper::Context for GraphQLContext {}

// Root query and mutation types
pub struct QueryRoot;

#[juniper::graphql_object(Context = GraphQLContext)]
impl QueryRoot {
    #[graphql(description = "Get all transactions")]
    async fn all_transactions(context: &GraphQLContext) -> FieldResult<Vec<Transaction>> {
        DbTransaction::all(&context.pool).await.map_err(Into::into).map(|txs| txs.into_iter().map(Into::into).collect())
    }

    #[graphql(description = "Get transactions by category")]
    async fn transactions_by_category(context: &GraphQLContext, category_id: i32) -> FieldResult<Vec<Transaction>> {
        DbTransaction::by_category_id(category_id, &context.pool).await.map_err(Into::into).map(|txs| txs.into_iter().map(Into::into).collect())
    }

    #[graphql(description = "Get transactions by date range")]
    async fn transactions_by_date_range(
        context: &GraphQLContext,
        start_date: String,
        end_date: String,
    ) -> FieldResult<Vec<Transaction>> {
        let start_date = NaiveDate::parse_from_str(&start_date, "%Y-%m-%d")
            .map_err(|e| format!("Invalid start date format: {}, expected YYYY-MM-DD", e))?;
        let end_date = NaiveDate::parse_from_str(&end_date, "%Y-%m-%d")
            .map_err(|e| format!("Invalid end date format: {}, expected YYYY-MM-DD", e))?;

        DbTransaction::by_date_range(&start_date, &end_date, &context.pool).await.map_err(Into::into).map(|txs| txs.into_iter().map(Into::into).collect())
    }

    #[graphql(description = "Get category summary by date range")]
    async fn transactions_summary_by_category(
        context: &GraphQLContext,
        start_date: String,
        end_date: String,
    ) -> FieldResult<Vec<CategorySummary>> {
        let start_date = NaiveDate::parse_from_str(&start_date, "%Y-%m-%d")
            .map_err(|e| format!("Invalid start date format: {}, expected YYYY-MM-DD", e))?;
        let end_date = NaiveDate::parse_from_str(&end_date, "%Y-%m-%d")
            .map_err(|e| format!("Invalid end date format: {}, expected YYYY-MM-DD", e))?;

        DbTransaction::sum_by_category(&start_date, &end_date, &context.pool).await.map_err(Into::into).map(|cats| cats.into_iter().map(Into::into).collect())
    }

    #[graphql(description = "Get all categories")]
    async fn categories(context: &GraphQLContext) -> FieldResult<Vec<Category>> {
        DbCategory::all(&context.pool).await.map_err(Into::into).map(|cats| cats.into_iter().map(Into::into).collect())
    }

    #[graphql(description = "Get category by name")]
    async fn category_by_name(context: &GraphQLContext, name: String) -> FieldResult<Category> {
        DbCategory::find_by_name(&name, &context.pool).await.map_err(Into::into).map(|cat| cat.into())
    }
}

pub struct MutationRoot;

#[juniper::graphql_object(Context = GraphQLContext)]
impl MutationRoot {
    async fn create_transaction(
        context: &GraphQLContext,
        amount: f64,
        description: String,
        date: String,
        category_id: i32,
    ) -> FieldResult<Transaction> {
        let amount = BigDecimal::from_str(&amount.to_string())?;
    
        let date = Date::parse(date.as_str(), format_description!("[year]-[month]-[day]")).unwrap();
        DbTransaction::create(amount, description, date, category_id, &context.pool).await.map_err(Into::into).map(|tx| tx.into()) 
    }

    async fn update_transaction(
        context: &GraphQLContext,
        id: i32,
        amount: f64,
        description: String,
        date: String,
        category_id: i32,
    ) -> FieldResult<Transaction> {
        let amount = BigDecimal::from_str(&amount.to_string())?;
    
        let date = Date::parse(date.as_str(), format_description!("[year]-[month]-[day]")).unwrap();
        DbTransaction::update(id, amount, description, date, category_id, &context.pool).await.map_err(Into::into).map(|tx| tx.into()) 
    }

    // async fn delete_transaction(context: &GraphQLContext, id: i32) -> FieldResult<bool> {
    //     DbTransaction::delete(id, &context.pool).await.map_err(Into::into)
    // }

    async fn create_category(
        context: &GraphQLContext,
        name: String,
        description: Option<String>,
        icon: Option<String>,
        color: Option<String>,
    ) -> FieldResult<Category> {
        DbCategory::create(name, description, icon, color, &context.pool).await.map_err(Into::into).map(|cat| cat.into())
    }

    async fn update_category(
        context: &GraphQLContext,
        id: i32,
        name: String,
        description: Option<String>,
        icon: Option<String>,
        color: Option<String>,
    ) -> FieldResult<Category> {
        DbCategory::update(id, name, description, icon, color, &context.pool).await.map_err(Into::into).map(|cat| cat.into())
    }

    // async fn delete_category(context: &GraphQLContext, id: i32) -> FieldResult<bool> {
    //     DbCategory::delete(id, &context.pool).await.map_err(Into::into)
    // }
}
