# Estrategia de Consolidación de Variables de Entorno

**Fecha de creación:** 6 de noviembre de 2025  
**Basado en:** ENV_DUPLICATION_REPORT.md  
**Objetivo:** Eliminar duplicaciones y estandarizar configuración de variables de entorno

---

## 1. Resumen Ejecutivo

### Situación Actual
- **15 archivos .env** distribuidos en el proyecto
- **57 variables únicas duplicadas** con 213 ocurrencias totales
- **14 pares de archivos similares** (>20% de similitud)
- Configuración fragmentada y difícil de mantener

### Objetivo
- Reducir a **6-8 archivos .env** estratégicos
- Eliminar **100% de duplicaciones innecesarias**
- Centralizar configuración compartida
- Mantener flexibilidad por entorno y servicio

### Beneficios Esperados
- ✅ Mantenimiento simplificado (un solo lugar para actualizar variables comunes)
- ✅ Menor riesgo de inconsistencias entre servicios
- ✅ Configuración más clara y documentada
- ✅ Onboarding más rápido para nuevos desarrolladores

---

## 2. Principios de Consolidación

### 2.1 Jerarquía de Configuración

```
┌─────────────────────────────────────────┐
│  .env.{environment}                     │  ← Nivel 1: Configuración por entorno
│  (docker, prod, staging)                │     (variables globales del proyecto)
└─────────────────────────────────────────┘
              ↓ hereda/sobrescribe
┌─────────────────────────────────────────┐
│  .env.shared                            │  ← Nivel 2: Configuración compartida
│  (variables comunes a todos servicios)  │     (bases de datos, URLs, etc.)
└─────────────────────────────────────────┘
              ↓ hereda/sobrescribe
┌─────────────────────────────────────────┐
│  {service}/.env.example                 │  ← Nivel 3: Configuración específica
│  (solo variables únicas del servicio)   │     (solo si es necesario)
└─────────────────────────────────────────┘
```

### 2.2 Criterios de Decisión

**Mantener archivo .env si:**
- ✅ Es específico de un entorno (development, production, staging)
- ✅ Contiene configuración crítica de seguridad
- ✅ Es usado activamente por Docker Compose
- ✅ Tiene variables únicas que no se repiten

**Eliminar archivo .env si:**
- ❌ Es duplicado de otro archivo
- ❌ Contiene solo variables que ya están en archivos centralizados
- ❌ Es un template (.example) redundante
- ❌ No es referenciado por ningún servicio o script

### 2.3 Estrategia de Migración

1. **Crear archivos centralizados** con variables compartidas
2. **Migrar variables** de archivos específicos a centralizados
3. **Actualizar referencias** en docker-compose y servicios
4. **Eliminar archivos** redundantes
5. **Validar** que servicios funcionan correctamente

---

## 3. Estructura Objetivo

### 3.1 Archivos a Mantener (6 archivos principales)

```
TechNovaStore/
├── .env.docker                          # ✅ MANTENER - Desarrollo con Docker (activo)
├── .env.docker.example                  # ✅ MANTENER - Template para desarrollo
├── .env.shared.example                  # ✅ CREAR - Variables compartidas entre servicios
├── .env.prod.example                    # ✅ MANTENER - Template para producción
├── .env.staging.example                 # ✅ MANTENER - Template para staging
└── .env.logging.example                 # ✅ MANTENER - Configuración específica de logging
```

### 3.2 Archivos a Eliminar (9 archivos)

```
❌ .env.example                          # ELIMINAR - Consolidar en .env.docker.example
❌ frontend/.env.local                   # ELIMINAR - Usar .env.docker (contiene valores reales)
❌ frontend/.env.local.example           # CONSOLIDAR - Mover a .env.shared.example
❌ ai-services/chatbot/.env.example      # CONSOLIDAR - Mover variables únicas a .env.shared
❌ ai-services/recommender/.env.example  # CONSOLIDAR - Mover variables únicas a .env.shared
❌ services/notification/.env.example    # CONSOLIDAR - Mover variables únicas a .env.shared
❌ services/ticket/.env.example          # CONSOLIDAR - Mover variables únicas a .env.shared
❌ services/user/.env.example            # CONSOLIDAR - Mover variables únicas a .env.shared
❌ automation/shipment-tracker/.env.example  # CONSOLIDAR - Mover variables únicas a .env.shared
```

**Nota:** `api-gateway/.env.security.example` se mantiene porque contiene configuración de seguridad específica y extensa.

