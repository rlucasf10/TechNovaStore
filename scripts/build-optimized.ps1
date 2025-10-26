# Script para construcción optimizada con imagen base compartida
Write-Host "🚀 Iniciando construcción optimizada de servicios..." -ForegroundColor Green

# Construir imagen base una sola vez
Write-Host "📦 Construyendo imagen base compartida..." -ForegroundColor Yellow
docker build -f docker/base/Dockerfile.service-base -t service-base .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Imagen base construida exitosamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error construyendo imagen base" -ForegroundColor Red
    exit 1
}

# Lista de servicios a construir
$services = @("order", "user", "product", "payment", "notification")

# Construir cada servicio usando la imagen base
foreach ($service in $services) {
    Write-Host "🔨 Construyendo servicio: $service" -ForegroundColor Cyan
    docker build -f services/$service/Dockerfile -t "$service-service" .
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Servicio $service construido exitosamente" -ForegroundColor Green
    } else {
        Write-Host "❌ Error construyendo servicio $service" -ForegroundColor Red
        exit 1
    }
}

Write-Host "🎉 Todos los servicios construidos exitosamente!" -ForegroundColor Green
Write-Host "💡 Tiempo de construcción reducido gracias a la imagen base compartida" -ForegroundColor Blue