#!/usr/bin/env pwsh

param(
    [string]$DbHost,
    [string]$DbPort,
    [string]$DbUser,
    [string]$DbPassword,
    [string]$DbName
)

# Load environment variables from .env
$envFile = Join-Path $PSScriptRoot "..\.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if (-not [string]::IsNullOrWhiteSpace($_) -and $_ -notlike '#*') {
            $pair = $_ -split '=', 2
            if ($pair.Count -eq 2) {
                $k = $pair[0].Trim()
                $v = $pair[1].Trim().Trim("'").Trim('"')
                Set-Item -Path "env:$k" -Value $v
            }
        }
    }
}

# Fill in any missing params from env vars
if (-not $DbHost)     { $DbHost     = $env:DB_HOST }
if (-not $DbPort)     { $DbPort     = $env:DB_PORT }
if (-not $DbUser)     { $DbUser     = $env:ADMIN_USER }
if (-not $DbPassword) { $DbPassword = $env:ADMIN_PASSWORD }
if (-not $DbName)     { $DbName     = $env:DB_NAME }

# Debug output of connection parameters
Write-Host "Database connection parameters:"
Write-Host "Host: $DbHost"
Write-Host "Port: $DbPort"
Write-Host "User: $DbUser"
Write-Host "Database: $DbName"
Write-Host "Temporary file: $tempFile"

# Get PostgreSQL path
$pgPath = Join-Path "${env:ProgramFiles}" "PostgreSQL\17\bin\psql.exe"
if (-not (Test-Path $pgPath)) {
    Write-Error "PostgreSQL not found at $pgPath"
    exit 1
}

# Collect and combine SQL files
$files = Get-ChildItem -Path $PSScriptRoot -Filter '*.sql' | Sort-Object Name
$tempFile = [IO.Path]::GetTempFileName()

foreach ($f in $files) {
    Add-Content -Path $tempFile -Value (Get-Content $f.FullName -Raw)
    Add-Content -Path $tempFile -Value ''  # blank line between scripts
}

try {
    # Execute the command
    $result = Start-Process `
        -FilePath $pgPath `
        -ArgumentList @(
            "-h", $DbHost,
            "-p", $DbPort,
            "-U", $DbUser,
            "-d", $DbName,
            "-f", $tempFile
        ) `
        -Wait `
        -NoNewWindow `
        -PassThru

    if ($result.ExitCode -ne 0) {
        Write-Error "Failed to execute migrations. Exit code: $($result.ExitCode)"
        exit 1
    }
}
finally {
    # Clean up temporary file
    Remove-Item $tempFile -Force
}

Write-Host "All migrations applied successfully"