### 3.3 Archivos Especiales

```
api-gateway/
└── .env.security.example                # ✅ MANTENER - Configuración de seguridad específica
                                         #    (HTTPS, CSRF, CSP, rate limiting, etc.)
```

---

## 4. Mapeo de Variables

### 4.1 Variables Globales (en .env.docker, .env.prod, .env.staging)

Estas variables son específicas del entorno y deben estar en los archivos de entorno:

```bash
# Entorno
NODE_ENV=development|production|staging

# URLs Públicas del Frontend (específicas por entorno)
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_URL=http://localhost:3011
NEXT_PUBLIC_CHATBOT_URL=http://localhost:3009
NEXT_PUBLIC_SOCKET_URL=http://localhost:3009

# OAuth (específico por entorno)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_GITHUB_CLIENT_ID=

# Analytics (específico por entorno)
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=
NEXT_PUBLIC_SENTRY_DSN=

# Credenciales de Bases de Datos (específicas por entorno)
MONGO_USERNAME=admin
MONGO_PASSWORD=password
POSTGRES_USERNAME=admin
POSTGRES_PASSWORD=password
REDIS_PASSWORD=password

# JWT Secret (específico por entorno)
JWT_SECRET=development_jwt_secret_key_change_in_production

# Logging (específico por entorno)
LOG_LEVEL=debug|info|error
```

### 4.2 Variables Compartidas (en .env.shared.example)

Estas variables son comunes a todos los servicios y entornos:

```bash
# ============================================
# CONFIGURACIÓN COMPARTIDA DE SERVICIOS
# ============================================
# Este archivo contiene variables comunes a todos los microservicios.
# Cada servicio puede sobrescribir estas variables en su propio .env si es necesario.

# --- Configuración de Servidor ---
PORT=3000                                # Puerto por defecto (cada servicio sobrescribe)

# --- Bases de Datos ---
# MongoDB
MONGODB_URI=mongodb://localhost:27017/technovastore
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=2
MONGODB_MAX_IDLE_TIME=30000
MONGODB_SERVER_SELECTION_TIMEOUT=5000
MONGODB_SOCKET_TIMEOUT=45000

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=technovastore
POSTGRES_POOL_MAX=20
POSTGRES_POOL_MIN=5
POSTGRES_POOL_ACQUIRE=30000
POSTGRES_POOL_IDLE=10000
POSTGRES_SSL=false

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# --- URLs de Servicios Internos (Docker network) ---
CHATBOT_SERVICE_URL=http://chatbot:3001
TICKET_SERVICE_URL=http://ticket-service:3005
USER_SERVICE_URL=http://user-service:3002
PRODUCT_SERVICE_URL=http://product-service:3003
PAYMENT_SERVICE_URL=http://payment-service:3004
NOTIFICATION_SERVICE_URL=http://notification-service:3005
ORDER_SERVICE_URL=http://order-service:3006

# --- Configuración de Email (SMTP) ---
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@technovastore.com
SMTP_PASS=your_smtp_app_password
EMAIL_FROM=noreply@technovastore.com

# --- Seguridad ---
CSRF_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# --- APIs Externas (Proveedores) ---
AMAZON_API_KEY=your-amazon-api-key
AMAZON_SECRET_KEY=your-amazon-secret-key
ALIEXPRESS_API_KEY=your-aliexpress-api-key
BANGGOOD_API_KEY=your-banggood-api-key
EBAY_API_KEY=your-ebay-api-key
NEWEGG_API_KEY=your-newegg-api-key

# --- Configuración de Cache ---
CACHE_TTL=3600
PRICE_CACHE_TTL=1800

# --- Configuración de Sincronización ---
SYNC_INTERVAL_HOURS=4
PRICE_UPDATE_INTERVAL_MINUTES=15

# --- Tracking ---
TRACKING_UPDATE_INTERVAL=6
RATE_LIMIT_DELAY=1000
MAX_RETRY_ATTEMPTS=3

# --- Recomendaciones ---
RECOMMENDATION_CACHE_TTL=3600
MODEL_UPDATE_INTERVAL=86400
MIN_INTERACTIONS_FOR_CF=5
DIVERSITY_FACTOR=0.3

# --- Sesiones ---
SESSION_MAX_AGE=86400000

# --- CORS ---
CORS_ORIGIN=http://localhost:3011

# --- Monitoreo ---
ENABLE_METRICS=true
```

