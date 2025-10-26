# TechNovaStore Makefile

.PHONY: help install build dev test lint format clean docker-up docker-down docker-build docker-logs

# Default target
help:
	@echo "Available commands:"
	@echo "  install      - Install all dependencies"
	@echo "  build        - Build all services"
	@echo "  dev          - Start development environment"
	@echo "  test         - Run all tests"
	@echo "  lint         - Run linting"
	@echo "  format       - Format code"
	@echo "  clean        - Clean build artifacts"
	@echo "  docker-up    - Start Docker services"
	@echo "  docker-down  - Stop Docker services"
	@echo "  docker-build - Build Docker images"
	@echo "  docker-logs  - Show Docker logs"

# Install dependencies
install:
	npm install
	@echo "Installing dependencies for all services..."
	cd frontend && npm install
	cd api-gateway && npm install
	cd services/product && npm install
	cd services/order && npm install
	cd services/user && npm install
	cd services/payment && npm install
	cd services/notification && npm install
	cd automation/sync-engine && npm install
	cd automation/auto-purchase && npm install
	cd automation/shipment-tracker && npm install
	cd ai-services/chatbot && npm install
	cd ai-services/recommender && npm install

# Build all services
build:
	npm run build

# Start development environment
dev:
	docker-compose up -d mongodb postgresql redis
	npm run dev

# Run tests
test:
	npm run test

# Run integration tests
test-integration:
	npm run test:integration

# Run E2E tests
test-e2e:
	npm run test:e2e

# Run linting
lint:
	npm run lint

# Fix linting issues
lint-fix:
	npm run lint:fix

# Format code
format:
	npm run format

# Check formatting
format-check:
	npm run format:check

# Clean build artifacts
clean:
	rm -rf dist/
	rm -rf build/
	rm -rf coverage/
	rm -rf node_modules/
	find . -name "node_modules" -type d -exec rm -rf {} +
	find . -name "dist" -type d -exec rm -rf {} +

# Docker commands
docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-build:
	docker-compose build

docker-logs:
	docker-compose logs -f

docker-clean:
	docker-compose down -v
	docker system prune -f

# Production commands
prod-build:
	docker-compose -f docker-compose.prod.yml build

prod-up:
	docker-compose -f docker-compose.prod.yml up -d

prod-down:
	docker-compose -f docker-compose.prod.yml down

# Database commands
db-migrate:
	@echo "Running database migrations..."
	# Add migration commands here

db-seed:
	@echo "Seeding database..."
	# Add seed commands here

# Git flow commands
feature-start:
	@read -p "Enter feature name: " feature; \
	git checkout develop && \
	git pull origin develop && \
	git checkout -b feature/$$feature

feature-finish:
	@current_branch=$$(git branch --show-current); \
	if [[ $$current_branch == feature/* ]]; then \
		git checkout develop && \
		git pull origin develop && \
		git merge $$current_branch && \
		git branch -d $$current_branch && \
		git push origin develop; \
	else \
		echo "Not on a feature branch"; \
	fi

release-start:
	@read -p "Enter version (e.g., 1.0.0): " version; \
	git checkout develop && \
	git pull origin develop && \
	git checkout -b release/$$version

release-finish:
	@current_branch=$$(git branch --show-current); \
	if [[ $$current_branch == release/* ]]; then \
		version=$${current_branch#release/}; \
		git checkout master && \
		git pull origin master && \
		git merge $$current_branch && \
		git tag -a v$$version -m "Release version $$version" && \
		git checkout develop && \
		git merge $$current_branch && \
		git branch -d $$current_branch && \
		git push origin master develop --tags; \
	else \
		echo "Not on a release branch"; \
	fi