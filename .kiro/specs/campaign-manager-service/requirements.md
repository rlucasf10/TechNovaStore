# Documento de Requisitos - Campaign Manager Service

## Introducción

Este documento define los requisitos para el Campaign Manager Service, un microservicio que gestiona automáticamente campañas promocionales, aplicando y removiendo descuentos en productos según reglas configuradas y fechas establecidas. El servicio se integra con el Product Service y sincroniza con el frontend para mostrar campañas dinámicas.

## Glosario

- **Campaign Manager Service**: Microservicio responsable de gestionar campañas promocionales
- **Campaign**: Campaña promocional con fechas de inicio/fin y reglas de descuento
- **Discount Rule**: Regla que define cómo aplicar descuentos (porcentaje, fijo, por categoría, etc.)
- **Product Service**: Microservicio existente que gestiona productos
- **Cron Job**: Tarea programada que se ejecuta automáticamente en intervalos definidos
- **Campaign Product**: Producto con descuento aplicado durante una campaña
- **Priority**: Número que determina qué campaña se muestra cuando múltiples están activas
- **Frontend Config**: Configuración JSON que define cómo se muestra la campaña en el frontend
- **Screaming Architecture**: Arquitectura donde los casos de uso son carpetas en la raíz del proyecto

## Requisitos

### Requisito 1: Gestión de Campañas

**User Story:** Como administrador del sistema, quiero crear y gestionar campañas promocionales con fechas y reglas de descuento, para que los descuentos se apliquen automáticamente a los productos.

#### Acceptance Criteria

1. WHEN un administrador crea una campaña, THE Campaign Manager Service SHALL almacenar la campaña con nombre, fechas de inicio/fin, prioridad y reglas de descuento
2. WHEN un administrador actualiza una campaña, THE Campaign Manager Service SHALL validar que las fechas sean coherentes y las reglas sean válidas
3. WHEN un administrador elimina una campaña activa, THE Campaign Manager Service SHALL remover todos los descuentos aplicados antes de eliminar la campaña
4. THE Campaign Manager Service SHALL permitir múltiples campañas activas simultáneamente y aplicar la de mayor prioridad
5. WHEN se consultan las campañas, THE Campaign Manager Service SHALL retornar las campañas ordenadas por prioridad descendente

### Requisito 2: Reglas de Descuento

**User Story:** Como administrador del sistema, quiero definir reglas de descuento flexibles por producto, categoría o globalmente, para que pueda crear campañas personalizadas.

#### Acceptance Criteria

1. THE Campaign Manager Service SHALL soportar descuentos de tipo porcentaje con valor entre 1 y 99
2. THE Campaign Manager Service SHALL soportar descuentos de tipo cantidad fija en euros
3. WHEN se define un descuento por categoría, THE Campaign Manager Service SHALL aplicar ese descuento a todos los productos de esa categoría
4. WHEN se define un descuento específico para un producto, THE Campaign Manager Service SHALL priorizar ese descuento sobre el de categoría o global
5. WHEN se define un descuento global, THE Campaign Manager Service SHALL aplicar ese descuento a todos los productos que no tengan descuento específico o de categoría
6. THE Campaign Manager Service SHALL permitir definir un descuento máximo en euros para descuentos porcentuales
7. THE Campaign Manager Service SHALL validar que las reglas de descuento sean matemáticamente correctas antes de aplicarlas

### Requisito 3: Aplicación Automática de Descuentos

**User Story:** Como administrador del sistema, quiero que los descuentos se apliquen automáticamente cuando una campaña inicia, para que no requiera intervención manual.

#### Acceptance Criteria

