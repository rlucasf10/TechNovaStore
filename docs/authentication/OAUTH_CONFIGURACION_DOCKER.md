# 🐳 Configuración de OAuth en Docker Compose

## ✅ RESUMEN

La implementación de OAuth está **100% completa**. Solo necesitas configurar las credenciales en `docker-compose.optimized.yml`.

---

## 📍 DÓNDE CONFIGURAR LAS CREDENCIALES

### 1️⃣ Frontend (`frontend/.env.local`)

**✅ YA CONFIGURADO** - No tocar

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
NEXT_PUBLIC_GITHUB_CLIENT_ID=  # Agregar cuando tengas el GitHub Client ID
```

### 2️⃣ Backend (`docker-compose.optimized.yml`)

**✅ YA AGREGADO** - Solo cambiar los valores

Busca la sección `user-service` y verás:

```yaml
user-service:
  environment:
    # ... otras variables ...
    
    # OAuth Configuration
    GOOGLE_CLIENT_ID: YOUR_GOOGLE_CLIENT_ID_HERE
    GOOGLE_CLIENT_SECRET: YOUR_GOOGLE_CLIENT_SECRET_HERE  ⬅️ CAMBIAR ESTO
    GITHUB_CLIENT_ID: CAMBIAR-POR-TU-GITHUB-CLIENT-ID        ⬅️ CAMBIAR ESTO
    GITHUB_CLIENT_SECRET: CAMBIAR-POR-TU-GITHUB-SECRET       ⬅️ CAMBIAR ESTO
    FRONTEND_URL: http://localhost:3011
```

---

## 🔑 CÓMO OBTENER LAS CREDENCIALES

### Google Client Secret

1. Ir a: https://console.cloud.google.com/
2. Buscar el proyecto con Client ID: `YOUR_GOOGLE_CLIENT_ID_HERE`
3. Ir a **"APIs y servicios"** → **"Credenciales"**
4. Buscar el OAuth 2.0 Client ID
5. Copiar el **Client Secret** (algo como `YOUR_GOOGLE_CLIENT_SECRET_EXAMPLE...`)
6. Pegar en `docker-compose.optimized.yml` reemplazando `YOUR_GOOGLE_CLIENT_SECRET_HERE`

### GitHub Client ID y Secret

1. Ir a: https://github.com/settings/developers
2. Click **"OAuth Apps"** → **"New OAuth App"**
3. Configurar:
   - **Application name**: `TechNovaStore`
   - **Homepage URL**: `http://localhost:3011`
   - **Authorization callback URL**: `http://localhost:3011/auth/callback/github`
4. Click **"Register application"**
5. Copiar el **Client ID**
6. Click **"Generate a new client secret"**
7. Copiar el **Client Secret** (solo se muestra una vez)
8. Pegar ambos en `docker-compose.optimized.yml`
9. También agregar el Client ID en `frontend/.env.local`:
   ```bash
   NEXT_PUBLIC_GITHUB_CLIENT_ID=tu-client-id-aqui
   ```

---

## 🗄️ MIGRACIÓN DE BASE DE DATOS

Necesitas agregar los campos OAuth a la tabla `users`:

```sql
-- Conectarse a PostgreSQL
docker exec -it technovastore-postgresql psql -U admin -d technovastore

-- Ejecutar la migración
ALTER TABLE users 
  ALTER COLUMN password_hash DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS github_id VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS auth_methods JSONB DEFAULT '[]'::jsonb;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);

-- Salir
\q
```

---

## 🚀 REINICIAR SERVICIOS

Después de configurar las credenciales:

```powershell
# Reconstruir y reiniciar el user-service
docker-compose -f docker-compose.optimized.yml up -d --build user-service

# Reiniciar el frontend (si cambiaste NEXT_PUBLIC_GITHUB_CLIENT_ID)
docker-compose -f docker-compose.optimized.yml restart frontend
```

---

## ✅ CHECKLIST

- [ ] 1. Obtener Google Client Secret de Google Cloud Console
- [ ] 2. Obtener GitHub Client ID y Secret de GitHub
- [ ] 3. Editar `docker-compose.optimized.yml` con las credenciales reales
- [ ] 4. Editar `frontend/.env.local` con GitHub Client ID
- [ ] 5. Ejecutar migración de base de datos
- [ ] 6. Reconstruir y reiniciar servicios
- [ ] 7. Probar login con Google en http://localhost:3011/login
- [ ] 8. Probar login con GitHub en http://localhost:3011/login

---

## 🧪 PROBAR QUE FUNCIONA

1. Ir a: http://localhost:3011/login
2. Click en **"Continuar con Google"**
3. Autorizar en Google
4. Deberías ser redirigido al dashboard autenticado
5. Repetir con GitHub

---

## ⚠️ IMPORTANTE

### ✅ CORRECTO (Docker Compose)
- Variables de entorno en `docker-compose.optimized.yml`
- Client Secrets en el archivo de Docker Compose
- Reiniciar servicios después de cambiar variables

### ❌ INCORRECTO
- ~~Crear archivo `services/user/.env`~~ (no se usa en Docker)
- ~~Variables de entorno en archivos `.env` individuales~~ (Docker Compose las ignora)
- Client Secrets en el frontend

---

## 📖 DOCUMENTACIÓN COMPLETA

Para más detalles, ver: `OAUTH_IMPLEMENTATION_COMPLETE.md`
