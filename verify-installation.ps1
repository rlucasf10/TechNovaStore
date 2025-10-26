# Script de Verificación y Construcción de TechNovaStore
# Construye todos los microservicios en el orden correcto

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TechNovaStore - Verificación Final" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Función para construir un servicio
function Build-Service {
    param(
        [int]$Step,
        [int]$Total,
        [string]$Name,
        [string]$Path
    )
    
    Write-Host "[$Step/$Total] Construyendo $Name..." -ForegroundColor Yellow
    
    if (-not (Test-Path $Path)) {
        Write-Host "ERROR: No se encontró el directorio $Path" -ForegroundColor Red
        return $false
    }
    
    if (-not (Test-Path "$Path/package.json")) {
        Write-Host "ERROR: No se encontró package.json en $Path" -ForegroundColor Red
        return $false
    }
    
    Push-Location $Path
    
    # Verificar si existe el script de build
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    if (-not $packageJson.scripts.build) {
        Write-Host "  ⚠ No hay script de build, saltando..." -ForegroundColor Yellow
        Pop-Location
        return $true
    }
    
    # Ejecutar build
    $buildOutput = npm run build 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Fallo en la construcción de $Name" -ForegroundColor Red
        Write-Host ""
        Write-Host "Detalles del error:" -ForegroundColor Yellow
        Write-Host $buildOutput -ForegroundColor Gray
        Write-Host ""
        Pop-Location
        return $false
    }
    
    Pop-Location
    Write-Host "  ✓ $Name construido correctamente" -ForegroundColor Green
    Write-Host ""
    return $true
}

# Verificar que Node.js está instalado
Write-Host "Verificando Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "ERROR: Node.js no está instalado" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Node.js $nodeVersion" -ForegroundColor Green
Write-Host ""

# Verificar que npm está instalado
Write-Host "Verificando npm..." -ForegroundColor Yellow
$npmVersion = npm --version 2>$null
if (-not $npmVersion) {
    Write-Host "ERROR: npm no está instalado" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ npm $npmVersion" -ForegroundColor Green
Write-Host ""

Write-Host "Construyendo servicios..." -ForegroundColor Cyan
Write-Host ""

# Construir servicios en orden
$services = @(
    @{Step=1; Total=12; Name="Shared Config"; Path="shared/config"},
    @{Step=2; Total=12; Name="API Gateway"; Path="api-gateway"},
    @{Step=3; Total=12; Name="Product Service"; Path="services/product"},
    @{Step=4; Total=12; Name="User Service"; Path="services/user"},
    @{Step=5; Total=12; Name="Order Service"; Path="services/order"},
    @{Step=6; Total=12; Name="Payment Service"; Path="services/payment"},
    @{Step=7; Total=12; Name="Notification Service"; Path="services/notification"},
    @{Step=8; Total=12; Name="Ticket Service"; Path="services/ticket"},
    @{Step=9; Total=12; Name="Sync Engine"; Path="automation/sync-engine"},
    @{Step=10; Total=12; Name="Auto Purchase"; Path="automation/auto-purchase"},
    @{Step=11; Total=12; Name="Shipment Tracker"; Path="automation/shipment-tracker"},
    @{Step=12; Total=12; Name="Frontend"; Path="frontend"}
)

$allSuccess = $true

foreach ($service in $services) {
    $result = Build-Service -Step $service.Step -Total $service.Total -Name $service.Name -Path $service.Path
    if (-not $result) {
        $allSuccess = $false
        break
    }
}

Write-Host ""

if ($allSuccess) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ CONSTRUCCIÓN COMPLETADA EXITOSAMENTE" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Todos los servicios se han construido correctamente." -ForegroundColor White
    Write-Host ""
    Write-Host "Para iniciar los servicios con Docker:" -ForegroundColor Cyan
    Write-Host "  Todos los servicios:  .\start-all-services.ps1" -ForegroundColor White
    Write-Host "  Solo esenciales:      .\start-minimal.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Para reiniciar después de reiniciar el PC:" -ForegroundColor Cyan
    Write-Host "  Todos los servicios:  .\restart-services.ps1" -ForegroundColor White
    Write-Host "  Solo esenciales:      .\restart-minimal.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "URLs principales:" -ForegroundColor Cyan
    Write-Host "  Frontend:    http://localhost:3011" -ForegroundColor White
    Write-Host "  API Gateway: http://localhost:3000" -ForegroundColor White
    Write-Host "  Grafana:     http://localhost:3013" -ForegroundColor White
    Write-Host ""
    exit 0
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "✗ ERROR EN LA CONSTRUCCIÓN" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Revisa los errores anteriores y corrige los problemas." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
