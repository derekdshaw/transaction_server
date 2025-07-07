# Transaction Server - Backend

This is the backend for the transaction server. It provides a GraphQL API for managing transactions. It will query the database for transactions and return them from the graphql endpoint.

## Database Migrations

Once you have created the database. The migrations will create the necessary tables and indexes for the application to function.

To apply migrations to the database, run the script below. This will execute the SQL files in the `migrations` directory in order. 

```bash
./migrations/apply-migrations.ps1
```

## Tools

The tools directory contains a category_importer tool that can be used to import categorized transactions from a CSV file into the database.

## API Endpoints

### GraphQL

The server provides a single GraphQL endpoint:

- `/graphql` - Main GraphQL endpoint
- `/graphiql` - GraphiQL interface for testing

#### Available Queries

- `transactions`: Get all transactions
- `transactionsByCategory`: Get transactions filtered by category
- `transactionsByDateRange`: Get transactions within a date range
- `transactionsSummaryByCategory`: Get transactions summary by category
- `categories`: Get all categories
- `categoryById`: Get a category by id

#### Available Mutations

- `createTransaction`: Create a new transaction
- `updateTransaction`: Update an existing transaction

### Example Queries

Get all transactions:
```graphql
query {
  transactions {
    id
    amount
    description
    date
    category
    createdAt
    updatedAt
  }
}
```

Get transactions by category:
```graphql
query {
  transactionsByCategory(category: "Food") {
    id
    amount
    description
    date
  }
}
```

Create a new transaction:
```graphql
mutation {
  createTransaction(
    amount: 100.50
    description: "Groceries"
    date: "2025-06-28T00:00:00+00:00"
    category: "Food"
  ) {
    id
    amount
    description
  }
}
```


