# Guías del Proyecto TechNovaStore

Reglas y convenciones generales para el desarrollo de todo el proyecto TechNovaStore, una plataforma de e-commerce especializada en tecnología e informática con arquitectura de microservicios.

## Idioma de Respuestas

**IMPORTANTE**: Todas las respuestas en el chat deben ser en español.

### Reglas de Idioma

- Responder siempre en español al usuario
- Los comentarios en el código DEBEN estar en español
- Los nombres de variables, funciones y clases pueden estar en inglés (convención estándar)
- Toda comunicación directa con el usuario debe ser en español
- Documentación técnica (JSDoc, comentarios de código) debe estar en español

## Archivos de Prueba Temporales

- Cuando crees archivos de prueba solo para verificación (test-_.ts, verify-_.ts, etc.), DEBES eliminarlos después de ejecutarlos exitosamente
- No dejes archivos de prueba temporales en el repositorio
- Solo mantén archivos de prueba que sean parte de la suite de testing oficial del proyecto

## Revisión de Tareas Antes de Implementar

**IMPORTANTE**: SIEMPRE revisar la lista de tareas antes de implementar cualquier funcionalidad.

### Reglas de Implementación

- ANTES de implementar cualquier funcionalidad, DEBES revisar el archivo `.kiro/specs/[nombre-spec]/tasks.md`
- Verificar si la funcionalidad que vas a implementar corresponde a una tarea específica
- Si corresponde a una tarea, verificar que la implementación sea exactamente como se describe en la tarea
- NO implementar funcionalidades que no estén en las tareas o que no correspondan a la tarea actual
- Si hay dudas sobre qué implementar, preguntar al usuario qué tarea específica quiere ejecutar

## Entorno de Desarrollo

**IMPORTANTE**: Este proyecto se ejecuta completamente con Docker.

### Información del Entorno

- **Sistema Operativo Local**: Windows 11
- **Entorno de Ejecución**: Docker containers
- **Arquitectura**: Microservicios con Docker Compose
- **Docker Compose Activo**: `docker-compose.optimized.yml` (NO usar docker-compose.yml)

### Servicios Dockerizados (Containers Activos)

**Microservicios de Aplicación:**

- `technovastore-frontend` (puerto 3011) - Aplicación web frontend
- `technovastore-api-gateway` (puerto 3000) - API Gateway principal
- `technovastore-chatbot` (puerto 3009) - Servicio de chatbot con Ollama/Phi-3
- `technovastore-product-service` (puerto 3001) - Gestión de productos
- `technovastore-order-service` (puerto 3002) - Gestión de pedidos
- `technovastore-user-service` (puerto 3003) - Gestión de usuarios
- `technovastore-payment-service` (puerto 3004) - Procesamiento de pagos
- `technovastore-notification-service` (puerto 3005) - Envío de notificaciones
- `technovastore-sync-engine` (puerto 3006) - Motor de sincronización
- `technovastore-auto-purchase` (puerto 3007) - Compras automáticas
- `technovastore-shipment-tracker` (puerto 3008) - Seguimiento de envíos
- `technovastore-recommender` (puerto 3010) - Sistema de recomendaciones
- `technovastore-ticket-service` (puerto 3012) - Gestión de tickets de soporte

**Bases de Datos:**

- `technovastore-mongodb` (puerto 27017) - Base de datos NoSQL principal
- `technovastore-postgresql` (puerto 5432) - Base de datos SQL
- `technovastore-redis` (puerto 6379) - Cache y mensajería

**Monitoreo y Observabilidad:**

- `technovastore-prometheus` (puerto 9090) - Recolección de métricas
- `technovastore-grafana` (puerto 3013) - Visualización de métricas
- `technovastore-alertmanager` (puerto 9093) - Gestión de alertas
- `technovastore-elasticsearch` (puertos 9200, 9300) - Motor de búsqueda y logs
- `technovastore-logstash` (puertos 5000, 5044, 9600) - Procesamiento de logs
- `technovastore-kibana` (puerto 5601) - Visualización de logs

**Exporters (Métricas):**

- `technovastore-node-exporter` (puerto 9100) - Métricas del sistema
- `technovastore-mongodb-exporter` (puerto 9216) - Métricas de MongoDB
- `technovastore-redis-exporter` (puerto 9121) - Métricas de Redis
- `technovastore-postgres-exporter` (puerto 9187) - Métricas de PostgreSQL

### Reglas de Docker

- SIEMPRE usar comandos de Docker para ejecutar servicios
- NO intentar ejecutar servicios directamente en Windows sin Docker
- Para ejecutar comandos dentro de containers, usar: `docker exec -it <container-name> <command>`
- Para ver logs de containers: `docker logs <container-name>`
- Para reconstruir servicios: `docker-compose build <service-name>`
- Para reiniciar servicios: `docker-compose restart <service-name>`

### Gestión de Recursos y RAM

**IMPORTANTE**: El sistema tiene **8GB de RAM física total** (6.8 GiB disponibles para Docker).

