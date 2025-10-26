# Script para instalar todas las dependencias del proyecto
# Usa NPM Workspaces para gestionar el monorepositorio

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TechNovaStore - Instalación Completa" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
Write-Host "[1/3] Verificando Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "ERROR: Node.js no está instalado" -ForegroundColor Red
    Write-Host "Descarga Node.js desde: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host "  ✓ Node.js $nodeVersion" -ForegroundColor Green
Write-Host ""

# Verificar npm
Write-Host "[2/3] Verificando npm..." -ForegroundColor Yellow
$npmVersion = npm --version 2>$null
if (-not $npmVersion) {
    Write-Host "ERROR: npm no está instalado" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ npm $npmVersion" -ForegroundColor Green
Write-Host ""

# Instalar dependencias
Write-Host "[3/3] Instalando dependencias..." -ForegroundColor Yellow
Write-Host "  Esto puede tardar varios minutos..." -ForegroundColor Gray
Write-Host ""

npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "✗ ERROR EN LA INSTALACIÓN" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Revisa los errores anteriores." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ INSTALACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Dependencias instaladas correctamente." -ForegroundColor White
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Construir servicios:  .\verify-installation.ps1" -ForegroundColor White
Write-Host "  2. Iniciar con Docker:   .\start-minimal.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Comandos útiles de NPM Workspaces:" -ForegroundColor Cyan
Write-Host "  npm run build              - Construir todos los servicios" -ForegroundColor White
Write-Host "  npm run build:services     - Construir solo servicios core" -ForegroundColor White
Write-Host "  npm run build:frontend     - Construir solo frontend" -ForegroundColor White
Write-Host "  npm run test               - Ejecutar tests de todos los servicios" -ForegroundColor White
Write-Host "  npm run lint               - Ejecutar linter en todos los servicios" -ForegroundColor White
Write-Host ""
