# Design Document - Sistema de Localidades Españolas (INE)

## Overview

Este documento describe el diseño técnico del sistema de localidades españolas que utiliza datos oficiales del Instituto Nacional de Estadística (INE). El sistema consta de tres componentes principales:

1. **Script de Generación**: Herramienta Node.js que descarga y procesa datos del INE
2. **Archivo de Datos Estático**: JSON optimizado con 50 provincias y 8,131 municipios
3. **Componentes React**: Dropdowns en cascada, validación y estimación de entrega

El sistema está diseñado para ser completamente autónomo (sin APIs externas en runtime), optimizado para rendimiento, y fácil de actualizar.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GENERACIÓN (Una vez)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │   INE API    │─────▶│   Script de  │─────▶│  JSON     │ │
│  │  (Fuente)    │      │  Generación  │      │  Estático │ │
│  └──────────────┘      └──────────────┘      └───────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    RUNTIME (Frontend)                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Componentes React                        │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │                                                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │  │
│  │  │  Province    │  │  Municipality│  │  Postal    │ │  │
│  │  │  Selector    │─▶│  Selector    │─▶│  Code      │ │  │
│  │  └──────────────┘  └──────────────┘  └────────────┘ │  │
│  │                                                        │  │
│  │  ┌──────────────┐  ┌──────────────┐                  │  │
│  │  │  Validator   │  │  Delivery    │                  │  │
│  │  │  Service     │  │  Estimator   │                  │  │
│  │  └──────────────┘  └──────────────┘                  │  │
│  │                                                        │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```


### Component Interaction Flow

1. **Generación (Desarrollo)**:
   - Desarrollador ejecuta `npm run generate-locations`
   - Script descarga datos del INE
   - Script procesa y optimiza datos
   - Script genera `spain-locations.json`

2. **Runtime (Usuario)**:
   - Usuario abre formulario de checkout
   - Sistema carga `spain-locations.json` (lazy)
   - Usuario selecciona provincia → filtra municipios
   - Usuario selecciona municipio → auto-completa código postal
   - Sistema valida y estima entrega

## Components and Interfaces

### 1. Script de Generación (`scripts/generate-spain-locations.ts`)

**Responsabilidad**: Descargar, procesar y generar el archivo de localidades.

**Fuentes de Datos**:
- INE API: `https://www.ine.es/dyngs/INEbase/es/operacion.htm?c=Estadistica_C&cid=1254736177031&menu=resultados&idp=1254734710990`
- Archivo CSV de municipios: `https://www.ine.es/daco/daco42/codmun/codmunmapa.htm`
- Códigos postales: Dataset público de Correos (incluido en el proyecto)

**Interfaz**:
```typescript
interface GeneratorConfig {
  ineApiUrl: string;
  postalCodesFile: string;
  outputFile: string;
  minify: boolean;
}

interface GeneratorResult {
  success: boolean;
  provincesCount: number;
  municipalitiesCount: number;
  fileSize: number;
  errors: string[];
}

class SpainLocationsGenerator {
  async downloadINEData(): Promise<RawINEData>;
  async loadPostalCodes(): Promise<PostalCodeMap>;
  async processData(ineData: RawINEData, postalCodes: PostalCodeMap): Promise<SpainLocationsData>;
  async generateJSON(data: SpainLocationsData, config: GeneratorConfig): Promise<GeneratorResult>;
}
```


### 2. Servicio de Localidades (`lib/locations/LocationsService.ts`)

**Responsabilidad**: Proporcionar acceso a los datos de localidades en el frontend.

**Interfaz**:
```typescript
interface Province {
  code: string;           // Código INE (ej: "28")
  name: string;           // Nombre (ej: "Madrid")
  autonomousCommunity: string;  // Comunidad autónoma
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface Municipality {
  code: string;           // Código INE (ej: "28079")
  name: string;           // Nombre (ej: "Madrid")
  provinceCode: string;   // Código de provincia
  postalCodes: string[];  // Array de códigos postales
  isCapital: boolean;     // Si es capital de provincia
}

interface SpainLocationsData {
  version: string;        // Versión de los datos
  generatedAt: string;    // Timestamp de generación
  provinces: Province[];
  municipalities: Municipality[];
}

class LocationsService {
  private data: SpainLocationsData | null = null;
  
  async loadData(): Promise<void>;
  getProvinces(): Province[];
  getMunicipalitiesByProvince(provinceCode: string): Municipality[];
  getMunicipality(municipalityCode: string): Municipality | null;
  getPostalCodesByMunicipality(municipalityCode: string): string[];
  validatePostalCode(postalCode: string, provinceCode: string): boolean;
  searchMunicipalities(query: string, provinceCode?: string): Municipality[];
}
```


