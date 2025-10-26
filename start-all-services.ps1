# Script PowerShell para arrancar todos los servicios de forma escalonada
# Evita sobrecargar Docker arrancando todo de golpe

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TechnovaStore - Arranque Escalonado" -ForegroundColor Cyan
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

# Limpiar estado previo completamente
Write-Host "[2/7] Limpiando estado previo..." -ForegroundColor Yellow
docker-compose -f docker-compose.optimized.yml down --remove-orphans 2>$null
docker network prune -f 2>$null
Write-Host "✓ Limpieza completada" -ForegroundColor Green
Write-Host ""

# FASE 1: Bases de datos (crítico)
Write-Host "[3/7] FASE 1: Arrancando bases de datos..." -ForegroundColor Yellow
docker-compose -f docker-compose.optimized.yml up -d mongodb postgresql redis
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Fallo al arrancar bases de datos" -ForegroundColor Red
    Write-Host "Intenta ejecutar: docker-compose -f docker-compose.optimized.yml down --remove-orphans" -ForegroundColor Yellow
    exit 1
}
Write-Host "  Esperando 60 segundos para que las BD inicialicen..." -ForegroundColor Gray
Start-Sleep -Seconds 60
Write-Host "✓ Bases de datos arrancadas" -ForegroundColor Green
Write-Host ""

# FASE 2: Servicios de infraestructura
Write-Host "[4/7] FASE 2: Arrancando infraestructura de monitoreo..." -ForegroundColor Yellow
docker-compose -f docker-compose.optimized.yml up -d prometheus
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ Advertencia: Fallo al arrancar Prometheus, continuando..." -ForegroundColor Yellow
}
Write-Host "  Esperando 60 segundos..." -ForegroundColor Gray
Start-Sleep -Seconds 60
Write-Host "✓ Infraestructura arrancada" -ForegroundColor Green
Write-Host ""

# FASE 3: Servicios core
Write-Host "[5/7] FASE 3: Arrancando servicios principales..." -ForegroundColor Yellow
docker-compose -f docker-compose.optimized.yml up -d api-gateway product-service order-service user-service payment-service notification-service ticket-service
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Fallo al arrancar servicios principales" -ForegroundColor Red
    exit 1
}
Write-Host "  Esperando 60 segundos..." -ForegroundColor Gray
Start-Sleep -Seconds 60
Write-Host "✓ Servicios principales arrancados" -ForegroundColor Green
Write-Host ""

# FASE 4: Servicios de automatización
Write-Host "[6/7] FASE 4: Arrancando servicios de automatización..." -ForegroundColor Yellow
docker-compose -f docker-compose.optimized.yml up -d sync-engine auto-purchase shipment-tracker
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ Advertencia: Fallo al arrancar algunos servicios de automatización" -ForegroundColor Yellow
}
Write-Host "  Esperando 60 segundos..." -ForegroundColor Gray
Start-Sleep -Seconds 60
Write-Host "✓ Servicios de automatización arrancados" -ForegroundColor Green
Write-Host ""

# FASE 5: AI, Frontend y Monitoring
Write-Host "[7/7] FASE 5: Arrancando AI, Frontend y Monitoring..." -ForegroundColor Yellow
docker-compose -f docker-compose.optimized.yml up -d chatbot recommender frontend grafana
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ Advertencia: Fallo al arrancar algunos servicios de AI/Frontend" -ForegroundColor Yellow
}
Write-Host "  Esperando 60 segundos..." -ForegroundColor Gray
Start-Sleep -Seconds 60
Write-Host "✓ AI y Frontend arrancados" -ForegroundColor Green
Write-Host ""

# FASE 6: Exporters y servicios opcionales (sin ELK para ahorrar recursos)
Write-Host "[OPCIONAL] Arrancando exporters..." -ForegroundColor Yellow
docker-compose -f docker-compose.optimized.yml --profile exporters up -d mongodb-exporter postgres-exporter redis-exporter node-exporter alertmanager
Write-Host "  Esperando 60 segundos..." -ForegroundColor Gray
Start-Sleep -Seconds 60
Write-Host "✓ Exporters arrancados" -ForegroundColor Green
Write-Host ""

# Verificar estado
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Estado de los contenedores:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
docker-compose -f docker-compose.optimized.yml ps

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ TODOS LOS SERVICIOS ARRANCADOS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "URLs de acceso:" -ForegroundColor Cyan
Write-Host "  Frontend:    http://localhost:3011" -ForegroundColor White
Write-Host "  API Gateway: http://localhost:3000" -ForegroundColor White
Write-Host "  Grafana:     http://localhost:3013 (admin/REDACTED_GRAFANA_PASSWORD)" -ForegroundColor White
Write-Host "  Prometheus:  http://localhost:9090" -ForegroundColor White
Write-Host ""
Write-Host "NOTA: ELK Stack (Elasticsearch, Logstash, Kibana) NO se arrancó" -ForegroundColor Yellow
Write-Host "      para ahorrar recursos. Si los necesitas, ejecuta:" -ForegroundColor Yellow
Write-Host "      docker-compose -f docker-compose.optimized.yml up -d elasticsearch logstash kibana" -ForegroundColor Gray
Write-Host ""
