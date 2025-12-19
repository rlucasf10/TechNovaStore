# Plan de Implementación - Sistema de Localidades Españolas (INE)

## Fase 1: Preparación y Dataset de Códigos Postales

- [x] 1. Crear dataset de códigos postales






  - Investigar y descargar dataset público de códigos postales de España
  - Crear archivo `data/spain-postal-codes.csv` con formato: postal_code, province_code, municipality_code, municipality_name
  - Validar que el dataset contenga al menos 8,000 municipios
  - Documentar fuente de datos en README
  - _Requisitos: 2.1, 2.2_

- [x] 2. Configurar estructura de carpetas





  - Crear carpeta `frontend/scripts/` para scripts de generación
  - Crear carpeta `frontend/data/` para datasets
  - Crear carpeta `frontend/src/lib/locations/` para servicios
  - Crear carpeta `frontend/src/components/checkout/` para componentes
  - Crear carpeta `frontend/public/data/` para archivo JSON generado
  - _Requisitos: 2.1_

## Fase 2: Script de Generación de Datos

- [x] 3. Crear script de generación base




  - [x] 3.1 Crear archivo `scripts/generate-spain-locations.ts`






    - Implementar función main() con manejo de errores
    - Configurar argumentos de línea de comandos (--minify, --output)
    - Implementar logging con colores (éxito, error, info)
    - Agregar progress indicators para operaciones largas
    - _Requisitos: 2.1, 2.5_

  - [x] 3.2 Implementar carga de códigos postales





    - Crear función loadPostalCodes() que lee el CSV
    - Parsear CSV usando librería csv-parse
    - Validar formato de cada registro
    - Crear mapa: postalCode → { provinceCode, municipalityCode, municipalityName }
    - Registrar errores de parsing sin detener el proceso
    - _Requisitos: 2.2, 2.4_

  - [x] 3.3 Implementar procesamiento de datos




    - Crear función processData() que agrupa por provincia
    - Agrupar municipios por provincia
    - Eliminar duplicados de municipios
    - Agregar múltiples códigos postales a municipios grandes
    - Ordenar provincias alfabéticamente
    - Ordenar municipios alfabéticamente dentro de cada provincia
    - _Requisitos: 2.2, 7.4_


  - [x] 3.4 Agregar metadatos a provincias






    - Crear mapa de provincias con coordenadas del centro
    - Agregar comunidad autónoma a cada provincia
    - Validar que todas las 50 provincias estén presentes
    - Marcar capitales de provincia (isCapital: true)
    - _Requisitos: 7.1, 7.2, 7.3_

  - [x] 3.5 Generar archivo JSON




    - Crear función generateJSON() que serializa los datos
    - Agregar metadatos: version, generatedAt, source
    - Implementar opción de minificación (sin espacios)
    - Escribir archivo en `public/data/spain-locations.json`
    - Calcular y mostrar tamaño del archivo generado
    - Validar que el tamaño sea < 500KB
    - _Requisitos: 2.2, 2.3, 5.1, 5.4, 7.5_

  - [x] 3.6 Escribir tests para el script de generación





    - Testear loadPostalCodes() con CSV válido
    - Testear loadPostalCodes() con CSV con errores
    - Testear processData() con datos de ejemplo
    - Testear generateJSON() con minificación
    - Verificar que el archivo generado cumple con el schema
    - _Requisitos: 2.2, 2.4_

- [x] 4. Agregar comando npm para generación








  - Agregar script en package.json: "generate-locations": "tsx scripts/generate-spain-locations.ts"
  - Documentar comando en README
  - Agregar instrucciones de actualización de datos
  - _Requisitos: 2.5_

## Fase 3: Servicio de Localidades (Frontend)

- [x] 5. Crear tipos TypeScript




  - [x] 5.1 Crear archivo `src/lib/locations/types.ts`





    - Definir interface Province con todos los campos
    - Definir interface Municipality con todos los campos
    - Definir interface SpainLocationsData
    - Definir interface DeliveryEstimate
    - Exportar todos los tipos
    - _Requisitos: 2.2, 3.1_

