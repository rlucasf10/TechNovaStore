# Notification Service

Servicio de notificaciones de TechNovaStore que maneja el envío de emails a clientes.

## Estructura (Screaming Architecture)

Este servicio sigue **Screaming Architecture**, donde la estructura refleja los casos de uso del negocio:

```
notification-service/
├── send-order-confirmation/       # Enviar confirmación de pedido
├── send-shipment-status/          # Enviar estado de envío
├── send-delay-alert/              # Enviar alerta de retraso
├── send-payment-confirmation/     # Enviar confirmación de pago
├── send-order-cancellation/       # Enviar cancelación de pedido
├── send-invoice-generated/        # Enviar factura generada
├── check-delivery-delays/         # Verificar retrasos en entregas
├── shared/                        # Infraestructura compartida
│   ├── email/                     # Servicio de email
│   ├── types/                     # Tipos compartidos
│   └── templates/                 # Templates base
├── api/                           # Capa HTTP
│   ├── NotificationController.ts
│   └── routes.ts
├── config/                        # Configuración
└── index.ts                       # Punto de entrada
```

## Casos de Uso

### 1. Enviar Confirmación de Pedido
Envía un email de confirmación cuando un cliente realiza un pedido.

### 2. Enviar Estado de Envío
Notifica al cliente sobre cambios en el estado de su envío.

### 3. Enviar Alerta de Retraso
Informa al cliente sobre retrasos en la entrega.

### 4. Enviar Confirmación de Pago
Confirma que el pago ha sido procesado exitosamente.

### 5. Enviar Cancelación de Pedido
Notifica la cancelación de un pedido.

### 6. Enviar Factura Generada
Envía la factura al cliente cuando está disponible.

### 7. Verificar Retrasos en Entregas
Verifica automáticamente cada 6 horas si hay pedidos retrasados y envía alertas.

## Desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar tests
npm test

# Build para producción
npm run build
```

## Docker

```bash
# Build imagen
docker build -t notification-service .

# Ejecutar contenedor
docker run -p 3000:3000 notification-service
```

## Variables de Entorno

```
PORT=3000
NODE_ENV=development
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@technovastore.com
```

## API

Ver [docs/API.md](docs/API.md) para documentación completa de endpoints.

## Arquitectura

Este servicio implementa **Screaming Architecture**:

- ✅ La estructura "grita" QUÉ HACE el servicio
- ✅ Cada caso de uso está en su propia carpeta
- ✅ Todo lo relacionado con un caso de uso está junto
- ✅ Fácil de encontrar, modificar y eliminar funcionalidad
- ✅ Tests junto al código que prueban

## Agregar Nuevo Caso de Uso

1. Crear carpeta con nombre descriptivo: `send-new-notification/`
2. Crear handler: `SendNewNotification.ts`
3. Crear template si es necesario: `NewNotificationTemplate.ts`
4. Crear tests: `SendNewNotification.test.ts`
5. Registrar en el controlador y rutas
6. Inyectar dependencias en `index.ts`

¡Eso es todo! No necesitas navegar por capas técnicas.