**Limitación crítica**: Ollama con Phi-3 Mini requiere **~5.3 GB de RAM** para funcionar correctamente.

**Estrategia de contenedores**:

- **NO arrancar todos los contenedores a la vez** - causará falta de memoria
- **Arrancar SOLO los contenedores necesarios** para cada tarea del tasks.md
- Detener contenedores no esenciales antes de trabajar con Ollama

**Contenedores esenciales para tareas de chatbot**:

- ✅ `technovastore-mongodb` - Base de datos para ProductKnowledgeBase
- ✅ `technovastore-ollama` - Servicio LLM (requiere 6GB límite)
- ✅ `technovastore-chatbot` - Servicio principal del chatbot

**Contenedores a detener durante desarrollo de chatbot**:

- ❌ Frontend, API Gateway, otros microservicios
- ❌ Stack ELK (Elasticsearch, Logstash, Kibana)
- ❌ Stack de monitoreo (Prometheus, Grafana, Alertmanager)
- ❌ Exporters (node-exporter, mongodb-exporter, etc.)

**Comandos útiles para gestión de recursos**:

```bash
# Detener contenedores no esenciales
docker-compose -f docker-compose.optimized.yml stop elasticsearch logstash kibana prometheus grafana alertmanager node-exporter mongodb-exporter postgres-exporter redis-exporter frontend api-gateway product-service order-service user-service payment-service notification-service ticket-service sync-engine auto-purchase shipment-tracker recommender

# Arrancar solo contenedores esenciales para chatbot
docker-compose -f docker-compose.optimized.yml up -d mongodb ollama chatbot

# Ver uso de RAM de contenedores
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}\t{{.MemPerc}}"

# Ver RAM disponible en el sistema
docker exec technovastore-ollama sh -c "free -h"
```

**Configuración de Ollama**:

- Límite de memoria: **6GB** (aumentado desde 3GB)
- Timeout: **120 segundos** (aumentado desde 30s para permitir carga del modelo)
- Primera carga del modelo tarda ~60-90 segundos
- Modelo cargado usa ~4.4 GB de RAM

**⚠️ LIMITACIÓN CRÍTICA CON 8GB RAM**:

- Con 8GB de RAM total, Ollama es **extremadamente lento** (>2 minutos por respuesta)
- El sistema Windows + Docker + servicios usan ~5GB, dejando solo ~1.8GB libres
- Ollama necesita ~5.3GB para funcionar eficientemente
- **Resultado**: Timeouts constantes (>120s), respuestas muy lentas o fallos
- **Solución**: Se requiere **16GB de RAM mínimo** para funcionamiento óptimo de Ollama
- **Estado actual**: Código implementado correctamente pero **NO VERIFICABLE** con 8GB RAM
- **Alternativa temporal**: El sistema de fallback (SimpleFallbackRecognizer) funciona correctamente sin Ollama

### Comandos Útiles de Docker

**IMPORTANTE**: Siempre usar `-f docker-compose.optimized.yml` en los comandos

```bash
# Ver todos los containers activos
docker ps

# Levantar todos los servicios
docker-compose -f docker-compose.optimized.yml up -d

# Ver estado de los servicios
docker-compose -f docker-compose.optimized.yml ps

# Ver logs de un servicio específico
docker-compose -f docker-compose.optimized.yml logs -f chatbot

# Ver logs en tiempo real de múltiples servicios
docker-compose -f docker-compose.optimized.yml logs -f chatbot mongodb

# Ejecutar comandos dentro del container del chatbot
docker exec -it technovastore-chatbot npm test
docker exec -it technovastore-chatbot npm run build
docker exec -it technovastore-chatbot sh

# Reconstruir y reiniciar un servicio (IMPORTANTE para aplicar cambios de código)
docker-compose -f docker-compose.optimized.yml up -d --build chatbot

# Reiniciar un servicio sin reconstruir
docker-compose -f docker-compose.optimized.yml restart chatbot

# Detener todos los servicios
docker-compose -f docker-compose.optimized.yml down

# Detener y eliminar volúmenes (CUIDADO: borra datos)
docker-compose -f docker-compose.optimized.yml down -v

# Ver uso de recursos de los containers
docker stats

# Inspeccionar un container
docker inspect technovastore-chatbot
```

### Nombres de Containers

**IMPORTANTE**: Los nombres de los containers tienen el prefijo `technovastore-`. Ejemplos:

- Chatbot: `technovastore-chatbot`
- MongoDB: `technovastore-mongodb`
- API Gateway: `technovastore-api-gateway`
- Frontend: `technovastore-frontend`

## Builds de Next.js (Frontend)

**IMPORTANTE**: Entender la diferencia entre desarrollo y producción para evitar confusiones.

### Comportamiento Esperado por Entorno

#### Desarrollo (`NODE_ENV=development`)

