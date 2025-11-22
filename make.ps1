# TechNovaStore Make Script para Windows PowerShell
# Arquitectura: Screaming Architecture con Dominios de Negocio

param(
    [Parameter(Position=0)]
    [string]$Command = "help",
    
    [Parameter(Position=1)]
    [string]$Service = ""
)

function Show-Help {
    Write-Host "=== TechNovaStore - Comandos Disponibles ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📦 Instalación:" -ForegroundColor Yellow
    Write-Host "  .\make.ps1 install              - Instalar todas las dependencias"
    Write-Host "  .\make.ps1 install-catalog      - Instalar dependencias del dominio Catalog"
    Write-Host "  .\make.ps1 install-commerce     - Instalar dependencias del dominio Commerce"
    Write-Host "  .\make.ps1 install-customer     - Instalar dependencias del dominio Customer"
    Write-Host "  .\make.ps1 install-support      - Instalar dependencias del dominio Support"
    Write-Host "  .\make.ps1 install-platform     - Instalar dependencias del dominio Platform"
    Write-Host ""
    Write-Host "🔨 Compilación:" -ForegroundColor Yellow
    Write-Host "  .\make.ps1 build                - Compilar todos los servicios"
    Write-Host "  .\make.ps1 build-catalog        - Compilar servicios del dominio Catalog"
    Write-Host "  .\make.ps1 build-commerce       - Compilar servicios del dominio Commerce"
    Write-Host "  .\make.ps1 build-customer       - Compilar servicios del dominio Customer"
    Write-Host "  .\make.ps1 build-support        - Compilar servicios del dominio Support"
    Write-Host "  .\make.ps1 build-platform       - Compilar servicios del dominio Platform"
    Write-Host ""
    Write-Host "🧪 Testing:" -ForegroundColor Yellow
    Write-Host "  .\make.ps1 test                 - Ejecutar todos los tests"
    Write-Host "  .\make.ps1 test-catalog         - Ejecutar tests del dominio Catalog"
    Write-Host "  .\make.ps1 test-commerce        - Ejecutar tests del dominio Commerce"
    Write-Host "  .\make.ps1 test-customer        - Ejecutar tests del dominio Customer"
    Write-Host "  .\make.ps1 test-support         - Ejecutar tests del dominio Support"
    Write-Host "  .\make.ps1 test-platform        - Ejecutar tests del dominio Platform"
    Write-Host "  .\make.ps1 test-integration     - Ejecutar tests de integración"
    Write-Host "  .\make.ps1 test-e2e             - Ejecutar tests E2E"
    Write-Host ""
    Write-Host "🔍 Calidad de Código:" -ForegroundColor Yellow
    Write-Host "  .\make.ps1 lint                 - Ejecutar linting en todos los servicios"
    Write-Host "  .\make.ps1 lint-fix             - Corregir problemas de linting"
    Write-Host "  .\make.ps1 format               - Formatear código"
    Write-Host "  .\make.ps1 format-check         - Verificar formato de código"
    Write-Host ""
    Write-Host "🐳 Docker:" -ForegroundColor Yellow
    Write-Host "  .\make.ps1 docker-up            - Iniciar servicios Docker (optimized)"
    Write-Host "  .\make.ps1 docker-down          - Detener servicios Docker"
    Write-Host "  .\make.ps1 docker-build         - Construir imágenes Docker"
    Write-Host "  .\make.ps1 docker-rebuild       - Reconstruir y reiniciar servicios"
    Write-Host "  .\make.ps1 docker-logs          - Ver logs de Docker"
    Write-Host "  .\make.ps1 docker-logs <srv>    - Ver logs de un servicio específico"
    Write-Host "  .\make.ps1 docker-restart       - Reiniciar todos los servicios"
    Write-Host "  .\make.ps1 docker-restart <srv> - Reiniciar un servicio específico"
    Write-Host "  .\make.ps1 docker-clean         - Limpiar contenedores y volúmenes"
    Write-Host "  .\make.ps1 docker-ps            - Ver estado de los servicios"
    Write-Host "  .\make.ps1 docker-stats         - Ver uso de recursos"
    Write-Host ""
    Write-Host "🚀 Producción:" -ForegroundColor Yellow
    Write-Host "  .\make.ps1 prod-build           - Construir para producción"
    Write-Host "  .\make.ps1 prod-up              - Iniciar en producción"
    Write-Host "  .\make.ps1 prod-down            - Detener producción"
    Write-Host "  .\make.ps1 prod-logs            - Ver logs de producción"
    Write-Host ""
    Write-Host "🗄️  Base de Datos:" -ForegroundColor Yellow
    Write-Host "  .\make.ps1 db-seed              - Poblar base de datos"
    Write-Host ""
    Write-Host "🧹 Limpieza:" -ForegroundColor Yellow
    Write-Host "  .\make.ps1 clean                - Limpiar artefactos de compilación"
    Write-Host "  .\make.ps1 clean-all            - Limpieza completa (incluye node_modules)"
    Write-Host ""
    Write-Host "🛠️  Utilidades:" -ForegroundColor Yellow
    Write-Host "  .\make.ps1 check-structure      - Verificar estructura de dominios"
    Write-Host "  .\make.ps1 health-check         - Health check de servicios"
    Write-Host "  .\make.ps1 validate             - Validar todos los servicios"
    Write-Host "  .\make.ps1 info                 - Ver información del proyecto"
}

