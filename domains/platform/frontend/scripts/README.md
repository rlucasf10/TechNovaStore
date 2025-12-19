# Scripts de Generación

Esta carpeta contiene scripts para generar y procesar datos del sistema de localidades españolas.

## Scripts Disponibles

### `generate-spain-locations.ts`

Script principal que genera el archivo JSON de localidades desde datos del INE (Instituto Nacional de Estadística).

**Funcionalidades:**
- Carga códigos postales desde CSV
- Procesa y agrupa datos por provincia
- Agrega metadatos de provincias (coordenadas, comunidad autónoma)
- Identifica capitales de provincia
- Genera archivo JSON optimizado
- Valida tamaño del archivo (< 500KB)
- Soporta minificación para reducir tamaño

## Uso

### Ejecución Básica

```bash
# Usando el comando npm (recomendado)
npm run generate-locations

# Generar archivo con formato legible (desarrollo)
npx tsx scripts/generate-spain-locations.ts

# Generar archivo minificado (producción)
npx tsx scripts/generate-spain-locations.ts --minify

# Especificar ruta de salida personalizada
npx tsx scripts/generate-spain-locations.ts --output ./custom-path.json

# Combinar opciones
npx tsx scripts/generate-spain-locations.ts --minify --output ./custom-path.json
```

### Opciones Disponibles

- `--minify` - Minificar el archivo JSON (sin espacios ni saltos de línea)
- `--output <path>` - Ruta del archivo de salida (por defecto: `public/data/spain-locations.json`)
- `--help`, `-h` - Mostrar ayuda

### Dentro de Docker

```bash
# Usando el comando npm (recomendado)
docker exec technovastore-frontend npm run generate-locations

# Generar archivo en el contenedor
docker exec technovastore-frontend npx tsx scripts/generate-spain-locations.ts

# Con minificación
docker exec technovastore-frontend npx tsx scripts/generate-spain-locations.ts --minify
```

## Requisitos

- Dataset de códigos postales en `data/spain-postal-codes.csv`
- Formato del CSV: `postal_code,province_code,municipality_code,municipality_name`

## Estructura del Archivo Generado

```json
{
  "version": "2025.1",
  "generatedAt": "2025-11-24T20:23:21.116Z",
  "source": "INE - Instituto Nacional de Estadística",
  "provinces": [
    {
      "code": "28",
      "name": "Madrid",
      "autonomousCommunity": "Comunidad de Madrid",
      "coordinates": {
        "lat": 40.4168,
        "lng": -3.7038
      }
    }
  ],
  "municipalities": [
    {
      "code": "28079",
      "name": "Madrid",
      "provinceCode": "28",
      "postalCodes": ["28001", "28002"],
      "isCapital": true
    }
  ]
}
```

## Validación

El script incluye validaciones automáticas:
- ✅ Formato de códigos postales (5 dígitos)
- ✅ Presencia de todas las 50 provincias españolas
- ✅ Coordenadas válidas para cada provincia
- ✅ Tamaño del archivo < 500KB
- ✅ Minificación correcta (si se solicita)

## Tests

Los tests verifican:
- Existencia y validez del archivo JSON
- Estructura correcta de datos
- Metadatos completos
- Códigos postales con formato válido
- Relaciones correctas entre provincias y municipios

```bash
# Ejecutar tests
npm test -- test/scripts/generate-spain-locations.test.ts
```

## Actualización de Datos

Para actualizar los datos de localidades españolas en el futuro, sigue estos pasos:

### 1. Obtener Nuevos Datos

Descarga el dataset actualizado de códigos postales de España desde una fuente oficial:
- **INE (Instituto Nacional de Estadística)**: https://www.ine.es/
- **Correos**: Dataset público de códigos postales
- Otras fuentes oficiales del gobierno español

### 2. Actualizar el Archivo CSV

Reemplaza el archivo `data/spain-postal-codes.csv` con el nuevo dataset:

```bash
# Hacer backup del archivo actual
cp data/spain-postal-codes.csv data/spain-postal-codes.csv.backup

# Copiar el nuevo archivo
cp /ruta/al/nuevo/dataset.csv data/spain-postal-codes.csv
```

**Importante**: Asegúrate de que el nuevo archivo CSV tenga el mismo formato:
```
postal_code,province_code,municipality_code,municipality_name
28001,28,28079,Madrid
28002,28,28079,Madrid
...
```

### 3. Validar el Nuevo Dataset

Antes de generar el archivo JSON, valida que el CSV sea correcto:

```bash
# Validar formato del CSV
npm run validate-postal-codes
```

### 4. Regenerar el Archivo JSON

Ejecuta el script de generación para crear el nuevo archivo:

```bash
# Generar archivo JSON actualizado
npm run generate-locations

# O con minificación para producción
npx tsx scripts/generate-spain-locations.ts --minify
```

### 5. Verificar la Generación

El script mostrará estadísticas de la generación:
- Número de provincias (debe ser 50)
- Número de municipios (debe ser ~8,131)
- Tamaño del archivo (debe ser < 500KB)
- Errores encontrados (si los hay)

### 6. Ejecutar Tests

Verifica que el nuevo archivo cumple con todos los requisitos:

```bash
# Ejecutar suite de tests
npm test -- test/scripts/generate-spain-locations.test.ts
```

Todos los tests deben pasar (18/18) antes de continuar.

### 7. Revisar Cambios

Compara el archivo nuevo con el anterior para identificar cambios:

```bash
# Ver diferencias (en sistemas Unix/Linux)
diff public/data/spain-locations.json public/data/spain-locations.json.backup

# En Windows con PowerShell
Compare-Object (Get-Content public/data/spain-locations.json) (Get-Content public/data/spain-locations.json.backup)
```

### 8. Commit de Cambios

Si todo está correcto, haz commit de los cambios:

```bash
git add data/spain-postal-codes.csv
git add public/data/spain-locations.json
git commit -m "chore: actualizar datos de localidades españolas (INE)"
```

### Frecuencia de Actualización Recomendada

- **Anualmente**: El INE actualiza los datos de municipios una vez al año
- **Cuando hay cambios administrativos**: Fusiones de municipios, nuevos códigos postales, etc.
- **Antes de releases importantes**: Para asegurar datos actualizados en producción

### Troubleshooting

**Problema**: El script reporta provincias faltantes
- **Solución**: Verifica que el CSV incluya datos para todas las 50 provincias españolas

**Problema**: El archivo generado excede 500KB
- **Solución**: Usa la opción `--minify` para reducir el tamaño

**Problema**: Tests fallan después de actualizar
- **Solución**: Revisa los errores específicos y verifica que el formato del CSV sea correcto

**Problema**: Códigos postales inválidos
- **Solución**: Ejecuta `npm run validate-postal-codes` para identificar registros con formato incorrecto
