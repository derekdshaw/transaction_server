use chrono::NaiveDate;
use sqlx::types::time::Date;
use sqlx::types::BigDecimal;
use std::sync::Arc;
use transaction_server::db_traits::MockCategoryRepository;
use transaction_server::db_traits::MockTransactionRepository;
use transaction_server::{
    db_models::{DbCategory, DbCategorySummary, DbTransaction},
    db_traits::{CategoryRepository, TransactionRepository},
};

pub struct LocalMockCategoryRepository {
    pub inner: Arc<MockCategoryRepository>,
}

#[async_trait::async_trait]
impl CategoryRepository for LocalMockCategoryRepository {
    async fn all(&self) -> Result<Vec<DbCategory>, sqlx::Error> {
        self.inner.all().await
    }

    async fn create(
        &self,
        name: String,
        description: Option<String>,
        icon: Option<String>,
        color: Option<String>,
    ) -> Result<DbCategory, sqlx::Error> {
        self.inner.create(name, description, icon, color).await
    }

    async fn update(
        &self,
        id: i32,
        name: String,
        description: Option<String>,
        icon: Option<String>,
        color: Option<String>,
    ) -> Result<DbCategory, sqlx::Error> {
        self.inner.update(id, name, description, icon, color).await
    }

    async fn find_by_name(&self, name: &str) -> Result<DbCategory, sqlx::Error> {
        self.inner.find_by_name(name).await
    }
}

pub struct LocalMockTransactionRepository {
    pub inner: Arc<MockTransactionRepository>,
}

// Create a mock for TransactionRepository
#[async_trait::async_trait]
impl TransactionRepository for LocalMockTransactionRepository {
    async fn create(
        &self,
        amount: BigDecimal,
        description: String,
        date: Date,
        category_id: i32,
    ) -> Result<DbTransaction, sqlx::Error> {
        self.inner
            .create(amount, description, date, category_id)
            .await
    }

    async fn all(&self) -> Result<Vec<DbTransaction>, sqlx::Error> {
        self.inner.all().await
    }

    async fn update(
        &self,
        id: i32,
        amount: BigDecimal,
        description: String,
        date: Date,
        category_id: i32,
    ) -> Result<DbTransaction, sqlx::Error> {
        self.inner
            .update(id, amount, description, date, category_id)
            .await
    }

    async fn by_category_id(&self, category_id: i32) -> Result<Vec<DbTransaction>, sqlx::Error> {
        self.inner.by_category_id(category_id).await
    }

    async fn by_date_range(
        &self,
        _start_date: &NaiveDate,
        _end_date: &NaiveDate,
    ) -> Result<Vec<DbTransaction>, sqlx::Error> {
        self.inner.by_date_range(_start_date, _end_date).await
    }

    async fn sum_by_category(
        &self,
        _start_date: &NaiveDate,
        _end_date: &NaiveDate,
    ) -> Result<Vec<DbCategorySummary>, sqlx::Error> {
        self.inner.sum_by_category(_start_date, _end_date).await
    }
}