function Install-All {
    Write-Host "📦 Instalando dependencias raíz..." -ForegroundColor Cyan
    npm install
    Write-Host ""
    Write-Host "📦 Instalando dependencias de todos los dominios..." -ForegroundColor Cyan
    Install-Catalog
    Install-Commerce
    Install-Customer
    Install-Support
    Install-Platform
    Write-Host ""
    Write-Host "✅ Todas las dependencias instaladas correctamente" -ForegroundColor Green
}

function Install-Catalog {
    Write-Host "📦 Instalando dependencias del dominio CATALOG..." -ForegroundColor Cyan
    Push-Location domains/catalog/product-service; npm install; Pop-Location
    Push-Location domains/catalog/sync-engine; npm install; Pop-Location
    Push-Location domains/catalog/recommender-service; npm install; Pop-Location
}

function Install-Commerce {
    Write-Host "📦 Instalando dependencias del dominio COMMERCE..." -ForegroundColor Cyan
    Push-Location domains/commerce/order-service; npm install; Pop-Location
    Push-Location domains/commerce/payment-service; npm install; Pop-Location
    Push-Location domains/commerce/auto-purchase-service; npm install; Pop-Location
}

function Install-Customer {
    Write-Host "📦 Instalando dependencias del dominio CUSTOMER..." -ForegroundColor Cyan
    Push-Location domains/customer/user-service; npm install; Pop-Location
    Push-Location domains/customer/notification-service; npm install; Pop-Location
}

function Install-Support {
    Write-Host "📦 Instalando dependencias del dominio SUPPORT..." -ForegroundColor Cyan
    Push-Location domains/support/ticket-service; npm install; Pop-Location
    Push-Location domains/support/chatbot-service; npm install; Pop-Location
    Push-Location domains/support/shipment-tracker; npm install; Pop-Location
}

function Install-Platform {
    Write-Host "📦 Instalando dependencias del dominio PLATFORM..." -ForegroundColor Cyan
    Push-Location domains/platform/api-gateway; npm install; Pop-Location
    Push-Location domains/platform/frontend; npm install; Pop-Location
}

function Build-All {
    Write-Host "🔨 Compilando todos los servicios..." -ForegroundColor Cyan
    Build-Catalog
    Build-Commerce
    Build-Customer
    Build-Support
    Build-Platform
    Write-Host ""
    Write-Host "✅ Todos los servicios compilados correctamente" -ForegroundColor Green
}