### 3. Componente ProvinceSelector (`components/checkout/ProvinceSelector.tsx`)

**Responsabilidad**: Dropdown para seleccionar provincia.

**Props**:
```typescript
interface ProvinceSelectorProps {
  value: string | null;
  onChange: (provinceCode: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}
```

**Comportamiento**:
- Carga provincias ordenadas alfabéticamente
- Muestra 50 opciones
- Emite evento onChange con código de provincia
- Muestra estado de error si se proporciona

### 4. Componente MunicipalitySelector (`components/checkout/MunicipalitySelector.tsx`)

**Responsabilidad**: Dropdown para seleccionar municipio (dependiente de provincia).

**Props**:
```typescript
interface MunicipalitySelectorProps {
  provinceCode: string | null;
  value: string | null;
  onChange: (municipalityCode: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  searchable?: boolean;  // Habilitar búsqueda (móvil)
}
```

**Comportamiento**:
- Deshabilitado si no hay provincia seleccionada
- Filtra municipios por provincia
- Implementa búsqueda si searchable=true
- Virtualización si >100 opciones
- Emite evento onChange con código de municipio


### 5. Componente PostalCodeInput (`components/checkout/PostalCodeInput.tsx`)

**Responsabilidad**: Input de código postal con validación y auto-completado.

**Props**:
```typescript
interface PostalCodeInputProps {
  value: string;
  onChange: (postalCode: string) => void;
  provinceCode: string | null;
  municipalityCode: string | null;
  error?: string;
  disabled?: boolean;
  autoComplete?: boolean;  // Auto-completar al seleccionar municipio
}
```

**Comportamiento**:
- Auto-completa cuando se selecciona municipio (si autoComplete=true)
- Valida formato (5 dígitos)
- Valida consistencia con provincia
- Muestra indicador visual de validación
- Permite selección si municipio tiene múltiples códigos postales

### 6. Servicio de Estimación de Entrega (`lib/locations/DeliveryEstimator.ts`)

**Responsabilidad**: Calcular estimación de días de entrega basado en ubicación.

**Interfaz**:
```typescript
interface DeliveryEstimate {
  days: string;           // Ej: "24-48 horas", "2-3 días laborables"
  daysMin: number;        // Días mínimos
  daysMax: number;        // Días máximos
  zone: 'madrid' | 'peninsula' | 'balearic' | 'canary' | 'ceuta-melilla';
}

class DeliveryEstimator {
  private readonly DISTRIBUTION_CENTER = { lat: 40.4168, lng: -3.7038 }; // Madrid
  
  calculateDistance(lat: number, lng: number): number;
  estimateDelivery(provinceCode: string): DeliveryEstimate;
  estimateDeliveryByMunicipality(municipalityCode: string): DeliveryEstimate;
}
```

**Lógica de Estimación**:
- Madrid (código 28): 24-48 horas
- Península (distancia < 600km): 2-3 días laborables
- Península (distancia >= 600km): 3-4 días laborables
- Islas Baleares (código 07): 3-5 días laborables
- Islas Canarias (códigos 35, 38): 4-6 días laborables
- Ceuta y Melilla (códigos 51, 52): 4-6 días laborables


### 7. Hook useSpainLocations (`hooks/useSpainLocations.ts`)

**Responsabilidad**: Hook personalizado para gestionar estado de localidades.

**Interfaz**:
```typescript
interface UseSpainLocationsReturn {
  // Estado
  provinces: Province[];
  municipalities: Municipality[];
  selectedProvince: string | null;
  selectedMunicipality: string | null;
  postalCode: string;
  deliveryEstimate: DeliveryEstimate | null;
  
  // Acciones
  setProvince: (code: string) => void;
  setMunicipality: (code: string) => void;
  setPostalCode: (code: string) => void;
  reset: () => void;
  
  // Validación
  errors: {
    province?: string;
    municipality?: string;
    postalCode?: string;
  };
  isValid: boolean;
  
  // Estado de carga
  isLoading: boolean;
  error: Error | null;
}

function useSpainLocations(): UseSpainLocationsReturn;
```

**Comportamiento**:
- Carga datos de localidades al montar
- Gestiona estado de provincia, municipio y código postal
- Limpia municipio y código postal al cambiar provincia
- Auto-completa código postal al seleccionar municipio
- Calcula estimación de entrega automáticamente
- Valida consistencia de datos

## Data Models

### Estructura del Archivo JSON (`spain-locations.json`)

