# 👤 Usuario Administrador - TechNovaStore

## ✅ Usuario Creado Exitosamente

Se ha creado un usuario administrador en la base de datos PostgreSQL con las siguientes credenciales:

### 🔑 Credenciales de Acceso

| Campo                | Valor                   |
| -------------------- | ----------------------- |
| **ID**               | 1                       |
| **Email**            | admin@technovastore.com |
| **Contraseña**       | Admin123!               |
| **Rol**              | admin                   |
| **Nombre**           | Admin                   |
| **Apellido**         | TechNovaStore           |
| **Teléfono**         | +34600000000            |
| **Estado**           | Activo ✓                |
| **Email Verificado** | Sí ✓                    |

---

## 🚀 Cómo Iniciar Sesión

### Opción 1: Desde el Frontend

1. Abre el navegador en: http://localhost:3011/login
2. Ingresa las credenciales:
   - Email: `admin@technovastore.com`
   - Contraseña: `Admin123!`
3. Click en "Iniciar sesión"

### Opción 2: Desde la API

```bash
# Usando curl
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@technovastore.com",
    "password": "Admin123!"
  }'
```

```powershell
# Usando PowerShell
$body = @{
    email = "admin@technovastore.com"
    password = "Admin123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

---

## 🔐 Seguridad

### ⚠️ IMPORTANTE: Cambiar Contraseña

**Esta contraseña es temporal y debe cambiarse inmediatamente después del primer login.**

#### Cambiar contraseña desde el frontend:

1. Inicia sesión con las credenciales por defecto
2. Ve a: Dashboard → Mi Perfil → Seguridad
3. Click en "Cambiar Contraseña"
4. Ingresa:
   - Contraseña actual: `Admin123!`
   - Nueva contraseña: (tu contraseña segura)
   - Confirmar contraseña: (repetir)
5. Click en "Guardar"

#### Cambiar contraseña desde la base de datos:

```sql
-- Conectarse a PostgreSQL
docker exec -it technovastore-postgresql psql -U admin -d technovastore

-- Actualizar contraseña (ejemplo con bcrypt hash)
UPDATE users
SET password_hash = '$2b$12$NUEVO_HASH_AQUI',
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'admin@technovastore.com';
```

Para generar un nuevo hash de bcrypt, puedes usar:

```javascript
// Node.js
const bcrypt = require('bcrypt');
const password = 'TuNuevaContraseñaSegura';
const hash = await bcrypt.hash(password, 12);
console.log(hash);
```

---

## 🔄 Recrear Usuario Administrador

Si necesitas recrear el usuario administrador (por ejemplo, si olvidaste la contraseña):

### Opción 1: Usando el script PowerShell

```powershell
.\scripts\create-admin-user.ps1
```

Este script:

- ✅ Verifica que PostgreSQL esté corriendo
- ✅ Elimina todos los usuarios existentes
- ✅ Resetea el contador de IDs
- ✅ Crea el usuario admin con ID 1
- ✅ Muestra las credenciales

### Opción 2: Manualmente desde SQL

```powershell
# Conectarse a PostgreSQL
docker exec -it technovastore-postgresql psql -U admin -d technovastore
```

```sql
-- Limpiar tabla de usuarios y resetear IDs
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- Crear usuario administrador
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
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIr.oXkfHa',
    'Admin',
    'TechNovaStore',
    '+34600000000',
    'admin',
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Verificar
SELECT id, email, first_name, last_name, role, is_active, email_verified
FROM users
WHERE email = 'admin@technovastore.com';
```

---

## 🔍 Verificar Usuario

### Desde PostgreSQL

```sql
-- Ver información del usuario admin
SELECT
    id,
    email,
    first_name,
    last_name,
    phone,
    role,
    is_active,
    email_verified,
    created_at,
    updated_at
