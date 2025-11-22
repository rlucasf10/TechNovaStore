# TechNovaStore Deployment Script for Windows
# Usage: .\scripts\deploy.ps1 [staging|production] [options]

param(
    [Parameter(Position=0)]
    [ValidateSet("staging", "production")]
    [string]$Environment,
    
    [switch]$Force,
    [switch]$SkipTests,
    [switch]$SkipBackup,
    [switch]$DryRun,
    [switch]$Help
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

function Show-Usage {
    Write-Host "Usage: .\scripts\deploy.ps1 [staging|production] [options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Force         Force deployment even if tests fail"
    Write-Host "  -SkipTests     Skip running tests before deployment"
    Write-Host "  -SkipBackup    Skip creating backup before deployment"
    Write-Host "  -DryRun        Show what would be deployed without actually deploying"
    Write-Host "  -Help          Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\scripts\deploy.ps1 staging"
    Write-Host "  .\scripts\deploy.ps1 production -Force"
    Write-Host "  .\scripts\deploy.ps1 staging -SkipTests -DryRun"
}

# Show help if requested
if ($Help) {
    Show-Usage
    exit 0
}

# Validate environment
if (-not $Environment) {
    Write-Error "Environment must be specified (staging or production)"
    Show-Usage
    exit 1
}

# Set environment-specific variables
if ($Environment -eq "staging") {
    $ComposeFile = "docker-compose.staging.yml"
    $EnvFile = ".env.staging"
    $Branch = "develop"
} elseif ($Environment -eq "production") {
    $ComposeFile = "docker-compose.prod.yml"
    $EnvFile = ".env.production"
    $Branch = "main"
}

Write-Status "Starting deployment to $Environment environment"

# Check if we're in the right directory
if (-not (Test-Path "package.json") -or -not (Test-Path $ComposeFile)) {
    Write-Error "This script must be run from the project root directory"
    exit 1
}

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Error "Docker is not running. Please start Docker and try again."
    exit 1
}

# Check if we're on the correct branch
try {
    $CurrentBranch = git branch --show-current
    if ($CurrentBranch -ne $Branch -and -not $Force) {
        Write-Error "You are on branch '$CurrentBranch' but trying to deploy '$Environment' which requires branch '$Branch'"
        Write-Warning "Use -Force to deploy anyway"
        exit 1
    }
} catch {
    Write-Warning "Could not determine current git branch"
}

# Check for uncommitted changes
try {
    $GitStatus = git status --porcelain
    if ($GitStatus -and -not $Force) {
        Write-Error "You have uncommitted changes. Please commit or stash them before deploying."
        Write-Warning "Use -Force to deploy anyway"
        exit 1
    }
} catch {
    Write-Warning "Could not check git status"
}

# Run tests unless skipped
if (-not $SkipTests -and -not $DryRun) {
    Write-Status "Running tests..."
    
    try {
        npm run test:ci
        Write-Success "All tests passed"
    } catch {
        if (-not $Force) {
            Write-Error "Tests failed. Use -Force to deploy anyway."
            exit 1
        } else {
            Write-Warning "Tests failed but continuing due to -Force flag"
        }
    }
}

# Check if environment file exists
if (-not (Test-Path $EnvFile)) {
    Write-Error "Environment file $EnvFile not found"
    Write-Status "Creating from example file..."
    Copy-Item "$EnvFile.example" $EnvFile
    Write-Warning "Please edit $EnvFile with your actual configuration before deploying"
    exit 1
}

if ($DryRun) {
    Write-Status "DRY RUN - Would deploy the following:"
    Write-Host "  Environment: $Environment"
    Write-Host "  Branch: $Branch"
    Write-Host "  Compose file: $ComposeFile"
    Write-Host "  Environment file: $EnvFile"
    try {
        $CurrentCommit = git rev-parse HEAD
        Write-Host "  Current commit: $CurrentCommit"
    } catch {
        Write-Host "  Current commit: Unable to determine"
    }
    Write-Host "  Skip tests: $SkipTests"
    Write-Host "  Skip backup: $SkipBackup"
    Write-Host "  Force deploy: $Force"
    exit 0
}

