# Herramientas de Migración - TechNovaStore

Este directorio contiene las herramientas necesarias para realizar la migración del proyecto a Screaming Architecture de forma segura y controlada.

## Herramientas Disponibles

### 1. Analizador de Duplicaciones

**Archivo**: `analyze-duplications.js`

Analiza el proyecto completo para identificar:
- Archivos `.env` duplicados
- Configuraciones redundantes (tsconfig, jest, eslint, etc.)
- Documentación duplicada
- Archivos temporales y obsoletos

**Uso**:
```bash
node scripts/migration/analyze-duplications.js
```

**Salida**: Genera `DUPLICATION_REPORT.md` en la raíz del proyecto con un reporte detallado de todas las duplicaciones encontradas.

**Características**:
- Detecta duplicaciones por contenido (hash MD5)
- Identifica archivos similares por nombre
- Genera recomendaciones de consolidación
- Crea plan de acción priorizado

### 2. Generador de Reporte de Estructura

**Archivo**: `generate-structure-report.js`

Genera un reporte completo de la estructura actual del proyecto:
- Árbol de directorios
- Microservicios identificados
- Archivos en raíz
- Análisis de organización

**Uso**:
```bash
node scripts/migration/generate-structure-report.js
```

**Salida**: Genera `CURRENT_STRUCTURE.md` en la raíz del proyecto con la estructura actual documentada.

**Características**:
- Identifica automáticamente microservicios
- Clasifica servicios por tipo (backend, AI, automation, etc.)
- Analiza archivos importantes (package.json, Dockerfile, etc.)
- Genera recomendaciones de mejora

### 3. Utilidad de Backup de Git

**Archivo**: `git-backup-utility.js`

Herramienta para crear backups y checkpoints durante la migración:
- Backups completos del proyecto
- Checkpoints de fase
- Listado de checkpoints
- Verificación de integridad

**Uso**:

```bash
# Crear backup completo antes de iniciar migración
node scripts/migration/git-backup-utility.js create-backup

# Crear checkpoint después de completar una fase
node scripts/migration/git-backup-utility.js create-checkpoint "Phase 1: Rename complete"

# Listar todos los checkpoints
node scripts/migration/git-backup-utility.js list-checkpoints

# Verificar integridad del repositorio
node scripts/migration/git-backup-utility.js verify
```

**Características**:
- Crea tags de Git para facilitar rollback
- Registra todos los checkpoints en `MIGRATION_CHECKPOINTS.md`
- Detecta cambios sin commitear
- Proporciona comandos de restauración

### 4. Script Principal de Preparación

**Archivo**: `prepare-migration.js`

Script que ejecuta todas las herramientas de análisis en secuencia para preparar la migración.

**Uso**:
```bash
node scripts/migration/prepare-migration.js
```

**Acciones**:
1. Verifica integridad del repositorio Git
2. Ejecuta análisis de duplicaciones
3. Genera reporte de estructura actual
4. Crea backup completo del proyecto
5. Genera resumen de preparación

## Flujo de Trabajo Recomendado

### Fase 0: Preparación

1. **Ejecutar preparación completa**:
   ```bash
   node scripts/migration/prepare-migration.js
   ```

2. **Revisar reportes generados**:
   - `DUPLICATION_REPORT.md` - Identificar duplicaciones
   - `CURRENT_STRUCTURE.md` - Entender estructura actual
   - `MIGRATION_CHECKPOINTS.md` - Verificar backup creado

3. **Planificar acciones**:
   - Revisar duplicaciones a eliminar
   - Identificar servicios a mover
   - Definir prioridades

### Durante la Migración

1. **Crear checkpoint después de cada fase**:
   ```bash
   node scripts/migration/git-backup-utility.js create-checkpoint "Phase X: Description"
   ```

2. **Verificar integridad regularmente**:
   ```bash
   node scripts/migration/git-backup-utility.js verify
   ```

### En Caso de Problemas

1. **Listar checkpoints disponibles**:
   ```bash
   node scripts/migration/git-backup-utility.js list-checkpoints
   ```

2. **Restaurar a checkpoint anterior**:
   ```bash
   git reset --hard <tag-name>
   git clean -fd
   ```

## Archivos Generados

Los scripts generan los siguientes archivos en la raíz del proyecto:

- `DUPLICATION_REPORT.md` - Reporte de duplicaciones
- `CURRENT_STRUCTURE.md` - Estructura actual del proyecto
- `MIGRATION_CHECKPOINTS.md` - Log de checkpoints y backups
- `MIGRATION_PREPARATION.md` - Resumen de preparación (generado por prepare-migration.js)

## Requisitos

- Node.js 14+
- Git instalado y configurado
- Repositorio Git inicializado

## Notas Importantes

- **Siempre crear backup antes de iniciar**: Usa `create-backup` antes de cualquier cambio
- **Checkpoints frecuentes**: Crea checkpoints después de cada fase completada
- **Revisar reportes**: Lee los reportes generados antes de proceder
- **No eliminar archivos manualmente**: Usa los scripts para mantener trazabilidad

## Soporte

Para problemas o preguntas sobre las herramientas de migración, consulta:
- `.kiro/specs/project-refactor-screaming-architecture/design.md` - Diseño técnico
- `.kiro/specs/project-refactor-screaming-architecture/tasks.md` - Plan de implementación
