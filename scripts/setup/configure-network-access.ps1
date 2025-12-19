# Script para configurar acceso desde red local
# Configura automáticamente COOKIE_DOMAIN y FRONTEND_URL con la IP de tu máquina

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuración de Acceso en Red Local" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Obtener la IP de la máquina
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress

if (-not $ipAddress) {
    Write-Host "❌ No se pudo detectar la IP de tu máquina" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, ejecuta 'ipconfig' y configura manualmente:" -ForegroundColor Yellow
    Write-Host "  1. Edita .env y .env.docker" -ForegroundColor Yellow
    Write-Host "  2. Cambia COOKIE_DOMAIN=localhost por COOKIE_DOMAIN=TU_IP" -ForegroundColor Yellow
    Write-Host "  3. Cambia FRONTEND_URL=http://localhost:3020 por FRONTEND_URL=http://TU_IP:3020" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ IP detectada: $ipAddress" -ForegroundColor Green
Write-Host ""

# Preguntar al usuario qué configuración quiere
Write-Host "Selecciona el tipo de acceso:" -ForegroundColor Yellow
Write-Host "  1. Solo localhost (acceso solo desde esta máquina)" -ForegroundColor White
Write-Host "  2. Red local (acceso desde cualquier dispositivo en tu red)" -ForegroundColor White
Write-Host ""
$choice = Read-Host "Ingresa tu opción (1 o 2)"

if ($choice -eq "1") {
    $cookieDomain = ""
    $frontendUrl = "http://localhost:3020"
    $apiUrl = "http://localhost:3000/api"
    $chatbotUrl = "http://localhost:3009"
    $ticketUrl = "http://localhost:3012/api"
    Write-Host ""
    Write-Host "✅ Configurando para acceso solo desde localhost..." -ForegroundColor Green
} elseif ($choice -eq "2") {
    $cookieDomain = ""
    $frontendUrl = "http://${ipAddress}:3020"
    $apiUrl = "http://${ipAddress}:3000/api"
    $chatbotUrl = "http://${ipAddress}:3009"
    $ticketUrl = "http://${ipAddress}:3012/api"
    Write-Host ""
    Write-Host "✅ Configurando para acceso desde red local..." -ForegroundColor Green
} else {
    Write-Host "❌ Opción inválida" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Función para actualizar archivo .env
function Update-EnvFile {
    param (
        [string]$FilePath,
        [string]$CookieDomain,
        [string]$FrontendUrl,
        [string]$ApiUrl,
        [string]$ChatbotUrl,
        [string]$TicketUrl
    )
    
    if (-not (Test-Path $FilePath)) {
        Write-Host "⚠️  Archivo no encontrado: $FilePath" -ForegroundColor Yellow
        return
    }
    
    $content = Get-Content $FilePath -Raw
    
    # Actualizar COOKIE_DOMAIN
    $content = $content -replace "COOKIE_DOMAIN=.*", "COOKIE_DOMAIN=$CookieDomain"
    
    # Actualizar FRONTEND_URL
    $content = $content -replace "FRONTEND_URL=http://[^`r`n]*", "FRONTEND_URL=$FrontendUrl"
    
    # Actualizar NEXT_PUBLIC_APP_URL si existe
    $content = $content -replace "NEXT_PUBLIC_APP_URL=http://[^`r`n]*", "NEXT_PUBLIC_APP_URL=$FrontendUrl"
    
    # Actualizar NEXT_PUBLIC_API_URL si existe
    $content = $content -replace "NEXT_PUBLIC_API_URL=http://[^`r`n]*", "NEXT_PUBLIC_API_URL=$ApiUrl"
    
    # Actualizar NEXT_PUBLIC_CHATBOT_URL si existe
    $content = $content -replace "NEXT_PUBLIC_CHATBOT_URL=http://[^`r`n]*", "NEXT_PUBLIC_CHATBOT_URL=$ChatbotUrl"
    
    # Actualizar NEXT_PUBLIC_SOCKET_URL si existe
    $content = $content -replace "NEXT_PUBLIC_SOCKET_URL=http://[^`r`n]*", "NEXT_PUBLIC_SOCKET_URL=$ChatbotUrl"
    
    # Actualizar NEXT_PUBLIC_TICKET_SERVICE_URL si existe
    $content = $content -replace "NEXT_PUBLIC_TICKET_SERVICE_URL=http://[^`r`n]*", "NEXT_PUBLIC_TICKET_SERVICE_URL=$TicketUrl"
    
    Set-Content -Path $FilePath -Value $content -NoNewline
    
    Write-Host "  ✓ Actualizado: $FilePath" -ForegroundColor Green
}

# Actualizar archivos .env
Write-Host "Actualizando archivos de configuración..." -ForegroundColor Cyan
Write-Host ""

Update-EnvFile -FilePath ".env" -CookieDomain $cookieDomain -FrontendUrl $frontendUrl -ApiUrl $apiUrl -ChatbotUrl $chatbotUrl -TicketUrl $ticketUrl
Update-EnvFile -FilePath ".env.docker" -CookieDomain $cookieDomain -FrontendUrl $frontendUrl -ApiUrl $apiUrl -ChatbotUrl $chatbotUrl -TicketUrl $ticketUrl
Update-EnvFile -FilePath ".env.shared" -CookieDomain $cookieDomain -FrontendUrl $frontendUrl -ApiUrl $apiUrl -ChatbotUrl $chatbotUrl -TicketUrl $ticketUrl

# Actualizar docker-compose.optimized.yml
Write-Host "Actualizando docker-compose.optimized.yml..." -ForegroundColor Cyan
if (Test-Path "docker-compose.optimized.yml") {
    $dockerCompose = Get-Content "docker-compose.optimized.yml" -Raw
    
    # Actualizar variables de entorno del frontend
    $dockerCompose = $dockerCompose -replace "NEXT_PUBLIC_API_URL: http://[^`r`n]*", "NEXT_PUBLIC_API_URL: $ApiUrl"
    $dockerCompose = $dockerCompose -replace "NEXT_PUBLIC_APP_URL: http://[^`r`n]*", "NEXT_PUBLIC_APP_URL: $FrontendUrl"
    $dockerCompose = $dockerCompose -replace "NEXT_PUBLIC_CHATBOT_URL: http://[^`r`n]*", "NEXT_PUBLIC_CHATBOT_URL: $ChatbotUrl"
    $dockerCompose = $dockerCompose -replace "NEXT_PUBLIC_SOCKET_URL: http://[^`r`n]*", "NEXT_PUBLIC_SOCKET_URL: $ChatbotUrl"
    $dockerCompose = $dockerCompose -replace "NEXT_PUBLIC_TICKET_SERVICE_URL: http://[^`r`n]*", "NEXT_PUBLIC_TICKET_SERVICE_URL: $TicketUrl"
    $dockerCompose = $dockerCompose -replace "FRONTEND_URL: http://[^`r`n]*", "FRONTEND_URL: $FrontendUrl"
    
    Set-Content -Path "docker-compose.optimized.yml" -Value $dockerCompose -NoNewline
    Write-Host "  ✓ Actualizado: docker-compose.optimized.yml" -ForegroundColor Green
}
Write-Host ""

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ Configuración completada" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($choice -eq "2") {
    Write-Host "📱 Acceso desde red local configurado:" -ForegroundColor Green
    Write-Host "  - Frontend: $frontendUrl" -ForegroundColor White
    Write-Host "  - API: $apiUrl" -ForegroundColor White
    Write-Host "  - Chatbot: $chatbotUrl" -ForegroundColor White
    Write-Host ""
    Write-Host "🔄 IMPORTANTE: Reinicia los servicios para aplicar cambios:" -ForegroundColor Yellow
    Write-Host "  docker-compose -f docker-compose.optimized.yml up -d --force-recreate frontend" -ForegroundColor White
    Write-Host "  docker-compose -f docker-compose.optimized.yml restart user-service api-gateway" -ForegroundColor White
    Write-Host ""
    Write-Host "⏳ Espera 10-15 segundos a que el frontend se reinicie..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "�  Ahora puedes acceder desde cualquier dispositivo en tu red:" -ForegroundColor Cyan
    Write-Host "  - Desde tu PC: http://localhost:3020" -ForegroundColor White
    Write-Host "  - Desde móvil/tablet: $frontendUrl" -ForegroundColor White
} else {
    Write-Host "💻 Acceso solo desde localhost configurado" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔄 IMPORTANTE: Reinicia los servicios para aplicar cambios:" -ForegroundColor Yellow
    Write-Host "  docker-compose -f docker-compose.optimized.yml up -d --force-recreate frontend" -ForegroundColor White
    Write-Host "  docker-compose -f docker-compose.optimized.yml restart user-service api-gateway" -ForegroundColor White
}

Write-Host ""
Write-Host "📚 Documentación: docs/security/HTTPONLY_COOKIES_CONFIGURATION.md" -ForegroundColor Cyan
Write-Host ""
