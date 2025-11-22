# TechNovaStore Makefile
# Arquitectura: Screaming Architecture con Dominios de Negocio

.PHONY: help install build dev test lint format clean docker-up docker-down docker-build docker-logs
.PHONY: install-catalog install-commerce install-customer install-support install-platform
.PHONY: build-catalog build-commerce build-customer build-support build-platform
.PHONY: test-catalog test-commerce test-customer test-support test-platform test-integration test-e2e
.PHONY: dev-core dev-full docker-rebuild docker-logs-service docker-restart docker-restart-service docker-ps docker-stats
.PHONY: prod-build prod-up prod-down prod-logs prod-ps
.PHONY: db-migrate db-seed db-backup db-restore
.PHONY: feature-start feature-finish release-start release-finish
.PHONY: check-structure monitor health-check validate info clean-all

# Default target
help:
	@echo "=== TechNovaStore - Comandos Disponibles ==="
	@echo ""
	@echo "📦 Instalación:"
	@echo "  install              - Instalar todas las dependencias"
	@echo "  install-catalog      - Instalar dependencias del dominio Catalog"
	@echo "  install-commerce     - Instalar dependencias del dominio Commerce"
	@echo "  install-customer     - Instalar dependencias del dominio Customer"
	@echo "  install-support      - Instalar dependencias del dominio Support"
	@echo "  install-platform     - Instalar dependencias del dominio Platform"
	@echo ""
	@echo "🔨 Compilación:"
	@echo "  build                - Compilar todos los servicios"
	@echo "  build-catalog        - Compilar servicios del dominio Catalog"
	@echo "  build-commerce       - Compilar servicios del dominio Commerce"
	@echo "  build-customer       - Compilar servicios del dominio Customer"
	@echo "  build-support        - Compilar servicios del dominio Support"
	@echo "  build-platform       - Compilar servicios del dominio Platform"
	@echo ""
	@echo "🧪 Testing:"
	@echo "  test                 - Ejecutar todos los tests"
	@echo "  test-catalog         - Ejecutar tests del dominio Catalog"
	@echo "  test-commerce        - Ejecutar tests del dominio Commerce"
	@echo "  test-customer        - Ejecutar tests del dominio Customer"
	@echo "  test-support         - Ejecutar tests del dominio Support"
	@echo "  test-platform        - Ejecutar tests del dominio Platform"
	@echo "  test-integration     - Ejecutar tests de integración"
	@echo "  test-e2e             - Ejecutar tests E2E"
	@echo ""
	@echo "🔍 Calidad de Código:"
	@echo "  lint                 - Ejecutar linting en todos los servicios"
	@echo "  lint-fix             - Corregir problemas de linting"
	@echo "  format               - Formatear código"
	@echo "  format-check         - Verificar formato de código"
	@echo ""
	@echo "🐳 Docker:"
	@echo "  docker-up            - Iniciar servicios Docker (optimized)"
	@echo "  docker-down          - Detener servicios Docker"
	@echo "  docker-build         - Construir imágenes Docker"
	@echo "  docker-logs          - Ver logs de Docker"
	@echo "  docker-clean         - Limpiar contenedores y volúmenes"
	@echo "  docker-restart       - Reiniciar todos los servicios"
	@echo ""
	@echo "🚀 Producción:"
	@echo "  prod-build           - Construir para producción"
	@echo "  prod-up              - Iniciar en producción"
	@echo "  prod-down            - Detener producción"
	@echo ""
	@echo "🗄️  Base de Datos:"
	@echo "  db-migrate           - Ejecutar migraciones"
	@echo "  db-seed              - Poblar base de datos"
	@echo ""
	@echo "🧹 Limpieza:"
	@echo "  clean                - Limpiar artefactos de compilación"
	@echo "  clean-all            - Limpieza completa (incluye node_modules)"
	@echo ""
	@echo "🌿 Git Flow:"
	@echo "  feature-start        - Iniciar nueva feature"
	@echo "  feature-finish       - Finalizar feature"
	@echo "  release-start        - Iniciar release"
	@echo "  release-finish       - Finalizar release"
	@echo ""
	@echo "🛠️  Utilidades:"
	@echo "  check-structure      - Verificar estructura de dominios"
	@echo "  monitor              - Monitorear servicios"
	@echo "  health-check         - Health check de servicios"
	@echo "  validate             - Validar todos los servicios"
	@echo "  info                 - Ver información del proyecto"

# ============================================================================
# INSTALACIÓN DE DEPENDENCIAS
# ============================================================================

