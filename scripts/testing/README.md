# Scripts de Testing

Scripts para testing, validación y verificación de servicios de TechNovaStore.

---

## Scripts Disponibles

### `health-check.js`

Verificar la salud de todos los servicios del proyecto.

**Uso:**
```bash
node scripts/testing/health-check.js
```

**Funcionalidad:**
- Verifica que todos los contenedores Docker estén corriendo
- Comprueba los health checks de cada servicio
- Valida conectividad con bases de datos
- Reporta estado de cada microservicio

**Salida esperada:**
```
✓ MongoDB - Healthy
✓ PostgreSQL - Healthy
✓ Redis - Healthy
✓ API Gateway - Healthy
✓ Product Service - Healthy
...
```

---

### `validate-all-services.js`

Validar todos los servicios del proyecto de forma exhaustiva.

**Uso:**
```bash
node scripts/testing/validate-all-services.js
```

**Funcionalidad:**
- Ejecuta health checks completos
- Valida endpoints de API
- Verifica comunicación entre servicios
- Comprueba configuración de servicios
- Genera reporte detallado de validación

**Salida esperada:**
```
=== Validación de Servicios TechNovaStore ===

[✓] Bases de Datos
  ✓ MongoDB: Conectado
  ✓ PostgreSQL: Conectado
  ✓ Redis: Conectado

[✓] Microservicios
  ✓ API Gateway: Respondiendo
  ✓ Product Service: Respondiendo
  ✓ Order Service: Respondiendo
  ...

[✓] Comunicación entre servicios
  ✓ API Gateway → Product Service: OK
  ✓ Order Service → Payment Service: OK
  ...

Resultado: 15/15 servicios validados correctamente
```

---

## Uso en CI/CD

Estos scripts están diseñados para integrarse en pipelines de CI/CD:

### GitHub Actions

```yaml
- name: Validate Services
  run: |
    node scripts/testing/health-check.js
    node scripts/testing/validate-all-services.js
```

### GitLab CI

```yaml
test:
  script:
    - node scripts/testing/health-check.js
    - node scripts/testing/validate-all-services.js
```

---

## Flujo de Testing

### Pre-Deployment

```bash
# 1. Verificar salud básica
node scripts/testing/health-check.js

# 2. Validación completa
node scripts/testing/validate-all-services.js
```

### Post-Deployment

```bash
# 1. Esperar a que servicios inicien
sleep 30

# 2. Verificar salud
node scripts/testing/health-check.js

# 3. Validación completa
node scripts/testing/validate-all-services.js
```

---

## Códigos de Salida

Los scripts utilizan códigos de salida estándar:

- `0` - Todos los tests pasaron
- `1` - Uno o más tests fallaron
- `2` - Error de configuración

---

## Configuración

Los scripts leen configuración de:

- Variables de entorno
- Archivos `.env`
- `docker-compose.yml`

### Variables de Entorno

```bash
# Timeout para health checks (ms)
HEALTH_CHECK_TIMEOUT=5000

# Reintentos para validación
VALIDATION_RETRIES=3

# Intervalo entre reintentos (ms)
RETRY_INTERVAL=2000
```

---

## Troubleshooting

### Health check falla constantemente

**Posibles causas:**
1. Servicio no ha terminado de iniciar
2. Puerto incorrecto
3. Servicio caído

**Solución:**
```bash
# Verificar logs del servicio
docker logs technovastore-<service-name>

# Reiniciar servicio
docker-compose restart <service-name>

# Reintentar health check
node scripts/testing/health-check.js
```

### Validación falla por timeout

**Solución:**
```bash
# Aumentar timeout
export HEALTH_CHECK_TIMEOUT=10000

# Reintentar
node scripts/testing/validate-all-services.js
```

---

## Desarrollo de Nuevos Tests

Para agregar nuevos tests de validación:

1. Editar `validate-all-services.js`
2. Agregar nueva función de validación
3. Integrar en el flujo principal
4. Actualizar documentación

**Ejemplo:**
```javascript
async function validateNewService() {
  try {
    const response = await fetch('http://localhost:3000/health');
    return response.ok;
  } catch (error) {
    return false;
  }
}
```

---

*Documentación actualizada: 22 de noviembre de 2025*
