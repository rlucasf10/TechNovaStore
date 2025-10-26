#!/bin/bash

# TechNovaStore Deployment Script
# Usage: ./scripts/deploy.sh [staging|production] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=""
FORCE_DEPLOY=false
SKIP_TESTS=false
SKIP_BACKUP=false
DRY_RUN=false

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [staging|production] [options]"
    echo ""
    echo "Options:"
    echo "  --force         Force deployment even if tests fail"
    echo "  --skip-tests    Skip running tests before deployment"
    echo "  --skip-backup   Skip creating backup before deployment"
    echo "  --dry-run       Show what would be deployed without actually deploying"
    echo "  --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 staging"
    echo "  $0 production --force"
    echo "  $0 staging --skip-tests --dry-run"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        staging|production)
            ENVIRONMENT="$1"
            shift
            ;;
        --force)
            FORCE_DEPLOY=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate environment
if [[ -z "$ENVIRONMENT" ]]; then
    print_error "Environment must be specified (staging or production)"
    show_usage
    exit 1
fi

# Set environment-specific variables
if [[ "$ENVIRONMENT" == "staging" ]]; then
    COMPOSE_FILE="docker-compose.staging.yml"
    ENV_FILE=".env.staging"
    BRANCH="develop"
elif [[ "$ENVIRONMENT" == "production" ]]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    ENV_FILE=".env.production"
    BRANCH="main"
fi

print_status "Starting deployment to $ENVIRONMENT environment"

# Check if we're in the right directory
if [[ ! -f "package.json" ]] || [[ ! -f "$COMPOSE_FILE" ]]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if we're on the correct branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "$BRANCH" ]] && [[ "$FORCE_DEPLOY" != true ]]; then
    print_error "You are on branch '$CURRENT_BRANCH' but trying to deploy '$ENVIRONMENT' which requires branch '$BRANCH'"
    print_warning "Use --force to deploy anyway"
    exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]] && [[ "$FORCE_DEPLOY" != true ]]; then
    print_error "You have uncommitted changes. Please commit or stash them before deploying."
    print_warning "Use --force to deploy anyway"
    exit 1
fi

# Run tests unless skipped
if [[ "$SKIP_TESTS" != true ]] && [[ "$DRY_RUN" != true ]]; then
    print_status "Running tests..."
    
    if ! npm run test:ci; then
        if [[ "$FORCE_DEPLOY" != true ]]; then
            print_error "Tests failed. Use --force to deploy anyway."
            exit 1
        else
            print_warning "Tests failed but continuing due to --force flag"
        fi
    else
        print_success "All tests passed"
    fi
fi

# Check if environment file exists
if [[ ! -f "$ENV_FILE" ]]; then
    print_error "Environment file $ENV_FILE not found"
    print_status "Creating from example file..."
    cp "${ENV_FILE}.example" "$ENV_FILE"
    print_warning "Please edit $ENV_FILE with your actual configuration before deploying"
    exit 1
fi

# Load environment variables
set -a
source "$ENV_FILE"
set +a

if [[ "$DRY_RUN" == true ]]; then
    print_status "DRY RUN - Would deploy the following:"
    echo "  Environment: $ENVIRONMENT"
    echo "  Branch: $BRANCH"
    echo "  Compose file: $COMPOSE_FILE"
    echo "  Environment file: $ENV_FILE"
    echo "  Current commit: $(git rev-parse HEAD)"
    echo "  Skip tests: $SKIP_TESTS"
    echo "  Skip backup: $SKIP_BACKUP"
    echo "  Force deploy: $FORCE_DEPLOY"
    exit 0
fi

