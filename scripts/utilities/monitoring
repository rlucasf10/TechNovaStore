#!/usr/bin/env powershell

# TechNovaStore - Script de Verificación de Servicios
# Este script verifica que todos los servicios estén funcionando correctamente

Write-Host "🚀 Verificando servicios de TechNovaStore..." -ForegroundColor Green

# Función para verificar si un puerto está abierto
function Test-Port {
    param(
        [string]$HostName = "localhost",
        [int]$Port,
        [string]$ServiceName
    )
    
    try {
        $connection = New-Object System.Net.Sockets.TcpClient($HostName, $Port)
        $connection.Close()
        Write-Host "✅ $ServiceName (puerto $Port) - FUNCIONANDO" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ $ServiceName (puerto $Port) - NO DISPONIBLE" -ForegroundColor Red
        return $false
    }
}

# Función para verificar endpoint HTTP
function Test-HttpEndpoint {
    param(
        [string]$Url,
        [string]$ServiceName
    )
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $ServiceName - FUNCIONANDO (HTTP 200)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠️ $ServiceName - RESPUESTA: $($response.StatusCode)" -ForegroundColor Yellow
            return $false
        }
    }
    catch {
        Write-Host "❌ $ServiceName - NO DISPONIBLE" -ForegroundColor Red
        return $false
    }
}

Write-Host "`n📊 Verificando infraestructura base..." -ForegroundColor Cyan

# Verificar bases de datos
$mongoOk = Test-Port -Port 27017 -ServiceName "MongoDB"
$postgresOk = Test-Port -Port 5432 -ServiceName "PostgreSQL"
$redisOk = Test-Port -Port 6379 -ServiceName "Redis"

Write-Host "`n📈 Verificando servicios de monitoreo..." -ForegroundColor Cyan

# Verificar servicios de monitoreo
$prometheusOk = Test-HttpEndpoint -Url "http://localhost:9090" -ServiceName "Prometheus"
$grafanaOk = Test-HttpEndpoint -Url "http://localhost:3013" -ServiceName "Grafana"

Write-Host "`n🔍 Verificando servicios de aplicación..." -ForegroundColor Cyan

# Verificar servicios principales de la aplicación
$apiGatewayOk = Test-HttpEndpoint -Url "http://localhost:3000/health" -ServiceName "API Gateway"
$frontendOk = Test-HttpEndpoint -Url "http://localhost:3011" -ServiceName "Frontend"

# Verificar microservicios
$productServiceOk = Test-HttpEndpoint -Url "http://localhost:3001/health" -ServiceName "Product Service"
$orderServiceOk = Test-HttpEndpoint -Url "http://localhost:3002/health" -ServiceName "Order Service"
$userServiceOk = Test-HttpEndpoint -Url "http://localhost:3003/health" -ServiceName "User Service"
$paymentServiceOk = Test-HttpEndpoint -Url "http://localhost:3004/health" -ServiceName "Payment Service"
$notificationServiceOk = Test-HttpEndpoint -Url "http://localhost:3005/health" -ServiceName "Notification Service"

Write-Host "`n🤖 Verificando servicios de automatización..." -ForegroundColor Cyan

# Verificar servicios de automatización
$syncEngineOk = Test-HttpEndpoint -Url "http://localhost:3006/health" -ServiceName "Sync Engine"
$autoPurchaseOk = Test-HttpEndpoint -Url "http://localhost:3007/health" -ServiceName "Auto Purchase"
$shipmentTrackerOk = Test-HttpEndpoint -Url "http://localhost:3008/health" -ServiceName "Shipment Tracker"

Write-Host "`n🧠 Verificando servicios de IA..." -ForegroundColor Cyan

# Verificar servicios de IA
$chatbotOk = Test-HttpEndpoint -Url "http://localhost:3009/health" -ServiceName "Chatbot"
$recommenderOk = Test-HttpEndpoint -Url "http://localhost:3010/health" -ServiceName "Recommender"

Write-Host "`n📋 Verificando servicios adicionales..." -ForegroundColor Cyan

# Verificar servicios adicionales
$ticketServiceOk = Test-HttpEndpoint -Url "http://localhost:3012/health" -ServiceName "Ticket Service"

Write-Host "`n📊 RESUMEN DE VERIFICACIÓN" -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor Yellow

$totalServices = 0
$workingServices = 0

# Contar servicios
$services = @(
    @{Name="MongoDB"; Status=$mongoOk},
    @{Name="PostgreSQL"; Status=$postgresOk},
    @{Name="Redis"; Status=$redisOk},
    @{Name="Prometheus"; Status=$prometheusOk},
    @{Name="Grafana"; Status=$grafanaOk},
    @{Name="API Gateway"; Status=$apiGatewayOk},
    @{Name="Frontend"; Status=$frontendOk},
    @{Name="Product Service"; Status=$productServiceOk},
    @{Name="Order Service"; Status=$orderServiceOk},
    @{Name="User Service"; Status=$userServiceOk},
    @{Name="Payment Service"; Status=$paymentServiceOk},
    @{Name="Notification Service"; Status=$notificationServiceOk},
    @{Name="Sync Engine"; Status=$syncEngineOk},
    @{Name="Auto Purchase"; Status=$autoPurchaseOk},
    @{Name="Shipment Tracker"; Status=$shipmentTrackerOk},
    @{Name="Chatbot"; Status=$chatbotOk},
    @{Name="Recommender"; Status=$recommenderOk},
    @{Name="Ticket Service"; Status=$ticketServiceOk}
)

foreach ($service in $services) {
    $totalServices++
    if ($service.Status) {
        $workingServices++
    }
}

Write-Host "Servicios funcionando: $workingServices/$totalServices" -ForegroundColor $(if ($workingServices -eq $totalServices) { "Green" } else { "Yellow" })

if ($workingServices -eq $totalServices) {
    Write-Host "`n🎉 ¡Todos los servicios están funcionando correctamente!" -ForegroundColor Green
} elseif ($workingServices -gt ($totalServices * 0.7)) {
    Write-Host "`n⚠️ La mayoría de servicios están funcionando. Revisa los servicios marcados como no disponibles." -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Varios servicios no están funcionando. Revisa la configuración y logs." -ForegroundColor Red
}

Write-Host "`n🌐 URLs de acceso:" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3011" -ForegroundColor White
Write-Host "API Gateway: http://localhost:3000" -ForegroundColor White
Write-Host "Grafana: http://localhost:3013 (admin/admin)" -ForegroundColor White
Write-Host "Prometheus: http://localhost:9090" -ForegroundColor White

Write-Host "`n📝 Para ver logs de un servicio específico:" -ForegroundColor Cyan
Write-Host "docker-compose logs [nombre-servicio]" -ForegroundColor White
Write-Host "Ejemplo: docker-compose logs api-gateway" -ForegroundColor White