### 4.3 Variables Específicas por Servicio

Después de consolidar, solo estas variables específicas quedarían en servicios individuales (si es necesario):

#### api-gateway/.env.security.example
```bash
# Configuración extensa de seguridad (HTTPS, CSP, HSTS, XSS, etc.)
# Este archivo se mantiene separado por su complejidad y especificidad
```

#### Servicios individuales
**Después de la consolidación, los servicios NO necesitarán archivos .env.example propios** porque:
- Variables comunes estarán en `.env.shared.example`
- Variables de entorno estarán en `.env.docker`, `.env.prod`, etc.
- Variables específicas del servicio se pueden documentar en el README del servicio

---

## 5. Plan de Migración Detallado

### 5.1 Fase 1: Crear Archivos Centralizados

**Acción:** Crear `.env.shared.example` con todas las variables compartidas

**Pasos:**
1. Crear archivo `.env.shared.example` en la raíz
2. Copiar variables comunes identificadas en el análisis
3. Organizar por categorías (bases de datos, servicios, email, etc.)
4. Agregar comentarios explicativos
5. Documentar propósito del archivo

**Resultado esperado:**
- ✅ Archivo `.env.shared.example` creado
- ✅ Contiene ~50 variables compartidas
- ✅ Bien documentado y organizado

### 5.2 Fase 2: Consolidar .env.docker.example

**Acción:** Mejorar `.env.docker.example` para que sea el template principal de desarrollo

**Pasos:**
1. Revisar `.env.example` (archivo a eliminar)
2. Identificar variables que faltan en `.env.docker.example`
3. Agregar variables faltantes a `.env.docker.example`
4. Mejorar documentación y comentarios
5. Agregar referencia a `.env.shared.example`

**Variables a agregar:**
```bash
# Referencia: Este archivo debe usarse junto con .env.shared.example
# Para desarrollo local, copiar ambos archivos y renombrar sin .example

# Configuración de aplicación
API_BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3011

# APIs Externas (desarrollo - opcional)
AMAZON_API_KEY=
ALIEXPRESS_API_KEY=
EBAY_API_KEY=
BANGGOOD_API_KEY=
NEWEGG_API_KEY=
```

**Resultado esperado:**
- ✅ `.env.docker.example` es template completo para desarrollo
- ✅ Incluye todas las variables necesarias
- ✅ Bien documentado con instrucciones

### 5.3 Fase 3: Migrar Variables de Servicios

**Acción:** Extraer variables únicas de cada servicio y consolidar

**Para cada servicio:**

#### chatbot/.env.example
```bash
# Variables a mover a .env.shared.example:
MONGODB_URI, FRONTEND_URL, TICKET_SERVICE_URL, LOG_LEVEL, SESSION_MAX_AGE, CORS_ORIGIN

# Variables específicas (mantener en README del servicio):
CHATBOT_PORT=3001
PYTHON_PATH=python  # Para spaCy
```

#### recommender/.env.example
```bash
# Variables a mover a .env.shared.example:
MONGODB_URL, REDIS_URL, LOG_LEVEL, RECOMMENDATION_CACHE_TTL, MODEL_UPDATE_INTERVAL, 
MIN_INTERACTIONS_FOR_CF, DIVERSITY_FACTOR

# Variables específicas: Ninguna (todas son compartidas)
```

#### notification/.env.example
```bash
# Variables a mover a .env.shared.example:
SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, EMAIL_FROM, LOG_LEVEL

# Variables específicas:
SERVICE_NAME=notification-service  # Documentar en README
```

#### ticket/.env.example
```bash
# Variables a mover a .env.shared.example:
POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD,
FRONTEND_URL, API_GATEWAY_URL, NOTIFICATION_SERVICE_URL, JWT_SECRET,
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS

# Variables específicas:
TICKET_SERVICE_PORT=3005  # Documentar en README
```

#### user/.env.example
```bash
# Variables a mover a .env.shared.example:
DATABASE_URL, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD,
JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN,
FRONTEND_URL, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD,
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, LOG_LEVEL

# Variables específicas (mantener en README):
GOOGLE_CLIENT_SECRET=  # NUNCA en frontend, solo backend
GITHUB_CLIENT_SECRET=  # NUNCA en frontend, solo backend
```