# Instalar todas las dependencias
install:
	@echo "📦 Instalando dependencias raíz..."
	npm install
	@echo ""
	@echo "📦 Instalando dependencias de todos los dominios..."
	$(MAKE) install-catalog
	$(MAKE) install-commerce
	$(MAKE) install-customer
	$(MAKE) install-support
	$(MAKE) install-platform
	@echo ""
	@echo "✅ Todas las dependencias instaladas correctamente"

# Instalar dependencias por dominio
install-catalog:
	@echo "📦 Instalando dependencias del dominio CATALOG..."
	cd domains/catalog/product-service && npm install
	cd domains/catalog/sync-engine && npm install
	cd domains/catalog/recommender-service && npm install

install-commerce:
	@echo "📦 Instalando dependencias del dominio COMMERCE..."
	cd domains/commerce/order-service && npm install
	cd domains/commerce/payment-service && npm install
	cd domains/commerce/auto-purchase-service && npm install

install-customer:
	@echo "📦 Instalando dependencias del dominio CUSTOMER..."
	cd domains/customer/user-service && npm install
	cd domains/customer/notification-service && npm install

install-support:
	@echo "📦 Instalando dependencias del dominio SUPPORT..."
	cd domains/support/ticket-service && npm install
	cd domains/support/chatbot-service && npm install
	cd domains/support/shipment-tracker && npm install

install-platform:
	@echo "📦 Instalando dependencias del dominio PLATFORM..."
	cd domains/platform/api-gateway && npm install
	cd domains/platform/frontend && npm install

# ============================================================================
# COMPILACIÓN
# ============================================================================

# Compilar todos los servicios
build:
	@echo "🔨 Compilando todos los servicios..."
	$(MAKE) build-catalog
	$(MAKE) build-commerce
	$(MAKE) build-customer
	$(MAKE) build-support
	$(MAKE) build-platform
	@echo ""
	@echo "✅ Todos los servicios compilados correctamente"

# Compilar por dominio
build-catalog:
	@echo "🔨 Compilando servicios del dominio CATALOG..."
	cd domains/catalog/product-service && npm run build
	cd domains/catalog/sync-engine && npm run build
	cd domains/catalog/recommender-service && npm run build

build-commerce:
	@echo "🔨 Compilando servicios del dominio COMMERCE..."
	cd domains/commerce/order-service && npm run build
	cd domains/commerce/payment-service && npm run build
	cd domains/commerce/auto-purchase-service && npm run build

build-customer:
	@echo "🔨 Compilando servicios del dominio CUSTOMER..."
	cd domains/customer/user-service && npm run build
	cd domains/customer/notification-service && npm run build

build-support:
	@echo "🔨 Compilando servicios del dominio SUPPORT..."
	cd domains/support/ticket-service && npm run build
	cd domains/support/chatbot-service && npm run build
	cd domains/support/shipment-tracker && npm run build

build-platform:
	@echo "🔨 Compilando servicios del dominio PLATFORM..."
	cd domains/platform/api-gateway && npm run build
	@echo "⚠️  Frontend se compila en Docker (npm run dev en desarrollo)"

# ============================================================================
# DESARROLLO
# ============================================================================

# Iniciar entorno de desarrollo
dev:
	@echo "🚀 Iniciando entorno de desarrollo..."
	docker-compose -f docker-compose.optimized.yml up -d mongodb postgresql redis
	@echo "✅ Bases de datos iniciadas"
	@echo "💡 Para iniciar servicios específicos, usa docker-compose -f docker-compose.optimized.yml up -d <servicio>"

# Iniciar desarrollo con servicios core
dev-core:
	@echo "🚀 Iniciando servicios core..."
	docker-compose -f docker-compose.optimized.yml up -d mongodb postgresql redis
	docker-compose -f docker-compose.optimized.yml up -d api-gateway frontend
	docker-compose -f docker-compose.optimized.yml up -d product-service order-service user-service

# Iniciar desarrollo completo
dev-full:
	@echo "🚀 Iniciando todos los servicios..."
	docker-compose -f docker-compose.optimized.yml up -d

# ============================================================================
# TESTING
# ============================================================================

# Ejecutar todos los tests
test:
	@echo "🧪 Ejecutando todos los tests..."
	$(MAKE) test-catalog
	$(MAKE) test-commerce
	$(MAKE) test-customer
	$(MAKE) test-support
	$(MAKE) test-platform
	@echo ""
	@echo "✅ Todos los tests completados"

# Tests por dominio
test-catalog:
	@echo "🧪 Ejecutando tests del dominio CATALOG..."
	cd domains/catalog/product-service && npm test
	cd domains/catalog/sync-engine && npm test
	cd domains/catalog/recommender-service && npm test