- [x] 6. Crear LocationsService




  - [x] 6.1 Crear archivo `src/lib/locations/LocationsService.ts`







    - Implementar clase LocationsService como singleton
    - Implementar método loadData() con lazy loading
    - Implementar caché en memoria de los datos cargados
    - Agregar manejo de errores al cargar JSON
    - _Requisitos: 5.5_

  - [x] 6.2 Implementar métodos de consulta





    - Implementar getProvinces() que retorna array ordenado
    - Implementar getMunicipalitiesByProvince(provinceCode)
    - Implementar getMunicipality(municipalityCode)
    - Implementar getPostalCodesByMunicipality(municipalityCode)
    - Agregar memoización para consultas frecuentes
    - _Requisitos: 1.1, 1.2, 1.3, 5.2, 5.3_

  - [x] 6.3 Implementar validación de códigos postales






    - Implementar validatePostalCode(postalCode, provinceCode)
    - Validar formato (5 dígitos)
    - Validar que el código pertenece a la provincia
    - Retornar true/false con mensaje de error descriptivo
    - _Requisitos: 4.2, 4.3, 4.4_

  - [x] 6.4 Implementar búsqueda de municipios




    - Implementar searchMunicipalities(query, provinceCode?)
    - Búsqueda case-insensitive
    - Filtrar por provincia si se proporciona
    - Limitar resultados a 50 municipios
    - Implementar debounce interno de 100ms
    - _Requisitos: 6.3_

  - [x] 6.5 Escribir property tests para LocationsService








    - **Property 1: Municipios filtrados pertenecen a la provincia seleccionada**
    - **Validates: Requirements 1.2**
    - Generar código de provincia aleatorio
    - Verificar que todos los municipios tienen el mismo provinceCode
    - Ejecutar 100 iteraciones

  - [x] 6.6 Escribir property tests para validación







    - **Property 8: Validación de código postal detecta inconsistencias**
    - **Validates: Requirements 4.2, 4.3**
    - Generar código postal y provincia que no coinciden
    - Verificar que validatePostalCode retorna false
    - Ejecutar 100 iteraciones

  - [x] 6.7 Escribir property tests para búsqueda








    - **Property 11: Búsqueda filtra correctamente**
    - **Validates: Requirements 6.3**
    - Generar texto de búsqueda aleatorio
    - Verificar que todos los resultados contienen el texto
    - Ejecutar 100 iteraciones


## Fase 4: Servicio de Estimación de Entrega

- [x] 7. Crear DeliveryEstimator



  - [x] 7.1 Crear archivo `src/lib/locations/DeliveryEstimator.ts`






    - Implementar clase DeliveryEstimator
    - Definir constante DISTRIBUTION_CENTER (Madrid: 40.4168, -3.7038)
    - Implementar fórmula de Haversine para calcular distancia
    - _Requisitos: 3.1_

  - [x] 7.2 Implementar lógica de estimación





    - Implementar estimateDelivery(provinceCode)
    - Implementar estimateDeliveryByMunicipality(municipalityCode)
    - Lógica de zonas:
      - Madrid (28): "24-48 horas" (1-2 días)
      - Península < 600km: "2-3 días laborables"
      - Península >= 600km: "3-4 días laborables"
      - Baleares (07): "3-5 días laborables"
      - Canarias (35, 38): "4-6 días laborables"
      - Ceuta/Melilla (51, 52): "4-6 días laborables"
    - _Requisitos: 3.2, 3.3, 3.4, 3.5_

  - [x] 7.3 Escribir property tests para DeliveryEstimator





    - **Property 6: Distancia calculada es positiva y razonable**
    - **Validates: Requirements 3.1**
    - Generar coordenadas aleatorias dentro de España
    - Verificar que 0 < distancia < 1500
    - Ejecutar 100 iteraciones

  - [x] 7.4 Escribir property tests para estimación






    - **Property 7: Estimación de entrega está en rango válido**
    - **Validates: Requirements 3.2**
    - Generar código de provincia aleatorio
    - Verificar que 1 <= días <= 6
    - Ejecutar 100 iteraciones

  - [x] 7.5 Escribir unit tests para casos específicos





    - Testear Madrid retorna "24-48 horas"
    - Testear península retorna "2-3 días laborables"
    - Testear Baleares retorna "3-5 días laborables"
    - Testear Canarias retorna "4-6 días laborables"
    - _Requisitos: 3.3, 3.4, 3.5_

