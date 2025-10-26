# TechNovaStore Scalability Deployment Script (PowerShell)
# Deploys horizontal auto-scaling, CDN, and distributed cache infrastructure

param(
    [string]$Environment = "production",
    [string]$DeploymentType = "docker-swarm"  # docker-swarm, kubernetes, or docker-compose
)

# Configuration
$ErrorActionPreference = "Stop"

# Colors for output
function Write-Log {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] WARNING: $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ERROR: $Message" -ForegroundColor Red
    exit 1
}

# Check prerequisites
function Test-Prerequisites {
    Write-Log "Checking prerequisites..."
    
    switch ($DeploymentType) {
        "docker-swarm" {
            if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
                Write-Error "Docker is not installed"
            }
            
            $swarmInfo = docker info --format "{{.Swarm.LocalNodeState}}" 2>$null
            if ($swarmInfo -ne "active") {
                Write-Warning "Docker Swarm is not initialized. Initializing..."
                docker swarm init
            }
        }
        "kubernetes" {
            if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
                Write-Error "kubectl is not installed"
            }
            
            try {
                kubectl cluster-info | Out-Null
            } catch {
                Write-Error "Kubernetes cluster is not accessible"
            }
        }
        "docker-compose" {
            if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
                Write-Error "docker-compose is not installed"
            }
        }
        default {
            Write-Error "Invalid deployment type: $DeploymentType"
        }
    }
    
    Write-Log "Prerequisites check completed"
}

# Create necessary directories
function New-Directories {
    Write-Log "Creating necessary directories..."
    
    $basePath = "C:\opt\technovastore"
    $directories = @(
        "$basePath\data\mongodb",
        "$basePath\data\postgresql", 
        "$basePath\data\redis",
        "$basePath\data\prometheus",
        "$basePath\data\grafana",
        "$basePath\cdn\static",
        "$basePath\cdn\uploads",
        "$basePath\cdn\optimized",
        "$basePath\cdn\cache",
        "$basePath\cache\redis-cluster",
        "$basePath\logs",
        "$basePath\backups"
    )
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }
    
    Write-Log "Directories created successfully"
}

# Deploy Redis Cluster for distributed caching
function Deploy-RedisCluster {
    Write-Log "Deploying Redis Cluster for distributed caching..."
    
    switch ($DeploymentType) {
        "docker-swarm" {
            docker stack deploy -c infrastructure/cache/redis-cluster.yml technovastore-cache
        }
        "kubernetes" {
            kubectl apply -f infrastructure/scaling/kubernetes/namespace.yaml
            Write-Warning "Redis cluster deployment for Kubernetes requires additional configuration"
        }
        "docker-compose" {
            docker-compose -f infrastructure/cache/redis-cluster.yml up -d
        }
    }
    
    # Wait for Redis cluster to be ready
    Write-Log "Waiting for Redis cluster to be ready..."
    Start-Sleep -Seconds 30
    
    # Verify cluster status
    try {
        $clusterInfo = docker exec technovastore-redis-master-1 redis-cli -a $env:REDIS_PASSWORD cluster info 2>$null
        if ($clusterInfo -match "cluster_state:ok") {
            Write-Log "Redis cluster is ready and healthy"
        } else {
            Write-Warning "Redis cluster may not be fully ready. Check logs for details."
        }
    } catch {
        Write-Warning "Could not verify Redis cluster status"
    }
}

# Deploy CDN infrastructure
function Deploy-CDN {
    Write-Log "Deploying CDN infrastructure..."
    
    switch ($DeploymentType) {
        "docker-swarm" {
            docker stack deploy -c infrastructure/cdn/cdn-deployment.yml technovastore-cdn
        }
        "kubernetes" {
            Write-Warning "CDN deployment for Kubernetes requires additional configuration"
        }
        "docker-compose" {
            docker-compose -f infrastructure/cdn/cdn-deployment.yml up -d
        }
    }
    
    Write-Log "CDN infrastructure deployed"
}

# Deploy auto-scaling infrastructure
function Deploy-AutoScaling {
    Write-Log "Deploying auto-scaling infrastructure..."
    
    switch ($DeploymentType) {
        "docker-swarm" {
            docker stack deploy -c infrastructure/scaling/docker-swarm.yml technovastore
            
            # Start auto-scaling monitor
            Write-Log "Starting auto-scaling monitor..."
            $monitorJob = Start-Job -ScriptBlock {
                Set-Location $using:PWD
                node infrastructure/scaling/auto-scaling-monitor.js
            }
            $monitorJob.Id | Out-File -FilePath "$env:TEMP\autoscaling-monitor.pid"
        }
        "kubernetes" {
            kubectl apply -f infrastructure/scaling/kubernetes/namespace.yaml
            kubectl apply -f infrastructure/scaling/kubernetes/deployments.yaml
            kubectl apply -f infrastructure/scaling/kubernetes/hpa.yaml
            
            Write-Log "Kubernetes HPA (Horizontal Pod Autoscaler) deployed"
        }
        "docker-compose" {
            Write-Warning "Auto-scaling with docker-compose is limited. Consider using Docker Swarm or Kubernetes for production."
        }
    }
    
    Write-Log "Auto-scaling infrastructure deployed"
}

# Configure load balancer
function Set-LoadBalancer {
    Write-Log "Configuring load balancer..."
    
    switch ($DeploymentType) {
        "docker-swarm" {
            Write-Log "NGINX load balancer configured via Docker Swarm"
        }
        "kubernetes" {
            Write-Warning "Load balancer configuration for Kubernetes requires Ingress controller setup"
        }
        "docker-compose" {
            Write-Log "NGINX load balancer configured via docker-compose"
        }
    }
}

