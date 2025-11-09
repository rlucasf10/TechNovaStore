# TechNovaStore Chatbot Service

Motor de procesamiento de lenguaje natural para el chatbot de TechNovaStore, especializado en atención al cliente para productos tecnológicos en español.

## Características

- **Procesamiento NLP en Español**: Integración con spaCy para análisis avanzado de texto
- **Reconocimiento de Intenciones**: Sistema inteligente para identificar intenciones del usuario
- **Base de Conocimientos**: Acceso directo a la base de datos de productos
- **API REST y WebSocket**: Soporte para comunicación síncrona y en tiempo real
- **Recomendaciones Personalizadas**: Sistema de recomendaciones basado en preferencias del usuario

## Requisitos del Sistema

- Node.js 18+
- Python 3.8+
- MongoDB (para base de conocimientos de productos)
- spaCy con modelo en español

## Instalación

### 1. Instalar dependencias de Node.js

```bash
npm install
```

### 2. Instalar spaCy y modelo en español

```bash
# Instalar spaCy
pip install spacy

# Descargar modelo en español
python -m spacy download es_core_news_sm
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con la configuración apropiada:

```env
CHATBOT_PORT=3001
MONGODB_URI=mongodb://localhost:27017/technovastore
FRONTEND_URL=http://localhost:3000
```

### 4. Compilar TypeScript

```bash
npm run build
```

## Uso

### Desarrollo

```bash
npm run dev
```

### Producción

```bash
npm start
```

### Testing

```bash
npm test
```

## API Endpoints

### REST API

#### POST /api/chat
Procesar mensaje de chat

```json
{
  "message": "Hola, busco un laptop gaming",
  "sessionId": "session-123",
  "userId": "user-456"
}
```

Respuesta:
```json
{
  "message": "He encontrado varios laptops gaming que podrían interesarte:",
  "intent": {
    "name": "product_search",
    "confidence": 0.85,
    "entities": {
      "PRODUCT_TYPE": "laptop"
    }
  },
  "products": [...],
  "suggestedActions": ["Ver más productos", "Filtrar por precio"],
  "confidence": 0.85
}
```

#### GET /health
Verificar estado del servicio

### WebSocket Events

#### Eventos del Cliente

- `chat_message`: Enviar mensaje de chat
- `typing_start`: Indicar que el usuario está escribiendo
- `typing_stop`: Indicar que el usuario dejó de escribir
- `join_session`: Unirse a una sesión de chat

#### Eventos del Servidor

- `chat_response`: Respuesta del chatbot
- `user_typing`: Notificación de usuario escribiendo
- `error`: Error en el procesamiento

## Arquitectura

### Componentes Principales

1. **NLPProcessor**: Wrapper para spaCy, procesa texto en español
2. **IntentRecognizer**: Reconoce intenciones basado en patrones y keywords
3. **ProductKnowledgeBase**: Acceso a base de datos de productos
4. **NLPEngine**: Motor principal que coordina todos los componentes
5. **ChatbotService**: Servicio web con API REST y WebSocket

### Flujo de Procesamiento

```
Entrada del Usuario
       ↓
NLP Processor (spaCy)
       ↓
Intent Recognizer
       ↓
Product Knowledge Base
       ↓
Response Generator
       ↓
Respuesta al Usuario
```

## Intenciones Soportadas

- `greeting`: Saludos
- `product_search`: Búsqueda de productos
- `product_info`: Información de productos
- `price_comparison`: Comparación de precios
- `product_recommendation`: Recomendaciones
- `order_status`: Estado de pedidos
- `shipping_info`: Información de envío
- `payment_info`: Métodos de pago
- `support_request`: Solicitudes de soporte
- `goodbye`: Despedidas

## Entidades Reconocidas

- `PRODUCT_TYPE`: Tipo de producto (laptop, móvil, etc.)
- `BRAND`: Marca del producto
- `PRICE_RANGE`: Rango de precios
- `ORDER_NUMBER`: Número de pedido
- `DATE`: Fechas
- `PERSON`: Nombres de personas
- `PAYMENT_METHOD`: Métodos de pago

## Docker

### Construcción

```bash
docker build -t technovastore-chatbot .
```

### Ejecución

```bash
docker run -p 3001:3001 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/technovastore \
  technovastore-chatbot
```

## Desarrollo

### Estructura del Proyecto

```
src/
├── nlp/
│   ├── NLPProcessor.ts      # Wrapper para spaCy
│   └── spacyProcessor.py    # Script Python para spaCy
├── intent/
│   └── IntentRecognizer.ts  # Reconocimiento de intenciones
├── knowledge/
│   └── ProductKnowledgeBase.ts # Base de conocimientos
├── tests/
│   ├── setup.ts            # Configuración de tests
│   └── NLPEngine.test.ts   # Tests del motor NLP
├── NLPEngine.ts            # Motor principal
├── ChatbotService.ts       # Servicio web
└── index.ts               # Punto de entrada
```

### Agregar Nuevas Intenciones

1. Editar `IntentRecognizer.ts` y agregar patrones en `loadIntentPatterns()`
2. Implementar manejo en `NLPEngine.ts` en el método `generateResponse()`
3. Agregar tests correspondientes

### Personalizar Respuestas

Las respuestas se generan en `NLPEngine.ts`. Cada intención tiene su propio método de manejo que puede ser personalizado según las necesidades del negocio.

## Monitoreo

El servicio expone métricas básicas en:

- `/health`: Estado del servicio
- `/api/chat/session/:sessionId`: Información de sesión
- `/api/chat/intents`: Lista de intenciones disponibles

## Troubleshooting

### Error: spaCy model not found

```bash
python -m spacy download es_core_news_sm
```

### Error: MongoDB connection failed

Verificar que MongoDB esté ejecutándose y la URI sea correcta en `.env`.

### Error: Python not found

Asegurar que Python 3.8+ esté instalado y disponible en el PATH.

## Contribución

1. Fork del repositorio
2. Crear rama de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## Licencia

Este proyecto es parte de TechNovaStore y está bajo licencia MIT.