# TechNovaStore Logging Setup Script (PowerShell)
# This script sets up the ELK Stack and configures logging for all services

Write-Host "🚀 Setting up TechNovaStore Logging System..." -ForegroundColor Green

# Create logs directory if it doesn't exist
Write-Host "📁 Creating logs directory..." -ForegroundColor Yellow
if (!(Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" -Force | Out-Null
}

# Create ELK Stack configuration directories
Write-Host "📁 Creating ELK Stack configuration directories..." -ForegroundColor Yellow
$directories = @(
    "infrastructure/elasticsearch/config",
    "infrastructure/logstash/config", 
    "infrastructure/logstash/pipeline",
    "infrastructure/kibana/config"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

# Copy environment configuration
Write-Host "📋 Setting up environment configuration..." -ForegroundColor Yellow
if (!(Test-Path ".env.logging")) {
    Copy-Item ".env.logging.example" ".env.logging"
    Write-Host "✅ Created .env.logging file. Please configure your logging settings." -ForegroundColor Green
} else {
    Write-Host "ℹ️  .env.logging already exists." -ForegroundColor Blue
}

# Build shared configuration package
Write-Host "🔨 Building shared configuration package..." -ForegroundColor Yellow
Push-Location "shared/config"
try {
    npm install
    npm run build
    Write-Host "✅ Shared config package built successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to build shared config package: $_" -ForegroundColor Red
} finally {
    Pop-Location
}

# Build shared utils package
Write-Host "🔨 Building shared utils package..." -ForegroundColor Yellow
Push-Location "shared/utils"
try {
    npm install
    npm run build
    Write-Host "✅ Shared utils package built successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to build shared utils package: $_" -ForegroundColor Red
} finally {
    Pop-Location
}

# Install dependencies for all services
Write-Host "📦 Installing dependencies for services..." -ForegroundColor Yellow
$services = @("api-gateway", "domains/catalog/product-service", "services/order", "domains/customer/user-service", "automation/auto-purchase")

foreach ($service in $services) {
    if (Test-Path $service) {
        Write-Host "📦 Installing dependencies for $service..." -ForegroundColor Cyan
        Push-Location $service
        try {
            npm install
            Write-Host "✅ Dependencies installed for $service" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to install dependencies for $service : $_" -ForegroundColor Red
        } finally {
            Pop-Location
        }
    }
}

# Start ELK Stack
Write-Host "🐳 Starting ELK Stack..." -ForegroundColor Yellow
try {
    docker-compose up -d elasticsearch logstash kibana
    Write-Host "✅ ELK Stack containers started" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to start ELK Stack: $_" -ForegroundColor Red
    exit 1
}

# Wait for Elasticsearch to be ready
Write-Host "⏳ Waiting for Elasticsearch to be ready..." -ForegroundColor Yellow
$timeout = 60
$counter = 0
do {
    if ($counter -ge $timeout) {
        Write-Host "❌ Elasticsearch failed to start within $timeout seconds" -ForegroundColor Red
        exit 1
    }
    Write-Host "⏳ Waiting for Elasticsearch... ($counter/$timeout)" -ForegroundColor Cyan
    Start-Sleep 1
    $counter++
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:9200/_cluster/health" -TimeoutSec 1 -ErrorAction SilentlyContinue
        $ready = $response.StatusCode -eq 200
    } catch {
        $ready = $false
    }
} while (!$ready)

Write-Host "✅ Elasticsearch is ready!" -ForegroundColor Green

# Wait for Kibana to be ready
Write-Host "⏳ Waiting for Kibana to be ready..." -ForegroundColor Yellow
$timeout = 120
$counter = 0
do {
    if ($counter -ge $timeout) {
        Write-Host "❌ Kibana failed to start within $timeout seconds" -ForegroundColor Red
        exit 1
    }
    Write-Host "⏳ Waiting for Kibana... ($counter/$timeout)" -ForegroundColor Cyan
    Start-Sleep 1
    $counter++
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5601/api/status" -TimeoutSec 1 -ErrorAction SilentlyContinue
        $ready = $response.StatusCode -eq 200
    } catch {
        $ready = $false
    }
} while (!$ready)

Write-Host "✅ Kibana is ready!" -ForegroundColor Green

# Create Kibana index patterns and dashboards
Write-Host "📊 Setting up Kibana dashboards..." -ForegroundColor Yellow
Start-Sleep 10  # Give Kibana a moment to fully initialize

# Create index pattern
try {
    $body = @{
        attributes = @{
            title = "technovastore-logs-*"
            timeFieldName = "@timestamp"
        }
    } | ConvertTo-Json -Depth 3

    $headers = @{
        "Content-Type" = "application/json"
        "kbn-xsrf" = "true"
    }

    Invoke-RestMethod -Uri "http://localhost:5601/api/saved_objects/index-pattern/technovastore-logs-*" `
                      -Method Post `
                      -Body $body `
                      -Headers $headers `
                      -ErrorAction SilentlyContinue | Out-Null
    Write-Host "✅ Kibana index pattern created" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  Index pattern may already exist" -ForegroundColor Blue
}

Write-Host "✅ Logging system setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 TechNovaStore Logging System is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Access points:" -ForegroundColor Cyan
Write-Host "   • Kibana Dashboard: http://localhost:5601" -ForegroundColor White
Write-Host "   • Elasticsearch: http://localhost:9200" -ForegroundColor White
Write-Host "   • Logstash: http://localhost:9600" -ForegroundColor White
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Configure your .env.logging file with your alert settings" -ForegroundColor White
Write-Host "   2. Start your services with: docker-compose up -d" -ForegroundColor White
Write-Host "   3. View logs in Kibana at http://localhost:5601" -ForegroundColor White
Write-Host "   4. Set up Kibana dashboards for monitoring" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Useful commands:" -ForegroundColor Cyan
Write-Host "   • View logs: docker-compose logs -f [service-name]" -ForegroundColor White
Write-Host "   • Check ELK status: docker-compose ps elasticsearch logstash kibana" -ForegroundColor White
Write-Host "   • Restart logging: docker-compose restart elasticsearch logstash kibana" -ForegroundColor White