#### shipment-tracker/.env.example
```bash
# Variables a mover a .env.shared.example:
POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD,
NOTIFICATION_SERVICE_URL, AMAZON_API_KEY, ALIEXPRESS_API_KEY, EBAY_API_KEY,
BANGGOOD_API_KEY, NEWEGG_API_KEY, LOG_LEVEL,
TRACKING_UPDATE_INTERVAL, RATE_LIMIT_DELAY, MAX_RETRY_ATTEMPTS

# Variables específicas: Ninguna (todas son compartidas)
```

**Resultado esperado:**
- ✅ Variables comunes movidas a `.env.shared.example`
- ✅ Variables específicas documentadas en README de cada servicio
- ✅ Archivos `.env.example` de servicios listos para eliminar

### 5.4 Fase 4: Consolidar Frontend

**Acción:** Eliminar archivos .env del frontend y usar configuración centralizada

**Pasos:**
1. Verificar que `frontend/.env.local` está en `.gitignore`
2. Mover variables públicas a `.env.docker`, `.env.prod`, `.env.staging`
3. Documentar en `frontend/README.md` cómo configurar variables
4. Eliminar `frontend/.env.local` del repositorio (si existe)
5. Actualizar `frontend/.env.local.example` con instrucciones de uso

**Contenido de frontend/.env.local.example (actualizado):**
```bash
# ============================================
# CONFIGURACIÓN DEL FRONTEND - INSTRUCCIONES
# ============================================
#
# ⚠️ IMPORTANTE: Este archivo es solo para referencia.
# 
# En desarrollo con Docker:
# - Las variables se configuran en .env.docker (raíz del proyecto)
# - Docker Compose las inyecta automáticamente al contenedor
# - NO necesitas crear .env.local manualmente
#
# En desarrollo local (sin Docker):
# - Copia este archivo a .env.local
# - Configura las variables según tu entorno
# - .env.local está en .gitignore (no se sube al repositorio)
#
# Variables necesarias:
# - NEXT_PUBLIC_API_URL: URL del API Gateway
# - NEXT_PUBLIC_APP_URL: URL de la aplicación
# - NEXT_PUBLIC_CHATBOT_URL: URL del servicio de chatbot
# - NEXT_PUBLIC_SOCKET_URL: URL para WebSockets
# - NEXT_PUBLIC_GOOGLE_CLIENT_ID: (opcional) OAuth Google
# - NEXT_PUBLIC_GITHUB_CLIENT_ID: (opcional) OAuth GitHub
#
# Ver .env.docker.example para valores de desarrollo
# Ver .env.prod.example para valores de producción

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_URL=http://localhost:3011
NEXT_PUBLIC_CHATBOT_URL=http://localhost:3009
NEXT_PUBLIC_SOCKET_URL=http://localhost:3009

# OAuth (opcional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_GITHUB_CLIENT_ID=

# Analytics (opcional)
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=
NEXT_PUBLIC_SENTRY_DSN=
```

**Resultado esperado:**
- ✅ `frontend/.env.local` eliminado del repositorio
- ✅ `frontend/.env.local.example` actualizado con instrucciones claras
- ✅ Variables del frontend en archivos de entorno centralizados

### 5.5 Fase 5: Actualizar Referencias

**Acción:** Actualizar docker-compose y documentación

**Archivos a actualizar:**

#### docker-compose.optimized.yml
```yaml
# Agregar referencia a .env.shared en servicios que lo necesiten
services:
  chatbot:
    env_file:
      - .env.docker          # Variables de entorno
      - .env.shared          # Variables compartidas (si existe)
    environment:
      - PORT=3001            # Sobrescribir PORT específico
```

#### README.md
```markdown
## Configuración de Variables de Entorno

El proyecto usa una jerarquía de archivos .env:

1. **`.env.docker`** - Configuración para desarrollo con Docker (activo)
2. **`.env.shared`** - Variables compartidas entre servicios (opcional)
3. **`.env.prod`** - Configuración para producción
4. **`.env.staging`** - Configuración para staging

### Configuración Inicial

```bash
# Copiar templates
cp .env.docker.example .env.docker
cp .env.shared.example .env.shared  # Opcional

# Editar con tus valores
nano .env.docker
```

Ver documentación completa en `docs/configuration/environment-variables.md`
```

#### Crear docs/configuration/environment-variables.md
Documentación completa de todas las variables de entorno, su propósito y valores por defecto.

**Resultado esperado:**
- ✅ docker-compose actualizado para usar archivos centralizados
- ✅ README actualizado con instrucciones claras
- ✅ Documentación completa de variables creada

