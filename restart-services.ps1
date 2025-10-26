# Script PowerShell para reiniciar servicios de forma escalonada después de reiniciar el PC
# Evita sobrecargar Docker arrancando todo de golpe

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TechnovaStore - Reinicio Escalonado" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que Docker está corriendo
Write-Host "[1/7] Verificando Docker..." -ForegroundColor Yellow
$dockerRunning = docker info 2>$null
if (-not $dockerRunning) {
    Write-Host "ERROR: Docker no está corriendo. Inicia Docker Desktop primero." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker está corriendo" -ForegroundColor Green
Write-Host ""

# FASE 1: Bases de datos (crítico)
Write-Host "[2/7] FASE 1: Reiniciando bases de datos..." -ForegroundColor Yellow
docker-compose -f docker-compose.optimized.yml restart mongodb postgresql redis
Write-Host "  Esperando 30 segundos..." -ForegroundColor Gray
Start-Sleep -Seconds 30
Write-Host "✓ Bases de datos reiniciadas" -ForegroundColor Green
Write-Host ""

# FASE 2: Servicios de infraestructura
Write-Host "[3/7] FASE 2: Reiniciando infraestructura..." -ForegroundColor Yellow
docker-compose -f docker-compose.optimized.yml restart prometheus
Write-Host "  Esperando 30 segundos..." -ForegroundColor Gray
Start-Sleep -Seconds 30
Write-Host "✓ Infraestructura reiniciada" -ForegroundColor Green
Write-Host ""

# FASE 3: Servicios core
Write-Host "[4/7] FASE 3: Reiniciando servicios principales..." -ForegroundColor Yellow
docker-compose -f docker-compose.optimized.yml restart api-gateway product-service order-service user-service payment-service notification-service ticket-service
Write-Host "  Esperando 30 segundos..." -ForegroundColor Gray
Start-Sleep -Seconds 30
Write-Host "✓ Servicios principales reiniciados" -ForegroundColor Green
Write-Host ""

# FASE 4: Servicios de automatización
Write-Host "[5/7] FASE 4: Reiniciando servicios de automatización..." -ForegroundColor Yellow
docker-compose -f docker-compose.optimized.yml restart sync-engine auto-purchase shipment-tracker
Write-Host "  Esperando 60 segundos..." -ForegroundColor Gray
Start-Sleep -Seconds 60
Write-Host "✓ Servicios de automatización reiniciados" -ForegroundColor Green
Write-Host ""

# FASE 5: AI, Frontend y Monitoring
Write-Host "[6/7] FASE 5: Reiniciando AI, Frontend y Monitoring..." -ForegroundColor Yellow
docker-compose -f docker-compose.optimized.yml restart chatbot recommender frontend grafana alertmanager
Write-Host "  Esperando 40 segundos..." -ForegroundColor Gray
Start-Sleep -Seconds 40
Write-Host "✓ AI y Frontend reiniciados" -ForegroundColor Green
Write-Host ""

# FASE 6: Exporters y ELK (opcional, pueden fallar si no están configurados)
Write-Host "[7/7] FASE 6: Reiniciando exporters y ELK..." -ForegroundColor Yellow
docker-compose -f docker-compose.optimized.yml restart mongodb-exporter postgres-exporter redis-exporter node-exporter elasticsearch logstash kibana 2>$null
Write-Host "✓ Exporters y ELK reiniciados (si están disponibles)" -ForegroundColor Green
Write-Host ""

# Verificar estado
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Estado de los contenedores:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
docker-compose -f docker-compose.optimized.yml ps

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ TODOS LOS SERVICIOS REINICIADOS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "URLs de acceso:" -ForegroundColor Cyan
Write-Host "  Frontend:    http://localhost:3011" -ForegroundColor White
Write-Host "  API Gateway: http://localhost:3000" -ForegroundColor White
Write-Host "  Grafana:     http://localhost:3013 (admin/REDACTED_GRAFANA_PASSWORD)" -ForegroundColor White
Write-Host "  Prometheus:  http://localhost:9090" -ForegroundColor White
Write-Host ""
