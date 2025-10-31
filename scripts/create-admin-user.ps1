# Script PowerShell para crear usuario administrador en PostgreSQL
# Uso: .\scripts\create-admin-user.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Crear Usuario Administrador" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que el contenedor esté corriendo
$containerStatus = docker ps --filter "name=technovastore-postgresql" --format "{{.Status}}"

if (-not $containerStatus) {
    Write-Host "❌ ERROR: El contenedor de PostgreSQL no está corriendo" -ForegroundColor Red
    Write-Host "Ejecuta: docker-compose -f docker-compose.optimized.yml up -d postgresql" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Contenedor PostgreSQL está corriendo" -ForegroundColor Green
Write-Host ""

# Advertencia
Write-Host "⚠️  ADVERTENCIA: Este script eliminará TODOS los usuarios existentes" -ForegroundColor Yellow
Write-Host "   y reseteará el contador de IDs." -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "¿Estás seguro de continuar? (S/N)"

if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "Operación cancelada" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Creando usuario administrador..." -ForegroundColor Cyan

# Ejecutar el script SQL
$result = docker exec technovastore-postgresql psql -U admin -d technovastore -c @"
TRUNCATE TABLE users RESTART IDENTITY CASCADE;
INSERT INTO users (
    email,
    password_hash,
    first_name,
    last_name,
    phone,
    role,
    is_active,
    email_verified,
    created_at,
    updated_at
) VALUES (
    'admin@technovastore.com',
    '\$2b\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIr.oXkfHa',
    'Admin',
    'TechNovaStore',
    '+34600000000',
    'admin',
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Usuario administrador creado exitosamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Credenciales de Acceso" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Email:      admin@technovastore.com" -ForegroundColor White
    Write-Host "Contraseña: Admin123!" -ForegroundColor White
    Write-Host "Rol:        admin" -ForegroundColor White
    Write-Host "ID:         1" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  IMPORTANTE: Cambia esta contraseña después del primer login" -ForegroundColor Yellow
    Write-Host ""
    
    # Verificar el usuario creado
    Write-Host "Verificando usuario creado..." -ForegroundColor Cyan
    docker exec technovastore-postgresql psql -U admin -d technovastore -c "SELECT id, email, first_name, last_name, role, is_active, email_verified FROM users WHERE email = 'admin@technovastore.com';"
} else {
    Write-Host ""
    Write-Host "❌ ERROR: No se pudo crear el usuario administrador" -ForegroundColor Red
    Write-Host "Revisa los logs del contenedor:" -ForegroundColor Yellow
    Write-Host "docker logs technovastore-postgresql --tail 50" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Acceso a la Base de Datos" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Puedes conectarte a PostgreSQL usando:" -ForegroundColor White
Write-Host "  Host:     localhost" -ForegroundColor Gray
Write-Host "  Puerto:   5432" -ForegroundColor Gray
Write-Host "  Usuario:  admin" -ForegroundColor Gray
Write-Host "  Password: password" -ForegroundColor Gray
Write-Host "  Database: technovastore" -ForegroundColor Gray
Write-Host ""
Write-Host "Herramientas recomendadas:" -ForegroundColor White
Write-Host "  - pgAdmin 4: https://www.pgadmin.org/download/" -ForegroundColor Gray
Write-Host "  - DBeaver: https://dbeaver.io/download/" -ForegroundColor Gray
Write-Host ""
Write-Host "Para más información, consulta: GUIA_CONEXION_BASES_DATOS.md" -ForegroundColor Cyan
Write-Host ""
