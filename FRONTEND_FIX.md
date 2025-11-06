# Solución: Error Frontend después del Cambio de Nombre de Carpeta

**Fecha**: 6 de noviembre de 2025  
**Problema**: Frontend no funcionaba después del cambio de nombre de carpeta  
**Estado**: ✅ Resuelto

---

## Problema Identificado

### Síntomas

```
Error: ENOENT: no such file or directory, scandir '/app/src/app'
```

El contenedor del frontend estaba buscando archivos en rutas que no existían.

### Causa Raíz

La imagen Docker del frontend (`technovastore-frontend:latest`) fue construida cuando la carpeta del proyecto se llamaba "Ciberseguridad". La imagen tenía rutas absolutas compiladas con el nombre antiguo.

Aunque el volumen estaba correctamente montado (`./frontend:/app`), la imagen Docker tenía referencias internas a rutas antiguas que causaban el error.

---

## Solución Aplicada

### Paso 1: Detener el Contenedor

```bash
docker-compose -f docker-compose.optimized.yml stop frontend
```

### Paso 2: Eliminar Contenedores Antiguos

```bash
# Detener todos los contenedores
docker ps --format "{{.Names}}" | Where-Object { $_ -like "*technovastore*" } | ForEach-Object { docker stop $_ }

# Eliminar todos los contenedores
docker ps -a --format "{{.Names}}" | Where-Object { $_ -like "*technovastore*" } | ForEach-Object { docker rm $_ }
```

### Paso 3: Reconstruir la Imagen sin Caché

```bash
docker-compose -f docker-compose.optimized.yml build --no-cache frontend
```

**Importante**: El flag `--no-cache` es crucial para asegurar que la imagen se construya completamente desde cero con las rutas actuales.

### Paso 4: Iniciar el Contenedor

```bash
docker-compose -f docker-compose.optimized.yml up -d frontend
```

---

## Verificación

### Logs del Frontend

```bash
docker logs technovastore-frontend --tail 20
```

**Salida esperada**:
```
✓ Ready in 7.5s
○ Compiling / ...
✓ Compiled / in 19.1s (3023 modules)
GET / 200 in 4602ms
```

### Estado del Contenedor

```bash
docker ps | grep frontend
```

**Salida esperada**:
```
technovastore-frontend   Up X minutes   0.0.0.0:3011->3000/tcp
```

### Acceso Web

Abrir navegador en: http://localhost:3011

**Resultado**: ✅ Frontend funcionando correctamente

---

## Lecciones Aprendidas

### 1. Imágenes Docker y Rutas Absolutas

Las imágenes Docker pueden contener rutas absolutas compiladas. Cuando se cambia el nombre de la carpeta del proyecto, es necesario reconstruir las imágenes.

### 2. Importancia del Flag --no-cache

El flag `--no-cache` asegura que Docker no use capas cacheadas que puedan contener rutas antiguas.

### 3. Volúmenes vs Imágenes

Aunque los volúmenes se montan correctamente, la imagen Docker puede tener rutas compiladas que causan problemas.

---

## Prevención Futura

### Al Cambiar Nombre de Carpeta

Si en el futuro se cambia el nombre de la carpeta del proyecto:

1. **Reconstruir todas las imágenes**:
   ```bash
   docker-compose -f docker-compose.optimized.yml build --no-cache
   ```

2. **Eliminar contenedores antiguos**:
   ```bash
   docker-compose -f docker-compose.optimized.yml down
   ```

3. **Iniciar servicios desde cero**:
   ```bash
   docker-compose -f docker-compose.optimized.yml up -d
   ```

### Al Hacer Cambios Importantes

Siempre reconstruir imágenes después de:
- Cambios en Dockerfile
- Cambios en package.json
- Cambios en configuración de Next.js
- Cambios en nombre de carpeta del proyecto

---

## Comandos de Referencia Rápida

### Reconstruir Frontend

```bash
# Detener
docker-compose -f docker-compose.optimized.yml stop frontend

# Reconstruir sin caché
docker-compose -f docker-compose.optimized.yml build --no-cache frontend

# Iniciar
docker-compose -f docker-compose.optimized.yml up -d frontend
```

### Reconstruir Todos los Servicios

```bash
# Detener todos
docker-compose -f docker-compose.optimized.yml down

# Reconstruir todos sin caché
docker-compose -f docker-compose.optimized.yml build --no-cache

# Iniciar todos
docker-compose -f docker-compose.optimized.yml up -d
```

### Ver Logs en Tiempo Real

```bash
docker-compose -f docker-compose.optimized.yml logs -f frontend
```

---

## Estado Final

- ✅ Frontend funcionando correctamente
- ✅ Imagen Docker reconstruida con rutas actuales
- ✅ Contenedores iniciados exitosamente
- ✅ Acceso web funcionando en http://localhost:3011

---

**Documento creado**: 6 de noviembre de 2025  
**Problema**: Resuelto  
**Tiempo de resolución**: ~5 minutos
