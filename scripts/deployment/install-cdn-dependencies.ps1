# TechNovaStore CDN Dependencies Installation Script
# Instala las dependencias necesarias para configurar Cloudflare CDN

Write-Host "🚀 TechNovaStore - Instalación de dependencias CDN" -ForegroundColor Green
Write-Host ""

# Verificar si Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js detectado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js no está instalado" -ForegroundColor Red
    Write-Host "💡 Instala Node.js desde: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Verificar si npm está disponible
try {
    $npmVersion = npm --version
    Write-Host "✅ npm detectado: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm no está disponible" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Instalando dependencias de Cloudflare..." -ForegroundColor Blue

# Instalar cloudflare SDK
try {
    npm install cloudflare dotenv
    Write-Host "✅ Cloudflare SDK instalado" -ForegroundColor Green
} catch {
    Write-Host "❌ Error instalando Cloudflare SDK" -ForegroundColor Red
    Write-Host "💡 Intenta ejecutar: npm install cloudflare dotenv" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✅ ¡Dependencias instaladas exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Próximos pasos:" -ForegroundColor Blue
Write-Host "   1. Crea tu cuenta gratuita en Cloudflare" -ForegroundColor White
Write-Host "   2. Copia .env.cloudflare.example a .env.cloudflare" -ForegroundColor White
Write-Host "   3. Completa las variables de entorno" -ForegroundColor White
Write-Host "   4. Ejecuta: node scripts/setup-cloudflare-cdn.js" -ForegroundColor White