### 5.6 Fase 6: Eliminar Archivos Redundantes

**Acción:** Eliminar archivos .env que ya no son necesarios

**Archivos a eliminar:**
```bash
rm .env.example
rm frontend/.env.local  # Si existe en el repo
rm ai-services/chatbot/.env.example
rm ai-services/recommender/.env.example
rm services/notification/.env.example
rm services/ticket/.env.example
rm services/user/.env.example
rm automation/shipment-tracker/.env.example
```

**Actualizar .gitignore:**
```bash
# Variables de entorno
.env
.env.local
.env.*.local
.env.docker
.env.shared
.env.prod
.env.staging

# Mantener templates
!.env.*.example
```

**Resultado esperado:**
- ✅ 9 archivos .env eliminados
- ✅ .gitignore actualizado
- ✅ Solo archivos necesarios permanecen

### 5.7 Fase 7: Validación

**Acción:** Verificar que todo funciona correctamente

**Pasos de validación:**

1. **Validar archivos creados:**
```bash
# Verificar que archivos existen
ls -la .env.docker.example
ls -la .env.shared.example
ls -la .env.prod.example
ls -la .env.staging.example
ls -la .env.logging.example
ls -la api-gateway/.env.security.example
```

2. **Validar que archivos fueron eliminados:**
```bash
# Estos comandos NO deben encontrar archivos
find . -name ".env.example" -not -path "./node_modules/*"
find . -path "*/services/*/.env.example"
find . -path "*/ai-services/*/.env.example"
```

3. **Validar Docker Compose:**
```bash
# Copiar templates
cp .env.docker.example .env.docker
cp .env.shared.example .env.shared

# Validar sintaxis
docker-compose -f docker-compose.optimized.yml config

# Iniciar servicios
docker-compose -f docker-compose.optimized.yml up -d

# Verificar que servicios inician
docker-compose -f docker-compose.optimized.yml ps
```

4. **Validar servicios funcionan:**
```bash
# Verificar health checks
docker exec technovastore-chatbot curl -f http://localhost:3001/health
docker exec technovastore-frontend curl -f http://localhost:3000/
docker exec technovastore-api-gateway curl -f http://localhost:3000/health
```

5. **Ejecutar análisis de duplicaciones:**
```bash
# Debe mostrar reducción significativa
node scripts/analyze-env-duplications.js
```

**Resultado esperado:**
- ✅ Todos los servicios inician correctamente
- ✅ Health checks pasan
- ✅ Análisis muestra reducción de duplicaciones
- ✅ No hay errores de variables faltantes

---

## 6. Checklist de Implementación

### Fase 1: Crear Archivos Centralizados
- [ ] Crear `.env.shared.example` con variables compartidas
- [ ] Organizar variables por categorías
- [ ] Agregar comentarios explicativos
- [ ] Validar sintaxis

### Fase 2: Consolidar .env.docker.example
- [ ] Revisar `.env.example` actual
- [ ] Agregar variables faltantes a `.env.docker.example`
- [ ] Mejorar documentación
- [ ] Agregar referencia a `.env.shared.example`

### Fase 3: Migrar Variables de Servicios
- [ ] Extraer variables de `chatbot/.env.example`
- [ ] Extraer variables de `recommender/.env.example`
- [ ] Extraer variables de `notification/.env.example`
- [ ] Extraer variables de `ticket/.env.example`
- [ ] Extraer variables de `user/.env.example`
- [ ] Extraer variables de `shipment-tracker/.env.example`
- [ ] Actualizar `.env.shared.example` con variables extraídas
- [ ] Documentar variables específicas en README de cada servicio

### Fase 4: Consolidar Frontend
- [ ] Verificar `.env.local` en `.gitignore`
- [ ] Actualizar `frontend/.env.local.example` con instrucciones
- [ ] Eliminar `frontend/.env.local` del repositorio (si existe)
- [ ] Documentar configuración en `frontend/README.md`

### Fase 5: Actualizar Referencias
- [ ] Actualizar `docker-compose.optimized.yml`
- [ ] Actualizar `docker-compose.prod.yml`
- [ ] Actualizar `docker-compose.staging.yml`
- [ ] Actualizar `README.md` principal
- [ ] Crear `docs/configuration/environment-variables.md`

