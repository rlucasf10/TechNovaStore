# Documento de Requisitos

## Introducción

Este documento define los requisitos para actualizar el chatbot de TechNovaStore desde un sistema basado en palabras clave con spaCy a un chatbot conversacional de IA impulsado por Ollama con Phi-3 Mini. El nuevo chatbot entenderá lenguaje natural como ChatGPT/Gemini mientras está especializado en operaciones de e-commerce, ejecutándose localmente sin costos de API externa, y optimizado para sistemas con recursos limitados (8GB RAM).

## Glosario

- **Ollama**: Runtime local de LLM que permite ejecutar modelos de lenguaje grandes en infraestructura local
- **Phi-3 Mini**: Modelo de lenguaje ligero de Microsoft (2-3GB RAM) optimizado para IA conversacional
- **ChatbotService**: El servicio Express.js que maneja solicitudes de chat HTTP/WebSocket
- **NLPEngine**: El componente de procesamiento de lenguaje natural que interpreta mensajes de usuario
- **ConversationContext**: Datos históricos de conversación usados para mantener contexto entre mensajes
- **Especialización E-commerce**: Conocimiento específico del dominio sobre productos, pedidos, envíos y soporte al cliente
- **System Prompt**: Instrucciones que definen la personalidad, dominio de conocimiento y comportamiento del chatbot
- **Streaming Response**: Generación de respuesta en tiempo real token por token para mejor UX
- **Mecanismo de Fallback**: Sistema de respaldo cuando Ollama no está disponible

## Requisitos

### Requisito 1

**Historia de Usuario:** Como cliente, quiero interactuar con el chatbot usando lenguaje conversacional natural (como "buscar ordenador portátil" o "necesito una laptop para gaming"), para poder encontrar productos sin usar palabras clave específicas.

#### Criterios de Aceptación

1. CUANDO un cliente envía una consulta en lenguaje natural sobre productos, EL ChatbotService DEBERÁ reenviar el mensaje al NLPEngine impulsado por Ollama con el contexto de conversación
2. CUANDO el NLPEngine recibe una consulta de búsqueda de productos, EL NLPEngine DEBERÁ generar una respuesta que incluya información relevante de productos desde el ProductKnowledgeBase
3. CUANDO el cliente usa lenguaje coloquial o sinónimos (ej. "portátil" vs "laptop" vs "ordenador portátil"), EL NLPEngine DEBERÁ entender la intención y devolver resultados apropiados
4. CUANDO se genera la respuesta, EL ChatbotService DEBERÁ devolver el mensaje con datos de productos en el formato ChatResponse existente
5. EL NLPEngine DEBERÁ mantener el contexto de conversación a través de múltiples mensajes para entender preguntas de seguimiento

### Requisito 2

**Historia de Usuario:** Como administrador del sistema, quiero que el chatbot se ejecute localmente usando Ollama con Phi-3 Mini, para evitar costos de API externa mientras trabajo dentro de la restricción de 8GB RAM de mi sistema.

#### Criterios de Aceptación

1. EL ChatbotService DEBERÁ integrarse con Ollama ejecutándose como contenedor Docker en el stack de docker-compose
2. EL contenedor Ollama DEBERÁ estar configurado para usar el modelo Phi-3 Mini (phi3:mini)
3. CUANDO el servicio Ollama inicia, EL contenedor Ollama DEBERÁ automáticamente descargar y cargar el modelo Phi-3 Mini
4. EL contenedor Ollama DEBERÁ exponer un endpoint HTTP API para completaciones de chat
5. EL NLPEngine DEBERÁ comunicarse con Ollama vía solicitudes HTTP al endpoint local
6. EL contenedor Ollama DEBERÁ estar configurado con límites de memoria apropiados para sistemas de 8GB RAM (máximo 3GB de asignación)

### Requisito 3

**Historia de Usuario:** Como cliente, quiero que el chatbot esté especializado en las operaciones de e-commerce de TechNovaStore, para que proporcione información precisa sobre productos, pedidos, envíos y soporte.

#### Criterios de Aceptación

