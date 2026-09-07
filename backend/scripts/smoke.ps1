# FARAZZ FLOW - Full smoke test (all mounted routers + RBAC + workflow)
$ErrorActionPreference = "Stop"
$base = "http://localhost:4100/api/v1"

function Make-Session {
  $s = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  return $s
}

function Login($email, $password, $session) {
  $body = @{ email = $email; password = $password } | ConvertTo-Json
  $resp = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -Body $body -ContentType "application/json" -WebSession $session
  if (-not $resp.success) { throw "Login failed for $email" }
  return $resp
}

function GetHdrs($csrf) {
  return @{ "x-csrf-token" = $csrf }
}

# ── 1. Login as Faraz (super admin) ─────────────────────────────
$faraz = Make-Session
$l = Login "faraz@farazzflow.example.com" "Admin123!" $faraz
$csrf = $l.data.csrfToken
$h = GetHdrs $csrf
Write-Host "[OK] Login Faraz -> tokens ok (session=$($l.data.user.name), role=$($l.data.user.role_code))"

$results = @()
function Check($name, $ok, $detail = "") {
  $script:results += [pscustomobject]@{ name = $name; ok = $ok; detail = $detail }
  $mark = if ($ok) { "PASS" } else { "FAIL" }
  Write-Host ("[{0}] {1} {2}" -f $mark, $name, $detail)
}

# ── 2. Health ───────────────────────────────────────────────────
$r = Invoke-RestMethod -Uri "$base/health" -Method Get
Check "GET /health" ($r.success -eq $true)
$r = Invoke-RestMethod -Uri "$base/health/db" -Method Get
Check "GET /health/db" ($r.success -eq $true)

# ── 3. Core CRUD lists (view permission) ────────────────────────
$lists = @(
  "customers", "suppliers", "shipments", "orders", "deliveries", "exceptions",
  "returns", "warehouses", "inventory", "inbound", "outbound", "sorting",
  "vehicles", "drivers", "routes", "dispatches", "maintenance",
  "billing", "payments", "cod",
  "service-types", "pricing", "contracts",
  "approvals", "tasks", "documents",
  "notifications", "reports/shipments-by-status", "reports/revenue",
  "reports/top-routes", "reports/inventory-summary", "reports/usage-overview",
  "reports/transport-efficiency", "monitoring/overview", "monitoring/database",
  "monitoring/activity", "monitoring/security-events", "monitoring/health/live"
)
foreach ($ep in $lists) {
  try {
    $r = Invoke-RestMethod -Uri "$base/${ep}?limit=3" -Method Get -WebSession $faraz -Headers $h
    Check "GET /$ep" ($r.success -eq $true)
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    $msg = $_.ErrorDetails.Message
    Check "GET /$ep" $false "HTTP $code $msg"
  }
}

# ── 4. Create + detail + patch + delete round-trips ─────────────
try {
  $body = @{ name = "Smoke Cust A"; type = "shipper"; city = "Jakarta"; status = "active" } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/customers" -Method Post -Body $body -ContentType "application/json" -WebSession $faraz -Headers $h
  $cid = $r.data.id
  Check "POST /customers" ($r.success -and $cid -gt 0)
  $r = Invoke-RestMethod -Uri "$base/customers/$cid" -Method Get -WebSession $faraz -Headers $h
  Check "GET /customers/{id}" ($r.data.row.id -eq $cid)
  $body = @{ status = "inactive"; phone = "0811-test" } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/customers/$cid" -Method Put -Body $body -ContentType "application/json" -WebSession $faraz -Headers $h
  Check "PUT /customers/{id}" ($r.success -eq $true)
  $r = Invoke-RestMethod -Uri "$base/customers/$cid" -Method Delete -WebSession $faraz -Headers $h
  Check "DELETE /customers/{id}" ($r.success -eq $true)
} catch {
  Check "customer CRUD round-trip" $false $_.Exception.Message
}