### Fase 6: Eliminar Archivos Redundantes
- [ ] Eliminar `.env.example`
- [ ] Eliminar `frontend/.env.local` (si existe)
- [ ] Eliminar archivos `.env.example` de servicios (6 archivos)
- [ ] Actualizar `.gitignore`

### Fase 7: Validación
- [ ] Validar archivos creados existen
- [ ] Validar archivos eliminados no existen
- [ ] Validar sintaxis de docker-compose
- [ ] Iniciar servicios Docker
- [ ] Verificar health checks
- [ ] Ejecutar análisis de duplicaciones
- [ ] Verificar reducción de duplicaciones

### Fase 8: Documentación
- [ ] Actualizar documentación de configuración
- [ ] Crear guía de migración para desarrolladores
- [ ] Actualizar CONTRIBUTING.md si es necesario
- [ ] Crear commit con cambios

---

## 7. Métricas de Éxito

### Antes de la Consolidación
- ❌ 15 archivos .env
- ❌ 57 variables únicas duplicadas
- ❌ 213 ocurrencias duplicadas
- ❌ 14 pares de archivos similares

### Después de la Consolidación (Objetivo)
- ✅ 6-7 archivos .env estratégicos
- ✅ 0-5 variables duplicadas (solo las necesarias por entorno)
- ✅ <30 ocurrencias duplicadas
- ✅ 0-2 pares de archivos similares

### KPIs
- **Reducción de archivos:** 53% (15 → 7)
- **Reducción de duplicaciones:** >90% (213 → <30)
- **Tiempo de configuración inicial:** -50% (menos archivos que copiar/editar)
- **Mantenibilidad:** +80% (cambios centralizados)

---

## 8. Riesgos y Mitigaciones

### Riesgo 1: Servicios no encuentran variables
**Probabilidad:** Media  
**Impacto:** Alto  
**Mitigación:**
- Validar cada servicio después de cambios
- Mantener backup de archivos originales
- Usar docker-compose config para validar antes de aplicar

### Riesgo 2: Variables sensibles expuestas
**Probabilidad:** Baja  
**Impacto:** Crítico  
**Mitigación:**
- Verificar .gitignore antes de eliminar archivos
- Nunca commitear archivos .env sin .example
- Revisar historial de Git si se detecta exposición

### Riesgo 3: Incompatibilidad con CI/CD
**Probabilidad:** Media  
**Impacto:** Medio  
**Mitigación:**
- Actualizar scripts de CI/CD junto con consolidación
- Probar en entorno de staging primero
- Documentar cambios necesarios en pipelines

### Riesgo 4: Desarrolladores confundidos
**Probabilidad:** Alta  
**Impacto:** Bajo  
**Mitigación:**
- Documentar cambios claramente
- Crear guía de migración
- Comunicar cambios al equipo
- Mantener instrucciones en README

---

## 9. Cronograma Estimado

| Fase | Duración | Dependencias |
|------|----------|--------------|
| 1. Crear archivos centralizados | 30 min | Análisis completado |
| 2. Consolidar .env.docker.example | 20 min | Fase 1 |
| 3. Migrar variables de servicios | 1 hora | Fase 1 |
| 4. Consolidar frontend | 20 min | Fase 1 |
| 5. Actualizar referencias | 30 min | Fases 1-4 |
| 6. Eliminar archivos redundantes | 15 min | Fases 1-5 |
| 7. Validación | 45 min | Fases 1-6 |
| 8. Documentación | 30 min | Fase 7 |
| **TOTAL** | **4 horas** | - |

---

## 10. Próximos Pasos

1. ✅ **Revisar esta estrategia** con el equipo
2. ⏳ **Aprobar plan de consolidación**
3. ⏳ **Ejecutar Fase 1:** Crear archivos centralizados
4. ⏳ **Ejecutar Fases 2-6:** Consolidar y migrar
5. ⏳ **Ejecutar Fase 7:** Validación completa
6. ⏳ **Ejecutar Fase 8:** Documentación
7. ⏳ **Crear commit:** "Phase 2.1: Consolidate environment variables"

---

## 11. Referencias

- **Análisis de duplicaciones:** `ENV_DUPLICATION_REPORT.md`
- **Archivos actuales:** Ver sección 2 del reporte
- **Variables duplicadas:** Ver sección 3 del reporte
- **Recomendaciones originales:** Ver sección 6 del reporte

---

**Documento creado por:** Script de análisis automatizado  
**Última actualización:** 6 de noviembre de 2025  
**Estado:** ✅ Listo para implementación
