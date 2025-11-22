# Scripts de Migración a Estructura Estándar

Este directorio contiene scripts para facilitar la migración de microservicios a la estructura estándar de Clean Architecture definida en el proyecto TechNovaStore.

## Scripts Disponibles

### 1. analyze-service-structure.js

Analiza la estructura actual de un microservicio y la compara con la estructura estándar.

**Uso:**
```bash
node scripts/migration/analyze-service-structure.js <service-path>
```

**Ejemplo:**
```bash
node scripts/migration/analyze-service-structure.js domains/catalog/product-service
```

**Salida:**
- Reporte en consola con análisis detallado
- Archivo JSON `structure-analysis.json` en el directorio del servicio

**Información que proporciona:**
- ✅ Cumplimiento de estructura estándar
- ⚠️ Patrones antiguos detectados
- 📊 Estadísticas de archivos
- ⚙️ Archivos de configuración presentes
- 💡 Recomendaciones de mejora
- 📋 Plan de migración sugerido

### 2. generate-standard-structure.js

Genera la estructura estándar completa para un nuevo microservicio o para preparar la migración de uno existente.

**Uso:**
```bash
node scripts/migration/generate-standard-structure.js <service-path>
```

**Ejemplo:**
```bash
# Para un nuevo servicio
node scripts/migration/generate-standard-structure.js domains/catalog/new-service

# Para preparar migración de servicio existente
node scripts/migration/generate-standard-structure.js domains/catalog/existing-service
```

**Lo que crea:**
- Estructura completa de carpetas según Clean Architecture
- Archivos de configuración (package.json, tsconfig.json, jest.config.js)
- Dockerfiles (desarrollo y producción)
- Archivos de documentación (README.md, API.md, ARCHITECTURE.md)
- Plantillas de código inicial

## Flujo de Trabajo Recomendado

### Para Servicios Nuevos

1. **Generar estructura:**
   ```bash
   node scripts/migration/generate-standard-structure.js domains/[domain]/[service-name]
   ```

2. **Instalar dependencias:**
   ```bash
   cd domains/[domain]/[service-name]
   npm install
   ```

3. **Implementar lógica de negocio:**
   - Crear entidades en `src/domain/entities/`
   - Crear casos de uso en `src/application/use-cases/`
   - Implementar repositorios en `src/infrastructure/database/repositories/`
   - Crear controladores en `src/presentation/controllers/`

4. **Ejecutar tests:**
   ```bash
   npm test
   ```

### Para Migración de Servicios Existentes

1. **Analizar estructura actual:**
   ```bash
   node scripts/migration/analyze-service-structure.js domains/[domain]/[service-name]
   ```

2. **Revisar reporte:**
   - Leer el reporte en consola
   - Revisar `structure-analysis.json` para detalles
   - Identificar patrones antiguos a migrar

3. **Crear estructura estándar (opcional):**
   ```bash
   # Esto creará las carpetas faltantes sin sobrescribir archivos existentes
   node scripts/migration/generate-standard-structure.js domains/[domain]/[service-name]
   ```

4. **Migrar archivos manualmente:**
   
   Según el reporte, mover archivos a sus nuevas ubicaciones:
   
   ```bash
   # Ejemplo: Mover controladores
   # De: src/controllers/
   # A:  src/presentation/controllers/
   
   # Ejemplo: Mover modelos
   # De: src/models/
   # A:  src/infrastructure/database/models/ o src/domain/entities/
   ```

5. **Actualizar imports:**
   
   Actualizar todos los imports en los archivos movidos:
   
   ```typescript
   // Antes
   import { User } from '../models/User';
   
   // Después
   import { User } from '@infrastructure/database/models/User';
   // o
   import { User } from '@domain/entities/User';
   ```

6. **Actualizar tsconfig.json:**
   
   Agregar path aliases si no existen:
   
   ```json
   {
     "compilerOptions": {
       "baseUrl": "./src",
       "paths": {
         "@domain/*": ["domain/*"],
         "@application/*": ["application/*"],
         "@infrastructure/*": ["infrastructure/*"],
         "@presentation/*": ["presentation/*"],
         "@shared/*": ["shared/*"]
       }
     }
   }
   ```

7. **Actualizar jest.config.js:**
   
   Agregar moduleNameMapper:
   
   ```javascript
   module.exports = {
     moduleNameMapper: {
       '^@domain/(.*)$': '<rootDir>/src/domain/$1',
       '^@application/(.*)$': '<rootDir>/src/application/$1',
       '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
       '^@presentation/(.*)$': '<rootDir>/src/presentation/$1',
       '^@shared/(.*)$': '<rootDir>/src/shared/$1'
     }
   };
   ```

8. **Ejecutar tests:**
   ```bash
   npm test
   ```

9. **Verificar compilación:**
   ```bash
   npm run build
   ```

10. **Analizar nuevamente:**
    ```bash
    node scripts/migration/analyze-service-structure.js domains/[domain]/[service-name]
    ```

## Estructura Estándar Generada

```
service-name/
├── src/
│   ├── domain/                    # Lógica de negocio pura
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── repositories/
│   │   ├── services/
│   │   └── events/
│   ├── application/               # Casos de uso
│   │   ├── use-cases/
│   │   ├── services/
│   │   ├── dtos/
│   │   └── mappers/
│   ├── infrastructure/            # Implementaciones técnicas
│   │   ├── database/
│   │   ├── http/
│   │   ├── messaging/
│   │   ├── external/
│   │   └── cache/
│   ├── presentation/              # Interfaz HTTP
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── validators/
│   │   └── serializers/
│   ├── config/                    # Configuración
│   ├── shared/                    # Código compartido
│   └── index.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
├── scripts/
├── Dockerfile
├── Dockerfile.prod
├── package.json
├── tsconfig.json
└── jest.config.js
```

## Patrones Antiguos vs Nuevos

| Patrón Antiguo | Patrón Nuevo |
|----------------|--------------|
| `src/controllers/` | `src/presentation/controllers/` |
| `src/routes/` | `src/presentation/routes/` |
| `src/models/` | `src/infrastructure/database/models/` o `src/domain/entities/` |
| `src/services/` | `src/domain/services/` y `src/application/services/` |
| `src/middleware/` | `src/presentation/middleware/` |
| `src/utils/` | `src/shared/utils/` |
| `src/validators/` | `src/presentation/validators/` |
| `test/` | `tests/` (plural) |

## Beneficios de la Estructura Estándar

1. **Mantenibilidad**: Código organizado y fácil de encontrar
2. **Testabilidad**: Cada capa puede testearse independientemente
3. **Escalabilidad**: Fácil agregar nuevas funcionalidades
4. **Claridad**: La estructura refleja el dominio del negocio
5. **Independencia**: Cambios en una capa no afectan otras
6. **Consistencia**: Todos los servicios siguen el mismo patrón

## Documentación Adicional

Para más detalles sobre la estructura estándar, consultar:
- [STANDARD_SERVICE_STRUCTURE.md](../../.kiro/specs/project-refactor-screaming-architecture/STANDARD_SERVICE_STRUCTURE.md)

## Soporte

Si encuentras problemas con los scripts o tienes dudas sobre la migración, consulta la documentación del proyecto o contacta al equipo de desarrollo.