## Fase 5: Componentes de UI

- [x] 8. Crear componente ProvinceSelector





  - [x] 8.1 Crear archivo `src/components/checkout/ProvinceSelector.tsx`





    - Implementar componente funcional con TypeScript
    - Definir props: value, onChange, error, disabled, placeholder
    - Usar componente Select base (si existe) o crear dropdown nativo
    - Cargar provincias desde LocationsService
    - Ordenar provincias alfabéticamente
    - Implementar estado de carga (loading)
    - Mostrar mensaje de error si se proporciona
    - _Requisitos: 1.1_

  - [x] 8.2 Escribir unit tests para ProvinceSelector







    - Testear renderizado con 50 provincias
    - Testear evento onChange
    - Testear estado disabled
    - Testear mostrar error
    - _Requisitos: 1.1_

- [x] 9. Crear componente MunicipalitySelector




  - [x] 9.1 Crear archivo `src/components/checkout/MunicipalitySelector.tsx`






    - Implementar componente funcional con TypeScript
    - Definir props: provinceCode, value, onChange, error, disabled, placeholder, searchable
    - Deshabilitar si provinceCode es null
    - Filtrar municipios por provincia usando LocationsService
    - Implementar campo de búsqueda si searchable=true
    - Implementar debounce de 300ms para búsqueda
    - _Requisitos: 1.2, 6.2, 6.3_

  - [x] 9.2 Implementar virtualización para listas largas






    - Detectar si hay más de 100 municipios
    - Usar react-window o react-virtual para virtualización
    - Mantener performance fluida en móvil
    - _Requisitos: 6.4_

  - [x] 9.3 Escribir property tests para MunicipalitySelector








    - **Property 2: Código postal auto-completado es válido para el municipio**
    - **Validates: Requirements 1.3, 4.1**
    - Generar municipio aleatorio
    - Verificar que código postal está en postalCodes
    - Ejecutar 100 iteraciones

  - [x] 9.4 Escribir unit tests para MunicipalitySelector






    - Testear que está disabled sin provincia
    - Testear filtrado por provincia
    - Testear búsqueda con debounce
    - Testear virtualización con >100 opciones
    - _Requisitos: 1.2, 6.2, 6.3, 6.4_


- [ ] 10. Crear componente PostalCodeInput
  - [ ] 10.1 Crear archivo `src/components/checkout/PostalCodeInput.tsx`
    - Implementar componente funcional con TypeScript
    - Definir props: value, onChange, provinceCode, municipalityCode, error, disabled, autoComplete
    - Implementar input de texto con máscara de 5 dígitos
    - Auto-completar cuando se selecciona municipio (si autoComplete=true)
    - Validar formato en tiempo real (5 dígitos)
    - Validar consistencia con provincia usando LocationsService
    - Mostrar indicador visual de validación (✓ o ✗)
    - _Requisitos: 1.3, 4.1, 4.2, 4.3, 4.4_

  - [ ] 10.2 Implementar selector de múltiples códigos postales
    - Detectar si municipio tiene múltiples códigos postales
    - Mostrar dropdown con opciones si hay múltiples
    - Permitir selección manual
    - _Requisitos: 4.5_

  - [ ] 10.3 Escribir property tests para PostalCodeInput
    - **Property 9: Validación de código postal acepta códigos válidos**
    - **Validates: Requirements 4.2, 4.4**
    - Generar código postal y provincia que coinciden
    - Verificar que validatePostalCode retorna true
    - Ejecutar 100 iteraciones

  - [ ] 10.4 Escribir unit tests para PostalCodeInput
    - Testear auto-completado al seleccionar municipio
    - Testear validación de formato (5 dígitos)
    - Testear validación de consistencia con provincia
    - Testear indicador visual de validación
    - Testear selector de múltiples códigos postales
    - _Requisitos: 1.3, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 11. Crear componente DeliveryEstimateDisplay
  - [ ] 11.1 Crear archivo `src/components/checkout/DeliveryEstimateDisplay.tsx`
    - Implementar componente funcional con TypeScript
    - Definir props: provinceCode, municipalityCode
    - Calcular estimación usando DeliveryEstimator
    - Mostrar mensaje formateado: "Entrega estimada: {días}"
    - Agregar icono de camión o reloj
    - Implementar skeleton loader mientras calcula
    - _Requisitos: 3.1, 3.2_

  - [ ] 11.2 Escribir unit tests para DeliveryEstimateDisplay
    - Testear cálculo de estimación
    - Testear formato de mensaje
    - Testear skeleton loader
    - _Requisitos: 3.1, 3.2_

