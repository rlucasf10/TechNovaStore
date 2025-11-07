# Tests de Verificación de Migración

Este directorio contiene los tests de verificación base para la migración a Screaming Architecture.

## Tests Disponibles

### 1. Verificación de Servicios Docker

**Archivo**: `verify-docker-services.test.js`

Verifica que los servicios Docker críticos están corriendo correctamente.

**Servicios verificados**:
- Servicios críticos: MongoDB, Redis, PostgreSQL
- Servicios de aplicación: API Gateway, Frontend, Product Service, User Service, Order Service, Payment Service

**Uso**:
```bash
node e2e-tests/migration-verification/verify-docker-services.test.js
```

**Salida esperada**:
- ✅ Todos los servicios críticos deben estar corriendo
- ⚠️ Servicios de aplicación son opcionales

---

### 2. Verificación de Compilación TypeScript

**Archivo**: `verify-typescript-compilation.test.js`

Verifica que todos los servicios TypeScript compilan sin errores.

**Servicios verificados**:
- API Gateway
- Frontend
- Todos los servicios backend (product, user, order, payment, notification, ticket)
- Servicios de IA (chatbot, recommender)
- Servicios de automatización (sync-engine, auto-purchase, shipment-tracker)

**Uso**:
```bash
node e2e-tests/migration-verification/verify-typescript-compilation.test.js
```

**Salida esperada**:
- ✅ Todos los servicios con TypeScript deben compilar sin errores
- ⚠️ Servicios sin tsconfig.json son omitidos

---

### 3. Verificación de Tests Existentes

**Archivo**: `verify-existing-tests.test.js`

Verifica que todos los tests existentes en el proyecto pasan correctamente.

**Servicios verificados**:
- Todos los servicios con tests configurados
- Solo ejecuta tests en servicios que tienen carpeta de tests o script de test

**Uso**:
```bash
node e2e-tests/migration-verification/verify-existing-tests.test.js
```

**Salida esperada**:
- ✅ Todos los tests existentes deben pasar
- ⚠️ Servicios sin tests son omitidos (esperado para backend services)

**Nota**: Este test puede tardar varios minutos en ejecutarse.

---

### 4. Ejecutar Todas las Verificaciones

**Archivo**: `run-all-verifications.js`

Ejecuta todas las verificaciones en secuencia y genera un reporte consolidado.

**Uso**:
```bash
node e2e-tests/migration-verification/run-all-verifications.js
```

**Salida esperada**:
- Reporte consolidado de todas las verificaciones
- Estado general del proyecto
- Duración total de las verificaciones

---

## Interpretación de Resultados

### Estados Posibles

- ✅ **Pasado**: La verificación completó exitosamente
- ❌ **Fallido**: La verificación encontró errores
- ⚠️ **Omitido**: La verificación no aplica (ej: servicio sin tests)

### Códigos de Salida

- `0`: Todas las verificaciones pasaron
- `1`: Al menos una verificación falló

---

## Cuándo Ejecutar

### Antes de Iniciar la Migración

Ejecutar todas las verificaciones para establecer una línea base:

```bash
node tests/migration/run-all-verifications.js
```

### Después de Cada Fase

Ejecutar verificaciones relevantes después de completar cada fase:

**Phase 1 (Renombrado)**:
```bash
node tests/migration/verify-docker-services.test.js
node tests/migration/verify-typescript-compilation.test.js
```

**Phase 2 (Duplicaciones)**:
```bash
node tests/migration/verify-typescript-compilation.test.js
node tests/migration/verify-existing-tests.test.js
```

**Phase 3 (Dominios)**:
```bash
node tests/migration/run-all-verifications.js
```

**Phase 4 (Estandarización)**:
```bash
node tests/migration/run-all-verifications.js
```

**Phase 5 (Limpieza)**:
```bash
node tests/migration/run-all-verifications.js
```

---

## Solución de Problemas

### Error: "Docker no está disponible"

**Causa**: Docker no está instalado o no está corriendo.

**Solución**:
```bash
# Verificar Docker
docker --version

# Iniciar Docker Desktop (Windows)
# O iniciar servicio Docker (Linux)
```

### Error: "No se pudo obtener el estado de los servicios"

**Causa**: Los servicios Docker no están iniciados.

**Solución**:
```bash
docker-compose -f docker-compose.optimized.yml up -d
```

### Error: "Errores de compilación TypeScript"

**Causa**: Hay errores de TypeScript en el código.

**Solución**:
1. Revisar los errores mostrados en el reporte
2. Corregir los errores en el código
3. Volver a ejecutar la verificación

### Error: "Tests fallaron"

**Causa**: Hay tests que no pasan.

**Solución**:
1. Revisar los errores mostrados en el reporte
2. Ejecutar tests manualmente para más detalles:
   ```bash
   cd <servicio>
   npm test
   ```
3. Corregir los tests o el código
4. Volver a ejecutar la verificación

---

## Notas Importantes

1. **Servicios sin tests**: Es normal que algunos servicios backend no tengan tests. Estos serán omitidos automáticamente.

2. **Timeout**: La verificación de tests puede tardar varios minutos. El timeout está configurado a 2 minutos por servicio.

3. **Servicios opcionales**: Los servicios de aplicación en Docker son opcionales. Solo los servicios críticos (MongoDB, Redis, PostgreSQL) son requeridos.

4. **Compilación incremental**: La verificación de TypeScript usa `tsc --noEmit` para no generar archivos de salida.

---

## Integración con CI/CD

Estos tests pueden integrarse en pipelines de CI/CD:

```yaml
# Ejemplo para GitHub Actions
- name: Run Migration Verifications
  run: node tests/migration/run-all-verifications.js
```

---

## Mantenimiento

Estos tests deben actualizarse cuando:
- Se agregan nuevos servicios al proyecto
- Se cambian nombres de servicios
- Se modifican configuraciones de Docker Compose
- Se agregan nuevos tests al proyecto

---

**Última actualización**: 6 de noviembre de 2025  
**Versión**: 1.0  
**Estado**: Tests de verificación base creados
