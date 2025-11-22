# Guía de Uso - Herramientas de Migración

Esta guía proporciona instrucciones paso a paso para usar las herramientas de migración en el proyecto TechNovaStore.

## Inicio Rápido

### Opción 1: Preparación Completa (Recomendado)

Si es la primera vez que ejecutas las herramientas, usa el script de preparación completa:

```bash
node scripts/migration/prepare-migration.js
```

Este script ejecutará automáticamente:
1. ✅ Verificación de Git
2. ✅ Análisis de duplicaciones
3. ✅ Reporte de estructura
4. ✅ Backup completo
5. ✅ Generación de reportes

**Tiempo estimado**: 1-2 minutos

### Opción 2: Herramientas Individuales

Si solo necesitas ejecutar una herramienta específica:

```bash
# Análisis de duplicaciones
node scripts/migration/analyze-duplications.js

# Reporte de estructura
node scripts/migration/generate-structure-report.js

# Backup de Git
node scripts/migration/git-backup-utility.js create-backup
```

## Flujo de Trabajo Completo

### Fase 0: Preparación (Antes de Iniciar)

1. **Asegúrate de estar en el branch correcto**:
   ```bash
   git status
   git checkout develop  # o el branch que uses
   ```

2. **Ejecuta la preparación completa**:
   ```bash
   node scripts/migration/prepare-migration.js
   ```

3. **Revisa los reportes generados**:
   - `DUPLICATION_REPORT.md` - Duplicaciones encontradas
   - `CURRENT_STRUCTURE.md` - Estructura actual
   - `MIGRATION_CHECKPOINTS.md` - Backup creado
   - `MIGRATION_PREPARATION.md` - Resumen de preparación

4. **Verifica el backup**:
   ```bash
   node scripts/migration/git-backup-utility.js list-checkpoints
   ```

### Durante la Migración (Fases 1-5)

#### Antes de Cada Fase

1. **Verifica el estado de Git**:
   ```bash
   node scripts/migration/git-backup-utility.js verify
   ```

2. **Asegúrate de que no hay cambios sin commitear** (opcional):
   ```bash
   git status
   ```

#### Después de Cada Fase

1. **Crea un checkpoint**:
   ```bash
   node scripts/migration/git-backup-utility.js create-checkpoint "Phase X: Description"
   ```

   Ejemplos:
   ```bash
   node scripts/migration/git-backup-utility.js create-checkpoint "Phase 1: Rename complete"
   node scripts/migration/git-backup-utility.js create-checkpoint "Phase 2: Duplications removed"
   node scripts/migration/git-backup-utility.js create-checkpoint "Phase 3: Domain reorganization complete"
   ```

2. **Verifica que el checkpoint se creó**:
   ```bash
   node scripts/migration/git-backup-utility.js list-checkpoints
   ```

### En Caso de Problemas

#### Rollback a Checkpoint Anterior

1. **Lista los checkpoints disponibles**:
   ```bash
   node scripts/migration/git-backup-utility.js list-checkpoints
   ```

2. **Restaura el checkpoint deseado**:
   ```bash
   git reset --hard <tag-name>
   git clean -fd
   ```

   Ejemplo:
   ```bash
   git reset --hard phase-2-complete
   git clean -fd
   ```

#### Rollback Completo (Volver al Inicio)

Si necesitas volver al estado inicial antes de la migración:

```bash
git reset --hard pre-migration-backup-<timestamp>
git clean -fd
```

**⚠️ ADVERTENCIA**: Esto eliminará TODOS los cambios realizados durante la migración.

## Casos de Uso Específicos

### Caso 1: Solo Quiero Analizar Duplicaciones

```bash
node scripts/migration/analyze-duplications.js
```

**Salida**: `DUPLICATION_REPORT.md`

**Cuándo usar**: Antes de iniciar la migración o para verificar progreso en Phase 2.

### Caso 2: Solo Quiero Ver la Estructura Actual

```bash
node scripts/migration/generate-structure-report.js
```

**Salida**: `CURRENT_STRUCTURE.md`

**Cuándo usar**: Para entender la organización actual o documentar cambios.

### Caso 3: Crear Backup Manual

```bash
node scripts/migration/git-backup-utility.js create-backup
```

**Salida**: Tag de Git + entrada en `MIGRATION_CHECKPOINTS.md`

**Cuándo usar**: Antes de cambios críticos o experimentales.

### Caso 4: Verificar Estado de Git

```bash
node scripts/migration/git-backup-utility.js verify
```

**Salida**: Estado del repositorio, branch, commit, checkpoints

