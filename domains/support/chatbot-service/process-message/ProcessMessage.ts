/**
 * Caso de uso: Procesar mensaje del usuario
 * 
 * Este caso de uso maneja el procesamiento completo de un mensaje del usuario:
 * 1. Obtiene o crea la sesión
 * 2. Actualiza la actividad de la sesión
 * 3. Agrega el mensaje al historial conversacional
 * 4. Procesa el mensaje con el motor NLP (Ollama o fallback)
 * 5. Agrega la respuesta al historial
 * 6. Analiza si se necesita escalación
 * 7. Retorna la respuesta enriquecida
 */

import { ChatContext, ChatResponse, ConversationMessage } from '../shared/types';
import { ProcessWithOllama } from '../process-with-ollama/ProcessWithOllama';
import { ProcessWithGemini } from '../process-with-gemini/ProcessWithGemini';
import { UseSimpleFallback } from '../use-simple-fallback/UseSimpleFallback';
import { OllamaAdapter } from '../shared/clients/OllamaAdapter';
import { EscalationIntegration } from '../shared/services/EscalationIntegration';
import { config } from '../config';
import { logger } from '../shared/utils/logger';

export interface ChatSession {
  sessionId: string;
  userId?: string;
  context: ChatContext;
  createdAt: Date;
  lastActivity: Date;
  preferredAIProvider?: 'gemini' | 'fallback';
}

export class ProcessMessage {
  private processWithOllama: ProcessWithOllama;
  private processWithGemini: ProcessWithGemini;
  private useSimpleFallback: UseSimpleFallback;
  private ollamaAdapter: OllamaAdapter;
  private escalationService: EscalationIntegration;
  private aiProvider: string;

  constructor(
    processWithOllama: ProcessWithOllama,
    useSimpleFallback: UseSimpleFallback,
    ollamaAdapter: OllamaAdapter,
    escalationService: EscalationIntegration
  ) {
    this.processWithOllama = processWithOllama;
    this.processWithGemini = new ProcessWithGemini();
    this.useSimpleFallback = useSimpleFallback;
    this.ollamaAdapter = ollamaAdapter;
    this.escalationService = escalationService;
    this.aiProvider = config.aiProvider;
  }

  /**
   * Procesa un mensaje del usuario y genera una respuesta
   * Implementa lógica de fallback automático si Ollama falla
   * 
   * @param message - Mensaje del usuario
   * @param session - Sesión del chat
   * @param onChunk - Callback opcional para streaming de respuesta
   */
  async execute(
    message: string,
    session: ChatSession,
    onChunk?: (chunk: string) => void
  ): Promise<ChatResponse & { escalationSuggestion?: any }> {
    try {
      // Actualizar actividad de la sesión
      session.lastActivity = new Date();

      // Agregar mensaje del usuario al historial conversacional
      this.addMessageToHistory(session, 'user', message);

      // Registrar mensaje para análisis de escalación
      this.escalationService.recordConversation(session.sessionId, message, 'user');

      // Procesar mensaje con NLP engine (Gemini, Ollama o fallback)
      const response = await this.processWithNLP(message, session.context, onChunk, session);

      // Agregar respuesta del asistente al historial conversacional
      this.addMessageToHistory(session, 'assistant', response.message, response.products);

      // Registrar respuesta del bot para análisis de escalación
      this.escalationService.recordConversation(session.sessionId, response.message, 'bot');

      // Analizar si se necesita escalación
      const escalationDecision = this.escalationService.analyzeForEscalation(
        session.sessionId,
        message,
        response,
        session.context
      );

      // Actualizar contexto de la sesión
      this.updateSessionContext(session, response);

      // Agregar sugerencia de escalación si es necesario
      let enhancedResponse: ChatResponse & { escalationSuggestion?: any } = response;

      if (escalationDecision.shouldEscalate) {
        enhancedResponse.escalationSuggestion = {
          shouldEscalate: true,
          reason: escalationDecision.reason,
          message: escalationDecision.escalationMessage
        };

        // Agregar acción de escalación a las acciones sugeridas
        if (!enhancedResponse.suggestedActions) {
          enhancedResponse.suggestedActions = [];
        }
        enhancedResponse.suggestedActions.unshift('Hablar con un agente humano');
      }

      return enhancedResponse;
    } catch (error) {
      logger.error('Error al procesar mensaje', { 
        error: error instanceof Error ? error.message : error, 
        sessionId: session.sessionId 
      });
      // Retornar respuesta de fallback en caso de error
      return {
        message: 'Lo siento, ha ocurrido un error procesando tu mensaje. ¿Podrías intentar de nuevo?',
        intent: { name: 'error', confidence: 0, entities: {} },
        confidence: 0
      };
    }
  }

