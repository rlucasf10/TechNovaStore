# Guía de Conexión a Bases de Datos - TechNovaStore

Esta guía te ayudará a conectarte a las bases de datos del proyecto usando herramientas gráficas locales en Windows.

---

## 📊 Resumen de Credenciales

| Base de Datos  | Host      | Puerto | Usuario | Contraseña | Base de Datos |
| -------------- | --------- | ------ | ------- | ---------- | ------------- |
| **PostgreSQL** | localhost | 5432   | admin   | password   | technovastore |
| **MongoDB**    | localhost | 27017  | admin   | password   | technovastore |
| **Redis**      | localhost | 6379   | -       | password   | -             |

---

## 1️⃣ PostgreSQL - Herramientas Recomendadas

### Opción A: pgAdmin 4 (Recomendada)

**Descargar:**

- https://www.pgadmin.org/download/pgadmin-4-windows/

**Configuración:**

1. Abre pgAdmin 4
2. Click derecho en "Servers" → "Register" → "Server"
3. En la pestaña "General":
   - Name: `TechNovaStore`
4. En la pestaña "Connection":
   - Host name/address: `localhost`
   - Port: `5432`
   - Maintenance database: `technovastore`
   - Username: `admin`
   - Password: `password`
   - ✅ Marca "Save password"
5. Click "Save"

**Verificar conexión:**

```sql
-- Ejecuta esta query para ver las tablas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

### Opción B: DBeaver (Universal)

**Descargar:**

- https://dbeaver.io/download/

**Configuración:**

1. Abre DBeaver
2. Click en "Nueva Conexión" (icono de enchufe)
3. Selecciona "PostgreSQL"
4. Configura:
   - Host: `localhost`
   - Port: `5432`
   - Database: `technovastore`
   - Username: `admin`
   - Password: `password`
5. Click "Test Connection" → "Finish"

### Opción C: DataGrip (JetBrains - Pago)

**Descargar:**

- https://www.jetbrains.com/datagrip/

**Configuración:**

1. Abre DataGrip
2. Click en "+" → "Data Source" → "PostgreSQL"
3. Configura:
   - Host: `localhost`
   - Port: `5432`
   - Database: `technovastore`
   - User: `admin`
   - Password: `password`
4. Click "Test Connection" → "OK"

---

## 2️⃣ MongoDB - Herramientas Recomendadas

### Opción A: MongoDB Compass (Recomendada)

**Descargar:**

- https://www.mongodb.com/try/download/compass

**Configuración:**

1. Abre MongoDB Compass
2. En "New Connection", usa esta URI:
   ```
   mongodb://admin:password@localhost:27017/technovastore?authSource=admin
   ```
3. O configura manualmente:
   - Hostname: `localhost`
   - Port: `27017`
   - Authentication: Username/Password
   - Username: `admin`
   - Password: `password`
   - Authentication Database: `admin`
   - Default Database: `technovastore`
4. Click "Connect"

**Verificar conexión:**

```javascript
// En la consola de Compass, ejecuta:
db.products.countDocuments();
```

### Opción B: Studio 3T (Gratis para uso no comercial)

**Descargar:**

- https://studio3t.com/download/

**Configuración:**

1. Abre Studio 3T
2. Click en "Connect" → "New Connection"
3. En la pestaña "Server":
   - Server: `localhost`
   - Port: `27017`
4. En la pestaña "Authentication":
   - Authentication Mode: `Username/Password`
   - Username: `admin`
   - Password: `password`
   - Authentication DB: `admin`
5. En la pestaña "Connection":
   - Connection Name: `TechNovaStore`
6. Click "Test Connection" → "Save"

### Opción C: Robo 3T (Gratis)

**Descargar:**

- https://robomongo.org/download

**Configuración:**

1. Abre Robo 3T
2. Click en "Create" (nueva conexión)
3. En la pestaña "Connection":
   - Name: `TechNovaStore`
   - Address: `localhost:27017`
4. En la pestaña "Authentication":
   - ✅ Marca "Perform authentication"
   - Database: `admin`
   - User Name: `admin`
   - Password: `password`
5. Click "Test" → "Save"

---

## 3️⃣ Redis - Herramientas Recomendadas

### Opción A: RedisInsight (Recomendada)

**Descargar:**

- https://redis.com/redis-enterprise/redis-insight/

**Configuración:**

1. Abre RedisInsight
2. Click en "Add Redis Database"
3. Selecciona "Add Database Manually"
4. Configura:
   - Host: `localhost`
   - Port: `6379`
   - Database Alias: `TechNovaStore`
   - Username: (dejar vacío)
   - Password: `password`
5. Click "Add Redis Database"

**Verificar conexión:**

```redis
# Ejecuta estos comandos en la consola:
PING
INFO server
KEYS *
```

### Opción B: Another Redis Desktop Manager (Gratis)

**Descargar:**

- https://github.com/qishibo/AnotherRedisDesktopManager/releases

**Configuración:**

1. Abre Another Redis Desktop Manager
2. Click en "New Connection"
3. Configura:
   - Name: `TechNovaStore`
   - Host: `localhost`
   - Port: `6379`
   - Auth: `password`
4. Click "Test Connection" → "OK"

### Opción C: Redis Commander (Línea de comandos)

**Instalar con npm:**

```powershell
npm install -g redis-commander
```

**Ejecutar:**

```powershell
redis-commander --redis-password password
```

Luego abre: http://localhost:8081

---

## 🔧 Verificación de Puertos

Antes de conectarte, verifica que los puertos estén expuestos:

```powershell
# Ver contenedores activos con sus puertos
docker ps --filter "name=technovastore" --format "table {{.Names}}\t{{.Ports}}"
```

**Resultado esperado:**

```
technovastore-postgresql    0.0.0.0:5432->5432/tcp
technovastore-mongodb       0.0.0.0:27017->27017/tcp
technovastore-redis         0.0.0.0:6379->6379/tcp
```

---

## 🚨 Solución de Problemas

### Error: "Connection refused" o "Cannot connect"

1. **Verifica que los contenedores estén corriendo:**

   ```powershell
   docker ps --filter "name=technovastore-postgresql"
   docker ps --filter "name=technovastore-mongodb"
   docker ps --filter "name=technovastore-redis"
   ```

2. **Verifica que los puertos estén expuestos:**

   ```powershell
   netstat -an | findstr "5432"
   netstat -an | findstr "27017"
   netstat -an | findstr "6379"
   ```

3. **Reinicia los contenedores si es necesario:**
   ```powershell
   docker-compose -f docker-compose.optimized.yml restart postgresql mongodb redis
   ```

### Error: "Authentication failed"

1. **Verifica las credenciales en docker-compose.optimized.yml**
2. **Para PostgreSQL, prueba conectarte desde la línea de comandos:**

   ```powershell
   docker exec -it technovastore-postgresql psql -U admin -d technovastore
   ```

3. **Para MongoDB, prueba conectarte desde la línea de comandos:**

   ```powershell
   docker exec -it technovastore-mongodb mongosh -u admin -p password --authenticationDatabase admin
   ```

4. **Para Redis, prueba conectarte desde la línea de comandos:**
   ```powershell
   docker exec -it technovastore-redis redis-cli -a password
   ```

### Puerto ya en uso

Si algún puerto está ocupado por otra aplicación:

```powershell
# Ver qué proceso está usando el puerto
netstat -ano | findstr "5432"
netstat -ano | findstr "27017"
netstat -ano | findstr "6379"

