# Guías del Proyecto TechNovaStore

Reglas y convenciones generales para el desarrollo de todo el proyecto TechNovaStore, una plataforma de e-commerce especializada en tecnología e informática con arquitectura de microservicios.

## Arquitectura del Proyecto

**IMPORTANTE**: El proyecto sigue **Screaming Architecture** en todos los microservicios backend.

- Los servicios backend están organizados por casos de uso en la raíz (ej: `send-order-confirmation/`, `create-campaign/`)
- Cada caso de uso tiene su lógica y tests en su propia carpeta
- La infraestructura compartida está en `shared/` (modelos, repositorios, clientes, utilidades)
- Los controladores y rutas están en `api/`
- **Excepción**: El frontend aún no ha sido refactorizado a Screaming Architecture (pendiente)

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

### Páginas de Prueba en Next.js

- Cuando crees páginas de prueba para componentes (ej: `/test-product-card`, `/test-component`), estas son SOLO para desarrollo
- Estas páginas DEBEN eliminarse antes de producción
- Agregar un comentario claro en la parte superior indicando que es una página de prueba temporal
- Ejemplo de estructura:
  ```typescript
  /**
   * Página de prueba para el componente X
   * Ruta: /test-x
   * 
   * Esta página es solo para desarrollo y testing.
   * NO debe estar en producción.
   */
  ```
- Mantener un registro de páginas de prueba creadas para eliminarlas antes del deploy

## Revisión de Tareas Antes de Implementar

**IMPORTANTE**: SIEMPRE revisar la lista de tareas antes de implementar cualquier funcionalidad.

### Reglas de Implementación

- ANTES de implementar cualquier funcionalidad, DEBES revisar el archivo `.kiro/specs/[nombre-spec]/tasks.md`
- Verificar si la funcionalidad que vas a implementar corresponde a una tarea específica
- Si corresponde a una tarea, verificar que la implementación sea exactamente como se describe en la tarea
- NO implementar funcionalidades que no estén en las tareas o que no correspondan a la tarea actual
- Si hay dudas sobre qué implementar, preguntar al usuario qué tarea específica quiere ejecutar

## Implementación en la Web Real

**CRÍTICO**: Las funcionalidades DEBEN implementarse en la web real, no solo en páginas de prueba.

### Reglas de Implementación Real

- **SIEMPRE implementar en la aplicación real primero** (ej: `/productos`, `/carrito`, etc.)
- Las páginas de prueba (ej: `/test-*`) son SOLO para verificación adicional
- **NO es suficiente** crear solo páginas de prueba - el usuario quiere ver los cambios en la web real
- Después de implementar, reconstruir el contenedor Docker para aplicar cambios
- Verificar que los cambios sean visibles en la URL real de la aplicación

### Flujo Correcto

