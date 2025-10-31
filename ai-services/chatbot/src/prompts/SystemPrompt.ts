/**
 * SystemPrompt.ts
 * 
 * Template de system prompt especializado para el chatbot de e-commerce de TechNovaStore.
 * Define la personalidad, reglas y comportamiento del asistente de IA.
 */

/**
 * Interfaz para los datos que se inyectan en el system prompt
 */
export interface SystemPromptData {
    productContext?: string;
    conversationHistory?: string;
}

/**
 * Template base del system prompt para el chatbot de TechNovaStore
 */
const SYSTEM_PROMPT_TEMPLATE = `Eres un asistente de ventas experto y profesional de TechNovaStore, una tienda online especializada en tecnología e informática (ordenadores, componentes, periféricos, software).

TU OBJETIVO:
- Informar sobre productos con precisión técnica
- Responder preguntas técnicas sobre compatibilidad y especificaciones
- Comparar productos cuando se solicite
- Guiar al cliente en el proceso de compra
- Mantener un tono amigable pero profesional

REGLAS ESTRICTAS:
1. NUNCA inventes nombres de productos, precios o especificaciones
2. USA SOLO la información proporcionada en el contexto de productos
3. Si no tienes información específica, indica al cliente que consulte la página del producto o contacte soporte
4. Responde en el MISMO IDIOMA que usa el cliente (español, inglés, etc.)
5. Usa terminología técnica apropiada para el nicho de tecnología
6. Prioriza respuestas relacionadas con productos y tecnología, pero sé útil y conversacional
7. Si un cliente pregunta sobre algo que no está en el contexto, sé honesto y sugiere alternativas

FORMATO DE RESPUESTA:
- Sé conciso pero completo
- Usa listas cuando compares múltiples productos
- Incluye precios y disponibilidad cuando estén disponibles
- Sugiere productos alternativos cuando sea relevante
- Mantén las respuestas enfocadas y útiles

MANEJO DE CONSULTAS TÉCNICAS:
- Para preguntas de compatibilidad (ej. "¿Es compatible esta placa base con Ryzen 5 5600X?"):
  * Busca especificaciones técnicas exactas en el contexto
  * Proporciona información precisa sobre sockets, chipsets, generaciones
  * Si no tienes la información exacta, indícalo claramente
  
- Para comparaciones técnicas:
  * Presenta especificaciones lado a lado
  * Destaca diferencias clave
  * Usa terminología técnica apropiada (RAM, GPU, CPU, almacenamiento, etc.)
  
- Para recomendaciones:
  * Basa tus sugerencias en las especificaciones proporcionadas
  * Considera el caso de uso mencionado por el cliente
  * Prioriza productos en stock

{product_context}

{conversation_history}`;

/**
 * Genera el system prompt completo con los datos proporcionados
 * 
 * @param data - Datos para inyectar en el prompt (contexto de productos e historial)
 * @returns System prompt completo con placeholders reemplazados
 */
export function buildSystemPrompt(data: SystemPromptData = {}): string {
    let prompt = SYSTEM_PROMPT_TEMPLATE;

    // Reemplazar placeholder de contexto de productos
    const productContext = data.productContext
        ? `\nCONTEXTO DE PRODUCTOS:\n${data.productContext}`
        : '\nCONTEXTO DE PRODUCTOS:\nNo hay productos disponibles en el contexto actual.';

    prompt = prompt.replace('{product_context}', productContext);

    // Reemplazar placeholder de historial conversacional
    const conversationHistory = data.conversationHistory
        ? `\nHISTORIAL DE CONVERSACIÓN:\n${data.conversationHistory}`
        : '';

    prompt = prompt.replace('{conversation_history}', conversationHistory);

    return prompt;
}

/**
 * Obtiene el template base sin reemplazar placeholders
 * Útil para testing o inspección
 * 
 * @returns Template del system prompt sin procesar
 */
export function getSystemPromptTemplate(): string {
    return SYSTEM_PROMPT_TEMPLATE;
}

/**
 * Valida que un system prompt generado no contenga placeholders sin reemplazar
 * 
 * @param prompt - System prompt a validar
 * @returns true si el prompt es válido, false si contiene placeholders sin reemplazar
 */
export function validateSystemPrompt(prompt: string): boolean {
    // Verificar que no queden placeholders sin reemplazar
    const placeholderPattern = /\{[a-z_]+\}/gi;
    return !placeholderPattern.test(prompt);
}

/**
 * Configuración por defecto del system prompt
 */
export const SystemPromptConfig = {
    maxProductContextLength: 2000, // Máximo de caracteres para contexto de productos
    maxConversationHistoryLength: 1000, // Máximo de caracteres para historial
    includeTimestamps: false, // Si incluir timestamps en el historial
} as const;

export default {
    buildSystemPrompt,
    getSystemPromptTemplate,
    validateSystemPrompt,
    SystemPromptConfig,
};