try {
  $body = @{ wh_code = "SMK"; name = "Smoke Warehouse" } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/warehouses" -Method Post -Body (ConvertTo-Json @{ name = "Smoke WH"; city = "Jakarta" }) -ContentType "application/json" -WebSession $faraz -Headers $h
  $wid = $r.data.id
  Check "POST /warehouses (auto WH-code)" ($r.success -and $wid -gt 0)
  $r = Invoke-RestMethod -Uri "$base/warehouse-zones/$wid" -Method Post -Body (ConvertTo-Json @{ code = "A1"; name = "Zone A1" }) -ContentType "application/json" -WebSession $faraz -Headers $h
  Check "POST /warehouse-zones/{wid}" ($r.success -eq $true)
  $r = Invoke-RestMethod -Uri "$base/inventory" -Method Post -Body (ConvertTo-Json @{ warehouse_id = $wid; sku = "SMK-SKU-1"; name = "Smoke Item"; quantity = 10 }) -ContentType "application/json" -WebSession $faraz -Headers $h
  $iid = $r.data.id
  Check "POST /inventory" ($r.success -and $iid -gt 0)
} catch {
  Check "warehouse/inventory create" $false $_.Exception.Message
}

try {
  # Full shipment lifecycle: booked -> picked_up -> in_transit -> out_for_delivery -> delivered
  $r = Invoke-RestMethod -Uri "$base/shipments" -Method Post -Body (ConvertTo-Json @{
    customer_id = 1; origin = "Jakarta"; destination = "Bandung"; service_type = "standard";
    weight_kg = 12.5; status = "booked"; planned_date = "2026-09-20"
  }) -ContentType "application/json" -WebSession $faraz -Headers $h
  $shid = $r.data.id
  Check "POST /shipments (auto code)" ($r.success -and $shid -gt 0)

  foreach ($st in @("booked", "picked_up", "in_transit", "out_for_delivery", "delivered")) {
    $r = Invoke-RestMethod -Uri "$base/shipments/$shid/status" -Method Patch -Body (ConvertTo-Json @{ status = $st }) -ContentType "application/json" -WebSession $faraz -Headers $h
    Check "PATCH /shipments/{id}/status -> $st" ($r.success -eq $true) "transition=$($r.data.to)"
  }
  $r = Invoke-RestMethod -Uri "$base/shipments/$shid/status-history" -Method Get -WebSession $faraz -Headers $h
  Check "GET /shipments/{id}/status-history" ($r.success -eq $true) "count=$($r.data.history.Count)"

  # deliveries lifecycle mirror
  $r = Invoke-RestMethod -Uri "$base/deliveries" -Method Post -Body (ConvertTo-Json @{
    shipment_id = $shid; status = "scheduled"
  }) -ContentType "application/json" -WebSession $faraz -Headers $h
  $did = $r.data.id
  Check "POST /deliveries" ($r.success -and $did -gt 0)
  foreach ($st in @("out_for_delivery", "delivered")) {
    $r = Invoke-RestMethod -Uri "$base/deliveries/$did/status" -Method Patch -Body (ConvertTo-Json @{ status = $st }) -ContentType "application/json" -WebSession $faraz -Headers $h
    Check "PATCH /deliveries/{id}/status -> $st" ($r.success -eq $true)
  }

  # exception flow
  $r = Invoke-RestMethod -Uri "$base/exceptions" -Method Post -Body (ConvertTo-Json @{
    shipment_id = $shid; exception_type = "address_mismatch"; severity = "high"
  }) -ContentType "application/json" -WebSession $faraz -Headers $h
  $exid = $r.data.id
  Check "POST /exceptions (shipment flags exception)" ($r.success -and $exid -gt 0)
  $r = Invoke-RestMethod -Uri "$base/exceptions/$exid/resolve" -Method Patch -Body (ConvertTo-Json @{ status = "resolved"; note = "fixed address" }) -ContentType "application/json" -WebSession $faraz -Headers $h
  Check "PATCH /exceptions/{id}/resolve" ($r.success -eq $true)

  # order lifecycle
  $r = Invoke-RestMethod -Uri "$base/orders" -Method Post -Body (ConvertTo-Json @{
    customer_id = 1; order_date = "2026-09-22"
  }) -ContentType "application/json" -WebSession $faraz -Headers $h
  $oid = $r.data.id
  Check "POST /orders" ($r.success -and $oid -gt 0)
  foreach ($st in @("confirmed", "processing", "completed")) {
    $r = Invoke-RestMethod -Uri "$base/orders/$oid/status" -Method Patch -Body (ConvertTo-Json @{ status = $st }) -ContentType "application/json" -WebSession $faraz -Headers $h
    Check "PATCH /orders/{id}/status -> $st" ($r.success -eq $true)
  }
} catch {
  Check "shipment lifecycle workflow" $false $_.Exception.Message
}

