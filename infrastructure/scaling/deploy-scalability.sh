#!/bin/bash

# TechNovaStore Scalability Deployment Script
# Deploys horizontal auto-scaling, CDN, and distributed cache infrastructure

set -e

echo "🚀 Deploying TechNovaStore Scalability Infrastructure"

# Configuration
ENVIRONMENT=${1:-production}
DEPLOYMENT_TYPE=${2:-docker-swarm}  # docker-swarm, kubernetes, or docker-compose

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    case $DEPLOYMENT_TYPE in
        "docker-swarm")
            if ! command -v docker &> /dev/null; then
                error "Docker is not installed"
            fi
            
            if ! docker info | grep -q "Swarm: active"; then
                warn "Docker Swarm is not initialized. Initializing..."
                docker swarm init
            fi
            ;;
        "kubernetes")
            if ! command -v kubectl &> /dev/null; then
                error "kubectl is not installed"
            fi
            
            if ! kubectl cluster-info &> /dev/null; then
                error "Kubernetes cluster is not accessible"
            fi
            ;;
        "docker-compose")
            if ! command -v docker-compose &> /dev/null; then
                error "docker-compose is not installed"
            fi
            ;;
        *)
            error "Invalid deployment type: $DEPLOYMENT_TYPE"
            ;;
    esac
    
    log "Prerequisites check completed"
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    
    sudo mkdir -p /opt/technovastore/{data,logs,cdn,cache,backups}
    sudo mkdir -p /opt/technovastore/data/{mongodb,postgresql,redis,prometheus,grafana}
    sudo mkdir -p /opt/technovastore/cdn/{static,uploads,optimized,cache}
    sudo mkdir -p /opt/technovastore/cache/redis-cluster
    
    # Set permissions
    sudo chown -R $USER:$USER /opt/technovastore
    chmod -R 755 /opt/technovastore
    
    log "Directories created successfully"
}

# Deploy Redis Cluster for distributed caching
deploy_redis_cluster() {
    log "Deploying Redis Cluster for distributed caching..."
    
    case $DEPLOYMENT_TYPE in
        "docker-swarm")
            docker stack deploy -c infrastructure/cache/redis-cluster.yml technovastore-cache
            ;;
        "kubernetes")
            kubectl apply -f infrastructure/scaling/kubernetes/namespace.yaml
            # Note: Redis cluster deployment for Kubernetes would need additional StatefulSet configurations
            warn "Redis cluster deployment for Kubernetes requires additional configuration"
            ;;
        "docker-compose")
            docker-compose -f infrastructure/cache/redis-cluster.yml up -d
            ;;
    esac
    
    # Wait for Redis cluster to be ready
    log "Waiting for Redis cluster to be ready..."
    sleep 30
    
    # Verify cluster status
    if docker exec technovastore-redis-master-1 redis-cli -a $REDIS_PASSWORD cluster info | grep -q "cluster_state:ok"; then
        log "Redis cluster is ready and healthy"
    else
        warn "Redis cluster may not be fully ready. Check logs for details."
    fi
}

# Deploy CDN infrastructure
deploy_cdn() {
    log "Deploying CDN infrastructure..."
    
    case $DEPLOYMENT_TYPE in
        "docker-swarm")
            docker stack deploy -c infrastructure/cdn/cdn-deployment.yml technovastore-cdn
            ;;
        "kubernetes")
            warn "CDN deployment for Kubernetes requires additional configuration"
            ;;
        "docker-compose")
            docker-compose -f infrastructure/cdn/cdn-deployment.yml up -d
            ;;
    esac
    
    log "CDN infrastructure deployed"
}

# Deploy auto-scaling infrastructure
deploy_autoscaling() {
    log "Deploying auto-scaling infrastructure..."
    
    case $DEPLOYMENT_TYPE in
        "docker-swarm")
            docker stack deploy -c infrastructure/scaling/docker-swarm.yml technovastore
            
            # Start auto-scaling monitor
            log "Starting auto-scaling monitor..."
            node infrastructure/scaling/auto-scaling-monitor.js &
            echo $! > /tmp/autoscaling-monitor.pid
            ;;
        "kubernetes")
            kubectl apply -f infrastructure/scaling/kubernetes/namespace.yaml
            kubectl apply -f infrastructure/scaling/kubernetes/deployments.yaml
            kubectl apply -f infrastructure/scaling/kubernetes/hpa.yaml
            
            log "Kubernetes HPA (Horizontal Pod Autoscaler) deployed"
            ;;
        "docker-compose")
            warn "Auto-scaling with docker-compose is limited. Consider using Docker Swarm or Kubernetes for production."
            ;;
    esac
    
    log "Auto-scaling infrastructure deployed"
}