function Build-Catalog {
    Write-Host "🔨 Compilando servicios del dominio CATALOG..." -ForegroundColor Cyan
    Push-Location domains/catalog/product-service; npm run build; Pop-Location
    Push-Location domains/catalog/sync-engine; npm run build; Pop-Location
    Push-Location domains/catalog/recommender-service; npm run build; Pop-Location
}

function Build-Commerce {
    Write-Host "🔨 Compilando servicios del dominio COMMERCE..." -ForegroundColor Cyan
    Push-Location domains/commerce/order-service; npm run build; Pop-Location
    Push-Location domains/commerce/payment-service; npm run build; Pop-Location
    Push-Location domains/commerce/auto-purchase-service; npm run build; Pop-Location
}

function Build-Customer {
    Write-Host "🔨 Compilando servicios del dominio CUSTOMER..." -ForegroundColor Cyan
    Push-Location domains/customer/user-service; npm run build; Pop-Location
    Push-Location domains/customer/notification-service; npm run build; Pop-Location
}

function Build-Support {
    Write-Host "🔨 Compilando servicios del dominio SUPPORT..." -ForegroundColor Cyan
    Push-Location domains/support/ticket-service; npm run build; Pop-Location
    Push-Location domains/support/chatbot-service; npm run build; Pop-Location
    Push-Location domains/support/shipment-tracker; npm run build; Pop-Location
}

function Build-Platform {
    Write-Host "🔨 Compilando servicios del dominio PLATFORM..." -ForegroundColor Cyan
    Push-Location domains/platform/api-gateway; npm run build; Pop-Location
    Write-Host "⚠️  Frontend se compila en Docker (npm run dev en desarrollo)" -ForegroundColor Yellow
}

function Test-All {
    Write-Host "🧪 Ejecutando todos los tests..." -ForegroundColor Cyan
    Test-Catalog
    Test-Commerce
    Test-Customer
    Test-Support
    Test-Platform
    Write-Host ""
    Write-Host "✅ Todos los tests completados" -ForegroundColor Green
}

function Test-Catalog {
    Write-Host "🧪 Ejecutando tests del dominio CATALOG..." -ForegroundColor Cyan
    Push-Location domains/catalog/product-service; npm test; Pop-Location
    Push-Location domains/catalog/sync-engine; npm test; Pop-Location
    Push-Location domains/catalog/recommender-service; npm test; Pop-Location
}

function Test-Commerce {
    Write-Host "🧪 Ejecutando tests del dominio COMMERCE..." -ForegroundColor Cyan
    Push-Location domains/commerce/order-service; npm test; Pop-Location
    Push-Location domains/commerce/payment-service; npm test; Pop-Location
    Push-Location domains/commerce/auto-purchase-service; npm test; Pop-Location
}

function Test-Customer {
    Write-Host "🧪 Ejecutando tests del dominio CUSTOMER..." -ForegroundColor Cyan
    Push-Location domains/customer/user-service; npm test; Pop-Location
    Push-Location domains/customer/notification-service; npm test; Pop-Location
}

function Test-Support {
    Write-Host "🧪 Ejecutando tests del dominio SUPPORT..." -ForegroundColor Cyan
    Push-Location domains/support/ticket-service; npm test; Pop-Location
    Push-Location domains/support/chatbot-service; npm test; Pop-Location
    Push-Location domains/support/shipment-tracker; npm test; Pop-Location
}

function Test-Platform {
    Write-Host "🧪 Ejecutando tests del dominio PLATFORM..." -ForegroundColor Cyan
    Push-Location domains/platform/api-gateway; npm test; Pop-Location
    Write-Host "⚠️  Frontend tests se ejecutan con npm test en el contenedor" -ForegroundColor Yellow
}

