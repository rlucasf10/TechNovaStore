# Plan de Implementación

- [x] 1. Configurar infraestructura Ollama en Docker
  - Agregar servicio Ollama al docker-compose.yml con límites de memoria (3GB)
  - Crear volumen `ollama_data` en docker-compose.yml
  - Configurar healthcheck para el servicio Ollama
  - Crear carpeta `infrastructure/ollama/` si no existe
  - Crear script `infrastructure/ollama/init-ollama.sh` para descargar modelo Phi-3 Mini
  - Hacer script ejecutable: `chmod +x infrastructure/ollama/init-ollama.sh`
  - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.6_

- [x] 2. Crear OllamaAdapter para comunicación con Ollama
  - [x] 2.1 Implementar clase OllamaAdapter con interfaces TypeScript
    - Crear carpeta `ai-services/chatbot/src/adapters/` si no existe
    - Crear archivo `ai-services/chatbot/src/adapters/OllamaAdapter.ts`
    - Definir interfaces: OllamaConfig, OllamaMessage, OllamaRequest, OllamaResponse
    - Implementar constructor con configuración desde variables de entorno
    - _Requisitos: 2.5, 7.1, 7.2, 7.3, 7.4_

  - [x] 2.2 Implementar método generateResponse (sin streaming)
    - Crear método para enviar request HTTP POST a Ollama
    - Implementar formateo de mensajes al formato de Ollama
    - Agregar manejo de timeout (30 segundos)
    - Implementar lógica de reintentos (2 intentos con backoff exponencial)
    - _Requisitos: 2.5, 7.4_

  - [x] 2.3 Implementar método generateStreamingResponse
    - Crear método para streaming de respuestas
    - Procesar respuesta NDJSON línea por línea
    - Implementar callback para emitir chunks
    - Manejar evento 'done' para finalizar stream
    - _Requisitos: 4.1, 4.2_

  - [x] 2.4 Implementar health check y verificación de modelo
    - Crear método checkHealth() que consulte endpoint /api/tags
    - Implementar cache de 30 segundos para health checks
    - Crear método isModelLoaded() para verificar modelo phi3:mini
    - _Requisitos: 5.3, 5.4, 8.5_

  - [x] 2.5 Implementar manejo de errores y tipos de error
    - Crear clase OllamaError con códigos de error
    - Implementar manejo de errores de conexión, timeout, modelo no cargado
    - Agregar logging detallado de errores
    - _Requisitos: 5.1, 8.4_

- [x] 3. Implementar system prompt especializado para e-commerce
  - Crear carpeta `ai-services/chatbot/src/prompts/` si no existe
  - Crear archivo `ai-services/chatbot/src/prompts/SystemPrompt.ts` con template de prompt
  - Definir reglas estrictas: no inventar datos, usar solo contexto, responder en español
  - Incluir instrucciones para manejo de consultas técnicas de tecnología
  - Agregar placeholders para {product_context} y {conversation_history}
  - Implementar función para reemplazar placeholders con datos reales
  - _Requisitos: 3.1, 3.2, 3.5, 3.6, 10.1_

- [x] 4. Implementar lógica RAG (Retrieval Augmented Generation)
  - [x] 4.1 Crear función de extracción de keywords del mensaje de usuario
    - Usar NLPProcessor existente o implementar extracción simple con natural
    - Identificar categorías de productos (laptop, móvil, tablet, etc.)
    - Identificar marcas mencionadas
    - Extraer especificaciones técnicas mencionadas
    - _Requisitos: 9.1, 10.2_

  - [x] 4.2 Implementar recuperación de productos desde ProductKnowledgeBase
    - Crear método en NLPEngine para consultar ProductKnowledgeBase
    - Implementar búsqueda por categoría, marca y keywords
    - Limitar resultados a 5 productos máximo
    - Priorizar productos en stock y ordenar por relevancia
    - _Requisitos: 9.1, 9.2, 10.2, 10.3_

  - [x] 4.3 Crear función formatProductContext para formatear productos
    - Implementar formateo estructurado: nombre, SKU, marca, precio, disponibilidad
    - Incluir descripción (máximo 200 caracteres)
    - Incluir especificaciones técnicas clave (máximo 5)
    - Manejar caso de 0 productos encontrados
    - _Requisitos: 9.2, 9.5, 10.3_

  - [x] 4.4 Integrar RAG en flujo de procesamiento de mensajes
    - Modificar NLPEngine.processUserInput para incluir paso RAG
    - Recuperar productos antes de llamar a Ollama
    - Inyectar contexto de productos en system prompt
    - Incluir productos recuperados en ChatResponse
    - _Requisitos: 1.1, 1.2, 9.1, 9.2_