1. WHEN una campaña alcanza su fecha de inicio, THE Campaign Manager Service SHALL aplicar automáticamente todos los descuentos definidos en las reglas
2. WHEN se aplica un descuento a un producto, THE Campaign Manager Service SHALL guardar el precio original del producto antes de modificarlo
3. WHEN se aplica un descuento a un producto, THE Campaign Manager Service SHALL calcular el precio con descuento y el porcentaje de descuento
4. WHEN se aplica un descuento a un producto, THE Campaign Manager Service SHALL actualizar los campos campaign_price, discount_percentage, original_price e in_campaign en el Product Service
5. THE Campaign Manager Service SHALL registrar en campaign_products cada producto con descuento aplicado incluyendo precios original y con descuento
6. WHEN se aplican descuentos, THE Campaign Manager Service SHALL procesar los productos en lotes de 100 para evitar sobrecarga de la base de datos
7. IF un producto ya tiene un descuento de otra campaña, THE Campaign Manager Service SHALL aplicar el descuento de la campaña con mayor prioridad

### Requisito 4: Remoción Automática de Descuentos

**User Story:** Como administrador del sistema, quiero que los descuentos se remuevan automáticamente cuando una campaña finaliza, para que los precios vuelvan a su estado original.

#### Acceptance Criteria

1. WHEN una campaña alcanza su fecha de fin, THE Campaign Manager Service SHALL remover automáticamente todos los descuentos aplicados
2. WHEN se remueve un descuento de un producto, THE Campaign Manager Service SHALL restaurar el precio original del producto
3. WHEN se remueve un descuento de un producto, THE Campaign Manager Service SHALL limpiar los campos campaign_price, discount_percentage, original_price e in_campaign en el Product Service
4. THE Campaign Manager Service SHALL eliminar los registros de campaign_products asociados a la campaña finalizada
5. WHEN se remueven descuentos, THE Campaign Manager Service SHALL procesar los productos en lotes de 100 para evitar sobrecarga de la base de datos
6. THE Campaign Manager Service SHALL generar un reporte final con métricas de la campaña antes de remover los descuentos

### Requisito 5: Scheduler Automático (Cron Jobs)

**User Story:** Como administrador del sistema, quiero que el sistema verifique automáticamente cada hora si hay campañas que activar o desactivar, para que no requiera intervención manual.

#### Acceptance Criteria

1. THE Campaign Manager Service SHALL ejecutar un cron job cada hora para verificar campañas pendientes de activación
2. WHEN el cron job detecta una campaña que debe activarse, THE Campaign Manager Service SHALL aplicar los descuentos automáticamente
3. THE Campaign Manager Service SHALL ejecutar un cron job cada hora para verificar campañas pendientes de desactivación
4. WHEN el cron job detecta una campaña que debe desactivarse, THE Campaign Manager Service SHALL remover los descuentos automáticamente
5. THE Campaign Manager Service SHALL registrar en logs cada activación y desactivación automática de campañas
6. THE Campaign Manager Service SHALL enviar notificaciones al equipo cuando una campaña se active o desactive automáticamente
7. IF el cron job falla al aplicar o remover descuentos, THE Campaign Manager Service SHALL reintentar la operación hasta 3 veces antes de notificar el error

### Requisito 6: Integración con Product Service

**User Story:** Como desarrollador del sistema, quiero que el Campaign Manager Service se integre correctamente con el Product Service, para que los descuentos se reflejen en los productos.

#### Acceptance Criteria

1. THE Campaign Manager Service SHALL comunicarse con el Product Service mediante llamadas HTTP REST
2. WHEN se aplica un descuento, THE Campaign Manager Service SHALL actualizar el producto en el Product Service con los campos de campaña
3. WHEN se remueve un descuento, THE Campaign Manager Service SHALL actualizar el producto en el Product Service removiendo los campos de campaña
4. THE Campaign Manager Service SHALL obtener la lista de productos del Product Service filtrando por categoría cuando sea necesario
5. IF el Product Service no está disponible, THE Campaign Manager Service SHALL reintentar la operación con backoff exponencial
6. THE Campaign Manager Service SHALL validar que el producto existe en el Product Service antes de aplicar descuentos

### Requisito 7: API REST para Gestión

**User Story:** Como administrador del sistema, quiero una API REST para gestionar campañas, para que pueda crear, actualizar y consultar campañas desde el frontend.