# ── 5. Fleet dispatch lifecycle ─────────────────────────────────
try {
  $r = Invoke-RestMethod -Uri "$base/routes" -Method Post -Body (ConvertTo-Json @{
    origin = "Jakarta"; destination = "Cirebon"; status = "active"
  }) -ContentType "application/json" -WebSession $faraz -Headers $h
  $rid = $r.data.id
  $r = Invoke-RestMethod -Uri "$base/dispatches" -Method Post -Body (ConvertTo-Json @{
    route_id = $rid; scheduled_at = "2026-09-21 09:00"
  }) -ContentType "application/json" -WebSession $faraz -Headers $h
  $dp = $r.data.id
  Check "POST /dispatches" ($r.success -and $dp -gt 0)
  foreach ($st in @("dispatch", "on_route", "completed")) {
    $r = Invoke-RestMethod -Uri "$base/dispatches/$dp/status" -Method Patch -Body (ConvertTo-Json @{ status = $st }) -ContentType "application/json" -WebSession $faraz -Headers $h
    Check "PATCH /dispatches/{id}/status -> $st" ($r.success -eq $true)
  }
} catch {
  Check "dispatch lifecycle" $false $_.Exception.Message
}

# ── 6. Finance lifecycle ────────────────────────────────────────
try {
  $r = Invoke-RestMethod -Uri "$base/billing" -Method Post -Body (ConvertTo-Json @{
    doc_type = "invoice"; customer_id = 1; issue_date = "2026-09-21"; sub_total = 500; tax_rate = 11; total = 555; status = "sent"
  }) -ContentType "application/json" -WebSession $faraz -Headers $h
  $bid = $r.data.id
  Check "POST /billing (auto INV code)" ($r.success -and $bid -gt 0)
  $r = Invoke-RestMethod -Uri "$base/bill-items/$bid" -Method Post -Body (ConvertTo-Json @{ description = "Freight"; quantity = 1; unit_price = 500 }) -ContentType "application/json" -WebSession $faraz -Headers $h
  Check "POST /bill-items/{invoiceId}" ($r.success -eq $true)
  $r = Invoke-RestMethod -Uri "$base/billing/$bid/status" -Method Patch -Body (ConvertTo-Json @{ status = "settled" }) -ContentType "application/json" -WebSession $faraz -Headers $h
  Check "PATCH /billing/{id}/status -> settled" ($r.success -eq $true)
} catch {
  Check "finance lifecycle" $false $_.Exception.Message
}

# ── 7. Workspace + notifications ────────────────────────────────
try {
  $r = Invoke-RestMethod -Uri "$base/approvals" -Method Post -Body (ConvertTo-Json @{
    title = "Smoke approval"; category = "other"; priority = "medium"; description = "test"
  }) -ContentType "application/json" -WebSession $faraz -Headers $h
  $aid = $r.data.id
  Check "POST /approvals (auto APR code)" ($r.success -and $aid -gt 0)
  $r = Invoke-RestMethod -Uri "$base/approvals/$aid/decide" -Method Patch -Body (ConvertTo-Json @{ decision = "approved"; note = "ok" }) -ContentType "application/json" -WebSession $faraz -Headers $h
  Check "PATCH /approvals/{id}/decide" ($r.success -eq $true)

  $r = Invoke-RestMethod -Uri "$base/tasks" -Method Post -Body (ConvertTo-Json @{ title = "Smoke task"; priority = "high" }) -ContentType "application/json" -WebSession $faraz -Headers $h
  $tid = $r.data.id
  Check "POST /tasks (auto TSK code)" ($r.success -and $tid -gt 0)
  $r = Invoke-RestMethod -Uri "$base/tasks/$tid/status" -Method Patch -Body (ConvertTo-Json @{ status = "done" }) -ContentType "application/json" -WebSession $faraz -Headers $h
  Check "PATCH /tasks/{id}/status" ($r.success -eq $true)

  $r = Invoke-RestMethod -Uri "$base/notifications/unread-count" -Method Get -WebSession $faraz -Headers $h
  Check "GET /notifications/unread-count" ($r.success -eq $true) "count=$($r.data.count)"
  $list = Invoke-RestMethod -Uri "$base/notifications?limit=5" -Method Get -WebSession $faraz -Headers $h
  Check "GET /notifications" ($list.success -eq $true)
} catch {
  Check "workspace/notifications" $false $_.Exception.Message
}