## Fase 6: Hook Personalizado

- [ ] 12. Crear hook useSpainLocations
  - [ ] 12.1 Crear archivo `src/hooks/useSpainLocations.ts`
    - Implementar hook personalizado con TypeScript
    - Gestionar estado de: provinces, municipalities, selectedProvince, selectedMunicipality, postalCode
    - Implementar loadData() al montar el componente
    - Implementar setProvince() que limpia municipio y código postal
    - Implementar setMunicipality() que auto-completa código postal
    - Implementar setPostalCode() con validación
    - Implementar reset() que limpia todo el estado
    - _Requisitos: 1.1, 1.2, 1.3, 1.5_

  - [ ] 12.2 Implementar validación y errores
    - Validar que provincia esté seleccionada antes de municipio
    - Validar que municipio esté seleccionado antes de código postal
    - Validar formato y consistencia de código postal
    - Retornar objeto errors con mensajes descriptivos
    - Retornar isValid que indica si todo es válido
    - _Requisitos: 1.4, 4.2, 4.3_

  - [ ] 12.3 Implementar cálculo automático de estimación
    - Calcular deliveryEstimate cuando se selecciona municipio
    - Actualizar estimación automáticamente
    - Cachear resultado para evitar recálculos
    - _Requisitos: 3.1, 3.2_

  - [ ] 12.4 Escribir property tests para useSpainLocations
    - **Property 3: Cambio de provincia limpia estado dependiente**
    - **Validates: Requirements 1.5**
    - Generar dos provincias diferentes
    - Verificar que municipio y código postal son null después del cambio
    - Ejecutar 100 iteraciones

  - [ ] 12.5 Escribir unit tests para useSpainLocations
    - Testear carga inicial de datos
    - Testear setProvince limpia estado dependiente
    - Testear setMunicipality auto-completa código postal
    - Testear validación de errores
    - Testear cálculo de estimación
    - Testear reset limpia todo
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1_


## Fase 7: Integración con Formulario de Checkout

- [ ] 13. Integrar componentes en formulario de envío
  - [ ] 13.1 Actualizar página de checkout (Paso 1: Información de Envío)
    - Importar componentes: ProvinceSelector, MunicipalitySelector, PostalCodeInput
    - Importar hook useSpainLocations
    - Reemplazar inputs de texto por componentes de localidades
    - Conectar componentes con React Hook Form
    - Agregar DeliveryEstimateDisplay debajo del formulario
    - _Requisitos: 1.1, 1.2, 1.3, 3.1_

  - [ ] 13.2 Actualizar validación del formulario
    - Agregar validación de Zod para provincia (requerido)
    - Agregar validación de Zod para municipio (requerido)
    - Agregar validación de Zod para código postal (formato y consistencia)
    - Mostrar errores de validación inline
    - Prevenir avance al siguiente paso si hay errores
    - _Requisitos: 1.4, 4.2, 4.3_

  - [ ] 13.3 Implementar persistencia de selección
    - Guardar provincia, municipio y código postal en localStorage
    - Restaurar valores al volver al formulario
    - Limpiar valores al completar el pedido
    - _Requisitos: 1.1_

  - [ ] 13.4 Escribir integration tests para formulario
    - Testear flujo completo: seleccionar provincia → municipio → código postal
    - Testear validación de formulario vacío
    - Testear cambio de provincia limpia municipio
    - Testear auto-completado de código postal
    - Testear estimación de entrega se muestra
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1_

## Fase 8: Optimizaciones de Rendimiento

