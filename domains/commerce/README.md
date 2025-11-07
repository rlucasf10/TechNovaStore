# Dominio: Commerce (Comercio)

## Propósito

Este dominio es responsable de todas las **transacciones comerciales**, incluyendo la gestión de pedidos, procesamiento de pagos y compras automáticas.

## Responsabilidades

- **Gestión de pedidos**: Creación, seguimiento y gestión del ciclo de vida de pedidos
- **Procesamiento de pagos**: Integración con pasarelas de pago y gestión de transacciones
- **Compras automáticas**: Sistema de compras automáticas basado en reglas de negocio

## Servicios Incluidos

- `order-service`: Microservicio para gestión de pedidos
- `payment-service`: Microservicio para procesamiento de pagos
- `auto-purchase-service`: Sistema de compras automáticas

## Casos de Uso Principales

1. Crear un nuevo pedido desde el carrito de compras
2. Procesar pago de un pedido
3. Consultar estado de un pedido
4. Cancelar o modificar un pedido
5. Ejecutar compras automáticas basadas en reglas
6. Gestionar reembolsos y devoluciones

## Dependencias

- **PostgreSQL**: Base de datos transaccional para pedidos y pagos
- **MongoDB**: Base de datos para logs de transacciones
- **Redis**: Cache de carritos y sesiones de pago
- **Pasarelas de Pago**: Stripe, PayPal, MercadoPago, etc.

## Eventos Publicados

- `order.created`: Cuando se crea un nuevo pedido
- `order.confirmed`: Cuando se confirma un pedido
- `order.completed`: Cuando se completa un pedido
- `order.cancelled`: Cuando se cancela un pedido
- `payment.processed`: Cuando se procesa un pago exitosamente
- `payment.failed`: Cuando falla un pago
- `auto-purchase.executed`: Cuando se ejecuta una compra automática

## Eventos Consumidos

- `product.updated`: Para validar disponibilidad antes de crear pedido
- `inventory.updated`: Para verificar stock antes de confirmar pedido
- `user.verified`: Para validar usuario antes de procesar pago
