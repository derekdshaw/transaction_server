use crate::db_models::{DbCategory, DbCategorySummary, DbTransaction};
use async_trait::async_trait;
use chrono::NaiveDate;
use sqlx::types::time::Date;
use sqlx::types::BigDecimal;

#[cfg_attr(feature = "test-utils", mockall::automock)]
#[async_trait]
pub trait CategoryRepository: Send + Sync {
    async fn all(&self) -> Result<Vec<DbCategory>, sqlx::Error>;
    async fn find_by_name(&self, name: &str) -> Result<DbCategory, sqlx::Error>;
    async fn create(
        &self,
        name: String,
        description: Option<String>,
        icon: Option<String>,
        color: Option<String>,
    ) -> Result<DbCategory, sqlx::Error>;
    async fn update(
        &self,
        id: i32,
        name: String,
        description: Option<String>,
        icon: Option<String>,
        color: Option<String>,
    ) -> Result<DbCategory, sqlx::Error>;
}

#[cfg_attr(feature = "test-utils", mockall::automock)]
#[async_trait]
pub trait TransactionRepository: Send + Sync {
    async fn all(&self) -> Result<Vec<DbTransaction>, sqlx::Error>;

    async fn create(
        &self,
        amount: BigDecimal,
        description: String,
        date: Date,
        category_id: i32,
    ) -> Result<DbTransaction, sqlx::Error>;

    async fn update(
        &self,
        id: i32,
        amount: BigDecimal,
        description: String,
        date: Date,
        category_id: i32,
    ) -> Result<DbTransaction, sqlx::Error>;

    async fn by_category_id(&self, category_id: i32) -> Result<Vec<DbTransaction>, sqlx::Error>;

    async fn by_date_range(
        &self,
        start_date: &NaiveDate,
        end_date: &NaiveDate,
    ) -> Result<Vec<DbTransaction>, sqlx::Error>;

    async fn sum_by_category(
        &self,
        start_date: &NaiveDate,
        end_date: &NaiveDate,
    ) -> Result<Vec<DbCategorySummary>, sqlx::Error>;
}
