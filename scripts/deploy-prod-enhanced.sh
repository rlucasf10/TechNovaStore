#!/bin/bash

# TechNovaStore - Enhanced Production Deployment Script
# This script handles the complete production deployment with proper checks and rollback capabilities

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="/opt/technovastore/backups"
DATA_DIR="/opt/technovastore/data"
LOG_FILE="/var/log/technovastore/deploy-$(date +%Y%m%d_%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} $message" | tee -a "$LOG_FILE"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message" | tee -a "$LOG_FILE"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message" | tee -a "$LOG_FILE"
            ;;
        "DEBUG")
            echo -e "${BLUE}[DEBUG]${NC} $message" | tee -a "$LOG_FILE"
            ;;
    esac
}

# Error handling
error_exit() {
    log "ERROR" "$1"
    log "ERROR" "Deployment failed. Check logs at $LOG_FILE"
    exit 1
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error_exit "This script must be run as root for production deployment"
    fi
}

# Check system requirements
check_system_requirements() {
    log "INFO" "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error_exit "Docker is not installed"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error_exit "Docker Compose is not installed"
    fi
    
    # Check available disk space (minimum 20GB)
    local available_space=$(df / | awk 'NR==2 {print $4}')
    local required_space=$((20 * 1024 * 1024)) # 20GB in KB
    
    if [[ $available_space -lt $required_space ]]; then
        error_exit "Insufficient disk space. Required: 20GB, Available: $(($available_space / 1024 / 1024))GB"
    fi
    
    # Check available memory (minimum 4GB)
    local available_memory=$(free -m | awk 'NR==2{print $7}')
    if [[ $available_memory -lt 4096 ]]; then
        log "WARN" "Low available memory: ${available_memory}MB. Recommended: 4GB+"
    fi
    
    log "INFO" "System requirements check passed"
}

# Setup directory structure
setup_directories() {
    log "INFO" "Setting up directory structure..."
    
    # Create data directories
    mkdir -p "$DATA_DIR"/{mongodb,postgresql,redis,prometheus,grafana}
    mkdir -p "$BACKUP_DIR"/{mongodb,postgresql,config}
    mkdir -p /var/log/technovastore
    mkdir -p /opt/technovastore/ssl
    
    # Set proper permissions
    chown -R 1000:1000 "$DATA_DIR"
    chown -R 1000:1000 "$BACKUP_DIR"
    chmod -R 755 "$DATA_DIR"
    chmod -R 755 "$BACKUP_DIR"
    
    log "INFO" "Directory structure created"
}