test-commerce:
	@echo "🧪 Ejecutando tests del dominio COMMERCE..."
	cd domains/commerce/order-service && npm test
	cd domains/commerce/payment-service && npm test
	cd domains/commerce/auto-purchase-service && npm test

test-customer:
	@echo "🧪 Ejecutando tests del dominio CUSTOMER..."
	cd domains/customer/user-service && npm test
	cd domains/customer/notification-service && npm test

test-support:
	@echo "🧪 Ejecutando tests del dominio SUPPORT..."
	cd domains/support/ticket-service && npm test
	cd domains/support/chatbot-service && npm test
	cd domains/support/shipment-tracker && npm test

test-platform:
	@echo "🧪 Ejecutando tests del dominio PLATFORM..."
	cd domains/platform/api-gateway && npm test
	@echo "⚠️  Frontend tests se ejecutan con npm test en el contenedor"

# Tests de integración
test-integration:
	@echo "🧪 Ejecutando tests de integración..."
	npm run test:integration

# Tests E2E
test-e2e:
	@echo "🧪 Ejecutando tests E2E..."
	npm run test:e2e

# ============================================================================
# CALIDAD DE CÓDIGO
# ============================================================================

# Ejecutar linting en todos los servicios
lint:
	@echo "🔍 Ejecutando linting en todos los servicios..."
	npm run lint
	@echo "✅ Linting completado"

# Corregir problemas de linting
lint-fix:
	@echo "🔧 Corrigiendo problemas de linting..."
	npm run lint:fix
	@echo "✅ Linting corregido"

# Formatear código
format:
	@echo "✨ Formateando código..."
	npm run format
	@echo "✅ Código formateado"

# Verificar formato de código
format-check:
	@echo "🔍 Verificando formato de código..."
	npm run format:check
	@echo "✅ Verificación de formato completada"

# ============================================================================
# LIMPIEZA
# ============================================================================

# Limpiar artefactos de compilación
clean:
	@echo "🧹 Limpiando artefactos de compilación..."
	rm -rf dist/
	rm -rf build/
	rm -rf coverage/
	find domains/ -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
	find domains/ -name "build" -type d -exec rm -rf {} + 2>/dev/null || true
	find domains/ -name "coverage" -type d -exec rm -rf {} + 2>/dev/null || true
	@echo "✅ Artefactos de compilación eliminados"

# Limpieza completa (incluye node_modules)
clean-all:
	@echo "🧹 Limpieza completa (incluye node_modules)..."
	rm -rf node_modules/
	find domains/ -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
	$(MAKE) clean
	@echo "✅ Limpieza completa finalizada"

# ============================================================================
# DOCKER
# ============================================================================

# Iniciar servicios Docker (optimized)
docker-up:
	@echo "🐳 Iniciando servicios Docker (optimized)..."
	docker-compose -f docker-compose.optimized.yml up -d
	@echo "✅ Servicios Docker iniciados"

# Detener servicios Docker
docker-down:
	@echo "🐳 Deteniendo servicios Docker..."
	docker-compose -f docker-compose.optimized.yml down
	@echo "✅ Servicios Docker detenidos"

# Construir imágenes Docker
docker-build:
	@echo "🐳 Construyendo imágenes Docker..."
	docker-compose -f docker-compose.optimized.yml build
	@echo "✅ Imágenes Docker construidas"

# Reconstruir y reiniciar servicios
docker-rebuild:
	@echo "🐳 Reconstruyendo y reiniciando servicios..."
	docker-compose -f docker-compose.optimized.yml up -d --build
	@echo "✅ Servicios reconstruidos y reiniciados"

# Ver logs de Docker
docker-logs:
	docker-compose -f docker-compose.optimized.yml logs -f

# Ver logs de un servicio específico
docker-logs-service:
	@read -p "Nombre del servicio: " service; \
	docker-compose -f docker-compose.optimized.yml logs -f $$service

# Reiniciar todos los servicios
docker-restart:
	@echo "🐳 Reiniciando todos los servicios..."
	docker-compose -f docker-compose.optimized.yml restart
	@echo "✅ Servicios reiniciados"

# Reiniciar un servicio específico
docker-restart-service:
	@read -p "Nombre del servicio: " service; \
	docker-compose -f docker-compose.optimized.yml restart $$service

# Limpiar contenedores y volúmenes
docker-clean:
	@echo "🐳 Limpiando contenedores y volúmenes..."
	docker-compose -f docker-compose.optimized.yml down -v
	docker system prune -f
	@echo "✅ Limpieza Docker completada"

