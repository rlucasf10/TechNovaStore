# Script para detener TODOS los contenedores de forma ordenada

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deteniendo todos los servicios..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Detener todos los contenedores y limpiar redes huérfanas
Write-Host "Deteniendo contenedores..." -ForegroundColor Yellow
docker-compose -f docker-compose.optimized.yml down --remove-orphans

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Todos los servicios detenidos" -ForegroundColor Green
} else {
    Write-Host "⚠ Hubo algunos errores al detener servicios" -ForegroundColor Yellow
}

# Eliminar TODOS los contenedores de TechNovaStore (incluso los detenidos)
Write-Host ""
Write-Host "Eliminando contenedores detenidos..." -ForegroundColor Yellow
$containers = docker ps -a --format "{{.Names}}" | Select-String "technovastore"
if ($containers) {
    $containers | ForEach-Object {
        Write-Host "  Eliminando: $_" -ForegroundColor Gray
        docker rm -f $_ 2>$null
    }
    Write-Host "✓ Contenedores eliminados" -ForegroundColor Green
} else {
    Write-Host "✓ No hay contenedores para eliminar" -ForegroundColor Green
}

# Limpiar redes huérfanas
Write-Host ""
Write-Host "Limpiando redes huérfanas..." -ForegroundColor Yellow
docker network prune -f 2>$null
Write-Host "✓ Limpieza de redes completada" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ LIMPIEZA COMPLETA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Para arrancar de nuevo:" -ForegroundColor Cyan
Write-Host "  Todos los servicios:     .\start-all-services.ps1" -ForegroundColor White
Write-Host "  Solo esenciales:         .\start-minimal.ps1" -ForegroundColor White
Write-Host ""