# Matar el proceso (reemplaza PID con el número que aparece)
taskkill /PID <PID> /F
```

---

## 📝 Queries Útiles

### PostgreSQL

```sql
-- Ver todas las tablas
\dt

-- Ver estructura de una tabla
\d users

-- Contar usuarios
SELECT COUNT(*) FROM users;

-- Ver usuarios administradores
SELECT id, email, first_name, last_name, role, created_at
FROM users
WHERE role = 'admin';

-- Ver últimos pedidos
SELECT order_number, status, total_amount, created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;
```

### MongoDB

```javascript
// Ver todas las colecciones
show collections

// Contar productos
db.products.countDocuments()

// Ver productos activos
db.products.find({ is_active: true }).limit(10)

// Ver categorías
db.categories.find().pretty()

// Ver sesiones de chat recientes
db.chat_sessions.find().sort({ created_at: -1 }).limit(10)

// Buscar productos por nombre
db.products.find({ name: /laptop/i }).limit(5)
```

### Redis

```redis
# Ver todas las claves
KEYS *

# Ver información del servidor
INFO

# Ver claves de sesión
KEYS session:*

# Ver claves de caché
KEYS cache:*

# Obtener valor de una clave
GET cache:products:all

# Ver tiempo de vida de una clave
TTL session:abc123

# Limpiar toda la base de datos (¡CUIDADO!)
FLUSHDB
```

---

## 🔐 Seguridad

**IMPORTANTE:** Las credenciales actuales son para desarrollo local. En producción:

1. ✅ Cambia todas las contraseñas
2. ✅ Usa variables de entorno seguras
3. ✅ No expongas los puertos directamente
4. ✅ Usa SSL/TLS para las conexiones
5. ✅ Implementa firewall y restricciones de IP
6. ✅ Usa secretos de Docker o Kubernetes

---

## 📚 Recursos Adicionales

- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **MongoDB Docs:** https://docs.mongodb.com/
- **Redis Docs:** https://redis.io/documentation
- **Docker Networking:** https://docs.docker.com/network/

---

## 👤 Usuario Administrador

Se ha creado automáticamente un usuario administrador:

- **Email:** admin@technovastore.com
- **Contraseña:** Admin123!
- **Rol:** admin

**⚠️ IMPORTANTE:** Cambia esta contraseña después del primer login.

Para verificar que el usuario existe:

```sql
SELECT id, email, first_name, last_name, role, is_active, email_verified, created_at
FROM users
WHERE email = 'admin@technovastore.com';
```

---

¿Necesitas ayuda? Revisa los logs de los contenedores:

```powershell
docker logs technovastore-postgresql --tail 50
docker logs technovastore-mongodb --tail 50
docker logs technovastore-redis --tail 50
```