# Create backup unless skipped
if (-not $SkipBackup -and $Environment -eq "production") {
    Write-Status "Creating backup..."
    
    $BackupDir = ".\backups\$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    
    # Backup databases if they're running
    $PostgresContainer = docker ps --filter "name=technovastore.*postgresql" --format "{{.Names}}"
    if ($PostgresContainer) {
        Write-Status "Backing up PostgreSQL database..."
        docker-compose -f $ComposeFile exec -T postgresql pg_dump -U $env:POSTGRES_USER technovastore > "$BackupDir\postgresql_backup.sql"
    }
    
    $MongoContainer = docker ps --filter "name=technovastore.*mongodb" --format "{{.Names}}"
    if ($MongoContainer) {
        Write-Status "Backing up MongoDB database..."
        docker-compose -f $ComposeFile exec -T mongodb mongodump --uri="mongodb://$($env:MONGO_ROOT_USERNAME):$($env:MONGO_ROOT_PASSWORD)@localhost:27017/technovastore?authSource=admin" --out="$BackupDir\mongodb_backup"
    }
    
    Write-Success "Backup created at $BackupDir"
}

# Pull latest code
Write-Status "Pulling latest code from $Branch branch..."
try {
    git pull origin $Branch
} catch {
    Write-Warning "Could not pull latest code from git"
}

# Build and deploy
Write-Status "Building and deploying services..."

# Login to GitHub Container Registry if credentials are available
if ($env:GITHUB_TOKEN) {
    Write-Status "Logging in to GitHub Container Registry..."
    echo $env:GITHUB_TOKEN | docker login ghcr.io -u $env:GITHUB_ACTOR --password-stdin
}

# Pull latest images
Write-Status "Pulling latest Docker images..."
docker-compose -f $ComposeFile pull

# Stop existing services gracefully
Write-Status "Stopping existing services..."
docker-compose -f $ComposeFile down --timeout 30

# Start services
Write-Status "Starting services..."
docker-compose -f $ComposeFile up -d

# Wait for services to be ready
Write-Status "Waiting for services to start..."
Start-Sleep -Seconds 60

# Health checks
Write-Status "Running health checks..."

# Check API Gateway
$ApiHealthy = $false
for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Success "API Gateway is healthy"
            $ApiHealthy = $true
            break
        }
    } catch {
        if ($i -eq 10) {
            Write-Error "API Gateway health check failed after 10 attempts"
            exit 1
        }
        Write-Status "Attempt $i`: API Gateway not ready, waiting..."
        Start-Sleep -Seconds 10
    }
}

# Check Frontend
$FrontendHealthy = $false
for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3011" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Success "Frontend is healthy"
            $FrontendHealthy = $true
            break
        }
    } catch {
        if ($i -eq 10) {
            Write-Error "Frontend health check failed after 10 attempts"
            exit 1
        }
        Write-Status "Attempt $i`: Frontend not ready, waiting..."
        Start-Sleep -Seconds 10
    }
}

# Check other services (non-blocking)
$Services = @(
    @{Name="product-service"; Port=3001},
    @{Name="order-service"; Port=3002},
    @{Name="user-service"; Port=3003},
    @{Name="payment-service"; Port=3004},
    @{Name="notification-service"; Port=3005}
)

foreach ($service in $Services) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Success "$($service.Name) is healthy"
        }
    } catch {
        Write-Warning "$($service.Name) health check failed (non-blocking)"
    }
}

# Show running containers
Write-Status "Currently running containers:"
docker-compose -f $ComposeFile ps

# Show logs for any failed containers
$FailedContainers = docker-compose -f $ComposeFile ps --filter "status=exited" --format "table {{.Service}}" | Select-Object -Skip 1
if ($FailedContainers) {
    Write-Warning "Some containers failed to start:"
    $FailedContainers | ForEach-Object {
        if ($_.Trim()) {
            Write-Host "  $_"
        }
    }
    Write-Status "Showing logs for failed containers..."
    $FailedContainers | ForEach-Object {
        if ($_.Trim()) {
            Write-Status "Logs for $_`:"
            docker-compose -f $ComposeFile logs --tail=50 $_.Trim()
        }
    }
}

Write-Success "Deployment to $Environment completed successfully!"
Write-Status "Application is available at:"
if ($Environment -eq "staging") {
    Write-Host "  Frontend: http://localhost:3011"
    Write-Host "  API: http://localhost:3000"
} else {
    Write-Host "  Frontend: https://technovastore.com"
    Write-Host "  API: https://api.technovastore.com"
}

Write-Status "To view logs: docker-compose -f $ComposeFile logs -f"
Write-Status "To stop services: docker-compose -f $ComposeFile down"