/**
 * Prueba simple para verificar la función formatConversationHistory
 * Este archivo es temporal y debe eliminarse después de la verificación
 */

import { NLPEngine, ConversationMessage } from '../NLPEngine';

// Crear instancia del NLPEngine
const nlpEngine = new NLPEngine();

// Crear historial de conversación de prueba
const conversationHistory: ConversationMessage[] = [
  {
    role: 'user',
    content: 'Hola, busco una laptop para gaming',
    timestamp: new Date('2024-10-26T10:00:00Z')
  },
  {
    role: 'assistant',
    content: 'Hola! Te puedo ayudar a encontrar una laptop para gaming. ¿Tienes algún presupuesto en mente?',
    timestamp: new Date('2024-10-26T10:00:05Z')
  },
  {
    role: 'user',
    content: 'Mi presupuesto es de unos 1500 euros',
    timestamp: new Date('2024-10-26T10:00:30Z')
  },
  {
    role: 'assistant',
    content: 'Perfecto! Con ese presupuesto tenemos varias opciones excelentes. ¿Prefieres alguna marca en particular?',
    timestamp: new Date('2024-10-26T10:00:35Z')
  }
];

console.log('=== Prueba de formatConversationHistory ===\n');

console.log('Historial de conversación original:');
console.log(JSON.stringify(conversationHistory, null, 2));

console.log('\n--- Conversión a formato Ollama ---\n');

// Llamar a la función formatConversationHistory
const ollamaMessages = nlpEngine.formatConversationHistory(conversationHistory);

console.log('Mensajes en formato Ollama:');
console.log(JSON.stringify(ollamaMessages, null, 2));

// Verificaciones
console.log('\n=== Verificaciones ===');
console.log(`✓ Número de mensajes: ${ollamaMessages.length} (esperado: ${conversationHistory.length})`);
console.log(`✓ Primer mensaje - role: ${ollamaMessages[0].role} (esperado: user)`);
console.log(`✓ Primer mensaje - content: "${ollamaMessages[0].content.substring(0, 30)}..."`);
console.log(`✓ Segundo mensaje - role: ${ollamaMessages[1].role} (esperado: assistant)`);
console.log(`✓ Segundo mensaje - content: "${ollamaMessages[1].content.substring(0, 30)}..."`);

// Verificar que los roles se mapean correctamente
const rolesCorrect = ollamaMessages.every((msg, index) =>
  msg.role === conversationHistory[index].role
);
console.log(`✓ Roles mapeados correctamente: ${rolesCorrect ? 'SÍ' : 'NO'}`);

// Verificar que el contenido se mapea correctamente
const contentCorrect = ollamaMessages.every((msg, index) =>
  msg.content === conversationHistory[index].content
);
console.log(`✓ Contenido mapeado correctamente: ${contentCorrect ? 'SÍ' : 'NO'}`);

// Verificar que no se incluyen campos adicionales (timestamp, products)
const noExtraFields = ollamaMessages.every(msg =>
  Object.keys(msg).length === 2 && 'role' in msg && 'content' in msg
);
console.log(`✓ Solo campos role y content: ${noExtraFields ? 'SÍ' : 'NO'}`);

console.log('\n=== Prueba completada exitosamente ===');
