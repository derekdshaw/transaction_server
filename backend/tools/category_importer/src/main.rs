use clap::Parser;
use csv::Reader;
use serde::{Deserialize};
use sqlx::postgres::PgPoolOptions;
use sqlx::types::time::Date;
use sqlx::types::BigDecimal;
use std::str::FromStr;
use std::collections::HashMap;
use std::error::Error;
use std::env;
use std::path::Path;
use dotenv::dotenv;
use time::Month;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Path to the input CSV file
    #[arg(short, long)]
    input: String,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct TransactionRow {
    #[serde(rename = "Transaction ID")]
    transaction_id: String,
    #[serde(rename = "Posting Date")]
    posting_date: String,
    #[serde(rename = "Effective Date")]
    effective_date: String,
    #[serde(rename = "Transaction Type")]
    transaction_type: String,
    #[serde(rename = "Amount")]
    amount: f64,
    #[serde(rename = "Check Number")]
    check_number: String,
    #[serde(rename = "Reference Number")]
    reference_number: String,
    #[serde(rename = "Description")]
    description: String,
    #[serde(rename = "Transaction Category")]
    transaction_category: String,
    #[serde(rename = "Type")]
    type_field: String,
    #[serde(rename = "Balance")]
    balance: f64,
    #[serde(rename = "Memo")]
    memo: String,
    #[serde(rename = "Extended Description")]
    extended_description: String,
    #[serde(rename = "clean_text")]
    clean_text: String,
    #[serde(rename = "Category")]
    category_name: String,
    #[serde(rename = "Predicted_Category")]
    predicted_category: String,
    #[serde(rename = "Confidence_Score")]
    confidence_score: f64,
}

#[derive(Debug)]
struct Transaction {
    amount: BigDecimal,
    description: String,
    date: Date,
    category_id: i32,
}

#[derive(Debug, sqlx::FromRow)]
struct Category {
    id: i32,
    name: String
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {

    let args = Args::parse();

    // Load environment variables
    // Try to load .env.local first
    if dotenv::from_path(".env.local").is_err() {
        // If .env.local doesn't exist, try .env
        dotenv().ok();
    }

    // Get database connection parameters
    let host = env::var("DB_HOST")?;
    let port = env::var("DB_PORT")?;
    let user = env::var("DB_USER")?;
    let password = env::var("DB_PASSWORD")?;
    let dbname = env::var("DB_NAME")?;

    // Construct database URL
    let database_url = format!(
        "postgresql://{}:{}@{}:{}/{}",
        user,
        password,
        host,
        port,
        dbname
    );
    
    // Connect to database
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    // Fetch all categories from database
    let categories: Vec<Category> = sqlx::query_as!(
        Category,
        r#"
        SELECT id, name FROM categories
        "#
    )
    .fetch_all(&pool)
    .await?;

    // Create a map of category name to id
    let category_map: HashMap<String, i32> = categories
        .into_iter()
        .map(|c| (c.name.to_lowercase(), c.id))
        .collect();

    // Open input CSV file
    let input_path = Path::new(&args.input);
    let file = std::fs::File::open(input_path)?;
    let mut rdr = Reader::from_reader(file);

    // Process each row and insert into database
    for result in rdr.deserialize() {
        let row: TransactionRow = result?;
        let category_name = row.predicted_category.to_lowercase();

        if let Some(&category_id) = category_map.get(&category_name) {
            let parts: Vec<&str> = row.effective_date.split('/').collect();
            let month = parts[0].parse::<u8>()?;
            let day = parts[1].parse::<u8>()?;
            let year = parts[2].parse::<i32>()?;
            let transaction = Transaction {
                amount: BigDecimal::from_str(&row.amount.to_string())?,
                description: row.description,
                date: Date::from_calendar_date(year, Month::try_from(month)?, day)?,
                category_id,
            };

            // Insert into transactions table
            sqlx::query!(
                r#"
                INSERT INTO transactions (amount, description, date, category_id)
                VALUES ($1, $2, $3, $4)
                "#,
                transaction.amount,
                transaction.description,
                transaction.date,
                transaction.category_id
            )
            .execute(&pool)
            .await?;
        } else {
            eprintln!("Warning: Category '{}' not found in database", row.predicted_category);
        }
    }

    println!("All transactions imported successfully");
    Ok(())
}