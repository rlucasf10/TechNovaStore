# Script PowerShell para iniciar servicios de staging de forma escalonada
# Construye y levanta los contenedores en el orden correcto

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TechnovaStore - Inicio Staging" -ForegroundColor Cyan
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

# FASE 0: Construir imágenes base (CRÍTICO - debe ser primero)
Write-Host "[2/7] FASE 0: Construyendo imágenes base..." -ForegroundColor Yellow

# Imagen base para servicios generales
Write-Host "  Construyendo imagen base de servicios..." -ForegroundColor Gray
docker build -t technovastore-base:latest -f docker/base/Dockerfile.service-base .
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Falló la construcción de la imagen base de servicios" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Imagen base de servicios construida" -ForegroundColor Green

# Imagen base para chatbot (Python + spaCy)
Write-Host "  Construyendo imagen base del chatbot (Python + spaCy)..." -ForegroundColor Gray
docker build -t technovastore-chatbot-base:latest -f docker/base/Dockerfile.chatbot-base .
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Falló la construcción de la imagen base del chatbot" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Imagen base del chatbot construida" -ForegroundColor Green

Write-Host "✓ Todas las imágenes base construidas" -ForegroundColor Green
Write-Host ""

# FASE 1: Bases de datos (crítico)
Write-Host "[3/7] FASE 1: Iniciando bases de datos..." -ForegroundColor Yellow
docker-compose -f docker-compose.staging.yml up -d --build mongodb postgresql redis
Write-Host "  Esperando 30 segundos..." -ForegroundColor Gray
Start-Sleep -Seconds 30
Write-Host "✓ Bases de datos iniciadas" -ForegroundColor Green
Write-Host ""

# FASE 2: Servicios core
Write-Host "[4/7] FASE 2: Iniciando servicios principales..." -ForegroundColor Yellow
docker-compose -f docker-compose.staging.yml up -d --build api-gateway product-service order-service user-service payment-service notification-service ticket-service campaign-manager-service
Write-Host "  Esperando 60 segundos..." -ForegroundColor Gray
Start-Sleep -Seconds 60
Write-Host "✓ Servicios principales iniciados" -ForegroundColor Green
Write-Host ""

# FASE 3: Servicios de automatización
Write-Host "[5/7] FASE 3: Iniciando servicios de automatización..." -ForegroundColor Yellow
docker-compose -f docker-compose.staging.yml up -d --build sync-engine auto-purchase shipment-tracker
Write-Host "  Esperando 60 segundos..." -ForegroundColor Gray
Start-Sleep -Seconds 60
Write-Host "✓ Servicios de automatización iniciados" -ForegroundColor Green
Write-Host ""

# FASE 4: AI y Frontend
Write-Host "[6/7] FASE 4: Iniciando AI y Frontend..." -ForegroundColor Yellow
docker-compose -f docker-compose.staging.yml up -d --build ollama chatbot recommender frontend
Write-Host "  Esperando 60 segundos..." -ForegroundColor Gray
Start-Sleep -Seconds 60
Write-Host "✓ AI y Frontend iniciados" -ForegroundColor Green
Write-Host ""

# FASE 5: Monitoreo (Prometheus, Grafana, Alertmanager, ELK, Exporters)
# COMENTADO: No es necesario para staging de momento
# Write-Host "[7/7] FASE 5: Iniciando servicios de monitoreo..." -ForegroundColor Yellow
# docker-compose -f docker-compose.staging.yml up -d --build prometheus grafana alertmanager
# Write-Host "  Esperando 30 segundos..." -ForegroundColor Gray
# Start-Sleep -Seconds 30
# docker-compose -f docker-compose.staging.yml up -d --build elasticsearch logstash kibana
# Write-Host "  Esperando 30 segundos..." -ForegroundColor Gray
# Start-Sleep -Seconds 30
# docker-compose -f docker-compose.staging.yml up -d --build mongodb-exporter postgres-exporter redis-exporter node-exporter
# Write-Host "  Esperando 30 segundos..." -ForegroundColor Gray
# Start-Sleep -Seconds 30
# Write-Host "✓ Servicios de monitoreo iniciados" -ForegroundColor Green
# Write-Host ""

# Verificar estado
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Estado de los contenedores:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
docker-compose -f docker-compose.staging.yml ps

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ TODOS LOS SERVICIOS INICIADOS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "URLs de acceso (Staging):" -ForegroundColor Cyan
Write-Host "  Frontend:    http://localhost:3020" -ForegroundColor White
Write-Host "  API Gateway: http://localhost:3000" -ForegroundColor White
Write-Host "  Chatbot:     http://localhost:3009" -ForegroundColor White
Write-Host "  Grafana:     http://localhost:3013" -ForegroundColor White
Write-Host "  Prometheus:  http://localhost:9090" -ForegroundColor White
Write-Host "  Kibana:      http://localhost:5601" -ForegroundColor White
Write-Host ""