#### Acceptance Criteria

1. THE Campaign Manager Service SHALL exponer un endpoint POST /api/campaigns para crear campañas
2. THE Campaign Manager Service SHALL exponer un endpoint GET /api/campaigns para listar todas las campañas
3. THE Campaign Manager Service SHALL exponer un endpoint GET /api/campaigns/:id para obtener una campaña específica
4. THE Campaign Manager Service SHALL exponer un endpoint PUT /api/campaigns/:id para actualizar una campaña
5. THE Campaign Manager Service SHALL exponer un endpoint DELETE /api/campaigns/:id para eliminar una campaña
6. THE Campaign Manager Service SHALL exponer un endpoint GET /api/campaigns/active para obtener la campaña activa de mayor prioridad
7. THE Campaign Manager Service SHALL exponer un endpoint POST /api/campaigns/:id/apply-discounts para aplicar descuentos manualmente
8. THE Campaign Manager Service SHALL exponer un endpoint POST /api/campaigns/:id/remove-discounts para remover descuentos manualmente
9. THE Campaign Manager Service SHALL validar que el usuario tenga rol de administrador para todos los endpoints excepto GET /api/campaigns/active
10. THE Campaign Manager Service SHALL retornar códigos HTTP apropiados: 200 para éxito, 400 para validación, 401 para no autorizado, 404 para no encontrado, 500 para errores del servidor

### Requisito 8: Sincronización con Frontend

**User Story:** Como desarrollador del frontend, quiero que el Campaign Manager Service provea la configuración de frontend de la campaña activa, para que el frontend se actualice automáticamente.

#### Acceptance Criteria

1. WHEN se consulta la campaña activa, THE Campaign Manager Service SHALL incluir el campo frontend_config con la configuración de visualización
2. THE frontend_config SHALL incluir la configuración del banner promocional con mensajes e iconos
3. THE frontend_config SHALL incluir la configuración del hero section con título, subtítulo y CTA
4. THE frontend_config SHALL incluir la configuración de la sección de ofertas con título, subtítulo y badge
5. THE Campaign Manager Service SHALL validar que el frontend_config sea un JSON válido antes de almacenarlo

### Requisito 9: Analytics y Métricas

**User Story:** Como administrador del sistema, quiero ver métricas de rendimiento de cada campaña, para que pueda evaluar su efectividad.

#### Acceptance Criteria

1. THE Campaign Manager Service SHALL registrar el número de productos con descuento aplicado por campaña
2. THE Campaign Manager Service SHALL calcular el descuento promedio aplicado en la campaña
3. THE Campaign Manager Service SHALL registrar el número de unidades vendidas durante la campaña
4. THE Campaign Manager Service SHALL calcular los ingresos generados durante la campaña
5. THE Campaign Manager Service SHALL exponer un endpoint GET /api/campaigns/:id/analytics para obtener las métricas de una campaña
6. WHEN una campaña finaliza, THE Campaign Manager Service SHALL generar un reporte final con todas las métricas

### Requisito 10: Validación y Seguridad

**User Story:** Como administrador del sistema, quiero que el Campaign Manager Service valide todas las entradas y sea seguro, para que no se puedan crear campañas inválidas o maliciosas.

#### Acceptance Criteria

1. THE Campaign Manager Service SHALL validar que la fecha de inicio sea anterior a la fecha de fin
2. THE Campaign Manager Service SHALL validar que las fechas no sean en el pasado al crear una campaña
3. THE Campaign Manager Service SHALL validar que el nombre de la campaña sea único
4. THE Campaign Manager Service SHALL validar que la prioridad sea un número entero positivo
5. THE Campaign Manager Service SHALL validar que los porcentajes de descuento estén entre 1 y 99
6. THE Campaign Manager Service SHALL validar que los descuentos fijos sean números positivos
7. THE Campaign Manager Service SHALL sanitizar todos los inputs para prevenir inyección SQL y XSS
8. THE Campaign Manager Service SHALL requerir autenticación JWT para todos los endpoints administrativos
9. THE Campaign Manager Service SHALL registrar en logs todas las operaciones administrativas con el usuario que las realizó
10. THE Campaign Manager Service SHALL implementar rate limiting de 100 requests por minuto por IP

