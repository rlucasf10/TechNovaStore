# Notification Service

El servicio de notificaciones de TechNovaStore maneja el envío automático de emails para diferentes eventos del sistema, incluyendo actualizaciones de estado de envío y alertas de retraso.

## Características

- ✅ Envío automático de emails con templates HTML
- ✅ Notificaciones de estado de envío
- ✅ Sistema de alertas para retrasos
- ✅ Templates personalizables para diferentes tipos de notificación
- ✅ Detección automática de retrasos cada 6 horas
- ✅ API REST para integración con otros servicios
- ✅ Soporte para notificaciones en lote

## Tipos de Notificaciones

1. **Confirmación de pedido** - Cuando se confirma un pedido
2. **Actualización de envío** - Cambios en el estado del envío
3. **Alerta de retraso** - Cuando un envío se retrasa
4. **Pedido cancelado** - Cancelación de pedidos
5. **Confirmación de pago** - Confirmación de pagos
6. **Factura generada** - Cuando se genera una factura

## API Endpoints

### Salud del Servicio
```
GET /health
```

### Enviar Notificación General
```
POST /notifications/email
Content-Type: application/json

{
  "type": "order_confirmation",
  "recipient": "customer@example.com",
  "data": {
    "orderId": "ORDER-123",
    "customerName": "Juan Pérez",
    "totalAmount": 299.99
  }
}
```

### Notificación de Estado de Envío
```
POST /notifications/shipment-status
Content-Type: application/json

{
  "orderId": "ORDER-123",
  "status": "shipped",
  "trackingNumber": "TRACK-456",
  "estimatedDelivery": "2024-01-15T00:00:00Z",
  "customerEmail": "customer@example.com"
}
```

### Alerta de Retraso
```
POST /notifications/delay-alert
Content-Type: application/json

{
  "orderId": "ORDER-123",
  "originalDelivery": "2024-01-10T00:00:00Z",
  "newEstimatedDelivery": "2024-01-15T00:00:00Z",
  "customerEmail": "customer@example.com",
  "reason": "Retraso en el proveedor"
}
```

### Verificación Manual de Retrasos (Admin)
```
POST /admin/check-delays
```

## Configuración

### Variables de Entorno

Copia `.env.example` a `.env` y configura las siguientes variables:

```bash
# Configuración del servidor
PORT=3005
NODE_ENV=development

# Configuración SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-de-aplicación

# Configuración de email
EMAIL_FROM=noreply@technovastore.com
```

### Configuración SMTP

Para Gmail:
1. Habilita la autenticación de 2 factores
2. Genera una contraseña de aplicación
3. Usa la contraseña de aplicación en `SMTP_PASS`

## Desarrollo

### Instalación
```bash
npm install
```

### Desarrollo
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Tests
```bash
npm test
```

### Producción
```bash
npm start
```

## Docker

### Build
```bash
docker build -t technovastore/notification-service .
```

### Run
```bash
docker run -p 3005:3005 --env-file .env technovastore/notification-service
```

## Integración con Otros Servicios

### Shipment Tracker
El servicio de seguimiento de envíos debe llamar a este servicio cuando:
- El estado de un envío cambia
- Se detecta un retraso en la entrega

### Order Service
El servicio de pedidos debe notificar cuando:
- Se confirma un pedido
- Se cancela un pedido
- Se genera una factura

### Payment Service
El servicio de pagos debe notificar cuando:
- Se confirma un pago
- Falla un pago

## Detección Automática de Retrasos

El servicio ejecuta automáticamente cada 6 horas una verificación de retrasos que:

1. Consulta pedidos pendientes de entrega
2. Identifica pedidos que superan la fecha estimada de entrega
3. Envía alertas automáticas a los clientes
4. Calcula nuevas fechas estimadas basadas en el tipo de retraso

## Monitoreo

### Health Check
```bash
curl http://localhost:3005/health
```

### Logs
Los logs incluyen información sobre:
- Emails enviados exitosamente
- Errores de envío
- Verificaciones de retraso
- Errores de conexión SMTP

## Requisitos Cumplidos

- ✅ **Requisito 4.2**: Envío de notificaciones por email cuando cambia el estado del envío (dentro de 30 minutos)
- ✅ **Requisito 4.5**: Notificaciones automáticas cuando los envíos se retrasan más allá de la fecha estimada de entrega