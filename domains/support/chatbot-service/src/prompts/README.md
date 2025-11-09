# System Prompt para Chatbot de TechNovaStore

Este directorio contiene el template del system prompt especializado para el chatbot conversacional de e-commerce.

## Uso

```typescript
import { buildSystemPrompt, SystemPromptData } from './SystemPrompt';

// Ejemplo 1: Prompt básico sin contexto
const basicPrompt = buildSystemPrompt();

// Ejemplo 2: Prompt con contexto de productos
const productContext = `
PRODUCTOS DISPONIBLES:

1. Laptop Gaming ASUS ROG Strix G15
   - SKU: LAP-ASUS-001
   - Marca: ASUS
   - Precio: €1299.99
   - Disponibilidad: En stock
   - Descripción: Laptop gaming de alto rendimiento con procesador AMD Ryzen 7...
   - Especificaciones:
     * CPU: AMD Ryzen 7 5800H
     * GPU: NVIDIA RTX 3060 6GB
     * RAM: 16GB DDR4
     * Almacenamiento: 512GB NVMe SSD
     * Pantalla: 15.6" FHD 144Hz

2. Laptop Dell XPS 13
   - SKU: LAP-DELL-002
   - Marca: Dell
   - Precio: €1099.99
   - Disponibilidad: En stock
   - Descripción: Ultrabook premium para productividad...
`;

const conversationHistory = `
Usuario: Hola, busco una laptop para gaming
Asistente: ¡Hola! Claro, puedo ayudarte a encontrar una laptop para gaming. ¿Tienes algún presupuesto en mente?
Usuario: Hasta 1500 euros
`;

const promptData: SystemPromptData = {
  productContext,
  conversationHistory,
};

const fullPrompt = buildSystemPrompt(promptData);
```

## Características

### Reglas Estrictas

- **No inventar datos**: El asistente solo usa información del contexto proporcionado
- **Respuestas multiidioma**: Responde en el mismo idioma que usa el cliente
- **Especialización técnica**: Manejo de consultas técnicas sobre hardware y software
- **Enfoque inteligente**: Prioriza e-commerce y tecnología, pero mantiene conversaciones naturales

### Manejo de Consultas Técnicas

El prompt incluye instrucciones específicas para:

- Preguntas de compatibilidad de hardware
- Comparaciones técnicas entre productos
- Recomendaciones basadas en especificaciones
- Uso de terminología técnica apropiada

### Placeholders

- `{product_context}`: Información de productos recuperada via RAG
- `{conversation_history}`: Últimos intercambios de la conversación

## Validación

```typescript
import { validateSystemPrompt } from './SystemPrompt';

const prompt = buildSystemPrompt(data);
const isValid = validateSystemPrompt(prompt);

if (!isValid) {
  console.error('El prompt contiene placeholders sin reemplazar');
}
```

## Configuración

```typescript
import { SystemPromptConfig } from './SystemPrompt';

// Límites configurables
console.log(SystemPromptConfig.maxProductContextLength); // 2000 caracteres
console.log(SystemPromptConfig.maxConversationHistoryLength); // 1000 caracteres
```

## Integración con NLPEngine

El `NLPEngine` usará este módulo para construir el system prompt antes de enviar solicitudes a Ollama:

```typescript
import { buildSystemPrompt } from './prompts/SystemPrompt';

// En NLPEngine.processWithOllama()
const productContext = this.formatProductContext(products);
const conversationHistory = this.formatConversationHistory(
  context.conversationHistory
);

const systemPrompt = buildSystemPrompt({
  productContext,
  conversationHistory,
});

const messages = [
  { role: 'system', content: systemPrompt },
  { role: 'user', content: userInput },
];

const response = await this.ollamaAdapter.generateResponse(messages);
```

## Ajustes Futuros

El system prompt puede necesitar ajustes iterativos basados en:

- Calidad de respuestas en producción
- Feedback de usuarios
- Casos de uso no contemplados
- Optimización de temperatura del modelo

Se recomienda revisar y refinar el prompt cada semana durante el primer mes de despliegue.