- [x] 5. Implementar gestión de contexto conversacional
  - [x] 5.1 Extender interfaz ChatContext con historial conversacional
    - Agregar campo conversationHistory: ConversationMessage[]
    - Agregar campos lastProductQuery y lastProducts
    - Actualizar tipo ConversationMessage con role, content, timestamp, products
    - _Requisitos: 6.1, 6.4_

  - [x] 5.2 Implementar almacenamiento de historial en sesión
    - Modificar ChatbotService.createSession para inicializar historial vacío
    - Implementar método para agregar mensaje al historial
    - Limitar historial a últimos 10 intercambios (20 mensajes)
    - _Requisitos: 6.1, 6.3_

  - [x] 5.3 Crear función formatConversationHistory para Ollama
    - Convertir ConversationMessage[] a OllamaMessage[]
    - Mapear roles user/assistant correctamente
    - _Requisitos: 6.2, 6.5_

  - [x] 5.4 Implementar gestión de límite de tokens
    - Crear función para estimar tokens (~4 caracteres = 1 token)
    - Implementar lógica para eliminar mensajes antiguos si excede 1000 tokens
    - Reservar 1000 tokens para respuesta del LLM
    - _Requisitos: 6.3_

- [x] 6. Crear SimpleFallbackRecognizer (sin Python/spaCy)
  - [x] 6.1 Crear clase SimpleFallbackRecognizer usando librería 'natural'
    - Crear carpeta `ai-services/chatbot/src/fallback/` si no existe
    - Crear archivo `ai-services/chatbot/src/fallback/SimpleFallbackRecognizer.ts`
    - Importar natural para tokenización
    - Definir interfaz SimpleFallbackIntent
    - Implementar constructor con patrones de intenciones básicas
    - _Requisitos: 5.1, 5.2_

  - [x] 6.2 Implementar reconocimiento de intenciones básico
    - Crear método recognizeIntent que tokeniza texto
    - Implementar matching de keywords contra patrones
    - Calcular confidence basado en matches
    - Retornar intent con mayor confidence
    - _Requisitos: 5.1, 5.2_

  - [x] 6.3 Implementar extracción simple de entidades
    - Detectar categorías de productos (laptop, móvil, tablet, etc.)
    - Detectar marcas comunes (apple, samsung, sony, etc.)
    - Extraer entidades básicas sin NLP complejo
    - _Requisitos: 5.1, 5.2_

  - [x] 6.4 Crear respuestas de fallback simples
    - Implementar método generateFallbackResponse
    - Crear respuestas template para cada intent
    - Incluir mensaje indicando "Modo básico activo"
    - Mantener respuestas concisas y directas
    - _Requisitos: 5.2, 5.3_

- [ ] 7. Modificar NLPEngine para integrar Ollama
  - [x] 7.1 Agregar OllamaAdapter y SimpleFallbackRecognizer como dependencias
    - Importar y crear instancia de OllamaAdapter en constructor
    - Importar y crear instancia de SimpleFallbackRecognizer
    - Leer configuración de variables de entorno
    - Eliminar dependencia de IntentRecognizer antiguo (usa spaCy)
    - _Requisitos: 2.5, 5.1, 5.2, 7.1_

  - [x] 7.2 Implementar método processWithOllama
    - Ejecutar pipeline RAG: extraer keywords → recuperar productos → formatear contexto
    - Construir array de mensajes: system prompt + historial + mensaje usuario
    - Llamar a OllamaAdapter.generateResponse
    - Parsear respuesta y construir ChatResponse
    - Actualizar contexto conversacional
    - _Requisitos: 1.1, 1.2, 1.4, 1.5, 9.1, 9.2_

  - [x] 7.3 Implementar lógica de fallback automático
    - Verificar health de Ollama antes de procesar
    - Usar try-catch para capturar errores de Ollama
    - Llamar a useSimpleFallback si Ollama falla
    - Agregar campo usingFallback en ChatResponse
    - Registrar uso de fallback en logs
    - _Requisitos: 5.1, 5.2, 5.3, 5.4_

  - [x] 7.4 Modificar processUserInput para usar Ollama o fallback
    - Verificar variable de entorno USE_OLLAMA
    - Llamar a processWithOllama si está habilitado y disponible
    - Usar SimpleFallbackRecognizer como fallback
    - Mantener compatibilidad con respuestas actuales
    - _Requisitos: 1.1, 5.1, 5.2, 5.4, 7.1_