### Requisito 11: Base de Datos y Persistencia

**User Story:** Como desarrollador del sistema, quiero que el Campaign Manager Service use PostgreSQL para almacenar campañas, para que los datos sean consistentes y relacionales.

#### Acceptance Criteria

1. THE Campaign Manager Service SHALL usar PostgreSQL como base de datos principal
2. THE Campaign Manager Service SHALL crear la tabla campaigns con campos: id, name, slug, start_date, end_date, priority, is_active, discount_rules, frontend_config, created_at, updated_at
3. THE Campaign Manager Service SHALL crear la tabla campaign_products con campos: id, campaign_id, product_id, original_price, campaign_price, discount_percentage, discount_amount, applied_at
4. THE Campaign Manager Service SHALL crear la tabla campaign_analytics con campos: id, campaign_id, date, views, clicks, conversions, revenue
5. THE Campaign Manager Service SHALL usar transacciones de base de datos al aplicar o remover descuentos para garantizar consistencia
6. THE Campaign Manager Service SHALL crear índices en las columnas más consultadas: start_date, end_date, is_active, priority
7. THE Campaign Manager Service SHALL implementar migraciones de base de datos versionadas

### Requisito 12: Logging y Monitoreo

**User Story:** Como administrador del sistema, quiero que el Campaign Manager Service registre logs detallados, para que pueda diagnosticar problemas y auditar operaciones.

#### Acceptance Criteria

1. THE Campaign Manager Service SHALL registrar en logs cada campaña creada, actualizada o eliminada
2. THE Campaign Manager Service SHALL registrar en logs cada aplicación y remoción de descuentos con el número de productos afectados
3. THE Campaign Manager Service SHALL registrar en logs cada ejecución del cron job con el resultado
4. THE Campaign Manager Service SHALL registrar en logs todos los errores con stack trace completo
5. THE Campaign Manager Service SHALL exponer métricas de Prometheus en el endpoint /metrics
6. THE Campaign Manager Service SHALL exponer un health check en el endpoint /health que verifique la conexión a PostgreSQL y Product Service
7. THE Campaign Manager Service SHALL usar niveles de log apropiados: DEBUG para detalles, INFO para operaciones normales, WARN para advertencias, ERROR para errores

### Requisito 13: Configuración y Deployment

**User Story:** Como DevOps, quiero que el Campaign Manager Service sea fácil de configurar y desplegar, para que pueda integrarse con el resto del sistema.

#### Acceptance Criteria

1. THE Campaign Manager Service SHALL leer la configuración desde variables de entorno
2. THE Campaign Manager Service SHALL requerir las variables: DATABASE_URL, PRODUCT_SERVICE_URL, JWT_SECRET, PORT
3. THE Campaign Manager Service SHALL tener un Dockerfile optimizado con multi-stage build
4. THE Campaign Manager Service SHALL exponerse en el puerto 3011 por defecto
5. THE Campaign Manager Service SHALL incluirse en docker-compose.optimized.yml con dependencias de PostgreSQL
6. THE Campaign Manager Service SHALL tener un script de inicialización que cree las tablas necesarias
7. THE Campaign Manager Service SHALL documentar todas las variables de entorno en un archivo README.md

### Requisito 14: Panel de Administración de Campañas (Frontend)

**User Story:** Como administrador del sistema, quiero un panel visual en el AdminDashboard para gestionar campañas, para que pueda crear y monitorear campañas fácilmente.

#### Acceptance Criteria