FROM users
WHERE email = 'admin@technovastore.com';
```

### Desde la línea de comandos

```powershell
docker exec technovastore-postgresql psql -U admin -d technovastore -c "SELECT id, email, first_name, last_name, role FROM users WHERE email = 'admin@technovastore.com';"
```

---

## 🎯 Permisos del Rol Admin

El usuario con rol `admin` tiene acceso completo a:

### Frontend

- ✅ Dashboard de Administración (`/admin`)
- ✅ Gestión de Productos
- ✅ Gestión de Pedidos
- ✅ Gestión de Clientes
- ✅ Gestión de Tickets de Soporte
- ✅ Monitoreo de Servicios de IA
- ✅ Monitoreo de Automatización
- ✅ Analíticas y Reportes
- ✅ Configuración del Sistema

### Backend (API)

- ✅ Todos los endpoints de administración
- ✅ Endpoints protegidos con middleware `requireAdmin`
- ✅ Acceso a métricas y logs
- ✅ Gestión de usuarios
- ✅ Configuración de servicios

---

## 📊 Acceso a Bases de Datos

Para gestionar la base de datos gráficamente, consulta: **GUIA_CONEXION_BASES_DATOS.md**

### Resumen de Conexión

**PostgreSQL:**

- Host: `localhost`
- Puerto: `5432`
- Usuario: `admin`
- Contraseña: `password`
- Base de datos: `technovastore`

**Herramientas recomendadas:**

- pgAdmin 4: https://www.pgadmin.org/download/
- DBeaver: https://dbeaver.io/download/
- DataGrip: https://www.jetbrains.com/datagrip/

---

## 🐛 Solución de Problemas

### No puedo iniciar sesión

1. **Verifica que el usuario existe:**

   ```powershell
   docker exec technovastore-postgresql psql -U admin -d technovastore -c "SELECT * FROM users WHERE email = 'admin@technovastore.com';"
   ```

2. **Verifica que el backend esté corriendo:**

   ```powershell
   docker ps --filter "name=technovastore-api-gateway"
   ```

3. **Revisa los logs del API Gateway:**

   ```powershell
   docker logs technovastore-api-gateway --tail 50
   ```

4. **Verifica la conexión a PostgreSQL:**
   ```powershell
   docker exec technovastore-api-gateway sh -c "nc -zv postgresql 5432"
   ```

### Error: "Invalid credentials"

1. **Verifica que estás usando la contraseña correcta:** `Admin123!`
2. **Verifica que el hash de la contraseña es correcto en la base de datos**
3. **Recrea el usuario usando el script:** `.\scripts\create-admin-user.ps1`

### Error: "User not found"

El usuario no existe en la base de datos. Créalo usando:

```powershell
.\scripts\create-admin-user.ps1
```

### Error de Rate Limiting

Si ves el mensaje "Demasiados intentos", espera 15 minutos o limpia el localStorage:

```javascript
// En la consola del navegador (F12)
localStorage.clear();
location.reload();
```

---

## 📝 Notas Adicionales

### Hash de Contraseña

La contraseña `Admin123!` está hasheada con bcrypt usando 12 salt rounds:

```
$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIr.oXkfHa
```

### Requisitos de Contraseña

Para cambiar la contraseña, debe cumplir:

- ✅ Mínimo 8 caracteres
- ✅ Al menos una mayúscula
- ✅ Al menos una minúscula
- ✅ Al menos un número
- ✅ Al menos un carácter especial

### Seguridad en Producción

En producción, asegúrate de:

1. ✅ Cambiar la contraseña por defecto
2. ✅ Usar contraseñas fuertes y únicas
3. ✅ Habilitar autenticación de dos factores (2FA)
4. ✅ Cambiar las credenciales de la base de datos
5. ✅ Usar variables de entorno seguras
6. ✅ Implementar rate limiting en el backend
7. ✅ Usar HTTPS/SSL
8. ✅ Implementar auditoría de accesos

---

## 📚 Documentación Relacionada

- **Guía de Conexión a Bases de Datos:** `GUIA_CONEXION_BASES_DATOS.md`
- **Documentación de Autenticación:** `frontend/src/services/auth.service.README.md`
- **Documentación del Hook useAuth:** `frontend/src/hooks/useAuth.README.md`
- **Esquemas de Base de Datos:** `infrastructure/postgresql/init/01-init.sql`

---

¿Necesitas ayuda? Revisa los logs:

```powershell
# Logs del API Gateway
docker logs technovastore-api-gateway --tail 100

# Logs de PostgreSQL
docker logs technovastore-postgresql --tail 100

# Logs del Frontend
docker logs technovastore-frontend --tail 100
```