- [ ] 8. Implementar streaming de respuestas via Socket.IO
  - [ ] 8.1 Agregar evento chat_message_stream en ChatbotService
    - Crear handler para evento 'chat_message_stream'
    - Emitir evento 'bot_typing' al iniciar procesamiento
    - Validar mensaje y sessionId
    - _Requisitos: 4.1, 11.1_
    - **NOTA**: Implementado pero no verificado - requiere más RAM (16GB recomendado)

  - [ ] 8.2 Implementar método processUserInputStreaming en NLPEngine
    - Crear método que acepta callback para chunks
    - Ejecutar pipeline RAG (sin streaming)
    - Llamar a OllamaAdapter.generateStreamingResponse con callback
    - Emitir chunks via callback proporcionado
    - _Requisitos: 4.1, 4.2, 11.2_
    - **NOTA**: Implementado pero no verificado - Ollama timeout por falta de RAM

  - [ ] 8.3 Emitir eventos de streaming al cliente
    - Emitir 'chat_stream_chunk' por cada chunk recibido
    - Emitir 'chat_stream_end' al finalizar
    - Emitir 'bot_typing' false al terminar
    - Manejar errores con 'chat_stream_error'
    - _Requisitos: 4.2, 4.3, 4.4_
    - **NOTA**: Implementado pero no verificado - requiere sistema con más RAM

  - [ ] 8.4 Mantener compatibilidad con API REST sin streaming
    - Verificar que endpoint POST /api/chat siga funcionando
    - Usar método processUserInput (sin streaming) para REST
    - Retornar respuesta completa en JSON
    - _Requisitos: 4.5_

- [ ] 9. Implementar sistema de monitoreo y métricas
  - [ ] 9.1 Crear clase MetricsCollector
    - Crear carpeta `ai-services/chatbot/src/metrics/` si no existe
    - Crear archivo `ai-services/chatbot/src/metrics/MetricsCollector.ts`
    - Definir interfaz OllamaMetrics con campos de métricas
    - Implementar métodos: recordRequest, recordFallback, recordStreamingRequest
    - Implementar método updateHealthStatus
    - Implementar método getMetrics para obtener estadísticas
    - _Requisitos: 8.1, 8.2_

  - [ ] 9.2 Integrar MetricsCollector en NLPEngine
    - Crear instancia de MetricsCollector
    - Registrar cada request a Ollama con timestamp y resultado
    - Registrar tiempo de respuesta
    - Registrar uso de fallback
    - _Requisitos: 8.1, 8.2_

  - [ ] 9.3 Crear endpoint GET /api/chat/ollama/health
    - Implementar endpoint en ChatbotService
    - Consultar health de Ollama via OllamaAdapter
    - Verificar si modelo está cargado
    - Retornar JSON con status, model, modelLoaded, lastCheck
    - _Requisitos: 5.5, 8.5_

  - [ ] 9.4 Actualizar endpoint GET /api/chat/stats
    - Agregar sección 'ollama' con métricas de OllamaMetrics
    - Incluir: totalRequests, successRate, averageResponseTime, fallbackUsage
    - Mantener estadísticas existentes de sesiones
    - _Requisitos: 8.3_

  - [ ] 9.5 Implementar logging detallado
    - Registrar cada solicitud a Ollama con sessionId y timestamp
    - Registrar errores con tipo de error y mensaje
    - Registrar uso de fallback con razón
    - Usar niveles de log apropiados (info, warn, error)
    - _Requisitos: 8.1, 8.4_