# Create backup unless skipped
if [[ "$SKIP_BACKUP" != true ]] && [[ "$ENVIRONMENT" == "production" ]]; then
    print_status "Creating backup..."
    
    BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup databases if they're running
    if docker ps | grep -q "technovastore.*postgresql"; then
        print_status "Backing up PostgreSQL database..."
        docker-compose -f "$COMPOSE_FILE" exec -T postgresql pg_dump -U "$POSTGRES_USER" technovastore > "$BACKUP_DIR/postgresql_backup.sql"
    fi
    
    if docker ps | grep -q "technovastore.*mongodb"; then
        print_status "Backing up MongoDB database..."
        docker-compose -f "$COMPOSE_FILE" exec -T mongodb mongodump --uri="mongodb://$MONGO_ROOT_USERNAME:$MONGO_ROOT_PASSWORD@localhost:27017/technovastore?authSource=admin" --out="$BACKUP_DIR/mongodb_backup"
    fi
    
    print_success "Backup created at $BACKUP_DIR"
fi

# Pull latest code
print_status "Pulling latest code from $BRANCH branch..."
git pull origin "$BRANCH"

# Build and deploy
print_status "Building and deploying services..."

# Login to GitHub Container Registry if credentials are available
if [[ -n "$GITHUB_TOKEN" ]]; then
    print_status "Logging in to GitHub Container Registry..."
    echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_ACTOR" --password-stdin
fi

# Pull latest images
print_status "Pulling latest Docker images..."
docker-compose -f "$COMPOSE_FILE" pull

# Stop existing services gracefully
print_status "Stopping existing services..."
docker-compose -f "$COMPOSE_FILE" down --timeout 30

# Start services
print_status "Starting services..."
docker-compose -f "$COMPOSE_FILE" up -d

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 60

# Health checks
print_status "Running health checks..."

# Check API Gateway
for i in {1..10}; do
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        print_success "API Gateway is healthy"
        break
    fi
    if [[ $i -eq 10 ]]; then
        print_error "API Gateway health check failed after 10 attempts"
        exit 1
    fi
    print_status "Attempt $i: API Gateway not ready, waiting..."
    sleep 10
done

# Check Frontend
for i in {1..10}; do
    if curl -f http://localhost:3011 > /dev/null 2>&1; then
        print_success "Frontend is healthy"
        break
    fi
    if [[ $i -eq 10 ]]; then
        print_error "Frontend health check failed after 10 attempts"
        exit 1
    fi
    print_status "Attempt $i: Frontend not ready, waiting..."
    sleep 10
done

# Check other services (non-blocking)
SERVICES=("product-service:3001" "order-service:3002" "user-service:3003" "payment-service:3004" "notification-service:3005")

for service in "${SERVICES[@]}"; do
    IFS=':' read -r name port <<< "$service"
    if curl -f "http://localhost:$port/health" > /dev/null 2>&1; then
        print_success "$name is healthy"
    else
        print_warning "$name health check failed (non-blocking)"
    fi
done

# Show running containers
print_status "Currently running containers:"
docker-compose -f "$COMPOSE_FILE" ps

# Show logs for any failed containers
FAILED_CONTAINERS=$(docker-compose -f "$COMPOSE_FILE" ps --filter "status=exited" --format "table {{.Service}}" | tail -n +2)
if [[ -n "$FAILED_CONTAINERS" ]]; then
    print_warning "Some containers failed to start:"
    echo "$FAILED_CONTAINERS"
    print_status "Showing logs for failed containers..."
    echo "$FAILED_CONTAINERS" | while read -r container; do
        if [[ -n "$container" ]]; then
            print_status "Logs for $container:"
            docker-compose -f "$COMPOSE_FILE" logs --tail=50 "$container"
        fi
    done
fi

print_success "Deployment to $ENVIRONMENT completed successfully!"
print_status "Application is available at:"
if [[ "$ENVIRONMENT" == "staging" ]]; then
    echo "  Frontend: http://localhost:3011"
    echo "  API: http://localhost:3000"
else
    echo "  Frontend: https://technovastore.com"
    echo "  API: https://api.technovastore.com"
fi

print_status "To view logs: docker-compose -f $COMPOSE_FILE logs -f"
print_status "To stop services: docker-compose -f $COMPOSE_FILE down"