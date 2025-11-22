# Script para arrancar solo los servicios ESENCIALES (sin monitoring)
# Usa esto si tienes recursos limitados

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TechNovaStore - Modo MINIMAL" -ForegroundColor Cyan
Write-Host "Solo servicios esenciales" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Docker
Write-Host "[0/3] Verificando Docker..." -ForegroundColor Yellow
$dockerRunning = docker info 2>$null
if (-not $dockerRunning) {
    Write-Host "ERROR: Docker no está corriendo. Inicia Docker Desktop primero." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker OK" -ForegroundColor Green
Write-Host ""

# Limpiar estado previo si hay errores
Write-Host "Limpiando estado previo..." -ForegroundColor Gray
docker-compose -f docker-compose.optimized.yml down --remove-orphans 2>$null
Write-Host ""

# FASE 1: Bases de datos
Write-Host "[1/3] Arrancando bases de datos..." -ForegroundColor Yellow
docker-compose -f docker-compose.optimized.yml up -d mongodb postgresql redis
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Fallo al arrancar bases de datos. Ejecuta .\fix-docker-network.ps1" -ForegroundColor Red
    exit 1
}
Start-Sleep -Seconds 30
Write-Host "✓ Bases de datos OK" -ForegroundColor Green

# FASE 2: Servicios core
Write-Host "[2/3] Arrancando servicios principales..." -ForegroundColor Yellow
docker-compose -f docker-compose.optimized.yml up -d api-gateway product-service order-service user-service payment-service notification-service ticket-service
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Fallo al arrancar servicios. Ejecuta .\fix-docker-network.ps1" -ForegroundColor Red
    exit 1
}
Start-Sleep -Seconds 20
Write-Host "✓ Servicios principales OK" -ForegroundColor Green

# FASE 3: Frontend y servicios de negocio
Write-Host "[3/3] Arrancando frontend y servicios de negocio..." -ForegroundColor Yellow
docker-compose -f docker-compose.optimized.yml up -d frontend sync-engine auto-purchase shipment-tracker chatbot recommender
Start-Sleep -Seconds 15
Write-Host "✓ Frontend y servicios de negocio OK" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ SERVICIOS ESENCIALES ARRANCADOS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Total de contenedores: 15 (en lugar de 27)" -ForegroundColor Cyan
Write-Host ""
Write-Host "URLs:" -ForegroundColor Cyan
Write-Host "  Frontend:    http://localhost:3011" -ForegroundColor White
Write-Host "  API Gateway: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "NO ARRANCADOS (para ahorrar recursos):" -ForegroundColor Yellow
Write-Host "  - ELK Stack (Elasticsearch, Logstash, Kibana)" -ForegroundColor Gray
Write-Host "  - Prometheus, Grafana" -ForegroundColor Gray
Write-Host "  - Exporters (mongodb, postgres, redis, node)" -ForegroundColor Gray
Write-Host "  - Alertmanager" -ForegroundColor Gray
Write-Host ""