1. EL NLPEngine DEBERÁ usar un system prompt que defina al chatbot como especialista en e-commerce de TechNovaStore
2. EL system prompt DEBERÁ incluir instrucciones para manejar búsquedas de productos, consultas de pedidos, preguntas de envío y solicitudes de soporte
3. CUANDO un cliente pregunta sobre productos, EL NLPEngine DEBERÁ consultar el ProductKnowledgeBase e incluir resultados en el contexto del LLM
4. CUANDO un cliente pregunta sobre pedidos, EL NLPEngine DEBERÁ proporcionar instrucciones para rastreo de pedidos e incluir información relevante del estado del pedido
5. EL system prompt DEBERÁ instruir al LLM para responder en español y mantener un tono amigable y servicial
6. EL system prompt DEBERÁ prevenir que el LLM responda preguntas fuera del dominio de e-commerce

### Requisito 4

**Historia de Usuario:** Como cliente, quiero recibir respuestas en tiempo real mientras se generan, para tener una experiencia conversacional fluida similar a ChatGPT.

#### Criterios de Aceptación

1. CUANDO un cliente envía un mensaje vía WebSocket, EL ChatbotService DEBERÁ solicitar una respuesta en streaming desde Ollama
2. CUANDO Ollama genera tokens de respuesta, EL ChatbotService DEBERÁ emitir cada fragmento de token al cliente vía Socket.IO
3. EL cliente DEBERÁ recibir eventos 'chat_stream_chunk' conteniendo texto de respuesta parcial
4. CUANDO la respuesta está completa, EL ChatbotService DEBERÁ emitir un evento 'chat_stream_end'
5. EL ChatbotService DEBERÁ mantener compatibilidad hacia atrás con solicitudes REST API sin streaming

### Requisito 5

**Historia de Usuario:** Como desarrollador, quiero que el sistema maneje con gracia las fallas del servicio Ollama, para que el chatbot permanezca funcional incluso cuando el servicio LLM no esté disponible.

#### Criterios de Aceptación

1. CUANDO el NLPEngine no puede conectarse a Ollama, EL NLPEngine DEBERÁ recurrir a un sistema de fallback basado en patrones de texto simple (sin dependencias de Python/spaCy)
2. EL sistema de fallback DEBERÁ usar la librería 'natural' de Node.js para tokenización y extracción básica de keywords
3. CUANDO se usa el sistema de fallback, EL ChatbotService DEBERÁ registrar una advertencia indicando funcionalidad degradada
4. EL NLPEngine DEBERÁ implementar un mecanismo de health check para detectar disponibilidad de Ollama
5. CUANDO Ollama vuelve a estar disponible, EL NLPEngine DEBERÁ automáticamente reanudar el uso del procesamiento basado en LLM
6. EL endpoint de health del ChatbotService DEBERÁ reportar el estado de la integración con Ollama

### Requisito 6

**Historia de Usuario:** Como cliente, quiero que el chatbot recuerde el contexto de nuestra conversación, para poder hacer preguntas de seguimiento sin repetir información.

#### Criterios de Aceptación

1. EL ChatbotService DEBERÁ mantener un ConversationContext para cada sesión conteniendo los últimos 10 intercambios de mensajes
2. CUANDO se procesa un nuevo mensaje, EL NLPEngine DEBERÁ incluir el ConversationContext en la solicitud a Ollama
3. CUANDO el contexto de conversación excede 10 intercambios, EL ChatbotService DEBERÁ eliminar los mensajes más antiguos para prevenir problemas de límite de tokens
4. EL ConversationContext DEBERÁ incluir tanto mensajes de usuario como respuestas del asistente
5. EL NLPEngine DEBERÁ formatear el contexto como un array de historial de mensajes para la API de chat completion de Ollama

### Requisito 7

**Historia de Usuario:** Como administrador del sistema, quiero configurar la integración con Ollama a través de variables de entorno, para poder ajustar configuraciones sin modificar código.

#### Criterios de Aceptación

1. EL ChatbotService DEBERÁ leer la configuración de Ollama desde variables de entorno (OLLAMA_HOST, OLLAMA_MODEL, OLLAMA_TIMEOUT)
2. EL host Ollama por defecto DEBERÁ ser 'http://ollama:11434' para entornos Docker
3. EL modelo por defecto DEBERÁ ser 'phi3:mini' (Phi-3 Mini)
4. EL timeout por defecto DEBERÁ ser 30 segundos para solicitudes LLM
5. EL archivo .env.example DEBERÁ documentar todas las opciones de configuración relacionadas con Ollama

