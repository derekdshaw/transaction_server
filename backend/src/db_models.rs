
use chrono::{Datelike, NaiveDate};
use sqlx::types::time::Date;
use sqlx::types::BigDecimal;
use sqlx::{FromRow, PgPool};
use sqlx::Error;
use sqlx::types::time::OffsetDateTime;

#[derive(FromRow, Debug)]
pub struct DbCategorySummary {
    pub category_id: i32,
    pub category_name: Option<String>,
    pub total_amount: Option<BigDecimal>, // the option is needed because SQLx does not understand that COALESCE returns a non-nullable value
    pub transaction_count: Option<i64>,
}

#[derive(FromRow)]
pub struct DbCategory {
    pub id: i32,
    pub name: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub created_at: Option<OffsetDateTime>,
    pub updated_at: Option<OffsetDateTime>,
}

#[derive(sqlx::FromRow)]
pub struct DbTransaction {
    pub id: i32,
    pub amount: BigDecimal,
    pub description: String,
    pub date: Date,
    pub category_id: i32,
    #[sqlx(default)]
    pub category_name: Option<String>,
    pub created_at: Option<OffsetDateTime>,
    pub updated_at: Option<OffsetDateTime>,
}

impl DbCategory {
    pub async fn all(pool: &PgPool) -> Result<Vec<DbCategory>, Error> {
        sqlx::query_as!(
            DbCategory,
            r#"
            SELECT * FROM categories
            ORDER BY name
            "#
        )
        .fetch_all(pool)
        .await
    }

    pub async fn find_by_name(name: &str, pool: &PgPool) -> Result<DbCategory, Error> {
        sqlx::query_as!(
            DbCategory,
            r#"
            SELECT * FROM categories
            WHERE name = $1
            "#,
            name
        )
        .fetch_one(pool)
        .await
    }

    pub async fn create(
        name: String,
        description: Option<String>,
        icon: Option<String>,
        color: Option<String>,
        pool: &PgPool,
    ) -> Result<DbCategory, Error> {
        sqlx::query_as!(
            DbCategory,
            r#"
            INSERT INTO categories (name, description, icon, color)
            VALUES ($1, $2, $3, $4)
            RETURNING *
            "#,
            name,
            description,
            icon,
            color
        )
        .fetch_one(pool)
        .await
    }

    pub async fn update(
        id: i32,
        name: String,
        description: Option<String>,
        icon: Option<String>,
        color: Option<String>,
        pool: &PgPool,
    ) -> Result<DbCategory, Error> {
        sqlx::query_as!(
            DbCategory,
            r#"
            WITH updated AS (
                UPDATE categories 
                SET 
                    name = $1,
                    description = $2,
                    icon = $3,
                    color = $4,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $5
                RETURNING *
            )
            SELECT * FROM updated
            "#,
            name,
            description,
            icon,
            color,
            id
        )
        .fetch_one(pool)
        .await
    }
}

impl DbTransaction {
    pub async fn all(pool: &PgPool) -> Result<Vec<DbTransaction>, Error> {
        sqlx::query_as!(
            DbTransaction,
            r#"
            SELECT
                t.id as "id!",
                t.amount as "amount!",
                t.description as "description!",
                t.date as "date!",
                t.category_id as "category_id!",
                c.name as "category_name?",
                t.created_at as "created_at?",
                t.updated_at as "updated_at?"
            FROM transactions as t
            JOIN categories as c on t.category_id = c.id 
            ORDER BY t.date DESC
            "#
        )
        .fetch_all(pool)
        .await
    }

    pub async fn create(
        amount: BigDecimal,
        description: String,
        date: Date,
        category_id: i32,
        pool: &PgPool,
    ) -> Result<DbTransaction, Error> {
        sqlx::query_as!(
            DbTransaction,
            r#"
            WITH inserted AS (
                INSERT INTO transactions (amount, description, date, category_id)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            )
            SELECT 
                i.id,
                i.amount,
                i.description,
                i.date,
                i.category_id,
                c.name as "category_name?",
                i.created_at,
                i.updated_at
            FROM inserted i
            JOIN categories c ON i.category_id = c.id
            "#,
            amount,
            description,
            date,
            category_id
        )
        .fetch_one(pool)
        .await
    }

