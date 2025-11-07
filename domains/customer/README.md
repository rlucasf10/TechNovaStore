# Dominio: Customer (Cliente)

## Propósito

Este dominio es responsable de la **gestión de clientes y comunicaciones**, incluyendo autenticación, perfiles de usuario y sistema de notificaciones.

## Responsabilidades

- **Gestión de usuarios**: Registro, autenticación, autorización y gestión de perfiles
- **Notificaciones**: Envío de notificaciones por email, SMS y push notifications
- **Preferencias de usuario**: Gestión de preferencias y configuración de cuenta

## Servicios Incluidos

- `user-service`: Microservicio para gestión de usuarios y autenticación
- `notification-service`: Microservicio para envío de notificaciones multicanal

## Casos de Uso Principales

1. Registrar un nuevo usuario
2. Autenticar usuario (login)
3. Actualizar perfil de usuario
4. Gestionar direcciones de envío
5. Enviar notificaciones de pedidos
6. Enviar notificaciones de promociones
7. Gestionar preferencias de comunicación

## Dependencias

- **PostgreSQL**: Base de datos principal para usuarios
- **Redis**: Cache de sesiones y tokens JWT
- **Servicios de Email**: SendGrid, AWS SES, etc.
- **Servicios de SMS**: Twilio, etc.
- **Firebase**: Para push notifications

## Eventos Publicados

- `user.registered`: Cuando se registra un nuevo usuario
- `user.verified`: Cuando se verifica un usuario
- `user.updated`: Cuando se actualiza un perfil de usuario
- `user.deleted`: Cuando se elimina un usuario
- `notification.sent`: Cuando se envía una notificación
- `notification.failed`: Cuando falla el envío de una notificación

## Eventos Consumidos

- `order.created`: Para enviar notificación de pedido creado
- `order.confirmed`: Para enviar notificación de pedido confirmado
- `order.completed`: Para enviar notificación de pedido completado
- `payment.processed`: Para enviar notificación de pago exitoso
- `shipment.updated`: Para enviar notificación de estado de envío
