# Payment Service

Servicio de procesamiento de pagos para TechNovaStore.

## Arquitectura: Screaming Architecture

Este servicio sigue el patrón Screaming Architecture, donde la estructura del proyecto refleja los casos de uso del negocio.

## Estructura

```
payment-service/
├── process-payment/          # Procesar pagos
│   ├── ProcessPayment.ts
│   └── ProcessPayment.test.ts
├── process-refund/           # Procesar reembolsos
│   ├── ProcessRefund.ts
│   └── ProcessRefund.test.ts
├── get-payment-status/       # Obtener estado de pago
│   ├── GetPaymentStatus.ts
│   └── GetPaymentStatus.test.ts
├── verify-payment/           # Verificar pagos
│   ├── VerifyPayment.ts
│   └── VerifyPayment.test.ts
├── shared/                   # Infraestructura compartida
│   ├── clients/              # Clientes HTTP
│   │   └── OrderServiceClient.ts
│   └── utils/                # Utilidades
│       └── logger.ts
├── api/                      # Capa de presentación HTTP
│   ├── PaymentController.ts
│   └── routes.ts
├── config/                   # Configuración
│   └── index.ts
└── index.ts                  # Entry point
```

## Casos de Uso

### 1. Process Payment
Procesa el pago de un pedido utilizando diferentes métodos de pago (tarjeta, PayPal, transferencia bancaria, contra reembolso).

### 2. Process Refund
Procesa reembolsos completos o parciales para pedidos pagados.

### 3. Get Payment Status
Obtiene el estado actual del pago de un pedido.

### 4. Verify Payment
Verifica el estado de una transacción con el proveedor de pagos.

## API Endpoints

- `POST /api/payments/process` - Procesar un pago
- `POST /api/payments/:orderId/refund` - Procesar un reembolso
- `GET /api/payments/:orderId/status` - Obtener estado de pago
- `GET /api/payments/verify/:transactionId` - Verificar un pago

## Comunicación con Order Service

El Payment Service se comunica con el Order Service vía HTTP para:
- Actualizar el estado de pago de los pedidos
- Obtener información de pedidos

## Desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar tests
npm test

# Compilar
npm run build

# Ejecutar en producción
npm start
```

## Variables de Entorno

- `PORT` - Puerto del servicio (default: 3000)
- `NODE_ENV` - Entorno de ejecución
- `ORDER_SERVICE_URL` - URL del Order Service
- `LOG_LEVEL` - Nivel de logging

## Tests

Cada caso de uso tiene tests MUY COMPLETOS que cubren:
- Casos exitosos
- Manejo de errores
- Validación de entrada
- Reglas de negocio