1. THE Frontend SHALL agregar una sección "Campañas" en el sidebar del AdminDashboard
2. THE Frontend SHALL mostrar una página de listado de campañas con tabla que incluya: nombre, fechas, estado, prioridad y acciones
3. THE Frontend SHALL permitir filtrar campañas por estado: Todas, Activas, Programadas, Finalizadas
4. THE Frontend SHALL mostrar un formulario de creación de campaña con campos: nombre, fechas, prioridad, reglas de descuento y configuración de frontend
5. THE Frontend SHALL validar que las fechas de inicio sean anteriores a las de fin antes de enviar al backend
6. THE Frontend SHALL mostrar un editor visual para configurar reglas de descuento con opciones: Global, Por Categoría, Por Producto
7. THE Frontend SHALL permitir editar campañas existentes que no hayan iniciado
8. THE Frontend SHALL mostrar un botón de "Activar Ahora" para campañas programadas
9. THE Frontend SHALL mostrar un botón de "Desactivar" para campañas activas con confirmación
10. THE Frontend SHALL mostrar un badge visual del estado de cada campaña: Activa (verde), Programada (azul), Finalizada (gris)

### Requisito 15: Dashboard de Analytics de Campañas (Frontend)

**User Story:** Como administrador del sistema, quiero ver métricas visuales de rendimiento de campañas, para que pueda evaluar su efectividad fácilmente.

#### Acceptance Criteria

1. THE Frontend SHALL mostrar una vista de detalle de campaña con métricas clave en cards: Productos con descuento, Descuento promedio, Unidades vendidas, Ingresos generados
2. THE Frontend SHALL mostrar un gráfico de líneas con ventas diarias durante la campaña
3. THE Frontend SHALL mostrar un gráfico de barras con las categorías más vendidas durante la campaña
4. THE Frontend SHALL mostrar una tabla con los productos más vendidos durante la campaña incluyendo: nombre, unidades vendidas, ingresos
5. THE Frontend SHALL calcular y mostrar la tasa de conversión de la campaña comparada con el promedio
6. THE Frontend SHALL mostrar el ROI (Return on Investment) de la campaña calculado como: (Ingresos - Descuentos) / Descuentos
7. THE Frontend SHALL permitir exportar el reporte de campaña en formato PDF
8. THE Frontend SHALL actualizar las métricas en tiempo real cada 30 segundos para campañas activas
9. THE Frontend SHALL mostrar una comparativa con campañas anteriores del mismo tipo
10. THE Frontend SHALL integrarse con el dashboard de Grafana existente mostrando un link directo a métricas detalladas

### Requisito 16: Integración con Sistema de Monitoreo Existente

**User Story:** Como administrador del sistema, quiero que las métricas de campañas se integren con Prometheus y Grafana, para que pueda monitorear todo desde un solo lugar.

#### Acceptance Criteria

1. THE Campaign Manager Service SHALL exponer métricas de Prometheus en el endpoint /metrics incluyendo: campañas activas, productos con descuento, descuentos aplicados hoy
2. THE Campaign Manager Service SHALL registrar un gauge de Prometheus para el número de campañas activas
3. THE Campaign Manager Service SHALL registrar un counter de Prometheus para el número total de descuentos aplicados
4. THE Campaign Manager Service SHALL registrar un histogram de Prometheus para el tiempo de aplicación de descuentos
5. THE Campaign Manager Service SHALL incluir un dashboard de Grafana pre-configurado en infrastructure/grafana/provisioning/dashboards/campaigns.json
6. THE Grafana dashboard SHALL mostrar gráficos de: Campañas activas, Productos con descuento, Descuentos aplicados por hora, Tiempo de procesamiento
7. THE Grafana dashboard SHALL mostrar alertas cuando una campaña falla al activarse o desactivarse
8. THE Campaign Manager Service SHALL integrarse con Alertmanager para enviar notificaciones cuando el cron job falla
9. THE Campaign Manager Service SHALL registrar logs estructurados en formato JSON para integración con ELK stack existente
10. THE Campaign Manager Service SHALL incluir un dashboard de Kibana pre-configurado para visualizar logs de campañas
