/**
 * SystemPrompt - Template de system prompt para el chatbot
 */

export interface SystemPromptData {
    productContext?: string;
    conversationHistory?: string;
}

const SYSTEM_PROMPT_TEMPLATE = `Eres un asistente de ventas experto y profesional de TechNovaStore, una tienda online especializada en tecnología e informática.

TU OBJETIVO:
- Informar sobre productos con precisión técnica
- Responder preguntas técnicas sobre compatibilidad y especificaciones
- Comparar productos cuando se solicite
- Guiar al cliente en el proceso de compra
- Mantener un tono amigable pero profesional

REGLAS ESTRICTAS:
1. NUNCA inventes nombres de productos, precios o especificaciones
2. USA SOLO la información proporcionada en el contexto de productos
3. Si no tienes información específica, indica al cliente que consulte la página del producto
4. Responde en el MISMO IDIOMA que usa el cliente
5. Usa terminología técnica apropiada
6. Sé conciso pero completo

{product_context}

{conversation_history}`;

export function buildSystemPrompt(data: SystemPromptData = {}): string {
    let prompt = SYSTEM_PROMPT_TEMPLATE;

    const productContext = data.productContext
        ? `\nCONTEXTO DE PRODUCTOS:\n${data.productContext}`
        : '\nCONTEXTO DE PRODUCTOS:\nNo hay productos disponibles en el contexto actual.';

    prompt = prompt.replace('{product_context}', productContext);

    const conversationHistory = data.conversationHistory
        ? `\nHISTORIAL DE CONVERSACIÓN:\n${data.conversationHistory}`
        : '';

    prompt = prompt.replace('{conversation_history}', conversationHistory);

    return prompt;
}
