# Dataset de Códigos Postales de España

## Fuente de Datos

Este dataset contiene información de códigos postales, provincias y municipios de España.

### Fuentes Oficiales

1. **Instituto Nacional de Estadística (INE)**
   - URL: https://www.ine.es/daco/daco42/codmun/codmunmapa.htm
   - Descripción: Códigos oficiales de municipios y provincias de España
   - Última actualización: 2024

2. **Correos (Sociedad Estatal de Correos y Telégrafos)**
   - Descripción: Códigos postales oficiales de España
   - Cobertura: 8,131 municipios, 50 provincias

3. **Datos Abiertos del Gobierno de España**
   - URL: https://datos.gob.es/
   - Datasets relacionados con códigos postales y divisiones administrativas

## Formato del Archivo

El archivo `spain-postal-codes.csv` contiene las siguientes columnas:

- `postal_code`: Código postal de 5 dígitos (ej: "28001")
- `province_code`: Código de provincia de 2 dígitos (ej: "28")
- `municipality_code`: Código INE del municipio (ej: "28079")
- `municipality_name`: Nombre del municipio (ej: "Madrid")

## Estadísticas

- **Total de municipios**: 8,082 municipios únicos
- **Total de provincias**: 50 provincias
- **Total de códigos postales**: 301 códigos postales únicos
- **Total de registros**: 8,158 registros (incluyendo municipios con múltiples códigos postales)

## Actualización de Datos

Para actualizar este dataset:

1. Descargar los datos más recientes del INE
2. Ejecutar el script de generación: `npm run generate-postal-codes`
3. Validar el dataset generado: `npm run validate-postal-codes`
4. Verificar que los tests pasan
5. Hacer commit del archivo actualizado

## Comandos Disponibles

```bash
# Generar el dataset de códigos postales
npm run generate-postal-codes

# Validar el dataset generado
npm run validate-postal-codes
```

## Notas

- Los códigos postales pueden cambiar con el tiempo
- Algunos municipios grandes tienen múltiples códigos postales
- Los códigos INE son oficiales y estables
