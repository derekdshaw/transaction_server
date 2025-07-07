# Category Importer

A command-line tool for importing categorized transactions from CSV files into the transaction server database.

## Features

- Imports transactions from CSV files with categorized data
- Maps predicted categories to database category IDs
- Handles monetary amounts with proper decimal precision
- Preserves transaction dates from the CSV
- Provides error handling and logging for failed imports

## Required Environment Variables

The tool requires the following environment variables to be set:

- `DB_HOST`: Database host address
- `DB_PORT`: Database port number
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name

These can be set either directly in the environment or through a `.env` or `.env.local` file.

## CSV Input Format

The tool expects a CSV file with the following columns:

- `Transaction ID`: Unique identifier for the transaction
- `Posting Date`: Date the transaction was posted
- `Effective Date`: Date the transaction was effective
- `Amount`: Transaction amount (negative for debits, positive for credits)
- `Description`: Transaction description
- `Predicted_Category`: The predicted category for this transaction
- `Confidence_Score`: Confidence score for the predicted category

## Usage

```bash
# Basic usage
category_importer --input <path-to-csv-file>

# Example
category_importer --input /path/to/transactions.csv
```

## Error Handling

The tool will:
- Skip transactions with unknown categories
- Log warnings for skipped transactions
- Provide detailed error messages for failed imports
- Exit with a non-zero status code on critical errors

## Requirements

- Rust 1.65 or later
- PostgreSQL database
- Properly configured environment variables

## Building

You will need to set the environment variable `DATABASE_URL` locally to satisfy sqlx during the build. This is in the format:
`postgresql://<user>:<password>@<host>:<port>/<database>`

```bash
cargo build
```

## Running Tests

```bash
cargo test
```

## License

MIT License