# Ver estado de los servicios
docker-ps:
	@echo "🐳 Estado de los servicios Docker:"
	docker-compose -f docker-compose.optimized.yml ps

# Ver uso de recursos
docker-stats:
	@echo "🐳 Uso de recursos de los contenedores:"
	docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

# ============================================================================
# PRODUCCIÓN
# ============================================================================

# Construir para producción
prod-build:
	@echo "🚀 Construyendo para producción..."
	docker-compose -f docker-compose.prod.yml build
	@echo "✅ Build de producción completado"

# Iniciar en producción
prod-up:
	@echo "🚀 Iniciando servicios en producción..."
	docker-compose -f docker-compose.prod.yml up -d
	@echo "✅ Servicios de producción iniciados"

# Detener producción
prod-down:
	@echo "🚀 Deteniendo servicios de producción..."
	docker-compose -f docker-compose.prod.yml down
	@echo "✅ Servicios de producción detenidos"

# Ver logs de producción
prod-logs:
	docker-compose -f docker-compose.prod.yml logs -f

# Ver estado de producción
prod-ps:
	docker-compose -f docker-compose.prod.yml ps

# ============================================================================
# BASE DE DATOS
# ============================================================================

# Ejecutar migraciones
db-migrate:
	@echo "🗄️  Ejecutando migraciones de base de datos..."
	# TODO: Agregar comandos de migración específicos
	@echo "⚠️  Migraciones pendientes de implementar"

# Poblar base de datos
db-seed:
	@echo "🗄️  Poblando base de datos..."
	node scripts/utilities/populate-free-products.js
	@echo "✅ Base de datos poblada"

# Backup de base de datos
db-backup:
	@echo "🗄️  Creando backup de base de datos..."
	# TODO: Agregar comandos de backup
	@echo "⚠️  Backup pendiente de implementar"

# Restaurar base de datos
db-restore:
	@echo "🗄️  Restaurando base de datos..."
	# TODO: Agregar comandos de restauración
	@echo "⚠️  Restauración pendiente de implementar"

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

#
 ============================================================================
# UTILIDADES
# ============================================================================

# Verificar estructura de dominios
check-structure:
	@echo "🔍 Verificando estructura de dominios..."
	@echo ""
	@echo "📁 Dominio CATALOG:"
	@ls -la domains/catalog/ 2>/dev/null || echo "  ⚠️  No encontrado"
	@echo ""
	@echo "📁 Dominio COMMERCE:"
	@ls -la domains/commerce/ 2>/dev/null || echo "  ⚠️  No encontrado"
	@echo ""
	@echo "📁 Dominio CUSTOMER:"
	@ls -la domains/customer/ 2>/dev/null || echo "  ⚠️  No encontrado"
	@echo ""
	@echo "📁 Dominio SUPPORT:"
	@ls -la domains/support/ 2>/dev/null || echo "  ⚠️  No encontrado"
	@echo ""
	@echo "📁 Dominio PLATFORM:"
	@ls -la domains/platform/ 2>/dev/null || echo "  ⚠️  No encontrado"

# Monitorear servicios
monitor:
	@echo "📊 Iniciando monitoreo de servicios..."
	node scripts/utilities/monitor-services.js

# Health check de todos los servicios
health-check:
	@echo "🏥 Verificando salud de los servicios..."
	node scripts/testing/health-check.js
	@echo "✅ Health check completado"

# Validar todos los servicios
validate:
	@echo "✅ Validando todos los servicios..."
	node scripts/testing/validate-all-services.js
	@echo "✅ Validación completada"

# Ver información del proyecto
info:
	@echo "ℹ️  Información del Proyecto TechNovaStore"
	@echo ""
	@echo "📦 Versión: $$(cat package.json | grep version | head -1 | awk -F: '{ print $$2 }' | sed 's/[\",]//g' | tr -d '[[:space:]]')"
	@echo "🏗️  Arquitectura: Screaming Architecture con Dominios"
	@echo ""
	@echo "📁 Dominios:"
	@echo "  - catalog   (product-service, sync-engine, recommender-service)"
	@echo "  - commerce  (order-service, payment-service, auto-purchase-service)"
	@echo "  - customer  (user-service, notification-service)"
	@echo "  - support   (ticket-service, chatbot-service, shipment-tracker)"
	@echo "  - platform  (api-gateway, frontend)"
	@echo ""
	@echo "🐳 Docker Compose: docker-compose.optimized.yml"
	@echo "📚 Documentación: docs/"
	@echo ""
	@echo "💡 Usa 'make help' para ver todos los comandos disponibles"
