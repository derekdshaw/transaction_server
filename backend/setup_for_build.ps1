# This script should be run before trying to build. It will start a PostgreSQL container, apply migrations, 
# and prepare offline metadata for SQLx. Docker is required to be installed to make this happen. Otherwise you can
# set the DATABASE_URL environment variable to point to your own database and run cargo sqlx prepare -- --all-targets --all-features 
# to prepare offline metadata for SQLx.

# Set environment variables
$env:DATABASE_URL = "postgres://postgres:postgres@localhost:5432/dev_db"
$containerName = "sqlx-dev-postgres"
$migrationDir = "migrations"

# Start PostgreSQL container
docker run --rm -d `
  --name $containerName `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=dev_db `
  -p 5432:5432 `
  postgres:15

Write-Host "PostgreSQL container started as '$containerName'"

# Wait for DB to be ready
Start-Sleep -Seconds 5

# Apply migrations using sqlx-cli
if (-not (Get-Command sqlx -ErrorAction SilentlyContinue)) {
    Write-Host "Installing sqlx-cli..."
    cargo install sqlx-cli
}

Write-Host "Running migrations..."
sqlx database create
sqlx migrate run --source $migrationDir

# Prepare offline metadata
Write-Host "Preparing SQLx offline metadata..."
cargo sqlx prepare -- --all-targets --all-features

Write-Host "Setup complete. You can now compile with SQLX_OFFLINE=true"

# Optional: Stop container after setup
docker stop $containerName
