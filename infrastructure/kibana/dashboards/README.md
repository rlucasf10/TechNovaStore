# Dashboards de Kibana - TechNovaStore

Este directorio contiene dashboards pre-configurados para Kibana que permiten visualizar los logs de los diferentes servicios de TechNovaStore.

## Dashboards Disponibles

### Campaign Manager Service - Logs Dashboard

**Archivo:** `campaigns-dashboard.ndjson`

Dashboard para visualizar y analizar los logs del Campaign Manager Service.

#### Paneles Incluidos

1. **Logs por Nivel** - Gráfico de dona mostrando la distribución de logs por nivel (DEBUG, INFO, WARN, ERROR)
2. **Operaciones de Campaña** - Gráfico de pastel con las operaciones más frecuentes
3. **Logs en el Tiempo** - Gráfico de barras apiladas mostrando la evolución temporal de logs por nivel
4. **Campañas Más Activas** - Tabla con las campañas que generan más eventos
5. **Productos Afectados por Operación** - Gráfico de barras horizontales
6. **Ejecuciones de Cron** - Métrica con el total de ejecuciones de cron jobs
7. **Errores de Integración** - Métrica con el total de errores de integración
8. **Errores de Validación** - Métrica con el total de errores de validación
9. **Logs Recientes de Campañas** - Tabla con los logs más recientes

#### Filtros Disponibles

- **Por Nivel**: DEBUG, INFO, WARN, ERROR
- **Por Operación**: campaign_created, campaign_updated, campaign_deleted, campaign_activated, campaign_deactivated, discounts_applied, discounts_removed, cron_execution, etc.
- **Por Campaña**: Filtrar por nombre de campaña específica
- **Por Evento**: campaign_lifecycle, discount_operation, cron_job, analytics, validation, integration

## Cómo Importar los Dashboards

### Método 1: Interfaz de Kibana

1. Acceder a Kibana en `http://localhost:5601`
2. Ir a **Stack Management** > **Saved Objects**
3. Hacer clic en **Import**
4. Seleccionar el archivo `.ndjson` del dashboard deseado
5. Hacer clic en **Import**

### Método 2: API de Kibana

```bash
# Importar el dashboard de Campaign Manager
curl -X POST "http://localhost:5601/api/saved_objects/_import" \
  -H "kbn-xsrf: true" \
  --form file=@infrastructure/kibana/dashboards/campaigns-dashboard.ndjson
```

### Método 3: Script de Inicialización

Ejecutar el script de inicialización que importa todos los dashboards:

```bash
./infrastructure/kibana/scripts/import-dashboards.sh
```

## Requisitos Previos

1. **Index Pattern**: Debe existir el index pattern `technovastore-logs-*` en Kibana
2. **Datos**: El Campaign Manager Service debe estar enviando logs a Logstash/Elasticsearch
3. **Elasticsearch**: Debe estar corriendo y accesible

## Crear el Index Pattern Manualmente

Si el index pattern no existe:

1. Ir a **Stack Management** > **Index Patterns**
2. Hacer clic en **Create index pattern**
3. Ingresar `technovastore-logs-*` como patrón
4. Seleccionar `@timestamp` como campo de tiempo
5. Hacer clic en **Create index pattern**

## Campos Específicos del Campaign Manager Service

El dashboard utiliza los siguientes campos específicos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `service` | keyword | Nombre del servicio (campaign-manager-service) |
| `level` | keyword | Nivel de log (DEBUG, INFO, WARN, ERROR) |
| `operation` | keyword | Tipo de operación de campaña |
| `event` | keyword | Tipo de evento (campaign_lifecycle, discount_operation, etc.) |
| `campaignId` | keyword | ID de la campaña |
| `campaignName` | keyword | Nombre de la campaña |
| `productsAffected` | integer | Número de productos afectados |
| `totalDiscountAmount` | float | Monto total de descuento |
| `duration` | integer | Duración de la operación en ms |
| `automatic` | boolean | Si la operación fue automática |
| `jobType` | keyword | Tipo de cron job (activation/deactivation) |
| `success` | boolean | Si la operación fue exitosa |

## Alertas Recomendadas

Se recomienda configurar las siguientes alertas en Kibana:

1. **Errores Críticos**: Cuando `level: ERROR` y `service: campaign-manager-service`
2. **Fallos de Cron**: Cuando `event: cron_job` y `success: false`
3. **Errores de Integración**: Cuando `event: integration` con alta frecuencia
4. **Campañas No Activadas**: Cuando no hay logs de `operation: campaign_activated` en el período esperado

## Troubleshooting

### No aparecen datos en el dashboard

1. Verificar que el Campaign Manager Service está corriendo
2. Verificar que Logstash está recibiendo logs: `docker logs technovastore-logstash`
3. Verificar que Elasticsearch tiene datos: 
   ```bash
   curl "http://localhost:9200/technovastore-logs-campaign-manager-service-*/_count"
   ```

### El index pattern no existe

Crear el index pattern manualmente siguiendo las instrucciones anteriores.

### Los campos no aparecen correctamente

Refrescar el index pattern en Kibana:
1. Ir a **Stack Management** > **Index Patterns**
2. Seleccionar `technovastore-logs-*`
3. Hacer clic en el botón de refrescar campos
