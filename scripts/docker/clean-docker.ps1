# ============================================================================
# Script de Limpieza Completa de Docker
# ============================================================================
# 
# Este script elimina TODOS los contenedores, imágenes, volúmenes y redes
# de Docker para hacer una instalación limpia.
#
# ADVERTENCIA: Esto borrará TODAS las bases de datos y datos almacenados.
# ============================================================================

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  LIMPIEZA COMPLETA DE DOCKER - TechNovaStore" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ADVERTENCIA: Este script eliminará:" -ForegroundColor Yellow
Write-Host "  - Todos los contenedores (en ejecución y detenidos)" -ForegroundColor Yellow
Write-Host "  - Todas las imágenes de Docker" -ForegroundColor Yellow
Write-Host "  - Todos los volúmenes (BASES DE DATOS INCLUIDAS)" -ForegroundColor Yellow
Write-Host "  - Todas las redes personalizadas" -ForegroundColor Yellow
Write-Host "  - Caché de build" -ForegroundColor Yellow
Write-Host ""

# Pedir confirmación
$confirmation = Read-Host "¿Estás seguro de que quieres continuar? (escribe 'SI' para confirmar)"
if ($confirmation -ne "SI") {
    Write-Host "Operación cancelada." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Iniciando limpieza completa..." -ForegroundColor Green
Write-Host ""

# 1. Detener todos los contenedores en ejecución
Write-Host "[1/7] Deteniendo todos los contenedores..." -ForegroundColor Cyan
$runningContainers = docker ps -q
if ($runningContainers) {
    docker stop $runningContainers
    Write-Host "  ✓ Contenedores detenidos" -ForegroundColor Green
} else {
    Write-Host "  ✓ No hay contenedores en ejecución" -ForegroundColor Green
}

# 2. Eliminar todos los contenedores
Write-Host "[2/7] Eliminando todos los contenedores..." -ForegroundColor Cyan
$allContainers = docker ps -aq
if ($allContainers) {
    docker rm -f $allContainers
    Write-Host "  ✓ Contenedores eliminados" -ForegroundColor Green
} else {
    Write-Host "  ✓ No hay contenedores para eliminar" -ForegroundColor Green
}

# 3. Eliminar todas las imágenes
Write-Host "[3/7] Eliminando todas las imágenes..." -ForegroundColor Cyan
$allImages = docker images -q
if ($allImages) {
    docker rmi -f $allImages
    Write-Host "  ✓ Imágenes eliminadas" -ForegroundColor Green
} else {
    Write-Host "  ✓ No hay imágenes para eliminar" -ForegroundColor Green
}

# 4. Eliminar todos los volúmenes
Write-Host "[4/7] Eliminando todos los volúmenes..." -ForegroundColor Cyan
$allVolumes = docker volume ls -q
if ($allVolumes) {
    docker volume rm -f $allVolumes
    Write-Host "  ✓ Volúmenes eliminados" -ForegroundColor Green
} else {
    Write-Host "  ✓ No hay volúmenes para eliminar" -ForegroundColor Green
}

# 5. Eliminar todas las redes personalizadas
Write-Host "[5/7] Eliminando redes personalizadas..." -ForegroundColor Cyan
$customNetworks = docker network ls --filter "type=custom" -q
if ($customNetworks) {
    docker network rm $customNetworks 2>$null
    Write-Host "  ✓ Redes personalizadas eliminadas" -ForegroundColor Green
} else {
    Write-Host "  ✓ No hay redes personalizadas para eliminar" -ForegroundColor Green
}

# 6. Limpiar caché de build y buildx
Write-Host "[6/7] Limpiando caché de build..." -ForegroundColor Cyan
docker builder prune -af --filter "until=24h"
docker buildx prune -af 2>$null
# Eliminar todos los builders
$builders = docker buildx ls --format "{{.Name}}" | Where-Object { $_ -ne "default" -and $_ -ne "desktop-linux" }
if ($builders) {
    foreach ($builder in $builders) {
        docker buildx rm $builder 2>$null
    }
}
Write-Host "  ✓ Caché de build y buildx limpiados" -ForegroundColor Green

# 7. Limpiar todo lo que quede (system prune)
Write-Host "[7/7] Limpieza final del sistema..." -ForegroundColor Cyan
docker system prune -af --volumes
Write-Host "  ✓ Sistema limpiado completamente" -ForegroundColor Green

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  LIMPIEZA COMPLETADA EXITOSAMENTE" -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Verificando estado de Docker..." -ForegroundColor Cyan
Write-Host ""

# Mostrar estado final
Write-Host "Contenedores:" -ForegroundColor Yellow
docker ps -a

Write-Host ""
Write-Host "Imágenes:" -ForegroundColor Yellow
docker images

Write-Host ""
Write-Host "Volúmenes:" -ForegroundColor Yellow
docker volume ls

Write-Host ""
Write-Host "Redes:" -ForegroundColor Yellow
docker network ls

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "Docker está completamente limpio y listo para una instalación fresca." -ForegroundColor Green
Write-Host ""
Write-Host "Siguiente paso:" -ForegroundColor Yellow
Write-Host "  docker-compose -f docker-compose.staging.yml up -d --build" -ForegroundColor White
Write-Host "============================================================================" -ForegroundColor Cyan