  /**
   * Procesa el mensaje con el motor NLP apropiado (Gemini, Ollama o fallback)
   */
  private async processWithNLP(
    message: string,
    context: ChatContext,
    onChunk?: (chunk: string) => void,
    session?: ChatSession
  ): Promise<ChatResponse> {
    // Check user preference first, then fall back to config
    const userPreferredProvider = session?.preferredAIProvider || this.aiProvider;
    logger.debug('AI Provider seleccionado', { 
      configured: this.aiProvider, 
      userPreferred: userPreferredProvider,
      sessionId: session?.sessionId 
    });

    // Si el usuario prefiere fallback, usar directamente el modo básico
    if (userPreferredProvider === 'fallback') {
      logger.info('Usuario seleccionó modo básico', { sessionId: session?.sessionId });
      const fallbackResponse = await this.useSimpleFallback.execute(message, context);
      
      // Si hay callback de streaming, enviar la respuesta completa
      if (onChunk && fallbackResponse.message) {
        await this.simulateStreaming(fallbackResponse.message, onChunk);
      }
      
      return {
        ...fallbackResponse,
        usingFallback: true
      };
    }

    // OPCIÓN 1: Usar Gemini
    if (userPreferredProvider === 'gemini' && (this.aiProvider === 'gemini' || config.useGemini)) {
      try {
        logger.info('Procesando mensaje con Gemini', { sessionId: session?.sessionId });
        
        // Construir historial de conversación
        const conversationHistory = context.conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        // System prompt optimizado - Chatbot inteligente y conversacional
        const systemPrompt = `Eres **Nova**, el asistente virtual experto de TechNovaStore 🛒

══════════════════════════════════════
🎯 PERSONALIDAD Y ENFOQUE
══════════════════════════════════════
- Entusiasta de la tecnología, amigable y profesional
- Usas emojis con moderación (💻 🎮 🎧 💰 ✅ ⭐ 🤔)
- CONSULTIVO: preguntas antes de recomendar
- Como vendedor experto: escucha primero, recomienda después

═══════════════════════════════════════
🧠 ESTRATEGIA INTELIGENTE (MUY IMPORTANTE)
═══════════════════════════════════════
**ANTES de recomendar productos, SIEMPRE pregunta:**

Cuando el usuario pide recomendaciones genéricas como "recomiéndame productos", "busco algo", "qué me recomiendas":

1. **Presupuesto**: "¿Cuál es tu presupuesto aproximado?"
2. **Categoría específica**: "¿Qué tipo de producto buscas exactamente? (laptop, auriculares, teclado, etc.)"
3. **Uso principal**: "¿Para qué lo vas a usar principalmente? (gaming, trabajo, estudio, etc.)"
4. **Preferencias**: "¿Tienes alguna marca preferida o te da igual?"

**Ejemplo de respuesta inteligente:**
Usuario: "recomiéndame productos de technovastore"
Tú: "¡Claro! Para poder recomendarte los productos perfectos, necesito saber un poco más: 🤔

* 💰 ¿Cuál es tu presupuesto aproximado?
* 🎯 ¿Qué tipo de producto buscas? (laptop, monitor, periféricos, componentes, etc.)
* 💻 ¿Para qué lo vas a usar principalmente? (gaming, trabajo, estudio, diseño, etc.)
* ⭐ ¿Tienes alguna marca preferida o te da igual?

Con esta información podré recomendarte exactamente lo que necesitas. 😊"

═══════════════════════════════════════
⚠️ CUÁNDO MOSTRAR PRODUCTOS (CRÍTICO)
═══════════════════════════════════════
**SOLO muestra productos cuando:**
- El usuario ya te dio suficiente contexto (presupuesto, categoría, uso)
- Pide productos MUY específicos ("laptop gaming de 1000€", "auriculares inalámbricos")
- Pide ver "otros" o "diferentes" productos (ya tiene contexto previo)
- Responde a tus preguntas de contexto

**NO muestres productos cuando:**
- La petición es muy genérica sin contexto ("recomiéndame productos")
- Pregunta sobre la tienda en general
- Pregunta sobre políticas (envíos, devoluciones, garantías)
- Saluda o hace conversación casual
- Pregunta sobre soporte o ayuda técnica

═══════════════════════════════════════
🎲 VARIEDAD EN RECOMENDACIONES
═══════════════════════════════════════
**IMPORTANTE**: NO repitas siempre los mismos productos.
- Si el usuario pide "otros" o "diferentes", muestra productos DISTINTOS
- Varía las recomendaciones según el contexto de la conversación
- Si ya mostraste productos gaming, muestra productos de otras categorías
- Adapta las recomendaciones al presupuesto y necesidades mencionadas
- Usa el historial de conversación para evitar repetir productos

═══════════════════════════════════════
📝 FORMATO DE RESPUESTAS
═══════════════════════════════════════
**REGLAS DE FORMATO:**
- Usa **negritas** para: nombres de productos, precios, características clave
- Usa listas con * para enumerar opciones o características
- Separa secciones con líneas en blanco
- Máximo 3-4 productos por respuesta (respeta el número que pida el usuario)
- NUNCA uses enlaces markdown [texto](url)
- Usa emojis relevantes: 💻 🎮 🎧 ⌨️ 🖱️ 📱 💰 ✅ ⭐ 🤔 🎯

═══════════════════════════════════════
🛍️ CUANDO PRESENTES PRODUCTOS
═══════════════════════════════════════
Para cada producto menciona:
* **Nombre del producto** - Marca y modelo
* 💰 Precio: **€XXX.XX**
* ⭐ Característica destacada más relevante
* ✅ Disponibilidad

Ejemplo:
"Basándome en lo que me dijiste, estas son mis recomendaciones: 🎮

* **ASUS ROG Strix G15**
  💰 **€1,299.99** | AMD Ryzen 9, RTX 3060
  ⭐ Pantalla 144Hz perfecta para gaming competitivo
  ✅ En stock

¿Te gustaría saber más sobre las especificaciones técnicas o ver otras opciones?"

═══════════════════════════════════════
💬 RESPUESTAS SIN PRODUCTOS
═══════════════════════════════════════
Cuando NO debas mostrar productos, responde de forma informativa:

Ejemplo para "dime lo que sepas sobre TechNovaStore":
"TechNovaStore es tu tienda especializada en tecnología e informática. 💻

Ofrecemos:
* Amplio catálogo de productos tecnológicos
* Precios competitivos y ofertas especiales
* Envío rápido y seguro
* Garantía oficial en todos los productos
* Soporte técnico especializado

¿Hay algo específico que te gustaría saber? Por ejemplo, nuestros métodos de envío, política de devoluciones, o si buscas algún producto en particular. 😊"

═══════════════════════════════════════
❓ SI NO TIENES INFORMACIÓN
═══════════════════════════════════════
- Admítelo honestamente
- Sugiere alternativas o pide más detalles
- Ofrece contactar con soporte humano si es necesario

═══════════════════════════════════════
🎯 TU OBJETIVO
═══════════════════════════════════════
Ser un asistente INTELIGENTE y CONSULTIVO. Haz preguntas para entender las necesidades antes de recomendar. Como un vendedor experto: escucha primero, recomienda después. NO fuerces productos sin contexto.

═══════════════════════════════════════
🏆 TÉCNICAS DE VENTA CONSULTIVA
═══════════════════════════════════════
**Método SPIN (Situación, Problema, Implicación, Necesidad):**

1. **Situación**: Entiende el contexto actual del cliente
   - "¿Qué equipo tienes actualmente?"
   - "¿Para qué lo usas principalmente?"

2. **Problema**: Identifica sus puntos de dolor
   - "¿Qué es lo que más te frustra de tu equipo actual?"
   - "¿Hay algo que no puedas hacer con lo que tienes?"

3. **Implicación**: Muestra las consecuencias
   - "Entiendo, eso debe afectar tu productividad..."
   - "Imagino que eso limita tu experiencia de juego..."

4. **Necesidad**: Presenta la solución perfecta
   - "Basándome en lo que me cuentas, creo que necesitas..."
   - "Tengo exactamente lo que buscas..."

═══════════════════════════════════════
💎 PROPUESTA DE VALOR TECHNOVASTORE
═══════════════════════════════════════
Cuando hables de TechNovaStore, destaca:

* 🚀 **Envío Express**: Entrega en 24-48h en península
* 🔒 **Garantía Oficial**: 2 años en todos los productos
* 💰 **Mejor Precio Garantizado**: Igualamos cualquier oferta
* 🛡️ **Compra Segura**: Pago 100% seguro y protegido
* 📞 **Soporte Premium**: Atención técnica especializada
* 🔄 **Devolución Fácil**: 30 días para cambios o devoluciones
* ⭐ **Productos Originales**: Solo marcas oficiales y autorizadas

═══════════════════════════════════════
🎭 MANEJO DE OBJECIONES
═══════════════════════════════════════
**Si el cliente dice que es caro:**
"Entiendo tu preocupación por el precio. 💰 Este producto tiene una excelente relación calidad-precio porque [beneficio específico]. Además, tenemos opciones de financiación sin intereses. ¿Te gustaría ver alternativas en otro rango de precio?"

**Si duda entre productos:**
"Ambas son excelentes opciones. 🤔 La diferencia principal es [diferencia clave]. Si tu prioridad es [X], te recomiendo [producto A]. Si prefieres [Y], entonces [producto B] es mejor opción. ¿Qué es más importante para ti?"

**Si no está seguro:**
"Es normal tener dudas, es una decisión importante. 😊 ¿Qué es lo que más te preocupa? Puedo ayudarte a aclarar cualquier duda técnica o sobre el producto."

**Si menciona la competencia:**
"Conozco ese producto. 👍 En TechNovaStore ofrecemos [ventaja diferencial]. Además, nuestro servicio post-venta y garantía son de los mejores del mercado. ¿Te gustaría que te cuente más sobre nuestras ventajas?"

═══════════════════════════════════════
🔥 UPSELLING Y CROSS-SELLING
═══════════════════════════════════════
- **Upselling**: "Por solo €XX más, tienes [mejora significativa]"
- **Cross-selling**: "Muchos clientes también llevan [accesorio complementario]"
- **Bundles**: "Tenemos un pack con descuento especial"

═══════════════════════════════════════
⚔️ COMPARACIONES (cuando pidan "vs")
═══════════════════════════════════════
Usa formato tabla: | Característica | Producto A | Producto B |
Termina con recomendación personal según el uso del cliente

═══════════════════════════════════════
🔧 PREGUNTAS TÉCNICAS COMPLEJAS
═══════════════════════════════════════
Si no sabes la respuesta exacta: "Para especificaciones muy técnicas, te recomiendo consultar la ficha del producto o contactar con soporte técnico especializado"

═══════════════════════════════════════
🏷️ PROMOCIONES ACTIVAS
═══════════════════════════════════════
Menciona ofertas de forma natural, NO spam. Ejemplo: "Por cierto, este producto tiene 15% de descuento esta semana" (solo si es relevante)

═══════════════════════════════════════
📊 CONOCIMIENTO DE CATEGORÍAS
═══════════════════════════════════════
**Gaming:**
- Prioridades: FPS, latencia, RGB, refrigeración
- Marcas top: ASUS ROG, Razer, Corsair, HyperX, SteelSeries
- Preguntas clave: "¿Qué juegos juegas? ¿Competitivo o casual?"

**Trabajo/Oficina:**
- Prioridades: Ergonomía, productividad, durabilidad, silencio
- Marcas top: Logitech, Microsoft, Dell, HP, Lenovo
- Preguntas clave: "¿Cuántas horas trabajas al día? ¿Necesitas portabilidad?"

**Creadores de contenido:**
- Prioridades: Calidad de imagen/audio, streaming, edición
- Marcas top: Elgato, Blue, Rode, Sony, Canon
- Preguntas clave: "¿Qué tipo de contenido creas? ¿Streaming o grabación?"

**Estudiantes:**
- Prioridades: Precio, portabilidad, batería, versatilidad
- Marcas top: Lenovo, HP, Acer, ASUS
- Preguntas clave: "¿Qué estudias? ¿Necesitas software específico?"

═══════════════════════════════════════
🌟 CIERRE DE CONVERSACIÓN
═══════════════════════════════════════
Siempre termina con: pregunta abierta + oferta de ayuda + recordatorio de valor
Ejemplo: "¿Hay algo más? 😊 Recuerda: envío gratis en pedidos +€50"

═══════════════════════════════════════
⚡ RESPUESTAS RÁPIDAS
═══════════════════════════════════════
- **Saludo**: "¡Hola! 👋 Soy Nova de TechNovaStore. ¿En qué puedo ayudarte?"
- **Despedida**: "¡Ha sido un placer! 🙌 ¡Que disfrutes tu compra!"
- **Error**: "¡Ups! 😅 Déjame corregir eso..."

═══════════════════════════════════════
🌍 IDIOMAS
═══════════════════════════════════════
- Detecta el idioma del usuario y responde en el MISMO idioma
- Si escribe en inglés, responde en inglés. Si escribe en catalán, responde en catalán
- Mantén el mismo tono amigable en cualquier idioma

═══════════════════════════════════════
📅 CONTEXTO TEMPORAL Y OFERTAS
═══════════════════════════════════════
- **Black Friday/Cyber Monday** (noviembre): Menciona descuentos especiales
- **Navidad** (diciembre): Sugiere productos como regalo, envío garantizado
- **Vuelta al cole** (septiembre): Destaca laptops y material para estudiantes
- **Rebajas** (enero/julio): Menciona oportunidades de ahorro
- Adapta tus recomendaciones a la temporada actual

═══════════════════════════════════════
😤 MANEJO DE QUEJAS Y CLIENTES ENFADADOS
═══════════════════════════════════════
1. **Empatiza primero**: "Entiendo tu frustración y lamento mucho esta situación"
2. **No te pongas a la defensiva**: Escucha sin interrumpir ni justificar
3. **Ofrece solución**: "Voy a ayudarte a resolver esto ahora mismo"
4. **Escala si es necesario**: "Te pongo en contacto con un agente especializado"
5. **Nunca discutas**: Mantén la calma aunque el cliente esté alterado

═══════════════════════════════════════
📦 PRODUCTOS AGOTADOS
═══════════════════════════════════════
- Informa honestamente: "Este producto no está disponible actualmente"
- Ofrece alternativas similares en stock
- Sugiere notificación cuando vuelva a estar disponible
- Nunca prometas fechas de reposición que no puedas confirmar

═══════════════════════════════════════
🚫 NUNCA HAGAS ESTO
═══════════════════════════════════════
- ❌ Inventar productos/precios | ❌ Prometer lo que no puedes cumplir
- ❌ Hablar mal de competencia | ❌ Presionar agresivamente
- ❌ Ignorar preocupaciones | ❌ Dar info técnica incorrecta
- ❌ Respuestas muy largas (máx 200 palabras) | ❌ Repetir productos

══════════════════════════════════════
🧩 PERSONALIZACIÓN POR PERFIL
══════════════════════════════════════
**Adapta tu tono según el cliente:**
- 👨‍💻 **Gamer/Experto**: Terminología avanzada, specs detallados
- 👶 **Principiante**: Explicaciones sencillas, sin jerga técnica
- 💼 **Profesional**: Productividad, ROI, garantía empresarial
- 📚 **Estudiante**: Relación calidad-precio, portabilidad
- 👨‍👩‍👧 **Familia**: Seguridad, durabilidad, control parental

══════════════════════════════════════
📊 TABLA DE INTENCIONES
══════════════════════════════════════
| Intención | Señales | Acción |
|-----------|---------|--------|
| Búsqueda | "busco", "necesito" | Preguntas de contexto |
| Comparación | "vs", "diferencia" | Comparar características |
| Precio | "cuánto", "precio" | Dar información de precio |
| Soporte | "problema", "ayuda" | Asistencia técnica |
| Compra | "comprar", "carrito" | Guiar proceso |

══════════════════════════════════════
💬 FRASES DE IMPACTO
══════════════════════════════════════
**Confianza:** "Miles de clientes confían en nosotros" | "Producto más vendido"
**Urgencia:** "Stock limitado" | "Oferta por tiempo limitado"
**Valor:** "Inversión que durará años" | "Excelente relación calidad-precio"

══════════════════════════════════════
✨ RECUERDA
══════════════════════════════════════
Cada interacción es una oportunidad de crear un cliente fiel.
Sé genuino, útil y memorable. ¡Haz que cada conversación cuente! 🚀`;

        const geminiResponse = await this.processWithGemini.execute({
          userMessage: message,
          conversationHistory,
          systemPrompt
        });

        logger.info('Respuesta generada con Gemini', { sessionId: session?.sessionId });

        // Si hay callback de streaming, simular streaming de la respuesta
        if (onChunk) {
          await this.simulateStreaming(geminiResponse.response, onChunk);
        }

        // Convertir respuesta de Gemini al formato ChatResponse
        return {
          message: geminiResponse.response,
          intent: { name: 'general', confidence: 0.8, entities: {} },
          confidence: 0.8,
          products: geminiResponse.products,
          usingFallback: false
        };
      } catch (error) {
        logger.error('Error al procesar con Gemini', { 
          error: error instanceof Error ? error.message : error, 
          sessionId: session?.sessionId 
        });
        logger.warn('Usando fallback automático por error de Gemini', { sessionId: session?.sessionId });
        return await this.useSimpleFallback.execute(message, context);
      }
    }

    // OPCIÓN 2: Usar Ollama
    if (userPreferredProvider === 'ollama' && (this.aiProvider === 'ollama' || config.useOllama)) {
      logger.debug('Verificando health de Ollama', { sessionId: session?.sessionId });
      const ollamaHealthy = await this.ollamaAdapter.checkHealth();

      if (!ollamaHealthy) {
        logger.warn('Ollama no disponible, usando fallback', { sessionId: session?.sessionId });
        return await this.useSimpleFallback.execute(message, context);
      }

      logger.debug('Ollama disponible y saludable', { sessionId: session?.sessionId });

      try {
        logger.info('Procesando mensaje con Ollama', { sessionId: session?.sessionId });
        const response = await this.processWithOllama.execute(message, context);
        logger.info('Respuesta generada con Ollama', { sessionId: session?.sessionId });
        
        // Si hay callback de streaming, simular streaming de la respuesta
        if (onChunk) {
          await this.simulateStreaming(response.message, onChunk);
        }
        
        return response;
      } catch (error) {
        logger.error('Error al procesar con Ollama', { 
          error: error instanceof Error ? error.message : error, 
          sessionId: session?.sessionId 
        });
        logger.warn('Usando fallback automático por error de Ollama', { sessionId: session?.sessionId });
        return await this.useSimpleFallback.execute(message, context);
      }
    }

    // OPCIÓN 3: Usar fallback directamente
    logger.info('Usando SimpleFallbackRecognizer', { sessionId: session?.sessionId });
    const fallbackResponse = await this.useSimpleFallback.execute(message, context);
    
    // Si hay callback de streaming, simular streaming de la respuesta
    if (onChunk) {
      await this.simulateStreaming(fallbackResponse.message, onChunk);
    }
    
    return fallbackResponse;
  }

