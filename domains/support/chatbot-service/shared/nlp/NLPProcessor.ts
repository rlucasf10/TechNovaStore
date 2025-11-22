/**
 * NLPProcessor - Procesador de lenguaje natural
 * 
 * Versión simplificada que no depende de Python/spaCy
 * Usa la librería 'natural' de Node.js para procesamiento básico
 */

import natural from 'natural';

export class NLPProcessor {
  private tokenizer: natural.WordTokenizer;

  constructor() {
    this.tokenizer = new natural.WordTokenizer();
  }

  /**
   * Extrae keywords del texto
   */
  async extractKeywords(text: string): Promise<string[]> {
    const tokens = this.tokenizer.tokenize(text.toLowerCase()) || [];
    
    // Filtrar stopwords básicas
    const stopwords = new Set(['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'por', 'con']);
    
    return tokens.filter(token => 
      token.length > 2 && 
      !stopwords.has(token)
    );
  }

  /**
   * Analiza el sentimiento del texto (implementación básica)
   */
  async analyzeSentiment(text: string): Promise<'positive' | 'negative' | 'neutral'> {
    const positiveWords = ['bueno', 'excelente', 'genial', 'perfecto', 'gracias'];
    const negativeWords = ['malo', 'terrible', 'problema', 'error', 'fallo'];
    
    const lowerText = text.toLowerCase();
    
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }
}
