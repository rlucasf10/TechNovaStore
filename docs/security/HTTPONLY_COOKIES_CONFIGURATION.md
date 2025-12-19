# Configuración de HttpOnly Cookies

Este documento describe cómo configurar las variables de entorno para el sistema de autenticación basado en httpOnly cookies en TechNovaStore.

## Tabla de Contenidos

- [Introducción](#introducción)
- [Variables de Entorno](#variables-de-entorno)
- [Configuración por Entorno](#configuración-por-entorno)
- [Configuración de CORS](#configuración-de-cors)
- [Troubleshooting](#troubleshooting)

## Introducción

TechNovaStore utiliza **httpOnly cookies** para almacenar tokens JWT de autenticación. Este enfoque proporciona mayor seguridad que localStorage al proteger contra ataques XSS (Cross-Site Scripting).

### ¿Por qué httpOnly cookies?

- **Protección contra XSS**: Las cookies httpOnly no son accesibles desde JavaScript del navegador
- **Envío automático**: El navegador envía automáticamente las cookies en cada request
- **Múltiples capas de seguridad**: Combinado con flags `Secure` y `SameSite`

## Variables de Entorno

### COOKIE_DOMAIN

Define el dominio para el cual la cookie es válida.

**Formato**: `dominio.com` (sin protocolo, sin puerto)

**Ejemplos**:
- Desarrollo local: `localhost`
- Desarrollo en red local: `192.168.1.100` (IP de tu máquina)
- Staging: `staging.technovastore.com`
- Producción: `technovastore.com`

**Importante**:
- En desarrollo, si usas `localhost`, las cookies solo funcionarán en `http://localhost:XXXX`
- Si necesitas acceder desde otra máquina en tu red local, usa la IP de tu máquina
- En producción, NO incluir `www` para que funcione en todos los subdominios

### FRONTEND_URL

Define la URL del frontend para configuración de CORS.

**Formato**: `protocolo://dominio:puerto`

**Ejemplos**:
- Desarrollo: `http://localhost:3020`
- Desarrollo en red local: `http://192.168.1.100:3020`
- Staging: `http://staging.technovastore.com:3020`
- Producción: `https://technovastore.com`

**Importante**:
- Debe coincidir exactamente con la URL desde la cual el frontend hace requests
- En producción, usar HTTPS
- El puerto debe coincidir con el puerto expuesto del frontend

## Configuración por Entorno

### Desarrollo Local (Máxima Portabilidad) - RECOMENDADO

**Archivo**: `.env` o `.env.docker`

```bash
# Cookie Configuration
COOKIE_DOMAIN=
FRONTEND_URL=http://localhost:3020

# Otras configuraciones
NODE_ENV=development
JWT_SECRET=development_jwt_secret_key_change_in_production
```

**Características**:
- `COOKIE_DOMAIN` vacío = funciona con **cualquier dominio/IP**
- `secure: false` - Permite HTTP
- `sameSite: 'lax'` - Permite navegación normal
- ✅ Funciona en `http://localhost:XXXX`
- ✅ Funciona en `http://127.0.0.1:XXXX`
- ✅ Funciona en `http://192.168.1.100:XXXX` (cualquier IP)
- ✅ **Portabilidad total**: El proyecto funciona en cualquier equipo sin cambios

**¿Por qué dejar COOKIE_DOMAIN vacío?**
- Cuando `COOKIE_DOMAIN` está vacío, el navegador usa el dominio exacto de la request
- Esto permite que las cookies funcionen con localhost, IPs, y cualquier dominio
- Es la configuración más flexible para desarrollo

### Desarrollo en Red Local (IP)

Si necesitas acceder desde otra máquina en tu red local (ej: probar en móvil):

#### Opción 1: Script Automático (Recomendado)

```powershell
# Ejecutar script de configuración
.\scripts\setup\configure-network-access.ps1

# Seleccionar opción 2: Red local
# El script detectará automáticamente tu IP y configurará todo

# Reiniciar servicios
docker-compose -f docker-compose.optimized.yml restart user-service api-gateway frontend
```

#### Opción 2: Configuración Manual

**Archivo**: `.env` o `.env.docker`

```bash
# Cookie Configuration
# Reemplazar 192.168.1.100 con la IP de tu máquina
COOKIE_DOMAIN=192.168.1.100
FRONTEND_URL=http://192.168.1.100:3020

# Otras configuraciones
NODE_ENV=development
JWT_SECRET=development_jwt_secret_key_change_in_production
```

**Pasos**:
1. Obtener la IP de tu máquina:
   ```bash
   # Windows
   ipconfig
   
   # Linux/Mac
   ifconfig
   ```
2. Actualizar `COOKIE_DOMAIN` y `FRONTEND_URL` con tu IP en:
   - `.env`
   - `.env.docker`
   - `.env.shared`
3. Actualizar también `NEXT_PUBLIC_API_URL` y `NEXT_PUBLIC_APP_URL`
4. Reiniciar los servicios:
   ```bash
   docker-compose -f docker-compose.optimized.yml restart user-service api-gateway frontend
   ```
5. Acceder desde cualquier dispositivo en tu red: `http://192.168.1.100:3020`

### Staging

**Archivo**: `.env.staging.example` (copiar a `.env.staging`)

```bash
# Cookie Configuration
COOKIE_DOMAIN=staging.technovastore.com
FRONTEND_URL=http://staging.technovastore.com:3020

# Otras configuraciones
NODE_ENV=staging
JWT_SECRET=staging_jwt_secret_key_change_me_to_something_very_secure
```

**Características**:
- `secure: false` - Permite HTTP (si staging no tiene HTTPS)
- `sameSite: 'lax'`
- Usar dominio de staging real

### Producción

**Archivo**: `.env.prod.example` (copiar a `.env.prod`)

```bash
# Cookie Configuration
COOKIE_DOMAIN=technovastore.com
FRONTEND_URL=https://technovastore.com

# Otras configuraciones
NODE_ENV=production
JWT_SECRET=your_super_secure_jwt_secret_key_here_minimum_32_characters
```

**Características**:
- `secure: true` - Requiere HTTPS
- `sameSite: 'lax'`
- NO incluir `www` en `COOKIE_DOMAIN` para que funcione en subdominios

**Importante en Producción**:
- SIEMPRE usar HTTPS
- Usar un JWT_SECRET fuerte (mínimo 32 caracteres)
- El dominio debe estar correctamente configurado en DNS
- Certificado SSL válido

## Configuración de CORS

Para que las cookies funcionen correctamente, el API Gateway debe tener CORS configurado correctamente.

### Backend (API Gateway)

```typescript
// domains/platform/api-gateway/index.ts
import cors from 'cors';

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3020',
  credentials: true, // ✅ CRÍTICO: Permite envío de cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Session-ID'],
  exposedHeaders: ['Set-Cookie'],
};

app.use(cors(corsOptions));

// ✅ IMPORTANTE: cookie-parser debe estar configurado
import cookieParser from 'cookie-parser';
app.use(cookieParser());
```

### Frontend

El frontend debe configurar `withCredentials: true` en todas las requests:

```typescript
// Axios (configuración global)
import axios from 'axios';

axios.defaults.withCredentials = true;
axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL;

// Fetch
fetch(url, {
  credentials: 'include', // ✅ Incluir cookies
  headers: {
    'Content-Type': 'application/json',
  },
});
```

## Configuración en Docker Compose

Las variables de entorno deben estar configuradas en `docker-compose.optimized.yml`:

```yaml
services:
  user-service:
    environment:
      NODE_ENV: development
      COOKIE_DOMAIN: localhost
      FRONTEND_URL: http://localhost:3020
      JWT_SECRET: your-super-secret-jwt-key-change-in-production
      # ... otras variables

  api-gateway:
    environment:
      NODE_ENV: development
      COOKIE_DOMAIN: localhost
      FRONTEND_URL: http://localhost:3020
      JWT_SECRET: your-super-secret-jwt-key-change-in-production
      # ... otras variables
```

## Troubleshooting

### Las cookies no se establecen

**Síntomas**: Después del login, no aparece la cookie `auth_token` en DevTools

**Soluciones**:
1. **RECOMENDADO**: Dejar `COOKIE_DOMAIN` vacío para máxima compatibilidad
   ```bash
   COOKIE_DOMAIN=
   ```
   Esto funciona con localhost, 127.0.0.1, y cualquier IP automáticamente

2. Si especificaste un `COOKIE_DOMAIN`, verificar que coincide con el dominio desde el cual accedes
   - Si accedes desde `http://localhost:3020`, `COOKIE_DOMAIN` debe ser `localhost` o vacío
   - Si accedes desde `http://192.168.1.100:3020`, `COOKIE_DOMAIN` debe ser `192.168.1.100` o vacío

3. Verificar que CORS está configurado correctamente:
   ```typescript
   credentials: true  // Debe estar en true
   ```

4. Verificar que el frontend tiene `withCredentials: true`:
   ```typescript
   axios.defaults.withCredentials = true;
   ```

5. Verificar logs del backend:
   ```bash
   docker logs technovastore-user-service
   ```

### Las cookies no se envían en requests

**Síntomas**: La cookie existe pero no se envía en requests autenticadas

**Soluciones**:
1. Verificar que el frontend tiene `withCredentials: true`
2. Verificar que el dominio de la cookie coincide con el dominio del request
3. Verificar que no hay errores de CORS en la consola del navegador

### Error de CORS

**Síntomas**: Error en consola: "CORS policy: The value of the 'Access-Control-Allow-Origin' header..."

**Soluciones**:
1. Verificar que `FRONTEND_URL` está configurado correctamente en el backend
2. Verificar que `credentials: true` está en la configuración de CORS
3. Verificar que el frontend hace requests a la URL correcta

### Cookies no funcionan en producción

**Síntomas**: Funciona en desarrollo pero no en producción

**Soluciones**:
1. Verificar que estás usando HTTPS en producción
2. Verificar que `COOKIE_DOMAIN` es correcto (sin `www`)
3. Verificar que el certificado SSL es válido
4. Verificar que `secure: true` está configurado en producción

### Cookies no funcionan entre subdominios

**Síntomas**: La cookie funciona en `www.technovastore.com` pero no en `api.technovastore.com`

**Soluciones**:
1. Configurar `COOKIE_DOMAIN=technovastore.com` (sin `www`)
2. Esto permite que la cookie funcione en todos los subdominios

## Verificación

### Verificar que las cookies se establecen correctamente

1. Abrir DevTools (F12)
2. Ir a la pestaña "Application" o "Storage"
3. Expandir "Cookies"
4. Seleccionar el dominio (ej: `http://localhost:3020`)
5. Buscar la cookie `auth_token`
6. Verificar los flags:
   - ✅ `HttpOnly`: Debe estar marcado
   - ✅ `Secure`: Debe estar marcado en producción (HTTPS)
   - ✅ `SameSite`: Debe ser `Lax`
   - ✅ `Domain`: Debe coincidir con `COOKIE_DOMAIN`
   - ✅ `Path`: Debe ser `/`

### Verificar que las cookies se envían en requests

1. Abrir DevTools (F12)
2. Ir a la pestaña "Network"
3. Hacer una request autenticada (ej: GET /api/users/profile)
4. Seleccionar la request
5. Ir a la pestaña "Headers"
6. Buscar en "Request Headers" el header `Cookie`
7. Verificar que contiene `auth_token=...`

## Referencias

- [Spec de Backend HttpOnly Cookies](.kiro/specs/backend-httponly-cookies/)
- [Documentación de Seguridad](./SECURITY_SETUP.md)
- [MDN: HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [OWASP: Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
