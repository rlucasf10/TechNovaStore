#!/bin/bash
# Script Bash para crear usuario administrador en PostgreSQL
# Uso: bash scripts/utilities/create-admin-user.sh 
# Uso en windows con WSL: wsl bash scripts/utilities/create-admin-user.sh
# SOLUCIÓN PERMANENTE: Este script genera el hash bcrypt DENTRO del contenedor
# para evitar problemas de escape de caracteres.

set -e

echo "========================================"
echo "  Crear Usuario Administrador"
echo "========================================"
echo ""

# Verificar que el contenedor de PostgreSQL esté corriendo
if ! docker ps --filter "name=technovastore-postgresql" --format "{{.Status}}" | grep -q "Up"; then
    echo "❌ ERROR: El contenedor de PostgreSQL no está corriendo"
    echo "Ejecuta: docker-compose -f docker-compose.optimized.yml up -d postgresql"
    exit 1
fi
echo "✓ Contenedor PostgreSQL está corriendo"

# Verificar que el contenedor de user-service esté corriendo
if ! docker ps --filter "name=technovastore-user-service" --format "{{.Status}}" | grep -q "Up"; then
    echo "❌ ERROR: El contenedor de user-service no está corriendo"
    echo "Ejecuta: docker-compose -f docker-compose.optimized.yml up -d user-service"
    exit 1
fi
echo "✓ Contenedor user-service está corriendo"
echo ""

# Advertencia
echo "⚠️  ADVERTENCIA: Este script eliminará TODOS los usuarios existentes"
echo "   y reseteará el contador de IDs."
echo ""
read -p "¿Estás seguro de continuar? (S/N): " confirm

if [[ "$confirm" != "S" && "$confirm" != "s" ]]; then
    echo "Operación cancelada"
    exit 0
fi

echo ""
echo "Generando hash bcrypt dentro del contenedor..."

# Generar el hash bcrypt DENTRO del contenedor de Node.js
PASSWORD_HASH=$(docker exec technovastore-user-service node -e "const bcrypt = require('bcrypt'); bcrypt.hash('Admin123!', 12).then(h => console.log(h));")

if [[ -z "$PASSWORD_HASH" ]]; then
    echo "❌ ERROR: No se pudo generar el hash bcrypt"
    exit 1
fi

# Limpiar el hash (quitar espacios y saltos de línea)
PASSWORD_HASH=$(echo "$PASSWORD_HASH" | tr -d '\r\n ')

echo "✓ Hash generado: ${PASSWORD_HASH:0:30}..."
echo ""

echo "Creando usuario administrador..."

# Truncar la tabla
docker exec technovastore-postgresql psql -U admin -d technovastore -c "TRUNCATE TABLE users RESTART IDENTITY CASCADE;"

# Fecha actual en formato ISO
CURRENT_DATE=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

# Insertar el usuario con el hash generado
docker exec technovastore-postgresql psql -U admin -d technovastore -c "
INSERT INTO users (
    email,
    password_hash,
    first_name,
    last_name,
    phone,
    role,
    is_active,
    email_verified,
    auth_methods,
    created_at,
    updated_at
) VALUES (
    'admin@technovastore.com',
    '$PASSWORD_HASH',
    'Admin',
    'TechNovaStore',
    '+34600000000',
    'admin',
    true,
    true,
    '[{\"type\": \"password\", \"linkedAt\": \"$CURRENT_DATE\"}]',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
"

if [[ $? -eq 0 ]]; then
    echo ""
    echo "✓ Usuario administrador creado exitosamente"
    echo ""
    echo "========================================"
    echo "  Credenciales de Acceso"
    echo "========================================"
    echo "Email:      admin@technovastore.com"
    echo "Contraseña: Admin123!"
    echo "Rol:        admin"
    echo "ID:         1"
    echo ""
    echo "⚠️  IMPORTANTE: Cambia esta contraseña después del primer login"
    echo ""
    
    # Verificar el usuario creado
    echo "Verificando usuario creado..."
    docker exec technovastore-postgresql psql -U admin -d technovastore -c "SELECT id, email, LEFT(password_hash, 30) as hash_preview, role, is_active, email_verified FROM users WHERE email = 'admin@technovastore.com';"
    
    echo ""
    echo "✓ Hash completo guardado:"
    docker exec technovastore-postgresql psql -U admin -d technovastore -t -c "SELECT password_hash FROM users WHERE email = 'admin@technovastore.com';"
else
    echo ""
    echo "❌ ERROR: No se pudo crear el usuario administrador"
    exit 1
fi

echo ""
echo "========================================"
echo "  Listo para usar"
echo "========================================"