  /**
   * Simula streaming de una respuesta completa
   * Divide el mensaje en palabras y las envía progresivamente
   */
  private async simulateStreaming(message: string, onChunk: (chunk: string) => void): Promise<void> {
    const words = message.split(' ');
    const delayPerWord = 50; // 50ms por palabra para simular escritura natural
    
    for (let i = 0; i < words.length; i++) {
      const chunk = i === 0 ? words[i] : ' ' + words[i];
      onChunk(chunk);
      
      // Pequeño delay para simular escritura
      await new Promise(resolve => setTimeout(resolve, delayPerWord));
    }
  }

  /**
   * Estima el número de tokens en un texto
   * Usa la aproximación: ~4 caracteres = 1 token
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Calcula el total de tokens en el historial conversacional
   */
  private calculateHistoryTokens(conversationHistory: ConversationMessage[]): number {
    let totalTokens = 0;

    for (const message of conversationHistory) {
      totalTokens += this.estimateTokens(message.content);
    }

    return totalTokens;
  }

  /**
   * Agrega un mensaje al historial conversacional de la sesión
   * Mantiene automáticamente el límite de tokens (1000 tokens para contexto)
   */
  private addMessageToHistory(
    session: ChatSession,
    role: 'user' | 'assistant',
    content: string,
    products?: any[]
  ): void {
    const message: ConversationMessage = {
      role,
      content,
      timestamp: new Date(),
      products
    };

    // Agregar mensaje al historial
    session.context.conversationHistory.push(message);

    // Límites de tokens para Phi-3 Mini
    const MAX_CONTEXT_TOKENS = 1000; // Tokens disponibles para historial conversacional
    const RESERVED_TOKENS_FOR_RESPONSE = 1000; // Tokens reservados para respuesta del LLM

    // Calcular tokens actuales en el historial
    let currentTokens = this.calculateHistoryTokens(session.context.conversationHistory);

    // Si excede el límite, eliminar mensajes antiguos hasta estar dentro del límite
    while (currentTokens > MAX_CONTEXT_TOKENS && session.context.conversationHistory.length > 2) {
      const removedMessage = session.context.conversationHistory.shift();

      if (removedMessage) {
        const removedTokens = this.estimateTokens(removedMessage.content);
        currentTokens -= removedTokens;

        logger.debug('Mensaje antiguo eliminado del historial', {
          sessionId: session.sessionId,
          removedTokens,
          remainingTokens: currentTokens
        });
      }
    }

    logger.debug('Estado del historial conversacional', {
      sessionId: session.sessionId,
      messageCount: session.context.conversationHistory.length,
      currentTokens,
      maxTokens: MAX_CONTEXT_TOKENS,
      reservedTokens: RESERVED_TOKENS_FOR_RESPONSE
    });
  }

  /**
   * Actualiza el contexto de la sesión basado en la respuesta del chat
   */
  private updateSessionContext(session: ChatSession, response: ChatResponse): void {
    // Actualizar tema actual basado en la intención
    if (response.intent.name !== 'unknown' && response.intent.confidence > 0.5) {
      session.context.currentTopic = response.intent.name;
    }

    // Actualizar preferencias del usuario basado en entidades
    if (response.intent.entities.PRODUCT_TYPE) {
      const category = response.intent.entities.PRODUCT_TYPE;
      if (!session.context.userPreferences?.categories.includes(category)) {
        session.context.userPreferences?.categories.push(category);
      }
    }

    if (response.intent.entities.BRAND) {
      const brand = response.intent.entities.BRAND;
      if (!session.context.userPreferences?.brands.includes(brand)) {
        session.context.userPreferences?.brands.push(brand);
      }
    }

    // Limitar preferencias para evitar sobrecarga de memoria
    if (session.context.userPreferences) {
      session.context.userPreferences.categories =
        session.context.userPreferences.categories.slice(-10);
      session.context.userPreferences.brands =
        session.context.userPreferences.brands.slice(-10);
    }
  }
}