- ✅ **Comando correcto**: `npm run dev`
- ✅ **Funciona**: Hot reload, compilación on-demand
- ❌ **NO ejecutar**: `npm run build` (fallará con error de `<Html>`)
- **Razón**: Next.js no puede hacer build de producción con NODE_ENV=development

**Contenedor de desarrollo**:
```bash
# docker-compose.optimized.yml tiene NODE_ENV: development
docker-compose -f docker-compose.optimized.yml up -d frontend

# El contenedor ejecuta automáticamente: npm run dev
# NO intentar hacer build en este contenedor
```

#### Producción (`NODE_ENV=production`)

- ✅ **Comando correcto**: `npm run build`
- ✅ **Funciona**: Build optimizado, generación estática de páginas
- ✅ **Resultado**: 16 páginas generadas, standalone build creado

**Contenedor de producción**:
```bash
# docker-compose.prod.yml tiene NODE_ENV: production
docker-compose -f docker-compose.prod.yml up -d frontend-1 frontend-2

# El build se ejecuta durante la construcción de la imagen
```

### Error Común: `<Html> should not be imported outside of pages/_document`

**Este error es ESPERADO y NORMAL cuando**:
- Intentas ejecutar `npm run build` en un contenedor con `NODE_ENV=development`
- Esto NO es un error del código, es una limitación de Next.js

**Solución**:
- En desarrollo: Usa `npm run dev` (ya configurado en docker-compose.optimized.yml)
- En producción: Usa `docker-compose.prod.yml` que tiene `NODE_ENV=production`

### Verificación de Funcionamiento

```bash
# Verificar TypeScript (funciona en cualquier entorno)
docker exec technovastore-frontend npx tsc --noEmit
# Debe retornar Exit Code: 0

# Verificar servidor de desarrollo
docker exec technovastore-frontend sh -c "curl -f http://localhost:3000 && echo 'OK'"
# Debe retornar: OK

# Probar build de producción (solo para verificar)
docker run --rm -e NODE_ENV=production technovastore-frontend:latest npm run build
# Debe completarse exitosamente con 16 páginas generadas
```

### Limpieza de Caché (si hay problemas)

Si el contenedor tiene problemas después de cambios en el código:

```bash
# Detener y eliminar contenedor
docker-compose -f docker-compose.optimized.yml stop frontend
docker-compose -f docker-compose.optimized.yml rm -f frontend

# Limpiar caché local
Remove-Item -Path "frontend\.next" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "frontend\node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue

# Reconstruir desde cero
docker-compose -f docker-compose.optimized.yml build --no-cache frontend
docker-compose -f docker-compose.optimized.yml up -d frontend
```

### Archivos Corregidos (Octubre 2025)

Los siguientes archivos fueron corregidos para eliminar conflictos con el build:

- ✅ `frontend/src/app/icon.tsx` - Eliminado `runtime = 'edge'`
- ✅ `frontend/src/app/apple-icon.tsx` - Eliminado `runtime = 'edge'`
- ✅ `frontend/src/app/global-error.tsx` - Estructura correcta para global-error
- ✅ `frontend/src/components/ui/Modal.tsx` - Eliminado KeyboardEvent no utilizado
- ✅ `frontend/src/app/ofertas/page.tsx` - Corregido acceso a competitor_price
- ✅ Stores (auth, notification, theme) - Tipos explícitos agregados

**Estado actual**: El código compila sin errores TypeScript y el build de producción funciona correctamente.

## Contexto del Proyecto

**TechNovaStore** es una plataforma de e-commerce completa especializada en tecnología e informática, desarrollada por un equipo hispanohablante.

### Características Principales

- **Arquitectura**: Microservicios con Docker Compose
- **Stack Tecnológico**: Node.js, TypeScript, MongoDB, PostgreSQL, Redis
- **Servicios Principales**:
  - E-commerce (productos, pedidos, pagos, usuarios)
  - Chatbot conversacional con IA (Ollama + Phi-3)
  - Sistema de recomendaciones
  - Notificaciones y seguimiento de envíos
  - Compras automáticas y sincronización
  - Gestión de tickets de soporte
- **Observabilidad**: Stack ELK (Elasticsearch, Logstash, Kibana) + Prometheus + Grafana
- **Monitoreo**: Métricas en tiempo real de todos los servicios y bases de datos

### Estructura del Proyecto

```
.
├── ai-services/          # Servicios de IA (chatbot, recommender)
├── backend-services/     # Microservicios backend
├── frontend/            # Aplicación web frontend
├── infrastructure/      # Configuración de infraestructura
├── monitoring/          # Configuración de monitoreo
└── docker-compose.yml   # Orquestación de todos los servicios
```

### Principios de Desarrollo

- **Microservicios independientes**: Cada servicio tiene su propia base de código y puede desplegarse independientemente
- **Comunicación asíncrona**: Uso de Redis para mensajería entre servicios
- **Observabilidad primero**: Todos los servicios deben exponer métricas y logs estructurados
- **Health checks**: Todos los servicios deben implementar endpoints de health
- **Containerización**: Todo se ejecuta en Docker, sin excepciones