**Cuándo usar**: Regularmente durante la migración para verificar integridad.

## Interpretación de Reportes

### DUPLICATION_REPORT.md

Este reporte identifica:

- **Archivos .env duplicados**: Archivos con contenido idéntico
- **Archivos .env similares**: Archivos con nombres similares (.env, .env.example, etc.)
- **Configuraciones duplicadas**: tsconfig.json, jest.config.js, etc.
- **Documentación duplicada**: README.md en múltiples ubicaciones
- **Archivos temporales**: .backup, .old, test-*, verify-*, etc.

**Acción recomendada**: Revisar cada sección y planificar consolidación.

### CURRENT_STRUCTURE.md

Este reporte muestra:

- **Árbol de estructura**: Organización de carpetas (nivel superior)
- **Microservicios identificados**: Todos los servicios con package.json o Dockerfile
- **Archivos en raíz**: Lista completa de archivos en la raíz del proyecto
- **Análisis de organización**: Problemas identificados y recomendaciones

**Acción recomendada**: Usar como referencia para planificar reorganización.

### MIGRATION_CHECKPOINTS.md

Este archivo registra:

- **Backups completos**: Tags de backup con información de restauración
- **Checkpoints de fase**: Tags de cada fase completada
- **Información de commit**: Hash, branch, fecha de cada checkpoint

**Acción recomendada**: Consultar antes de hacer rollback.

### MIGRATION_PREPARATION.md

Este reporte resume:

- **Estado de preparación**: Verificación de cada paso
- **Estadísticas del proyecto**: Números clave (servicios, archivos, etc.)
- **Problemas identificados**: Duplicaciones y archivos temporales
- **Próximos pasos**: Checklist de acciones

**Acción recomendada**: Leer completamente antes de iniciar Phase 1.

## Comandos de Referencia Rápida

```bash
# Preparación completa
node scripts/migration/prepare-migration.js

# Análisis individual
node scripts/migration/analyze-duplications.js
node scripts/migration/generate-structure-report.js

# Backup y checkpoints
node scripts/migration/git-backup-utility.js create-backup
node scripts/migration/git-backup-utility.js create-checkpoint "mensaje"
node scripts/migration/git-backup-utility.js list-checkpoints
node scripts/migration/git-backup-utility.js verify

# Rollback
git reset --hard <tag-name>
git clean -fd

# Ver ayuda
node scripts/migration/index.js
```

## Solución de Problemas

### Error: "No estamos en un repositorio Git"

**Causa**: No estás en la raíz del proyecto o no hay repositorio Git.

**Solución**:
```bash
cd /ruta/al/proyecto/TechNovaStore
git status  # Verificar que es un repo Git
```

### Error: "Hay cambios sin commitear"

**Causa**: Tienes cambios sin commitear en el repositorio.

**Solución**:
```bash
# Opción 1: Hacer commit
git add -A
git commit -m "Descripción de cambios"

# Opción 2: Descartar cambios (CUIDADO)
git reset --hard HEAD
git clean -fd
```

### Error: "Tag already exists"

**Causa**: Ya existe un tag con ese nombre.

**Solución**:
```bash
# Ver tags existentes
git tag -l

# Eliminar tag si es necesario
git tag -d <tag-name>
```

### Los reportes no se generan

**Causa**: Permisos de escritura o error en el script.

**Solución**:
```bash
# Verificar permisos
ls -la DUPLICATION_REPORT.md

# Ejecutar con más información
node scripts/migration/prepare-migration.js 2>&1 | tee migration.log
```

## Mejores Prácticas

1. **Siempre crear backup antes de cambios importantes**
2. **Crear checkpoints después de cada fase completada**
3. **Revisar reportes antes de proceder**
4. **No eliminar archivos manualmente sin documentar**
5. **Mantener log de todas las decisiones tomadas**
6. **Validar después de cada cambio (tests, Docker, etc.)**
7. **No hacer múltiples fases en un solo commit**

## Recursos Adicionales

- **Plan de migración**: `.kiro/specs/project-refactor-screaming-architecture/tasks.md`
- **Diseño técnico**: `.kiro/specs/project-refactor-screaming-architecture/design.md`
- **Requisitos**: `.kiro/specs/project-refactor-screaming-architecture/requirements.md`
- **README de herramientas**: `scripts/migration/README.md`

## Soporte

Si encuentras problemas con las herramientas:

1. Verifica que estás usando Node.js 14+
2. Verifica que Git está instalado y configurado
3. Revisa los logs de error
4. Consulta la documentación en `.kiro/specs/project-refactor-screaming-architecture/`
