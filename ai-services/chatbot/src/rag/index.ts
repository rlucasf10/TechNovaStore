/**
 * Módulo RAG (Retrieval Augmented Generation)
 * 
 * Este módulo proporciona componentes para implementar RAG en el chatbot:
 * - KeywordExtractor: Extrae keywords, categorías, marcas y especificaciones técnicas
 * - ProductContextFormatter: Formatea productos para inyectar en el prompt de Ollama
 */

export { KeywordExtractor, ExtractedKeywords } from './KeywordExtractor';
export { ProductContextFormatter } from './ProductContextFormatter';
