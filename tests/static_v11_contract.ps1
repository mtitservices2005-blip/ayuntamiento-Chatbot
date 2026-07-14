$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$required = @(
  'supabase/migrations/202607140001_v11_tenancy_auth_audit.sql',
  'supabase/migrations/202607140002_v11_ticket_rpc.sql',
  'supabase/migrations/202607140003_v11_storage_policies.sql',
  'supabase/migrations/202607140004_v11_public_config_rpc.sql',
  'v1.1/index.html', 'v1.1/admin.html', 'v1.1/brigade.html', 'v1.1/master.html'
)
foreach ($relative in $required) { if (-not (Test-Path (Join-Path $root $relative))) { throw "Falta $relative" } }
$migration = Get-Content (Join-Path $root 'supabase/migrations/202607140001_v11_tenancy_auth_audit.sql') -Raw
foreach ($token in @('enable row level security', 'v11_audit_events', 'v11_memberships', 'v11_tickets')) { if ($migration -notmatch [regex]::Escape($token)) { throw "Contrato de seguridad ausente: $token" } }
$legacy = @('index.html', 'admin.html', 'brigada.html') | ForEach-Object { git -C $root diff --name-only HEAD -- $_ }
if ($legacy) { throw 'La V1 existente no debe cambiar durante la construcción de esta superficie.' }
Write-Output 'Static V1.1 contract: PASS'
