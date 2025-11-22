# Production Deployment Script for TechNovaStore (PowerShell)
# This script handles the complete deployment process including database migrations

param(
    [switch]$SkipBuild = $false,
    [switch]$SkipMigrations = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting TechNovaStore Production Deployment..." -ForegroundColor Green

# Check if .env.prod exists
if (-not (Test-Path ".env.prod")) {
    Write-Host "❌ Error: .env.prod file not found!" -ForegroundColor Red
    Write-Host "Please copy .env.prod.example to .env.prod and configure your production variables." -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Loading production environment variables..." -ForegroundColor Blue

if (-not $SkipBuild) {
    Write-Host "📦 Building production images..." -ForegroundColor Blue
    docker-compose -f docker-compose.prod.yml build --no-cache
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "🗄️ Starting databases..." -ForegroundColor Blue
docker-compose -f docker-compose.prod.yml up -d mongodb postgresql redis

Write-Host "⏳ Waiting for databases to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

if (-not $SkipMigrations) {
    Write-Host "🔄 Database migrations will be handled by init scripts..." -ForegroundColor Blue
    Write-Host "Migrations are located in infrastructure/postgresql/init/" -ForegroundColor Gray
}

Write-Host "🚀 Starting all services..." -ForegroundColor Blue
docker-compose -f docker-compose.prod.yml up -d

Write-Host "🔍 Checking service health..." -ForegroundColor Blue
Start-Sleep -Seconds 60

# Health check for critical services
$services = @("api-gateway", "ticket-service", "chatbot", "notification-service")
$healthyServices = 0

foreach ($service in $services) {
    Write-Host "Checking $service health..." -ForegroundColor Gray
    
    try {
        $result = docker-compose -f docker-compose.prod.yml exec -T $service curl -f http://localhost:3005/health 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $service is healthy" -ForegroundColor Green
            $healthyServices++
        } else {
            Write-Host "❌ $service health check failed" -ForegroundColor Red
            Write-Host "Showing logs for $service:" -ForegroundColor Yellow
            docker-compose -f docker-compose.prod.yml logs --tail=20 $service
        }
    } catch {
        Write-Host "❌ $service health check failed with exception" -ForegroundColor Red
        Write-Host "Showing logs for $service:" -ForegroundColor Yellow
        docker-compose -f docker-compose.prod.yml logs --tail=20 $service
    }
}

Write-Host "📊 Deployment Summary:" -ForegroundColor Blue
docker-compose -f docker-compose.prod.yml ps

Write-Host "🎉 Production deployment completed!" -ForegroundColor Green
Write-Host "📈 Healthy services: $healthyServices/$($services.Count)" -ForegroundColor Cyan
Write-Host "🌐 Frontend: https://technovastore.com" -ForegroundColor Cyan
Write-Host "🔧 API Gateway: https://api.technovastore.com" -ForegroundColor Cyan
Write-Host "📋 Monitor logs with: docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor Gray

# Show final status
if ($healthyServices -eq $services.Count) {
    Write-Host "✅ All critical services are healthy!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️ Some services may need attention. Check the logs above." -ForegroundColor Yellow
    exit 1
}