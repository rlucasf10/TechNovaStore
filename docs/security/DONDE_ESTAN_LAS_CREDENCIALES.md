# 🔑 Dónde Están las Credenciales OAuth

## ✅ UBICACIÓN ÚNICA: `docker-compose.optimized.yml`

Todas las credenciales OAuth están en **UN SOLO LUGAR**: `docker-compose.optimized.yml`

---

## 📍 Frontend (línea ~602)

```yaml
frontend:
  environment:
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: "YOUR_GOOGLE_CLIENT_ID_HERE"
    NEXT_PUBLIC_GITHUB_CLIENT_ID: ""  # Agregar cuando tengas GitHub
```

**Solo Client IDs** (públicos, seguros)

---

## 📍 Backend - User Service (línea ~298)

```yaml
user-service:
  environment:
    GOOGLE_CLIENT_ID: YOUR_GOOGLE_CLIENT_ID_HERE
    GOOGLE_CLIENT_SECRET: YOUR_GOOGLE_CLIENT_SECRET_HERE
    GITHUB_CLIENT_ID: CAMBIAR-POR-TU-GITHUB-CLIENT-ID
    GITHUB_CLIENT_SECRET: CAMBIAR-POR-TU-GITHUB-SECRET
    FRONTEND_URL: http://localhost:3011
```

**Client IDs + Client Secrets** (privados, solo backend)

---

## ❌ ARCHIVOS QUE NO SE USAN (en Docker)

- ~~`frontend/.env.local`~~ - NO se usa en Docker, solo en desarrollo local sin Docker
- ~~`domains/customer/user-service/.env`~~ - NO se usa en Docker, eliminado

---

## 🔄 Cómo Aplicar Cambios

Después de editar `docker-compose.optimized.yml`:

```powershell
# Reiniciar solo el servicio que cambiaste
docker-compose -f docker-compose.optimized.yml up -d --force-recreate frontend
docker-compose -f docker-compose.optimized.yml up -d --force-recreate user-service
```

---

## 📝 Resumen

| Archivo | Frontend Client ID | Backend Client ID | Backend Secret |
|---------|-------------------|-------------------|----------------|
| `docker-compose.optimized.yml` (frontend) | ✅ | ❌ | ❌ |
| `docker-compose.optimized.yml` (user-service) | ❌ | ✅ | ✅ |
| `frontend/.env.local` | ❌ NO SE USA | ❌ | ❌ |
| `domains/customer/user-service/.env` | ❌ ELIMINADO | ❌ | ❌ |

**TODO está en `docker-compose.optimized.yml`** ✅