- [ ] 14. Implementar optimizaciones
  - [ ] 14.1 Optimizar carga del archivo JSON
    - Implementar lazy loading con dynamic import
    - Cargar solo cuando el usuario accede al checkout
    - Agregar preload hint en páginas anteriores
    - _Requisitos: 5.5_

  - [ ] 14.2 Implementar memoización
    - Usar useMemo para filtrado de municipios
    - Usar useMemo para cálculo de estimación
    - Usar useCallback para handlers de eventos
    - _Requisitos: 5.2, 5.3_

  - [ ] 14.3 Optimizar búsqueda de municipios
    - Implementar debounce de 300ms
    - Cancelar búsquedas anteriores
    - Limitar resultados a 50 municipios
    - _Requisitos: 6.3_

  - [ ] 14.4 Verificar tamaño del bundle
    - Analizar bundle con @next/bundle-analyzer
    - Verificar que spain-locations.json no se incluye en el bundle inicial
    - Verificar que el tamaño del archivo es < 500KB
    - _Requisitos: 5.1_

  - [ ] 14.5 Escribir performance tests
    - Testear tiempo de carga del archivo < 100ms
    - Testear tiempo de filtrado de municipios < 50ms
    - Testear tiempo de búsqueda < 100ms
    - _Requisitos: 5.2, 5.3_

## Fase 9: Experiencia Móvil

- [ ] 15. Optimizar para móvil
  - [ ] 15.1 Implementar dropdowns nativos en móvil
    - Detectar dispositivo móvil
    - Usar <select> nativo en móvil
    - Usar dropdown personalizado en desktop
    - _Requisitos: 6.1_

  - [ ] 15.2 Implementar búsqueda en móvil
    - Agregar campo de búsqueda en dropdown de municipios
    - Implementar filtrado en tiempo real
    - Optimizar para touch (botones grandes)
    - _Requisitos: 6.2, 6.3_

  - [ ] 15.3 Implementar cierre automático de dropdowns
    - Cerrar dropdown al seleccionar opción
    - Cerrar dropdown al hacer clic fuera
    - Cerrar dropdown al presionar ESC
    - _Requisitos: 6.5_

  - [ ] 15.4 Escribir property tests para cierre de dropdown
    - **Property 12: Selección cierra el dropdown**
    - **Validates: Requirements 6.5**
    - Generar opción aleatoria
    - Verificar que estado del dropdown es cerrado
    - Ejecutar 100 iteraciones

  - [ ] 15.5 Escribir tests de responsive
    - Testear renderizado en móvil (viewport 375px)
    - Testear renderizado en tablet (viewport 768px)
    - Testear renderizado en desktop (viewport 1024px)
    - _Requisitos: 6.1_


## Fase 10: Testing Comprehensivo

- [ ] 16. Ejecutar suite completa de tests
  - [ ] 16.1 Ejecutar todos los property tests
    - Verificar que todos los property tests pasan
    - Verificar que cada test ejecuta 100 iteraciones
    - Revisar coverage de property tests
    - _Requisitos: 1.2, 1.3, 1.5, 3.1, 3.2, 4.2, 4.3, 4.4, 6.3, 6.5_

  - [ ] 16.2 Ejecutar todos los unit tests
    - Verificar que todos los unit tests pasan
    - Verificar coverage > 80%
    - Identificar áreas sin cobertura
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 3.3, 3.4, 3.5, 4.1, 4.5_

  - [ ] 16.3 Ejecutar integration tests
    - Testear flujo completo de selección
    - Testear validación de formulario
    - Testear persistencia de datos
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1_

  - [ ] 16.4 Ejecutar tests E2E
    - Testear flujo completo de checkout con localidades
    - Testear en múltiples navegadores (Chrome, Firefox, Safari)
    - Testear en múltiples dispositivos (móvil, tablet, desktop)
    - _Requisitos: 1.1, 1.2, 1.3, 6.1_

## Fase 11: Documentación