# Configure load balancer
configure_load_balancer() {
    log "Configuring load balancer..."
    
    # Copy NGINX configuration
    case $DEPLOYMENT_TYPE in
        "docker-swarm")
            # NGINX is included in the swarm stack
            log "NGINX load balancer configured via Docker Swarm"
            ;;
        "kubernetes")
            # Would typically use an Ingress controller
            warn "Load balancer configuration for Kubernetes requires Ingress controller setup"
            ;;
        "docker-compose")
            # NGINX is included in the compose file
            log "NGINX load balancer configured via docker-compose"
            ;;
    esac
}

# Setup monitoring for scalability
setup_monitoring() {
    log "Setting up scalability monitoring..."
    
    # Start cache manager
    log "Starting distributed cache manager..."
    node infrastructure/cache/cache-manager.js &
    echo $! > /tmp/cache-manager.pid
    
    # Configure Prometheus for scalability metrics
    if [ -f "infrastructure/prometheus/prometheus.yml" ]; then
        log "Prometheus configuration found, updating for scalability metrics..."
        # Add scalability-specific scrape configs if needed
    fi
    
    log "Scalability monitoring configured"
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check Redis cluster
    if docker exec technovastore-redis-master-1 redis-cli -a $REDIS_PASSWORD ping | grep -q "PONG"; then
        log "✅ Redis cluster is responding"
    else
        error "❌ Redis cluster is not responding"
    fi
    
    # Check CDN server
    if curl -f http://localhost:8080/health &> /dev/null; then
        log "✅ CDN server is responding"
    else
        warn "⚠️ CDN server may not be ready yet"
    fi
    
    # Check auto-scaling monitor
    if [ -f "/tmp/autoscaling-monitor.pid" ] && kill -0 $(cat /tmp/autoscaling-monitor.pid) 2>/dev/null; then
        log "✅ Auto-scaling monitor is running"
    else
        warn "⚠️ Auto-scaling monitor may not be running"
    fi
    
    # Check cache manager
    if [ -f "/tmp/cache-manager.pid" ] && kill -0 $(cat /tmp/cache-manager.pid) 2>/dev/null; then
        log "✅ Cache manager is running"
    else
        warn "⚠️ Cache manager may not be running"
    fi
    
    log "Deployment verification completed"
}

# Cleanup function
cleanup() {
    log "Cleaning up..."
    
    # Stop background processes
    if [ -f "/tmp/autoscaling-monitor.pid" ]; then
        kill $(cat /tmp/autoscaling-monitor.pid) 2>/dev/null || true
        rm -f /tmp/autoscaling-monitor.pid
    fi
    
    if [ -f "/tmp/cache-manager.pid" ]; then
        kill $(cat /tmp/cache-manager.pid) 2>/dev/null || true
        rm -f /tmp/cache-manager.pid
    fi
}

# Main deployment function
main() {
    log "Starting TechNovaStore scalability deployment"
    log "Environment: $ENVIRONMENT"
    log "Deployment Type: $DEPLOYMENT_TYPE"
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Load environment variables
    if [ -f ".env.$ENVIRONMENT" ]; then
        log "Loading environment variables from .env.$ENVIRONMENT"
        export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)
    else
        warn "Environment file .env.$ENVIRONMENT not found"
    fi
    
    # Execute deployment steps
    check_prerequisites
    create_directories
    deploy_redis_cluster
    deploy_cdn
    deploy_autoscaling
    configure_load_balancer
    setup_monitoring
    verify_deployment
    
    log "🎉 TechNovaStore scalability infrastructure deployed successfully!"
    log "📊 Monitor the deployment with:"
    log "   - Grafana: http://localhost:3013"
    log "   - Prometheus: http://localhost:9090"
    log "   - CDN Health: http://localhost:8080/health"
    
    if [ "$DEPLOYMENT_TYPE" = "kubernetes" ]; then
        log "   - Kubernetes Dashboard: kubectl proxy"
        log "   - HPA Status: kubectl get hpa -n technovastore"
    fi
}

# Show usage
show_usage() {
    echo "Usage: $0 [environment] [deployment-type]"
    echo ""
    echo "Arguments:"
    echo "  environment     Environment to deploy (default: production)"
    echo "  deployment-type Deployment type: docker-swarm, kubernetes, or docker-compose (default: docker-swarm)"
    echo ""
    echo "Examples:"
    echo "  $0 production docker-swarm"
    echo "  $0 staging kubernetes"
    echo "  $0 development docker-compose"
}

# Handle command line arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_usage
    exit 0
fi

# Run main function
main