# ── 8. Files + import/export ────────────────────────────────────
try {
  $payload = @{
    title = "Smoke Doc"; fileName = "test.txt"; mimeType = "text/plain";
    dataBase64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("hello farazz"))
  } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/files" -Method Post -Body $payload -ContentType "application/json" -WebSession $faraz -Headers $h
  $fid = $r.data.id
  Check "POST /files (base64 upload)" ($r.success -and $fid -gt 0)
  $v = Invoke-RestMethod -Uri "$base/files/$fid/versions" -Method Get -WebSession $faraz -Headers $h
  Check "GET /files/{id}/versions" ($v.success -eq $true) "v=$($v.data.rows.Count)"
  $res = Invoke-WebRequest -Uri "$base/files/$fid/download" -Method Get -WebSession $faraz -Headers $h -UseBasicParsing
  Check "GET /files/{id}/download" ($res.StatusCode -eq 200) "bytes=$($res.RawContentLength)"

  $csv = "name,type,phone`r`nImport Cust A,shipper,0811`r`nImport Cust B,consignee,0812"
  $r = Invoke-RestMethod -Uri "$base/import-export/import/customers/csv" -Method Post -Body (ConvertTo-Json @{ csv = $csv }) -ContentType "application/json" -WebSession $faraz -Headers $h
  Check "POST /import-export/import/customers/csv" ($r.success -and $r.data.imported -ge 1) "imported=$($r.data.imported)"
} catch {
  Check "files/import-export" $false $_.Exception.Message
}

# ── 9. RBAC denial checks ───────────────────────────────────────
$fin = Make-Session
$lf = Login "test.finance@farazzflow.example.com" "Admin123!" $fin
$fh = GetHdrs $lf.data.csrfToken
try {
  Invoke-RestMethod -Uri "$base/admin/users" -Method Get -WebSession $fin -Headers $fh
  Check "RBAC: finance CANNOT GET /admin/users" $false "expected 403"
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Check "RBAC: finance CANNOT GET /admin/users" ($code -eq 403) "HTTP $code"
}
try {
  Invoke-RestMethod -Uri "$base/vehicles" -Method Post -Body (ConvertTo-Json @{ plate_no = "B 1 RBAC" }) -ContentType "application/json" -WebSession $fin -Headers $fh
  Check "RBAC: finance CANNOT create vehicle" $false "expected 403"
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Check "RBAC: finance CANNOT create vehicle" ($code -eq 403) "HTTP $code"
}
# finance CAN list invoice data (finance.view) but NOT admin
try {
  $r = Invoke-RestMethod -Uri "$base/billing?limit=1" -Method Get -WebSession $fin -Headers $fh
  Check "RBAC: finance CAN GET /billing" ($r.success -eq $true)
} catch {
  Check "RBAC: finance CAN GET /billing" $false $_.Exception.Message
}
# exceptions list (must succeed now that deleted_at exists)
try {
  $r = Invoke-RestMethod -Uri "$base/exceptions?limit=1" -Method Get -WebSession $faraz -Headers $h
  Check "GET /exceptions after soft-delete migration" ($r.success -eq $true)
} catch {
  Check "GET /exceptions after soft-delete migration" $false $_.Exception.Message
}

# ── Summary ─────────────────────────────────────────────────────
$pass = ($results | Where-Object { $_.ok }).Count
$fail = ($results | Where-Object { -not $_.ok }).Count
Write-Host ""
Write-Host ("==== SMOKE SUMMARY: {0} passed, {1} failed (total {2}) ====" -f $pass, $fail, $results.Count)
if ($fail -gt 0) {
  Write-Host "---- FAILED ----"
  $results | Where-Object { -not $_.ok } | ForEach-Object { Write-Host ("  {0}: {1}" -f $_.name, $_.detail) }
  exit 1
}
exit 0