    pub async fn update(
        id: i32,
        amount: BigDecimal,
        description: String,
        date: Date,
        category_id: i32,
        pool: &PgPool,
    ) -> Result<DbTransaction, Error> {
        sqlx::query_as!(
            DbTransaction,
            r#"
            WITH updated AS (
                UPDATE transactions 
                SET 
                    amount = $1,
                    description = $2,
                    date = $3,
                    category_id = $4,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $5
                RETURNING *
            )
            SELECT 
                u.id,
                u.amount,
                u.description,
                u.date,
                u.category_id,
                c.name as "category_name?",
                u.created_at,
                u.updated_at
            FROM updated u
            JOIN categories c ON u.category_id = c.id
            "#,
            amount,
            description,
            date,
            category_id,
            id
        )
        .fetch_one(pool)
        .await
    }

    pub async fn by_category_id(category_id: i32, pool: &PgPool) -> Result<Vec<DbTransaction>, Error> {
        sqlx::query_as!(
            DbTransaction,
            r#"
            SELECT 
                t.id,
                t.amount,
                t.description,
                t.date,
                t.category_id,
                c.name as "category_name?",
                t.created_at,
                t.updated_at
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            WHERE t.category_id = $1
            ORDER BY t.date DESC
            "#,
            category_id
        )
        .fetch_all(pool)
        .await
    }

    pub async fn by_date_range(
        start_date: &NaiveDate,
        end_date: &NaiveDate,
        pool: &PgPool,
    ) -> Result<Vec<DbTransaction>, Error> {
        let sql_start_date = Date::from_calendar_date(start_date.year().into(), time::Month::try_from(start_date.month() as u8).expect("Invalid month number"), start_date.day() as u8).unwrap();
        let sql_end_date = Date::from_calendar_date(end_date.year().into(), time::Month::try_from(end_date.month() as u8).expect("Invalid month number"), end_date.day() as u8).unwrap();
        sqlx::query_as!(
            DbTransaction,
            r#"
            SELECT 
                t.id,
                t.amount,
                t.description,
                t.date,
                t.category_id,
                c.name as "category_name?",
                t.created_at,
                t.updated_at
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            WHERE t.date BETWEEN $1 AND $2
            ORDER BY t.date DESC
            "#,
            sql_start_date,
            sql_end_date
        )
        .fetch_all(pool)
        .await
    }

    pub async fn sum_by_category(
        start_date: &NaiveDate,
        end_date: &NaiveDate,
        pool: &PgPool,
    ) -> Result<Vec<DbCategorySummary>, Error> {
        let sql_start_date = Date::from_calendar_date(
            start_date.year().into(),
            time::Month::try_from(start_date.month() as u8).expect("Invalid month number"),
            start_date.day() as u8
        ).unwrap();
        
        let sql_end_date = Date::from_calendar_date(
            end_date.year().into(),
            time::Month::try_from(end_date.month() as u8).expect("Invalid month number"),
            end_date.day() as u8
        ).unwrap();
        
        sqlx::query_as!(
            DbCategorySummary,
            r#"
            WITH category_totals AS (
                SELECT 
                    c.id as cat_id,
                    COALESCE(SUM(t.amount), 0) as total
                FROM categories c
                LEFT JOIN transactions t ON c.id = t.category_id 
                    AND t.date BETWEEN $1 AND $2
                GROUP BY c.id
            )
            SELECT 
                c.id as category_id,
                COALESCE(c.name, 'Uncategorized') as category_name,
                COALESCE(ct.total, 0) as total_amount,
                COUNT(t.id) as transaction_count
            FROM categories c
            LEFT JOIN transactions t ON c.id = t.category_id 
                AND t.date BETWEEN $1 AND $2
            LEFT JOIN category_totals ct ON c.id = ct.cat_id
            GROUP BY c.id, c.name, ct.total
            HAVING COUNT(t.id) > 0
            ORDER BY category_name
            "#,
            sql_start_date,
            sql_end_date
        )
        .fetch_all(pool)
        .await
    }
}