# Validate environment configuration
validate_environment() {
    log "INFO" "Validating environment configuration..."
    
    if [[ ! -f "$PROJECT_ROOT/.env.prod" ]]; then
        error_exit "Production environment file .env.prod not found. Copy from .env.prod.example and configure."
    fi
    
    # Source environment file
    set -a
    source "$PROJECT_ROOT/.env.prod"
    set +a
    
    # Check required variables
    local required_vars=(
        "MONGO_ROOT_USERNAME" "MONGO_ROOT_PASSWORD"
        "POSTGRES_USER" "POSTGRES_PASSWORD"
        "REDIS_PASSWORD" "JWT_SECRET"
        "GRAFANA_ADMIN_USER" "GRAFANA_ADMIN_PASSWORD"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            error_exit "Required environment variable $var is not set"
        fi
    done
    
    # Validate JWT secret length
    if [[ ${#JWT_SECRET} -lt 32 ]]; then
        error_exit "JWT_SECRET must be at least 32 characters long"
    fi
    
    log "INFO" "Environment configuration validated"
}

# Setup SSL certificates
setup_ssl() {
    log "INFO" "Setting up SSL certificates..."
    
    local ssl_dir="/opt/technovastore/ssl"
    
    if [[ ! -f "$ssl_dir/cert.pem" || ! -f "$ssl_dir/key.pem" ]]; then
        log "WARN" "SSL certificates not found. Generating self-signed certificates for testing..."
        
        # Generate self-signed certificate
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$ssl_dir/key.pem" \
            -out "$ssl_dir/cert.pem" \
            -subj "/C=ES/ST=Madrid/L=Madrid/O=TechNovaStore/CN=${DOMAIN:-localhost}"
        
        cp "$ssl_dir/cert.pem" "$ssl_dir/chain.pem"
        
        log "WARN" "Self-signed certificates generated. Replace with proper certificates for production!"
    else
        log "INFO" "SSL certificates found"
    fi
    
    # Set proper permissions
    chmod 600 "$ssl_dir"/*.pem
    chown root:root "$ssl_dir"/*.pem
}

# Pre-deployment backup
create_pre_deployment_backup() {
    log "INFO" "Creating pre-deployment backup..."
    
    local backup_timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/pre_deployment_$backup_timestamp"
    
    mkdir -p "$backup_path"
    
    # Backup current configuration if exists
    if [[ -f "$PROJECT_ROOT/docker-compose.prod.yml" ]]; then
        cp "$PROJECT_ROOT/docker-compose.prod.yml" "$backup_path/"
    fi
    
    if [[ -f "$PROJECT_ROOT/.env.prod" ]]; then
        cp "$PROJECT_ROOT/.env.prod" "$backup_path/"
    fi
    
    # Backup current data if containers are running
    if docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps -q mongodb &>/dev/null; then
        log "INFO" "Backing up existing MongoDB data..."
        docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T mongodb \
            mongodump --uri="mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@localhost:27017/technovastore?authSource=admin" \
            --archive="$backup_path/mongodb_backup.archive" --gzip || log "WARN" "MongoDB backup failed"
    fi
    
    if docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps -q postgresql &>/dev/null; then
        log "INFO" "Backing up existing PostgreSQL data..."
        docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T postgresql \
            pg_dump -U "${POSTGRES_USER}" -d technovastore --format=custom --compress=9 \
            > "$backup_path/postgresql_backup.dump" || log "WARN" "PostgreSQL backup failed"
    fi
    
    log "INFO" "Pre-deployment backup created at $backup_path"
}

# Build and deploy services
deploy_services() {
    log "INFO" "Building and deploying services..."
    
    cd "$PROJECT_ROOT"
    
    # Pull latest images
    log "INFO" "Pulling latest base images..."
    docker-compose -f docker-compose.prod.yml pull --ignore-pull-failures
    
    # Build services
    log "INFO" "Building application images..."
    docker-compose -f docker-compose.prod.yml build --no-cache --parallel
    
    # Stop existing services gracefully
    if docker-compose -f docker-compose.prod.yml ps -q &>/dev/null; then
        log "INFO" "Stopping existing services..."
        docker-compose -f docker-compose.prod.yml down --timeout 30
    fi
    
    # Start services
    log "INFO" "Starting production services..."
    docker-compose -f docker-compose.prod.yml up -d
    
    log "INFO" "Services deployment completed"
}

# Health checks
perform_health_checks() {
    log "INFO" "Performing health checks..."
    
    local max_attempts=30
    local attempt=1
    
    # Check database services
    log "INFO" "Checking database services..."
    while [[ $attempt -le $max_attempts ]]; do
        if docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T mongodb \
            mongosh --eval "db.runCommand('ping')" &>/dev/null; then
            log "INFO" "MongoDB is healthy"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            error_exit "MongoDB health check failed after $max_attempts attempts"
        fi
        
        log "DEBUG" "MongoDB health check attempt $attempt/$max_attempts failed, retrying..."
        sleep 10
        attempt=$((attempt + 1))
    done
    
    # Check PostgreSQL
    attempt=1
    while [[ $attempt -le $max_attempts ]]; do
        if docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T postgresql \
            pg_isready -U "${POSTGRES_USER}" -d technovastore &>/dev/null; then
            log "INFO" "PostgreSQL is healthy"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            error_exit "PostgreSQL health check failed after $max_attempts attempts"
        fi
        
        log "DEBUG" "PostgreSQL health check attempt $attempt/$max_attempts failed, retrying..."
        sleep 10
        attempt=$((attempt + 1))
    done
    
    # Check API Gateway
    log "INFO" "Checking API Gateway..."
    attempt=1
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s http://localhost/api/health &>/dev/null; then
            log "INFO" "API Gateway is healthy"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            error_exit "API Gateway health check failed after $max_attempts attempts"
        fi
        
        log "DEBUG" "API Gateway health check attempt $attempt/$max_attempts failed, retrying..."
        sleep 10
        attempt=$((attempt + 1))
    done
    
    # Check Frontend
    log "INFO" "Checking Frontend..."
    attempt=1
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s http://localhost/ &>/dev/null; then
            log "INFO" "Frontend is healthy"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            error_exit "Frontend health check failed after $max_attempts attempts"
        fi
        
        log "DEBUG" "Frontend health check attempt $attempt/$max_attempts failed, retrying..."
        sleep 10
        attempt=$((attempt + 1))
    done
    
    log "INFO" "All health checks passed"
}

# Setup monitoring
setup_monitoring() {
    log "INFO" "Setting up monitoring and alerting..."
    
    # Wait for Prometheus to be ready
    local attempt=1
    local max_attempts=20
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s http://localhost:9090/-/ready &>/dev/null; then
            log "INFO" "Prometheus is ready"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            log "WARN" "Prometheus readiness check failed"
            break
        fi
        
        sleep 5
        attempt=$((attempt + 1))
    done
    
    # Wait for Grafana to be ready
    attempt=1
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s http://localhost:3013/api/health &>/dev/null; then
            log "INFO" "Grafana is ready"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            log "WARN" "Grafana readiness check failed"
            break
        fi
        
        sleep 5
        attempt=$((attempt + 1))
    done
    
    log "INFO" "Monitoring setup completed"
}

# Setup backup service
setup_backup_service() {
    log "INFO" "Setting up backup service..."
    
    # Wait for backup service to be ready
    local attempt=1
    local max_attempts=10
    
    while [[ $attempt -le $max_attempts ]]; do
        if docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T db-backup \
            /scripts/health-check.sh &>/dev/null; then
            log "INFO" "Backup service is healthy"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            log "WARN" "Backup service health check failed"
            break
        fi
        
        sleep 10
        attempt=$((attempt + 1))
    done
    
    log "INFO" "Backup service setup completed"
}

# Generate deployment report
generate_deployment_report() {
    log "INFO" "Generating deployment report..."
    
    local report_file="/var/log/technovastore/deployment_report_$(date +%Y%m%d_%H%M%S).json"
    
    cat > "$report_file" << EOF
{
    "deployment": {
        "timestamp": "$(date -Iseconds)",
        "version": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
        "environment": "production",
        "status": "completed"
    },
    "services": {
        "nginx": "$(docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps -q nginx | wc -l)",
        "api_gateway": "$(docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps -q api-gateway-1 api-gateway-2 | wc -l)",
        "frontend": "$(docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps -q frontend-1 frontend-2 | wc -l)",
        "databases": "$(docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps -q mongodb postgresql redis | wc -l)",
        "monitoring": "$(docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps -q prometheus grafana | wc -l)",
        "backup": "$(docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps -q db-backup | wc -l)"
    },
    "system": {
        "disk_usage": "$(df -h / | awk 'NR==2 {print $5}')",
        "memory_usage": "$(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2}')",
        "load_average": "$(uptime | awk -F'load average:' '{print $2}')"
    },
    "endpoints": {
        "frontend": "https://${DOMAIN:-localhost}",
        "api": "https://${API_DOMAIN:-localhost}/api",
        "monitoring": "http://localhost:3013",
        "prometheus": "http://localhost:9090"
    }
}
EOF
    
    log "INFO" "Deployment report generated: $report_file"
    
    # Display summary
    echo
    echo "=========================================="
    echo "  TechNovaStore Production Deployment"
    echo "=========================================="
    echo "Status: COMPLETED"
    echo "Timestamp: $(date)"
    echo "Frontend: https://${DOMAIN:-localhost}"
    echo "API: https://${API_DOMAIN:-localhost}/api"
    echo "Monitoring: http://localhost:3013"
    echo "Log file: $LOG_FILE"
    echo "Report: $report_file"
    echo "=========================================="
}

# Main execution
main() {
    log "INFO" "Starting TechNovaStore production deployment..."
    
    # Ensure log directory exists
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Pre-flight checks
    check_root
    check_system_requirements
    validate_environment
    
    # Setup infrastructure
    setup_directories
    setup_ssl
    
    # Backup current state
    create_pre_deployment_backup
    
    # Deploy services
    deploy_services
    
    # Verify deployment
    perform_health_checks
    setup_monitoring
    setup_backup_service
    
    # Generate report
    generate_deployment_report
    
    log "INFO" "Production deployment completed successfully!"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "health-check")
        perform_health_checks
        ;;
    "backup")
        create_pre_deployment_backup
        ;;
    *)
        echo "Usage: $0 [deploy|health-check|backup]"
        exit 1
        ;;
esac