function Show-Info {
    Write-Host "ℹ️  Información del Proyecto TechNovaStore" -ForegroundColor Cyan
    Write-Host ""
    $version = (Get-Content package.json | ConvertFrom-Json).version
    Write-Host "📦 Versión: $version"
    Write-Host "🏗️  Arquitectura: Screaming Architecture con Dominios"
    Write-Host ""
    Write-Host "📁 Dominios:"
    Write-Host "  - catalog   (product-service, sync-engine, recommender-service)"
    Write-Host "  - commerce  (order-service, payment-service, auto-purchase-service)"
    Write-Host "  - customer  (user-service, notification-service)"
    Write-Host "  - support   (ticket-service, chatbot-service, shipment-tracker)"
    Write-Host "  - platform  (api-gateway, frontend)"
    Write-Host ""
    Write-Host "🐳 Docker Compose: docker-compose.optimized.yml"
    Write-Host "📚 Documentación: docs/"
    Write-Host ""
    Write-Host "💡 Usa '.\make.ps1 help' para ver todos los comandos disponibles"
}

# Ejecutar comando
switch ($Command.ToLower()) {
    "help" { Show-Help }
    "install" { Install-All }
    "install-catalog" { Install-Catalog }
    "install-commerce" { Install-Commerce }
    "install-customer" { Install-Customer }
    "install-support" { Install-Support }
    "install-platform" { Install-Platform }
    "build" { Build-All }
    "build-catalog" { Build-Catalog }
    "build-commerce" { Build-Commerce }
    "build-customer" { Build-Customer }
    "build-support" { Build-Support }
    "build-platform" { Build-Platform }
    "test" { Test-All }
    "test-catalog" { Test-Catalog }
    "test-commerce" { Test-Commerce }
    "test-customer" { Test-Customer }
    "test-support" { Test-Support }
    "test-platform" { Test-Platform }
    "test-integration" { npm run test:integration }
    "test-e2e" { npm run test:e2e }
    "lint" { npm run lint }
    "lint-fix" { npm run lint:fix }
    "format" { npm run format }
    "format-check" { npm run format:check }
    "clean" {
        Write-Host "🧹 Limpiando artefactos de compilación..." -ForegroundColor Cyan
        Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item -Path "build" -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item -Path "coverage" -Recurse -Force -ErrorAction SilentlyContinue
        Get-ChildItem -Path "domains" -Directory -Recurse -Filter "dist" | Remove-Item -Recurse -Force
        Get-ChildItem -Path "domains" -Directory -Recurse -Filter "build" | Remove-Item -Recurse -Force
        Get-ChildItem -Path "domains" -Directory -Recurse -Filter "coverage" | Remove-Item -Recurse -Force
        Write-Host "✅ Artefactos de compilación eliminados" -ForegroundColor Green
    }
    "clean-all" {
        Write-Host "🧹 Limpieza completa (incluye node_modules)..." -ForegroundColor Cyan
        Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
        Get-ChildItem -Path "domains" -Directory -Recurse -Filter "node_modules" | Remove-Item -Recurse -Force
        & $PSCommandPath clean
        Write-Host "✅ Limpieza completa finalizada" -ForegroundColor Green
    }
    "docker-up" {
        Write-Host "🐳 Iniciando servicios Docker (optimized)..." -ForegroundColor Cyan
        docker-compose -f docker-compose.optimized.yml up -d
        Write-Host "✅ Servicios Docker iniciados" -ForegroundColor Green
    }
    "docker-down" {
        Write-Host "🐳 Deteniendo servicios Docker..." -ForegroundColor Cyan
        docker-compose -f docker-compose.optimized.yml down
        Write-Host "✅ Servicios Docker detenidos" -ForegroundColor Green
    }
    "docker-build" {
        Write-Host "🐳 Construyendo imágenes Docker..." -ForegroundColor Cyan
        docker-compose -f docker-compose.optimized.yml build
        Write-Host "✅ Imágenes Docker construidas" -ForegroundColor Green
    }
    "docker-rebuild" {
        Write-Host "🐳 Reconstruyendo y reiniciando servicios..." -ForegroundColor Cyan
        docker-compose -f docker-compose.optimized.yml up -d --build
        Write-Host "✅ Servicios reconstruidos y reiniciados" -ForegroundColor Green
    }
    "docker-logs" {
        if ($Service) {
            docker-compose -f docker-compose.optimized.yml logs -f $Service
        } else {
            docker-compose -f docker-compose.optimized.yml logs -f
        }
    }
    "docker-restart" {
        if ($Service) {
            Write-Host "🐳 Reiniciando servicio $Service..." -ForegroundColor Cyan
            docker-compose -f docker-compose.optimized.yml restart $Service
            Write-Host "✅ Servicio $Service reiniciado" -ForegroundColor Green
        } else {
            Write-Host "🐳 Reiniciando todos los servicios..." -ForegroundColor Cyan
            docker-compose -f docker-compose.optimized.yml restart
            Write-Host "✅ Servicios reiniciados" -ForegroundColor Green
        }
    }
    "docker-clean" {
        Write-Host "🐳 Limpiando contenedores y volúmenes..." -ForegroundColor Cyan
        docker-compose -f docker-compose.optimized.yml down -v
        docker system prune -f
        Write-Host "✅ Limpieza Docker completada" -ForegroundColor Green
    }
    "docker-ps" {
        Write-Host "🐳 Estado de los servicios Docker:" -ForegroundColor Cyan
        docker-compose -f docker-compose.optimized.yml ps
    }
    "docker-stats" {
        Write-Host "🐳 Uso de recursos de los contenedores:" -ForegroundColor Cyan
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
    }
    "prod-build" {
        Write-Host "🚀 Construyendo para producción..." -ForegroundColor Cyan
        docker-compose -f docker-compose.prod.yml build
        Write-Host "✅ Build de producción completado" -ForegroundColor Green
    }
    "prod-up" {
        Write-Host "🚀 Iniciando servicios en producción..." -ForegroundColor Cyan
        docker-compose -f docker-compose.prod.yml up -d
        Write-Host "✅ Servicios de producción iniciados" -ForegroundColor Green
    }
    "prod-down" {
        Write-Host "🚀 Deteniendo servicios de producción..." -ForegroundColor Cyan
        docker-compose -f docker-compose.prod.yml down
        Write-Host "✅ Servicios de producción detenidos" -ForegroundColor Green
    }
    "prod-logs" {
        docker-compose -f docker-compose.prod.yml logs -f
    }
    "db-seed" {
        Write-Host "🗄️  Poblando base de datos..." -ForegroundColor Cyan
        node scripts/utilities/populate-free-products.js
        Write-Host "✅ Base de datos poblada" -ForegroundColor Green
    }
    "check-structure" {
        Write-Host "🔍 Verificando estructura de dominios..." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📁 Dominio CATALOG:"
        Get-ChildItem -Path "domains/catalog" -ErrorAction SilentlyContinue | Format-Table Name
        Write-Host "📁 Dominio COMMERCE:"
        Get-ChildItem -Path "domains/commerce" -ErrorAction SilentlyContinue | Format-Table Name
        Write-Host "📁 Dominio CUSTOMER:"
        Get-ChildItem -Path "domains/customer" -ErrorAction SilentlyContinue | Format-Table Name
        Write-Host "📁 Dominio SUPPORT:"
        Get-ChildItem -Path "domains/support" -ErrorAction SilentlyContinue | Format-Table Name
        Write-Host "📁 Dominio PLATFORM:"
        Get-ChildItem -Path "domains/platform" -ErrorAction SilentlyContinue | Format-Table Name
    }
    "health-check" {
        Write-Host "🏥 Verificando salud de los servicios..." -ForegroundColor Cyan
        node scripts/testing/health-check.js
        Write-Host "✅ Health check completado" -ForegroundColor Green
    }
    "validate" {
        Write-Host "✅ Validando todos los servicios..." -ForegroundColor Cyan
        node scripts/testing/validate-all-services.js
        Write-Host "✅ Validación completada" -ForegroundColor Green
    }
    "info" { Show-Info }
    default {
        Write-Host "❌ Comando desconocido: $Command" -ForegroundColor Red
        Write-Host ""
        Show-Help
    }
}
