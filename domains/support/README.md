# Dominio: Support (Soporte)

## Propósito

Este dominio es responsable del **soporte al cliente**, incluyendo gestión de tickets, chatbot conversacional con IA y seguimiento de envíos.

## Responsabilidades

- **Gestión de tickets**: Sistema de tickets de soporte para atención al cliente
- **Chatbot con IA**: Asistente conversacional inteligente para resolver dudas
- **Seguimiento de envíos**: Tracking en tiempo real de envíos y entregas

## Servicios Incluidos

- `ticket-service`: Microservicio para gestión de tickets de soporte
- `chatbot-service`: Chatbot conversacional con Ollama y Phi-3
- `shipment-tracker`: Sistema de seguimiento de envíos

## Casos de Uso Principales

1. Crear un ticket de soporte
2. Responder y gestionar tickets
3. Consultar con el chatbot sobre productos o pedidos
4. Obtener recomendaciones del chatbot
5. Rastrear estado de un envío
6. Recibir actualizaciones de seguimiento de envío
7. Resolver dudas frecuentes automáticamente

## Dependencias

- **MongoDB**: Base de datos para tickets y conversaciones del chatbot
- **PostgreSQL**: Base de datos para seguimiento de envíos
- **Redis**: Cache de conversaciones activas
- **Ollama**: Motor de IA local para el chatbot (Phi-3 Mini)
- **APIs de Transportistas**: FedEx, UPS, DHL, etc.

## Eventos Publicados

- `ticket.created`: Cuando se crea un nuevo ticket
- `ticket.updated`: Cuando se actualiza un ticket
- `ticket.resolved`: Cuando se resuelve un ticket
- `ticket.closed`: Cuando se cierra un ticket
- `shipment.updated`: Cuando se actualiza el estado de un envío
- `shipment.delivered`: Cuando se entrega un envío
- `chatbot.conversation.started`: Cuando inicia una conversación
- `chatbot.conversation.ended`: Cuando termina una conversación

## Eventos Consumidos

- `order.confirmed`: Para iniciar seguimiento de envío
- `order.completed`: Para actualizar estado de envío
- `user.registered`: Para enviar mensaje de bienvenida del chatbot
- `product.updated`: Para actualizar conocimiento del chatbot sobre productos