- [ ] 10. Actualizar configuración y variables de entorno
  - Actualizar archivo .env.example con variables de Ollama
  - Agregar: OLLAMA_HOST, OLLAMA_MODEL, OLLAMA_TIMEOUT, OLLAMA_TEMPERATURE, OLLAMA_MAX_TOKENS, USE_OLLAMA
  - Documentar cada variable con comentarios
  - Establecer valores por defecto apropiados
  - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 11. Actualizar dependencias en package.json
  - Actualizar socket.io a versión ^4.7.2 (última estable)
  - Actualizar axios a versión ^1.6.8 (última estable)
  - Actualizar mongoose a versión ^8.0.3 (última estable)
  - Agregar @types/natural para TypeScript
  - Mantener natural ^6.12.0 para SimpleFallbackRecognizer
  - Eliminar @tensorflow/tfjs-node (no necesario)
  - Eliminar python-shell completamente (no más Python)
  - Eliminar compromise (usamos natural)
  - Ejecutar npm install para actualizar node_modules
  - _Requisitos: 2.5, 5.1, 5.2_

- [ ] 12. Actualizar Dockerfile del chatbot
  - Remover COMPLETAMENTE instalación de Python y spaCy
  - Simplificar Dockerfile para solo Node.js
  - Mantener healthcheck existente
  - Optimizar capas de Docker para build más rápido
  - Reducir tamaño de imagen eliminando dependencias Python
  - _Requisitos: 2.1, 5.1_

- [ ] 13. Eliminar archivos obsoletos de Python/spaCy
  - Eliminar archivo `ai-services/chatbot/src/nlp/spacyProcessor.py`
  - Eliminar archivo `ai-services/chatbot/src/nlp/NLPProcessor.ts` (usa Python)
  - Eliminar archivo `ai-services/chatbot/src/intent/IntentRecognizer.ts` (depende de spaCy)
  - Eliminar carpeta `ai-services/chatbot/src/nlp/` si queda vacía
  - Eliminar carpeta `ai-services/chatbot/src/intent/` si queda vacía
  - Actualizar imports en archivos que referencien estos módulos
  - _Requisitos: 5.1, 5.2_

- [ ] 14. Verificar y actualizar integración con frontend
  - [ ] 14.1 Verificar si frontend tiene Socket.IO instalado
    - Revisar package.json del frontend
    - Verificar si existe socket.io-client
    - Documentar estado actual

  - [ ] 14.2 Crear/actualizar componente de chat con streaming
    - Implementar hook useChat con Socket.IO
    - Agregar manejo de eventos: chat_stream_chunk, chat_stream_end, bot_typing
    - Implementar indicador de "escribiendo" animado
    - Agregar badge de "Modo básico" cuando usingFallback es true
    - _Requisitos: 4.1, 4.2, 4.3, 11.1, 11.5_

  - [ ] 14.3 Implementar reconexión automática de Socket.IO
    - Manejar desconexiones de red
    - Reintentar conexión automáticamente
    - Mostrar estado de conexión al usuario

  - [ ] 14.4 Probar integración end-to-end frontend-backend
    - Enviar mensaje desde frontend
    - Verificar que streaming funciona correctamente
    - Verificar indicadores visuales (typing, chunks)
    - Probar fallback cuando Ollama no disponible