# Setup monitoring for scalability
function Set-Monitoring {
    Write-Log "Setting up scalability monitoring..."
    
    # Start cache manager
    Write-Log "Starting distributed cache manager..."
    $cacheJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        node infrastructure/cache/cache-manager.js
    }
    $cacheJob.Id | Out-File -FilePath "$env:TEMP\cache-manager.pid"
    
    Write-Log "Scalability monitoring configured"
}

# Verify deployment
function Test-Deployment {
    Write-Log "Verifying deployment..."
    
    # Check Redis cluster
    try {
        $redisPing = docker exec technovastore-redis-master-1 redis-cli -a $env:REDIS_PASSWORD ping 2>$null
        if ($redisPing -match "PONG") {
            Write-Log "✅ Redis cluster is responding"
        } else {
            Write-Error "❌ Redis cluster is not responding"
        }
    } catch {
        Write-Warning "⚠️ Could not verify Redis cluster"
    }
    
    # Check CDN server
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Log "✅ CDN server is responding"
        }
    } catch {
        Write-Warning "⚠️ CDN server may not be ready yet"
    }
    
    # Check background jobs
    if (Test-Path "$env:TEMP\autoscaling-monitor.pid") {
        $jobId = Get-Content "$env:TEMP\autoscaling-monitor.pid"
        $job = Get-Job -Id $jobId -ErrorAction SilentlyContinue
        if ($job -and $job.State -eq "Running") {
            Write-Log "✅ Auto-scaling monitor is running"
        } else {
            Write-Warning "⚠️ Auto-scaling monitor may not be running"
        }
    }
    
    if (Test-Path "$env:TEMP\cache-manager.pid") {
        $jobId = Get-Content "$env:TEMP\cache-manager.pid"
        $job = Get-Job -Id $jobId -ErrorAction SilentlyContinue
        if ($job -and $job.State -eq "Running") {
            Write-Log "✅ Cache manager is running"
        } else {
            Write-Warning "⚠️ Cache manager may not be running"
        }
    }
    
    Write-Log "Deployment verification completed"
}

# Cleanup function
function Stop-BackgroundJobs {
    Write-Log "Cleaning up background jobs..."
    
    if (Test-Path "$env:TEMP\autoscaling-monitor.pid") {
        $jobId = Get-Content "$env:TEMP\autoscaling-monitor.pid"
        Stop-Job -Id $jobId -ErrorAction SilentlyContinue
        Remove-Job -Id $jobId -ErrorAction SilentlyContinue
        Remove-Item "$env:TEMP\autoscaling-monitor.pid" -ErrorAction SilentlyContinue
    }
    
    if (Test-Path "$env:TEMP\cache-manager.pid") {
        $jobId = Get-Content "$env:TEMP\cache-manager.pid"
        Stop-Job -Id $jobId -ErrorAction SilentlyContinue
        Remove-Job -Id $jobId -ErrorAction SilentlyContinue
        Remove-Item "$env:TEMP\cache-manager.pid" -ErrorAction SilentlyContinue
    }
}

# Main deployment function
function Start-Deployment {
    Write-Log "Starting TechNovaStore scalability deployment"
    Write-Log "Environment: $Environment"
    Write-Log "Deployment Type: $DeploymentType"
    
    # Load environment variables
    $envFile = ".env.$Environment"
    if (Test-Path $envFile) {
        Write-Log "Loading environment variables from $envFile"
        Get-Content $envFile | ForEach-Object {
            if ($_ -match '^([^#][^=]+)=(.*)$') {
                [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
            }
        }
    } else {
        Write-Warning "Environment file $envFile not found"
    }
    
    try {
        # Execute deployment steps
        Test-Prerequisites
        New-Directories
        Deploy-RedisCluster
        Deploy-CDN
        Deploy-AutoScaling
        Set-LoadBalancer
        Set-Monitoring
        Test-Deployment
        
        Write-Log "🎉 TechNovaStore scalability infrastructure deployed successfully!"
        Write-Log "📊 Monitor the deployment with:"
        Write-Log "   - Grafana: http://localhost:3013"
        Write-Log "   - Prometheus: http://localhost:9090"
        Write-Log "   - CDN Health: http://localhost:8080/health"
        
        if ($DeploymentType -eq "kubernetes") {
            Write-Log "   - Kubernetes Dashboard: kubectl proxy"
            Write-Log "   - HPA Status: kubectl get hpa -n technovastore"
        }
        
    } catch {
        Write-Error "Deployment failed: $($_.Exception.Message)"
    }
}

# Show usage
function Show-Usage {
    Write-Host "Usage: .\deploy-scalability.ps1 [-Environment <env>] [-DeploymentType <type>]"
    Write-Host ""
    Write-Host "Parameters:"
    Write-Host "  -Environment     Environment to deploy (default: production)"
    Write-Host "  -DeploymentType  Deployment type: docker-swarm, kubernetes, or docker-compose (default: docker-swarm)"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\deploy-scalability.ps1 -Environment production -DeploymentType docker-swarm"
    Write-Host "  .\deploy-scalability.ps1 -Environment staging -DeploymentType kubernetes"
    Write-Host "  .\deploy-scalability.ps1 -Environment development -DeploymentType docker-compose"
}

# Handle help parameter
if ($args -contains "--help" -or $args -contains "-h") {
    Show-Usage
    exit 0
}

# Register cleanup on exit
Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    Stop-BackgroundJobs
}

# Run main function
Start-Deployment