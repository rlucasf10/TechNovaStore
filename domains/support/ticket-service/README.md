# Ticket Service

Sistema de gestión de tickets y escalación automática desde el chatbot para TechNovaStore.

## Características

- **Gestión completa de tickets**: Creación, actualización, resolución y cierre de tickets
- **Escalación automática**: Integración con el chatbot para escalación inteligente
- **Sistema de satisfacción**: Encuestas de satisfacción y métricas de calidad
- **Categorización automática**: Clasificación automática de tickets por contenido
- **Priorización inteligente**: Asignación automática de prioridades
- **Métricas y reportes**: Dashboard de métricas y análisis de satisfacción

## Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Ejecutar migraciones de base de datos
npm run migrate

# Iniciar en modo desarrollo
npm run dev

# Construir para producción
npm run build
npm start
```

## Configuración

### Variables de Entorno

```env
# Servicio
TICKET_SERVICE_PORT=3005
NODE_ENV=development

# Base de datos PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=technovastore
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

# URLs de servicios
FRONTEND_URL=http://localhost:3000
NOTIFICATION_SERVICE_URL=http://localhost:3004

# Seguridad
JWT_SECRET=your-jwt-secret-key
```

## API Endpoints

### Tickets

- `POST /api/tickets` - Crear ticket
- `GET /api/tickets` - Listar tickets (con filtros y paginación)
- `GET /api/tickets/:id` - Obtener ticket por ID
- `GET /api/tickets/number/:number` - Obtener ticket por número
- `PUT /api/tickets/:id` - Actualizar ticket
- `POST /api/tickets/:id/resolve` - Resolver ticket
- `POST /api/tickets/:id/close` - Cerrar ticket

### Mensajes

- `POST /api/tickets/:id/messages` - Añadir mensaje
- `GET /api/tickets/:id/messages` - Obtener mensajes del ticket

### Escalación

- `POST /api/escalate` - Escalar desde chatbot

### Satisfacción

- `POST /api/tickets/:id/satisfaction` - Crear encuesta de satisfacción

### Métricas

- `GET /api/metrics/tickets` - Métricas de tickets
- `GET /api/metrics/satisfaction` - Métricas de satisfacción

## Escalación Automática

El sistema analiza automáticamente las conversaciones del chatbot y decide cuándo escalar:

### Criterios de Escalación

1. **Solicitud explícita**: Cliente pide hablar con humano
2. **Baja confianza**: Chatbot no entiende la consulta
3. **Consultas repetitivas**: Problema no resuelto tras varios intentos
4. **Consultas complejas**: Requieren conocimiento técnico especializado
5. **Indicadores de queja**: Cliente muestra insatisfacción

### Razones de Escalación

- `customer_request`: Solicitud específica del cliente
- `chatbot_limitation`: Limitación del chatbot
- `unresolved_issue`: Problema no resuelto
- `complex_query`: Consulta técnica compleja
- `complaint_escalation`: Escalación de queja

## Categorización Automática

El sistema categoriza automáticamente los tickets basándose en palabras clave:

- **Consulta general** (`general_inquiry`)
- **Pregunta de producto** (`product_question`)
- **Problema de pedido** (`order_issue`)
- **Problema de pago** (`payment_problem`)
- **Consulta de envío** (`shipping_inquiry`)
- **Soporte técnico** (`technical_support`)
- **Queja** (`complaint`)
- **Solicitud de reembolso** (`refund_request`)

## Priorización Automática

Las prioridades se asignan automáticamente:

- **Urgente**: Palabras clave de urgencia o quejas graves
- **Alta**: Quejas, problemas de pago, errores críticos
- **Media**: Problemas de pedidos, reembolsos, soporte técnico
- **Baja**: Consultas generales, preguntas de productos

## Sistema de Satisfacción

### Métricas Incluidas

- Satisfacción general (1-5)
- Satisfacción con tiempo de respuesta (1-5)
- Satisfacción con calidad de resolución (1-5)
- Satisfacción con amabilidad del agente (1-5)
- Net Promoter Score (NPS)
- Análisis de sentimientos en comentarios

### Alertas Automáticas

- Satisfacción baja (< 3.0)
- Tiempos de respuesta insatisfactorios
- NPS negativo
- Tendencias negativas

## Base de Datos

### Tablas Principales

1. **tickets**: Información principal de tickets
2. **ticket_messages**: Mensajes del ticket
3. **satisfaction_surveys**: Encuestas de satisfacción

### Migraciones

Las migraciones se encuentran en `src/database/migrations/`:

1. `001_create_tickets_table.sql`
2. `002_create_ticket_messages_table.sql`
3. `003_create_satisfaction_surveys_table.sql`

## Integración con Chatbot

El chatbot se integra automáticamente con el sistema de tickets:

1. **Análisis de conversación**: Monitorea patrones de escalación
2. **Escalación automática**: Crea tickets cuando es necesario
3. **Historial de conversación**: Incluye contexto en el ticket
4. **Notificación al usuario**: Informa sobre la creación del ticket

## Desarrollo

### Estructura del Proyecto

```
src/
├── controllers/     # Controladores de API
├── services/        # Lógica de negocio
├── database/        # Repositorios y migraciones
├── types/          # Definiciones de tipos
├── config/         # Configuración
├── routes/         # Definición de rutas
└── tests/          # Pruebas unitarias
```

### Pruebas

```bash
# Ejecutar pruebas
npm test

# Ejecutar pruebas con cobertura
npm run test:coverage

# Ejecutar pruebas en modo watch
npm run test:watch
```

## Monitoreo

### Health Check

```bash
curl http://localhost:3005/health
```

### Métricas Disponibles

- Total de tickets
- Tickets abiertos/resueltos
- Tiempo promedio de resolución
- Tasa de escalación desde chatbot
- Satisfacción promedio
- Distribución por categorías y prioridades

## Seguridad

- Validación de entrada en todos los endpoints
- Sanitización de datos
- Manejo seguro de errores
- Logs de auditoría
- Tokens JWT para encuestas de satisfacción

## Contribución

1. Fork el repositorio
2. Crear rama de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request