- [ ] 15. Crear documentación
  - [ ] 15.1 Actualizar README del chatbot
    - Actualizar archivo `ai-services/chatbot/README.md`
    - Documentar nueva arquitectura con Ollama
    - Agregar instrucciones de setup con Ollama
    - Documentar variables de entorno
    - Agregar sección de troubleshooting
    - Incluir ejemplos de uso

  - [ ] 15.2 Documentar API de Socket.IO
    - Crear archivo `ai-services/chatbot/docs/SOCKET_API.md`
    - Documentar eventos: chat_message_stream, bot_typing, chat_stream_chunk, chat_stream_end
    - Incluir ejemplos de código para cliente
    - Documentar formato de datos de cada evento

  - [ ] 15.3 Crear guía de usuario del chatbot
    - Crear archivo `ai-services/chatbot/docs/USER_GUIDE.md`
    - Escribir ejemplos de consultas efectivas
    - Documentar limitaciones conocidas
    - Explicar cómo escalar a soporte humano
    - Incluir FAQ

  - [ ] 15.4 Documentar expectativas realistas de Phi-3 Mini
    - Crear archivo `ai-services/chatbot/docs/PHI3_EXPECTATIONS.md`
    - Documentar capacidades y limitaciones
    - Documentar latencias esperadas (2-5 segundos primera, 1-3 siguientes)
    - Explicar diferencias vs GPT-4/ChatGPT
    - Incluir guía de ajuste iterativo del system prompt

- [ ] 16. Implementar manejo de consultas técnicas especializadas
  - Agregar instrucciones específicas en system prompt para consultas de compatibilidad
  - Implementar lógica para priorizar especificaciones técnicas en RAG
  - Agregar ejemplos de consultas técnicas en system prompt
  - Implementar formateo especial para comparaciones técnicas
  - _Requisitos: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 17. Testing y validación
  - [ ] 17.1 Crear tests unitarios para OllamaAdapter
    - Crear carpeta `ai-services/chatbot/src/tests/unit/` si no existe
    - Crear archivo `ai-services/chatbot/src/tests/unit/OllamaAdapter.test.ts`
    - Test de formateo de prompts
    - Test de manejo de errores
    - Test de health checks
    - Mock de HTTP requests

  - [ ] 17.2 Crear tests unitarios para SimpleFallbackRecognizer
    - Crear archivo `ai-services/chatbot/src/tests/unit/SimpleFallbackRecognizer.test.ts`
    - Test de reconocimiento de intenciones básicas
    - Test de extracción de entidades simples
    - Test de generación de respuestas de fallback
    - Verificar que NO depende de Python/spaCy

  - [ ] 17.3 Crear tests de integración
    - Crear carpeta `ai-services/chatbot/src/tests/integration/` si no existe
    - Crear archivo `ai-services/chatbot/src/tests/integration/ollama-integration.test.ts`
    - Test end-to-end con Ollama real
    - Test de pipeline RAG completo
    - Test de fallback cuando Ollama falla
    - Test de streaming de respuestas

  - [ ] 17.4 Realizar tests de carga
    - Crear carpeta `ai-services/chatbot/src/tests/load/` si no existe
    - Crear archivo `ai-services/chatbot/src/tests/load/chatbot-load.test.ts`
    - Test con 10 usuarios simultáneos
    - Medir latencia y throughput
    - Verificar uso de memoria no exceda límites
    - Identificar cuellos de botella

- [ ] 18. Despliegue y migración
  - [ ] 18.1 Desplegar en entorno de desarrollo
    - Ejecutar docker-compose up con nuevo servicio Ollama
    - Verificar que Ollama descargue modelo Phi-3 Mini correctamente
    - Verificar que chatbot se conecte a Ollama
    - Probar funcionalidad básica

  - [ ] 18.2 Configurar monitoreo
    - Verificar que métricas se registren correctamente
    - Configurar alertas si memoria > 90%
    - Verificar logs de Ollama y chatbot

  - [ ] 18.3 Realizar pruebas de usuario
    - Probar consultas de productos variadas
    - Verificar respuestas conversacionales
    - Probar streaming de respuestas
    - Verificar fallback cuando Ollama no disponible
    - Probar consultas técnicas especializadas

  - [ ] 18.4 Medir latencias reales y optimizar
    - Medir tiempo de primera respuesta (objetivo: < 5 segundos)
    - Medir tiempo de respuestas siguientes (objetivo: < 3 segundos)
    - Verificar que streaming mejora percepción de velocidad
    - Ajustar timeout si necesario
    - _Requisitos: 11.2, 11.3, 11.4_

  - [ ] 18.5 Ajustar system prompt basado en resultados
    - Revisar calidad de respuestas
    - Ajustar temperatura si necesario
    - Refinar instrucciones del system prompt
    - Optimizar formateo de contexto de productos