```json
{
  "version": "2025.1",
  "generatedAt": "2025-01-15T10:30:00Z",
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
      "postalCodes": ["28001", "28002", "28003"],
      "isCapital": true
    }
  ]
}
```

**Optimizaciones**:
- Minificado (sin espacios ni saltos de línea)
- Códigos como strings (más compactos que números)
- Solo datos esenciales (sin descripciones largas)
- Tamaño estimado: ~350KB minificado


### Mapa de Códigos Postales

El script de generación utilizará un dataset de códigos postales que mapea cada código postal a su provincia y municipio. Este dataset se incluirá en el proyecto como `data/spain-postal-codes.csv`:

```csv
postal_code,province_code,municipality_code,municipality_name
28001,28,28079,Madrid
28002,28,28079,Madrid
08001,08,08019,Barcelona
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Municipios filtrados pertenecen a la provincia seleccionada

*For any* provincia seleccionada, todos los municipios devueltos por `getMunicipalitiesByProvince` deben tener `provinceCode` igual al código de la provincia seleccionada.

**Validates: Requirements 1.2**

### Property 2: Código postal auto-completado es válido para el municipio

*For any* municipio seleccionado, el código postal auto-completado debe estar en el array `postalCodes` del municipio.

**Validates: Requirements 1.3, 4.1**

### Property 3: Cambio de provincia limpia estado dependiente

*For any* provincia inicial y provincia nueva diferentes, cuando se cambia la provincia seleccionada, el municipio seleccionado y el código postal deben ser null/vacío.

**Validates: Requirements 1.5**

### Property 4: Archivo generado cumple con el schema esperado

*For any* datos de entrada válidos del INE, el archivo JSON generado debe cumplir con el schema TypeScript definido (SpainLocationsData).

**Validates: Requirements 2.2**

### Property 5: Script maneja errores sin fallar completamente

*For any* conjunto de datos con algunos registros inválidos, el script debe procesar los registros válidos y registrar los errores sin lanzar excepciones.

**Validates: Requirements 2.4**

### Property 6: Distancia calculada es positiva y razonable

*For any* municipio en España, la distancia calculada desde Madrid debe ser mayor que 0 y menor que 1500 km.

**Validates: Requirements 3.1**

### Property 7: Estimación de entrega está en rango válido

*For any* provincia, la estimación de días de entrega debe estar entre 1 y 6 días.

**Validates: Requirements 3.2**


### Property 8: Validación de código postal detecta inconsistencias

*For any* código postal y provincia, si el código postal no pertenece a la provincia, `validatePostalCode` debe retornar false.

**Validates: Requirements 4.2, 4.3**

### Property 9: Validación de código postal acepta códigos válidos

*For any* código postal que pertenece a una provincia, `validatePostalCode` debe retornar true cuando se valida con esa provincia.

**Validates: Requirements 4.2, 4.4**

### Property 10: Archivo generado está minificado

*For any* archivo JSON generado con `minify: true`, el contenido no debe contener espacios innecesarios ni saltos de línea.

**Validates: Requirements 5.4**

### Property 11: Búsqueda filtra correctamente

*For any* texto de búsqueda, todos los municipios devueltos por `searchMunicipalities` deben contener el texto de búsqueda en su nombre (case-insensitive).

**Validates: Requirements 6.3**

### Property 12: Selección cierra el dropdown

*For any* opción seleccionada en el dropdown, el dropdown debe cambiar su estado a cerrado.

**Validates: Requirements 6.5**

### Property 13: Archivo generado incluye códigos INE

*For any* provincia y municipio en el archivo generado, debe tener un campo `code` no vacío.

**Validates: Requirements 7.1**

### Property 14: Municipios incluyen comunidad autónoma

*For any* municipio en el archivo generado, debe tener un campo `autonomousCommunity` no vacío (heredado de su provincia).

**Validates: Requirements 7.2**

### Property 15: Provincias incluyen coordenadas

*For any* provincia en el archivo generado, debe tener un objeto `coordinates` con `lat` y `lng` válidos (lat: -90 a 90, lng: -180 a 180).

**Validates: Requirements 7.3**

### Property 16: Municipios grandes tienen múltiples códigos postales

*For any* municipio con población > 100,000 habitantes, debe tener un array `postalCodes` con al menos 2 elementos.

**Validates: Requirements 7.4**


## Error Handling

### Script de Generación

**Errores Manejados**:
1. **Error de red al descargar datos del INE**:
   - Reintentar hasta 3 veces con backoff exponencial
   - Si falla, usar datos en caché si existen
   - Registrar error y continuar con datos disponibles

2. **Datos del INE con formato inválido**:
   - Validar cada registro individualmente
   - Registrar registros inválidos en archivo de log
   - Continuar procesando registros válidos
   - Generar reporte de errores al final

3. **Archivo de códigos postales no encontrado**:
   - Lanzar error crítico (no se puede continuar)
   - Mostrar mensaje claro con instrucciones

4. **Error al escribir archivo de salida**:
   - Verificar permisos de escritura
   - Crear directorio si no existe
   - Lanzar error con mensaje descriptivo

### Frontend

**Errores Manejados**:
1. **Error al cargar archivo de localidades**:
   - Mostrar mensaje de error al usuario
   - Deshabilitar formulario de dirección
   - Ofrecer opción de reintentar

2. **Provincia o municipio no encontrado**:
   - Mostrar mensaje de error específico
   - Limpiar selección inválida
   - Permitir al usuario seleccionar nuevamente

3. **Código postal inválido**:
   - Mostrar mensaje de error inline
   - Highlight del campo con error
   - Sugerir códigos postales válidos si es posible

4. **Timeout al filtrar municipios**:
   - Mostrar spinner de carga
   - Cancelar operación anterior si hay nueva búsqueda
   - Implementar debounce de 300ms

## Testing Strategy

### Unit Tests

**Componentes a testear**:
1. **LocationsService**:
   - Carga correcta de datos
   - Filtrado de municipios por provincia
   - Validación de códigos postales
   - Búsqueda de municipios

2. **DeliveryEstimator**:
   - Cálculo de distancia
   - Estimación de días por zona
   - Casos especiales (Madrid, islas)

3. **Componentes React**:
   - Renderizado correcto
   - Manejo de eventos onChange
   - Estados de error
   - Deshabilitado condicional


### Property-Based Tests

**Framework**: fast-check (para TypeScript/JavaScript)

**Configuración**: Cada test debe ejecutar mínimo 100 iteraciones.

**Tests a implementar**:

1. **Test de Property 1**: Municipios filtrados pertenecen a la provincia
   - **Feature: spain-locations-ine, Property 1: Municipios filtrados pertenecen a la provincia seleccionada**
   - Generar: código de provincia aleatorio válido
   - Verificar: todos los municipios tienen el mismo provinceCode

2. **Test de Property 2**: Código postal auto-completado es válido
   - **Feature: spain-locations-ine, Property 2: Código postal auto-completado es válido para el municipio**
   - Generar: código de municipio aleatorio válido
   - Verificar: código postal está en el array postalCodes

3. **Test de Property 3**: Cambio de provincia limpia estado
   - **Feature: spain-locations-ine, Property 3: Cambio de provincia limpia estado dependiente**
   - Generar: dos códigos de provincia diferentes
   - Verificar: municipio y código postal son null después del cambio

4. **Test de Property 4**: Archivo generado cumple schema
   - **Feature: spain-locations-ine, Property 4: Archivo generado cumple con el schema esperado**
   - Generar: datos de entrada válidos simulados
   - Verificar: salida cumple con SpainLocationsData schema

5. **Test de Property 5**: Script maneja errores
   - **Feature: spain-locations-ine, Property 5: Script maneja errores sin fallar completamente**
   - Generar: datos con algunos registros inválidos aleatorios
   - Verificar: script completa sin lanzar excepciones

6. **Test de Property 6**: Distancia es positiva y razonable
   - **Feature: spain-locations-ine, Property 6: Distancia calculada es positiva y razonable**
   - Generar: coordenadas aleatorias dentro de España
   - Verificar: 0 < distancia < 1500

7. **Test de Property 7**: Estimación en rango válido
   - **Feature: spain-locations-ine, Property 7: Estimación de entrega está en rango válido**
   - Generar: código de provincia aleatorio
   - Verificar: 1 <= días <= 6

8. **Test de Property 8**: Validación detecta inconsistencias
   - **Feature: spain-locations-ine, Property 8: Validación de código postal detecta inconsistencias**
   - Generar: código postal y provincia que no coinciden
   - Verificar: validatePostalCode retorna false

9. **Test de Property 9**: Validación acepta códigos válidos
   - **Feature: spain-locations-ine, Property 9: Validación de código postal acepta códigos válidos**
   - Generar: código postal y provincia que coinciden
   - Verificar: validatePostalCode retorna true

10. **Test de Property 10**: Archivo minificado
    - **Feature: spain-locations-ine, Property 10: Archivo generado está minificado**
    - Generar: datos aleatorios
    - Verificar: salida no contiene espacios innecesarios

11. **Test de Property 11**: Búsqueda filtra correctamente
    - **Feature: spain-locations-ine, Property 11: Búsqueda filtra correctamente**
    - Generar: texto de búsqueda aleatorio
    - Verificar: todos los resultados contienen el texto

12. **Test de Property 12**: Selección cierra dropdown
    - **Feature: spain-locations-ine, Property 12: Selección cierra el dropdown**
    - Generar: opción aleatoria
    - Verificar: estado del dropdown es cerrado

13. **Test de Property 13**: Códigos INE presentes
    - **Feature: spain-locations-ine, Property 13: Archivo generado incluye códigos INE**
    - Generar: datos aleatorios
    - Verificar: todos tienen campo code no vacío

14. **Test de Property 14**: Comunidad autónoma presente
    - **Feature: spain-locations-ine, Property 14: Municipios incluyen comunidad autónoma**
    - Generar: municipios aleatorios
    - Verificar: todos tienen autonomousCommunity no vacío

15. **Test de Property 15**: Coordenadas válidas
    - **Feature: spain-locations-ine, Property 15: Provincias incluyen coordenadas**
    - Generar: provincias aleatorias
    - Verificar: coordenadas en rangos válidos

16. **Test de Property 16**: Municipios grandes con múltiples códigos
    - **Feature: spain-locations-ine, Property 16: Municipios grandes tienen múltiples códigos postales**
    - Generar: municipios grandes aleatorios
    - Verificar: postalCodes.length >= 2

### Integration Tests

1. **Flujo completo de selección**:
   - Seleccionar provincia → verificar municipios cargados
   - Seleccionar municipio → verificar código postal auto-completado
   - Verificar estimación de entrega calculada

2. **Validación de formulario**:
   - Enviar formulario vacío → verificar errores
   - Enviar con código postal inválido → verificar error
   - Enviar con datos válidos → verificar éxito

3. **Búsqueda de municipios**:
   - Escribir texto → verificar filtrado en tiempo real
   - Seleccionar resultado → verificar selección correcta

## Performance Considerations

### Optimizaciones Implementadas

1. **Lazy Loading**:
   - Cargar `spain-locations.json` solo cuando se necesita
   - Usar dynamic import en React

2. **Memoización**:
   - Cachear resultados de filtrado de municipios
   - Usar `useMemo` para cálculos costosos

3. **Virtualización**:
   - Implementar virtualización para dropdowns con >100 opciones
   - Usar `react-window` o `react-virtual`

4. **Debouncing**:
   - Aplicar debounce de 300ms a búsqueda de municipios
   - Cancelar búsquedas anteriores

5. **Minificación**:
   - Archivo JSON minificado (sin espacios)
   - Compresión gzip en servidor

### Métricas Objetivo

- **Tamaño del archivo**: < 500KB (minificado)
- **Tiempo de carga**: < 100ms (desde caché)
- **Tiempo de filtrado**: < 50ms (para cualquier provincia)
- **Tiempo de búsqueda**: < 100ms (con debounce)
- **Memoria usada**: < 10MB (datos en memoria)

## Security Considerations

1. **Validación de entrada**:
   - Validar formato de código postal (5 dígitos)
   - Sanitizar texto de búsqueda
   - Validar códigos de provincia/municipio contra lista conocida

2. **Prevención de XSS**:
   - Escapar nombres de municipios al renderizar
   - Usar React (escapa automáticamente)

3. **Integridad de datos**:
   - Verificar checksum del archivo JSON
   - Validar schema al cargar datos

## Deployment Considerations

1. **Generación de datos**:
   - Ejecutar script antes de build de producción
   - Incluir archivo generado en control de versiones
   - Documentar proceso de actualización

2. **Actualización de datos**:
   - Ejecutar `npm run generate-locations` cuando INE publique nuevos datos
   - Verificar que tests pasan después de actualizar
   - Hacer commit del nuevo archivo

3. **Fallback**:
   - Si falla la carga del archivo, mostrar input de texto libre
   - Permitir al usuario continuar sin validación estricta
   - Registrar error para investigación

## Future Enhancements

1. **Autocompletado inteligente**:
   - Sugerir municipios basado en código postal parcial
   - Búsqueda fuzzy para nombres con errores tipográficos

2. **Geolocalización**:
   - Detectar ubicación del usuario automáticamente
   - Pre-seleccionar provincia/municipio más cercano

3. **Historial de direcciones**:
   - Guardar direcciones usadas anteriormente
   - Permitir selección rápida de direcciones guardadas

4. **Validación de direcciones**:
   - Integrar con API de validación de direcciones
   - Verificar que la dirección completa existe

5. **Internacionalización**:
   - Soporte para nombres en catalán, gallego, euskera
   - Permitir búsqueda en múltiples idiomas
