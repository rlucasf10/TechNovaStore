# Ejemplo de Uso del Dataset de Códigos Postales

Este documento muestra cómo usar el dataset de códigos postales en tu código.

## Leer el Dataset

### Opción 1: Node.js (Backend/Scripts)

```typescript
import * as fs from 'fs';
import * as path from 'path';

interface PostalCodeRecord {
  postalCode: string;
  provinceCode: string;
  municipalityCode: string;
  municipalityName: string;
}

function loadPostalCodes(): PostalCodeRecord[] {
  const filePath = path.join(__dirname, 'spain-postal-codes.csv');
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // Saltar el header
  return lines.slice(1).map(line => {
    const [postalCode, provinceCode, municipalityCode, municipalityName] = line.split(',');
    return {
      postalCode,
      provinceCode,
      municipalityCode,
      municipalityName,
    };
  });
}

// Uso
const postalCodes = loadPostalCodes();
console.log(`Total de registros: ${postalCodes.length}`);
```

### Opción 2: Frontend (React/Next.js)

```typescript
// lib/locations/loadPostalCodes.ts
export async function loadPostalCodes() {
  const response = await fetch('/data/spain-postal-codes.csv');
  const text = await response.text();
  const lines = text.split('\n').filter(line => line.trim());
  
  return lines.slice(1).map(line => {
    const [postalCode, provinceCode, municipalityCode, municipalityName] = line.split(',');
    return {
      postalCode,
      provinceCode,
      municipalityCode,
      municipalityName,
    };
  });
}

// Uso en componente
import { useEffect, useState } from 'react';
import { loadPostalCodes } from '@/lib/locations/loadPostalCodes';

function MyComponent() {
  const [postalCodes, setPostalCodes] = useState([]);
  
  useEffect(() => {
    loadPostalCodes().then(setPostalCodes);
  }, []);
  
  return <div>Total: {postalCodes.length}</div>;
}
```

## Consultas Comunes

### Obtener todos los municipios de una provincia

```typescript
function getMunicipalitiesByProvince(
  postalCodes: PostalCodeRecord[],
  provinceCode: string
): string[] {
  const municipalities = new Set<string>();
  
  postalCodes
    .filter(record => record.provinceCode === provinceCode)
    .forEach(record => municipalities.add(record.municipalityName));
  
  return Array.from(municipalities).sort();
}

// Ejemplo: Municipios de Madrid (28)
const madridMunicipalities = getMunicipalitiesByProvince(postalCodes, '28');
console.log(madridMunicipalities);
```

### Obtener códigos postales de un municipio

```typescript
function getPostalCodesByMunicipality(
  postalCodes: PostalCodeRecord[],
  municipalityCode: string
): string[] {
  return postalCodes
    .filter(record => record.municipalityCode === municipalityCode)
    .map(record => record.postalCode)
    .sort();
}

// Ejemplo: Códigos postales de Madrid capital (28079)
const madridPostalCodes = getPostalCodesByMunicipality(postalCodes, '28079');
console.log(madridPostalCodes); // ['28001', '28002', '28003', ...]
```

### Validar un código postal

```typescript
function validatePostalCode(
  postalCodes: PostalCodeRecord[],
  postalCode: string,
  provinceCode: string
): boolean {
  return postalCodes.some(
    record => 
      record.postalCode === postalCode && 
      record.provinceCode === provinceCode
  );
}

// Ejemplo: Validar que 28001 pertenece a Madrid (28)
const isValid = validatePostalCode(postalCodes, '28001', '28');
console.log(isValid); // true
```

### Buscar municipios por nombre

```typescript
function searchMunicipalities(
  postalCodes: PostalCodeRecord[],
  query: string
): PostalCodeRecord[] {
  const normalizedQuery = query.toLowerCase();
  
  return postalCodes.filter(record =>
    record.municipalityName.toLowerCase().includes(normalizedQuery)
  );
}

// Ejemplo: Buscar municipios que contengan "Madrid"
const results = searchMunicipalities(postalCodes, 'Madrid');
console.log(results);
```

## Optimizaciones

### Crear índices para búsquedas rápidas

```typescript
interface PostalCodeIndex {
  byProvince: Map<string, PostalCodeRecord[]>;
  byMunicipality: Map<string, PostalCodeRecord[]>;
  byPostalCode: Map<string, PostalCodeRecord>;
}

function createIndex(postalCodes: PostalCodeRecord[]): PostalCodeIndex {
  const index: PostalCodeIndex = {
    byProvince: new Map(),
    byMunicipality: new Map(),
    byPostalCode: new Map(),
  };
  
  postalCodes.forEach(record => {
    // Índice por provincia
    if (!index.byProvince.has(record.provinceCode)) {
      index.byProvince.set(record.provinceCode, []);
    }
    index.byProvince.get(record.provinceCode)!.push(record);
    
    // Índice por municipio
    if (!index.byMunicipality.has(record.municipalityCode)) {
      index.byMunicipality.set(record.municipalityCode, []);
    }
    index.byMunicipality.get(record.municipalityCode)!.push(record);
    
    // Índice por código postal
    index.byPostalCode.set(record.postalCode, record);
  });
  
  return index;
}

// Uso
const index = createIndex(postalCodes);

// Búsqueda O(1) en lugar de O(n)
const madridRecords = index.byProvince.get('28');
const postalCodeRecord = index.byPostalCode.get('28001');
```

## Integración con el Script de Generación

El dataset se genera automáticamente con el script `generate-postal-codes-dataset.ts`.

Para regenerar el dataset:

```bash
npm run generate-postal-codes
```

Para validar el dataset:

```bash
npm run validate-postal-codes
```

## Notas Importantes

1. **Formato del CSV**: El archivo usa comas como separador y no tiene comillas alrededor de los valores
2. **Encoding**: El archivo está en UTF-8 para soportar caracteres especiales (á, é, í, ó, ú, ñ)
3. **Municipios con múltiples códigos postales**: Algunos municipios grandes tienen múltiples registros (uno por código postal)
4. **Códigos INE**: Los códigos de municipio son los códigos oficiales del INE
5. **Actualización**: El dataset debe actualizarse cuando el INE publique nuevos datos

## Recursos Adicionales

- [INE - Códigos de Municipios](https://www.ine.es/daco/daco42/codmun/codmunmapa.htm)
- [Correos - Códigos Postales](https://www.correos.es/es/es/herramientas/codigos-postales/detalle)
- [Datos Abiertos del Gobierno](https://datos.gob.es/)