- [ ] 17. Crear documentación
  - [ ] 17.1 Documentar script de generación
    - Crear README en `scripts/` con instrucciones de uso
    - Documentar formato del CSV de códigos postales
    - Documentar proceso de actualización de datos
    - Agregar ejemplos de comandos
    - _Requisitos: 2.5_

  - [ ] 17.2 Documentar componentes
    - Documentar props de ProvinceSelector
    - Documentar props de MunicipalitySelector
    - Documentar props de PostalCodeInput
    - Documentar props de DeliveryEstimateDisplay
    - Agregar ejemplos de uso
    - _Requisitos: 1.1, 1.2, 1.3, 3.1_

  - [ ] 17.3 Documentar hook useSpainLocations
    - Documentar API del hook
    - Documentar estados y acciones
    - Documentar validación y errores
    - Agregar ejemplos de uso
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 17.4 Documentar servicios
    - Documentar LocationsService API
    - Documentar DeliveryEstimator API
    - Agregar ejemplos de uso
    - _Requisitos: 1.2, 3.1_

  - [ ] 17.5 Crear guía de integración
    - Documentar cómo integrar en otros formularios
    - Documentar cómo personalizar estilos
    - Documentar cómo extender funcionalidad
    - _Requisitos: 1.1_

## Fase 12: Verificación Final

- [ ] 18. Checkpoint - Verificación completa del sistema
  - Ejecutar script de generación y verificar archivo JSON
  - Verificar que el archivo tiene 50 provincias y ~8,131 municipios
  - Verificar que el tamaño del archivo es < 500KB
  - Probar flujo completo en navegador
  - Verificar que todos los tests pasan
  - Verificar estimación de entrega para diferentes provincias
  - Verificar validación de códigos postales
  - Verificar experiencia móvil
  - Verificar performance (tiempos de carga y filtrado)
  - Hacer preguntas al usuario si surgen dudas
  - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 3.1, 3.2, 4.2, 4.3, 5.1, 5.2, 5.3, 6.1, 6.3_

## Notas Importantes

### Dependencias Externas

**Librerías NPM necesarias:**
- `csv-parse`: Para parsear el CSV de códigos postales
- `fast-check`: Para property-based testing
- `react-window` o `react-virtual`: Para virtualización de listas largas (opcional)

**Datos externos:**
- Dataset de códigos postales de España (CSV)
- Fuente sugerida: Dataset público de Correos o INE

### Orden de Implementación Recomendado

1. **Primero**: Fase 1-2 (Dataset y script de generación)
   - Esto genera el archivo JSON que necesitan todas las demás fases

2. **Segundo**: Fase 3-4 (Servicios)
   - LocationsService y DeliveryEstimator son la base de todo

3. **Tercero**: Fase 5-6 (Componentes y hook)
   - Construir la UI sobre los servicios

4. **Cuarto**: Fase 7 (Integración)
   - Integrar en el formulario de checkout existente

5. **Quinto**: Fases 8-9 (Optimizaciones y móvil)
   - Mejorar rendimiento y experiencia

6. **Sexto**: Fases 10-12 (Testing, documentación, verificación)
   - Asegurar calidad y completitud

### Testing Comprehensivo

Todas las tareas de testing son requeridas para asegurar la calidad del sistema:
- Property-based tests (16 propiedades de correctitud)
- Unit tests para todos los componentes y servicios
- Integration tests para flujos completos
- Performance tests para verificar objetivos de rendimiento
- Tests de responsive para múltiples dispositivos

### Integración con Spec de Frontend

Este sistema se integra con la **tarea 24.2** del spec `frontend-redesign-spectacular`:
- Reemplaza el autocompletado de Google Places API
- Proporciona selección de provincia y municipio
- Proporciona validación de código postal
- Proporciona estimación de entrega

### Consideraciones de Rendimiento

**Objetivos:**
- Archivo JSON < 500KB ✓
- Carga del archivo < 100ms ✓
- Filtrado de municipios < 50ms ✓
- Búsqueda con debounce < 100ms ✓

### Consideraciones de Accesibilidad

- Todos los dropdowns deben ser navegables por teclado
- Agregar labels apropiados (aria-label)
- Implementar aria-describedby para errores
- Asegurar contraste de colores en indicadores de validación

### Actualización de Datos

Para actualizar los datos en el futuro:
1. Descargar nuevo dataset de códigos postales
2. Reemplazar `data/spain-postal-codes.csv`
3. Ejecutar `npm run generate-locations`
4. Verificar que tests pasan
5. Hacer commit del nuevo `spain-locations.json`
