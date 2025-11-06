# Instrucciones de Rollback - TechNovaStore

Este documento proporciona instrucciones rápidas para hacer rollback en caso de problemas durante la migración.

---

## Rollback Completo (Volver al Estado Inicial)

Si necesitas volver al estado inicial antes de la migración, ejecuta:

```bash
# 1. Detener todos los servicios Docker
docker-compose -f docker-compose.optimized.yml down

# 2. Hacer rollback de Git al backup oficial
git reset --hard pre-migration-backup

# 3. Limpiar archivos no rastreados
git clean -fd

# 4. Reiniciar servicios
docker-compose -f docker-compose.optimized.yml up -d

# 5. Verificar que servicios están funcionando
docker-compose -f docker-compose.optimized.yml ps
```

---

## Información del Backup Oficial

- **Tag**: `pre-migration-backup`
- **Commit**: `4c30f9a82410c4586721bd6b07039f5393a1e956`
- **Fecha**: 6 de noviembre de 2025, 15:04:09
- **Branch**: `develop`
- **Estado**: Phase 0 completada (Preparación y Análisis)

---

## Rollback por Fase

### Phase 1: Renombrado de Proyecto

```bash
git reset --hard phase-1-complete
git clean -fd
docker-compose -f docker-compose.optimized.yml down
docker-compose -f docker-compose.optimized.yml up -d
```

### Phase 2: Eliminación de Duplicaciones

```bash
git reset --hard phase-2-complete
git clean -fd
docker-compose -f docker-compose.optimized.yml down
docker-compose -f docker-compose.optimized.yml up -d
```

### Phase 3: Reorganización a Dominios

```bash
git reset --hard phase-3-complete
git clean -fd
docker-compose -f docker-compose.optimized.yml down
docker-compose -f docker-compose.optimized.yml up -d
```

### Phase 4: Estandarización de Microservicios

```bash
git reset --hard phase-4-complete
git clean -fd
docker-compose -f docker-compose.optimized.yml down
docker-compose -f docker-compose.optimized.yml up -d
```

### Phase 5: Limpieza Final

```bash
git reset --hard phase-5-complete
git clean -fd
docker-compose -f docker-compose.optimized.yml down
docker-compose -f docker-compose.optimized.yml up -d
```

---

## Verificación Después del Rollback

Después de hacer rollback, verifica que todo funciona correctamente:

```bash
# 1. Ver estado de Git
git status
git log --oneline -5

# 2. Ver servicios Docker
docker-compose -f docker-compose.optimized.yml ps

# 3. Verificar health checks
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # Product Service
# ... (otros servicios)

# 4. Ejecutar tests (opcional)
npm test
```

---

## Listar Checkpoints Disponibles

Para ver todos los checkpoints disponibles:

```bash
node scripts/migration/git-backup-utility.js list-checkpoints
```

O directamente con Git:

```bash
git tag -l "*migration*" "*phase*"
```

---

## Notas Importantes

1. **⚠️ ADVERTENCIA**: `git reset --hard` eliminará TODOS los cambios no commiteados
2. **⚠️ ADVERTENCIA**: `git clean -fd` eliminará TODOS los archivos no rastreados
3. **✅ RECOMENDACIÓN**: Hacer commit de cambios importantes antes de rollback
4. **✅ RECOMENDACIÓN**: Documentar el problema antes de hacer rollback
5. **✅ RECOMENDACIÓN**: Verificar que servicios funcionan después del rollback

---

## Soporte

Si tienes problemas con el rollback:

1. Verifica que el tag existe: `git tag -l pre-migration-backup`
2. Verifica el estado de Git: `git status`
3. Consulta el log de Git: `git log --oneline -10`
4. Revisa MIGRATION_CHECKPOINTS.md para más información
5. Consulta MIGRATION_PLAN.md para el plan completo

---

**Última actualización**: 6 de noviembre de 2025  
**Estado**: Backup oficial creado - Listo para iniciar migración