1. ✅ Implementar funcionalidad en componentes reales
2. ✅ Integrar en páginas reales de la aplicación
3. ✅ Guardar archivos
4. ✅ **El frontend tiene hot-reload activado** - los cambios se aplican automáticamente
5. ✅ Refrescar navegador y verificar (ej: http://localhost:3020/productos)
6. ⚠️ Opcionalmente crear página de prueba para testing adicional

**Nota**: El frontend está en modo desarrollo (`NODE_ENV=development`) con hot-reload. Los cambios se aplican automáticamente sin necesidad de reconstruir el contenedor.

### Flujo INCORRECTO ❌

1. ❌ Crear solo página de prueba
2. ❌ No integrar en la aplicación real
3. ❌ Asumir que el trabajo está completo

**Ejemplo**: Si implementas un nuevo toolbar para el catálogo, debe verse en `/productos`, no solo en `/test-toolbar`

## Entorno de Desarrollo

**CRÍTICO**: Este proyecto se ejecuta COMPLETAMENTE con Docker. NUNCA ejecutar comandos npm/node directamente en local.

### Información del Entorno

- **Sistema Operativo Local**: Windows 11
- **Entorno de Ejecución**: Docker containers (OBLIGATORIO)
- **Arquitectura**: Microservicios con Docker Compose
- **Docker Compose Activo**: `docker-compose.optimized.yml` (modo desarrollo con hot-reload)

### Reglas de Ejecución con Docker

**REGLA ABSOLUTA**: TODOS los comandos de compilación, testing y ejecución DEBEN hacerse dentro de contenedores Docker.

#### Comandos CORRECTOS ✅

```bash
# Compilar un servicio
docker exec technovastore-api-gateway npm run build

# Ejecutar tests
docker exec technovastore-api-gateway npm test

# Instalar dependencias
docker exec technovastore-api-gateway npm install

# Ver logs
docker logs technovastore-api-gateway

# Ejecutar comando en contenedor
docker exec -it technovastore-api-gateway sh
```

#### Comandos INCORRECTOS ❌

```bash
# NUNCA hacer esto:
npm run build          # ❌ NO ejecutar en local
npm test              # ❌ NO ejecutar en local
npm install           # ❌ NO ejecutar en local
node dist/index.js    # ❌ NO ejecutar en local
```

### Servicios Dockerizados (Containers Activos)

**Microservicios de Aplicación:**

- `technovastore-frontend` (puerto 3020) - Aplicación web frontend
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

### Comandos Útiles de Docker

**IMPORTANTE**: Siempre usar `-f docker-compose.optimized.yml` (modo desarrollo con hot-reload)

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

### Entornos de Docker Compose

**Desarrollo (docker-compose.optimized.yml)**:
- `NODE_ENV=development` con hot-reload activado
- Los cambios en el código se aplican automáticamente
- NO necesitas reconstruir el contenedor después de cada cambio
- Comando: `docker-compose -f docker-compose.optimized.yml up -d frontend`

**Pre-producción (docker-compose.staging.yml)**:
- `NODE_ENV=production` con build optimizado
- Generación estática de páginas
- Debes reconstruir el contenedor después de cada cambio
- Comando: `docker-compose -f docker-compose.staging.yml up -d frontend`

**Nota**: Actualmente estamos usando `docker-compose.optimized.yml` para desarrollo.

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




## Instalación Permanente de Dependencias y Recursos

**CRÍTICO**: Todas las dependencias, archivos, carpetas y recursos DEBEN instalarse de forma permanente en los contenedores.

### Reglas de Instalación Permanente

- **NUNCA** instalar dependencias temporalmente con `docker exec <container> npm install <package>`
- **SIEMPRE** añadir dependencias en el archivo correspondiente para que persistan:
  - **Dependencias de Node.js**: Añadir en `package.json` del servicio correspondiente
  - **Configuración de contenedor**: Modificar `Dockerfile` si es necesario
  - **Variables de entorno**: Añadir en `docker-compose.optimized.yml` o archivos `.env`
  - **Archivos de configuración**: Copiar en el `Dockerfile` con instrucción `COPY`

### Flujo Correcto para Añadir Dependencias ✅

1. **Añadir la dependencia en `package.json`**:
   ```bash
   # Editar el archivo package.json del servicio
   # Añadir la dependencia en "dependencies" o "devDependencies"
   ```

2. **Reconstruir el contenedor**:
   ```bash
   docker-compose -f docker-compose.optimized.yml up -d --build <service-name>
   ```

3. **Verificar que funciona**:
   ```bash
   # Verificar que el servicio arrancó correctamente
   docker-compose -f docker-compose.optimized.yml logs <service-name>
   
   # Verificar que la dependencia está instalada
   docker exec <container-name> npm list <package-name>
   ```

### Flujo INCORRECTO ❌

```bash
# ❌ NO hacer esto - la dependencia se perderá al reiniciar el contenedor
docker exec technovastore-frontend npm install recharts

# ❌ NO hacer esto - cambios temporales que no persisten
docker exec technovastore-frontend sh -c "echo 'config' > /app/config.json"
```

### Ejemplos de Instalación Permanente

**Ejemplo 1: Añadir librería de gráficos al frontend**

```bash
# 1. Editar domains/platform/frontend/package.json
# Añadir en "dependencies": "recharts": "^2.10.0"

# 2. Reconstruir contenedor
docker-compose -f docker-compose.optimized.yml up -d --build frontend

# 3. Verificar
docker exec technovastore-frontend npm list recharts
```

**Ejemplo 2: Añadir variable de entorno**

```bash
# 1. Editar docker-compose.optimized.yml
# Añadir en la sección environment del servicio:
#   - NEW_VAR=value

# 2. Reiniciar contenedor
docker-compose -f docker-compose.optimized.yml up -d frontend

# 3. Verificar
docker exec technovastore-frontend printenv NEW_VAR
```

**Ejemplo 3: Añadir archivo de configuración**

```bash
# 1. Crear el archivo en el proyecto (ej: config/custom.json)

# 2. Editar Dockerfile para copiar el archivo:
#    COPY config/custom.json /app/config/

# 3. Reconstruir contenedor
docker-compose -f docker-compose.optimized.yml up -d --build <service-name>

# 4. Verificar
docker exec <container-name> ls -la /app/config/custom.json
```

### Ventajas de la Instalación Permanente

- ✅ Las dependencias persisten entre reinicios del contenedor
- ✅ Otros desarrolladores obtienen las mismas dependencias al construir
- ✅ El entorno de producción tendrá las mismas dependencias
- ✅ Se mantiene la reproducibilidad del entorno
- ✅ Se documenta qué dependencias usa cada servicio

### Cuándo Reconstruir vs Reiniciar

**Reconstruir (`up -d --build`)** - Cuando cambias:
- `package.json` (dependencias)
- `Dockerfile`
- Archivos que se copian en el build
- Configuración de build

**Reiniciar (`restart`)** - Cuando cambias:
- Variables de entorno en `docker-compose.yml`
- Código fuente (en desarrollo con hot-reload NO es necesario ni reiniciar)
- Archivos de configuración montados como volúmenes

