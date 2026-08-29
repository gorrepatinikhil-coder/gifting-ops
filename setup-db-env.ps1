# GiftingOps -- one-time database environment setup
# Run from the project root: .\setup-db-env.ps1
# The password is never echoed to the terminal or stored in shell history.

$envFile = Join-Path $PSScriptRoot ".env.local"

if (-not (Test-Path $envFile)) {
    Write-Host "ERROR: .env.local not found at $envFile" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "GiftingOps -- Database Connection Setup" -ForegroundColor Cyan
Write-Host "---------------------------------------" -ForegroundColor Cyan
Write-Host ""
Write-Host "Supabase project : hqallisaypffdinrnwho"
Write-Host "Region           : ap-northeast-1 (Tokyo)"
Write-Host ""
Write-Host "Where to find your password:" -ForegroundColor Yellow
Write-Host "  Supabase Dashboard -> Settings -> Database -> Connection string" -ForegroundColor Yellow
Write-Host "  Or reset it under: Settings -> Database -> Reset database password" -ForegroundColor Yellow
Write-Host ""

$securePass = Read-Host -Prompt "Enter your Supabase database password" -AsSecureString

$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)
$pass = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

if ([string]::IsNullOrWhiteSpace($pass)) {
    Write-Host "No password entered. Aborting." -ForegroundColor Red
    exit 1
}

# URL-encode the password so special characters (@, #, ?, & etc.) don't break the connection string
$encodedPass = [Uri]::EscapeDataString($pass)
$pass = $null

# Transaction pooler (port 6543) -- used by Prisma at runtime (IPv4-accessible via Supavisor)
$pooler = "postgresql://postgres.hqallisaypffdinrnwho:" + $encodedPass + "@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Session pooler (port 5432) -- used by Prisma Migrate / introspection
$direct = "postgresql://postgres.hqallisaypffdinrnwho:" + $encodedPass + "@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"

$encodedPass = $null

$content = Get-Content $envFile -Raw

# Replace DATABASE_URL and DIRECT_URL lines (handles any previously set value)
$content = $content -replace '(?m)^DATABASE_URL=.*$', ('DATABASE_URL="' + $pooler + '"')
$content = $content -replace '(?m)^DIRECT_URL=.*$',   ('DIRECT_URL="'   + $direct  + '"')

# Write WITHOUT BOM -- PowerShell 5.1's Set-Content -Encoding utf8 adds a BOM.
# [System.IO.File]::WriteAllText with UTF8Encoding($false) writes clean UTF-8.
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText($envFile, $content, $utf8NoBom)

Write-Host ""
Write-Host "Done! DATABASE_URL and DIRECT_URL written to .env.local (no BOM)" -ForegroundColor Green
Write-Host ""
Write-Host "Next: restart the dev server with:  npm run dev" -ForegroundColor Cyan
Write-Host ""
