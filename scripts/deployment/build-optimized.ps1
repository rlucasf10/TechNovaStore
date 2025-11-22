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

# Lista de servicios a construir con sus dominios
$services = @(
    @{Name="product-service"; Domain="catalog"},
    @{Name="order-service"; Domain="commerce"},
    @{Name="user-service"; Domain="customer"},
    @{Name="payment-service"; Domain="commerce"},
    @{Name="notification-service"; Domain="customer"}
)

# Construir cada servicio usando la imagen base
foreach ($service in $services) {
    $serviceName = $service.Name
    $domain = $service.Domain
    Write-Host "🔨 Construyendo servicio: $serviceName (dominio: $domain)" -ForegroundColor Cyan
    docker build -f domains/$domain/$serviceName/Dockerfile -t "$serviceName" .
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Servicio $serviceName construido exitosamente" -ForegroundColor Green
    } else {
        Write-Host "❌ Error construyendo servicio $serviceName" -ForegroundColor Red
        exit 1
    }
}

Write-Host "🎉 Todos los servicios construidos exitosamente!" -ForegroundColor Green
Write-Host "💡 Tiempo de construcción reducido gracias a la imagen base compartida" -ForegroundColor Blue