### Requisito 8

**Historia de Usuario:** Como desarrollador, quiero monitorear el rendimiento y uso de la integración con Ollama, para poder optimizar el uso de recursos y solucionar problemas.

#### Criterios de Aceptación

1. EL ChatbotService DEBERÁ registrar cada solicitud a Ollama con timestamp, ID de sesión y tiempo de respuesta
2. EL ChatbotService DEBERÁ rastrear métricas incluyendo total de solicitudes, tiempo promedio de respuesta y tasa de error
3. EL endpoint /api/chat/stats DEBERÁ devolver estadísticas de integración con Ollama
4. CUANDO una solicitud a Ollama falla, EL ChatbotService DEBERÁ registrar los detalles del error incluyendo tipo de error y mensaje
5. EL ChatbotService DEBERÁ exponer un endpoint /api/chat/ollama/health para verificar el estado del servicio Ollama

### Requisito 9

**Historia de Usuario:** Como administrador del sistema, quiero que el chatbot implemente RAG (Retrieval Augmented Generation) para inyectar conocimiento de productos dinámicamente, para que el LLM pueda responder con información precisa del catálogo sin inventar datos.

#### Criterios de Aceptación

1. CUANDO un cliente pregunta sobre productos, EL NLPEngine DEBERÁ consultar el ProductKnowledgeBase y recuperar información relevante
2. EL NLPEngine DEBERÁ formatear los datos de productos recuperados como contexto estructurado para incluir en el prompt de Ollama
3. EL system prompt DEBERÁ instruir explícitamente al LLM para usar SOLO la información proporcionada en el contexto y NUNCA inventar nombres, precios o especificaciones
4. CUANDO no hay información disponible sobre un producto específico, EL LLM DEBERÁ indicar al cliente que consulte la página del producto o contacte soporte
5. EL contexto de productos DEBERÁ incluir: nombre, SKU, precio, disponibilidad, especificaciones técnicas y descripciones

### Requisito 10

**Historia de Usuario:** Como cliente, quiero que el chatbot maneje consultas técnicas específicas del nicho de tecnología (compatibilidad, especificaciones, comparaciones), para obtener respuestas precisas sobre productos tecnológicos.

#### Criterios de Aceptación

1. EL system prompt DEBERÁ incluir instrucciones específicas para manejar consultas técnicas de hardware y software
2. CUANDO un cliente pregunta sobre compatibilidad (ej. "¿Es compatible esta placa base con Ryzen 5 5600X?"), EL NLPEngine DEBERÁ recuperar especificaciones técnicas relevantes del ProductKnowledgeBase
3. EL NLPEngine DEBERÁ priorizar la recuperación de especificaciones técnicas exactas sobre descripciones generales
4. CUANDO el cliente solicita comparaciones técnicas, EL NLPEngine DEBERÁ recuperar múltiples productos y presentar sus especificaciones lado a lado
5. EL LLM DEBERÁ responder con terminología técnica apropiada para el nicho de tecnología e informática

### Requisito 11

**Historia de Usuario:** Como administrador del sistema, quiero que el sistema gestione expectativas realistas sobre la latencia de respuesta, para que los usuarios tengan una experiencia fluida incluso con tiempos de procesamiento de 1-3 segundos.

#### Criterios de Aceptación

1. CUANDO un cliente envía un mensaje, EL ChatbotService DEBERÁ emitir inmediatamente un indicador visual de "escribiendo" (typing indicator)
2. CUANDO se usa streaming, EL primer chunk de respuesta DEBERÁ aparecer en menos de 2 segundos
3. EL ChatbotService DEBERÁ implementar un timeout de 30 segundos para solicitudes a Ollama
4. CUANDO una solicitud excede 30 segundos, EL sistema DEBERÁ automáticamente usar el fallback
5. EL frontend DEBERÁ mostrar indicadores de progreso durante el procesamiento de mensajes
