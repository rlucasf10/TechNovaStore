# Notification Service API

Servicio de notificaciones refactorizado con Screaming Architecture.

## Arquitectura

El servicio está organizado por casos de uso (use cases), donde cada carpeta representa una funcionalidad específica del negocio:

- `send-order-confirmation/` - Enviar confirmación de pedido
- `send-payment-confirmation/` - Enviar confirmación de pago
- `send-shipment-status/` - Enviar estado de envío
- `send-delay-alert/` - Enviar alerta de retraso
- `send-order-cancellation/` - Enviar cancelación de pedido
- `send-invoice-generated/` - Enviar factura generada
- `check-delivery-delays/` - Verificar retrasos en entregas

## Endpoints

### Health Check

```
GET /health
```

Respuesta:
```json
{
  "status": "ok",
  "service": "notification-service"
}
```

### Enviar Confirmación de Pedido

```
POST /api/notifications/order-confirmation
```

Body:
```json
{
  "orderId": "ORD-123",
  "customerEmail": "customer@example.com",
  "orderData": {
    "orderNumber": "ORD-123",
    "customerName": "John Doe",
    "totalAmount": 99.99,
    "items": []
  }
}
```

### Enviar Confirmación de Pago

```
POST /api/notifications/payment-confirmation
```

Body:
```json
{
  "orderId": "ORD-123",
  "customerEmail": "customer@example.com",
  "paymentData": {
    "amount": 99.99,
    "method": "credit_card",
    "transactionId": "TXN-123"
  }
}
```

### Enviar Estado de Envío

```
POST /api/notifications/shipment-status
```

Body:
```json
{
  "orderId": "ORD-123",
  "status": "shipped",
  "trackingNumber": "TRACK-123",
  "estimatedDelivery": "2024-12-31",
  "customerEmail": "customer@example.com"
}
```

### Enviar Alerta de Retraso

```
POST /api/notifications/delay-alert
```

Body:
```json
{
  "orderId": "ORD-123",
  "originalDelivery": "2024-12-25",
  "newEstimatedDelivery": "2024-12-28",
  "customerEmail": "customer@example.com",
  "reason": "Weather conditions"
}
```

### Enviar Cancelación de Pedido

```
POST /api/notifications/order-cancellation
```

Body:
```json
{
  "orderId": "ORD-123",
  "customerEmail": "customer@example.com",
  "reason": "Customer request"
}
```

### Enviar Factura Generada

```
POST /api/notifications/invoice-generated
```

Body:
```json
{
  "orderId": "ORD-123",
  "customerEmail": "customer@example.com",
  "invoiceData": {
    "invoiceNumber": "INV-123",
    "totalAmount": 99.99,
    "pdfUrl": "https://example.com/invoices/INV-123.pdf"
  }
}
```

### Verificar Retrasos en Entregas

```
POST /api/notifications/check-delays
```

Body:
```json
{
  "orders": [
    {
      "orderId": "ORD-123",
      "customerEmail": "customer@example.com",
      "estimatedDelivery": "2024-12-20",
      "currentStatus": "in_transit"
    }
  ]
}
```

## Endpoints Legacy (Compatibilidad)

Los siguientes endpoints mantienen compatibilidad con el código existente:

- `POST /notifications/email` - Enviar notificación genérica
- `POST /notifications/shipment-status` - Enviar estado de envío (legacy)
- `POST /notifications/delay-alert` - Enviar alerta de retraso (legacy)
- `POST /admin/check-delays` - Verificar retrasos manualmente

## Scheduler

El servicio incluye un scheduler que verifica automáticamente retrasos en entregas cada 6 horas.

## Configuración

Variables de entorno requeridas:

```env
PORT=3005
NODE_ENV=development

# Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=notifications@technovastore.com
SMTP_PASS=your_password
EMAIL_FROM=TechNovaStore <notifications@technovastore.com>
```

## Testing

```bash
# Ejecutar tests
npm test

# Ejecutar tests con cobertura
npm run test:coverage
```

## Estructura del Proyecto

```
notification-service/
├── send-order-confirmation/
│   ├── SendOrderConfirmation.ts
│   └── SendOrderConfirmation.test.ts
├── send-payment-confirmation/
├── send-shipment-status/
├── send-delay-alert/
├── send-order-cancellation/
├── send-invoice-generated/
├── check-delivery-delays/
├── shared/
│   ├── email/EmailService.ts
│   ├── templates/TemplateService.ts
│   ├── types/index.ts
│   └── utils/DelayDetector.ts
├── api/
│   ├── NotificationController.ts
│   └── routes.ts
├── config/
│   └── index.ts
└── index.ts
```
