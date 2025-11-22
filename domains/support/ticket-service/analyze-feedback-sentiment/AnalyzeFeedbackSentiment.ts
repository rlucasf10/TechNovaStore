/**
 * Caso de uso: Analizar sentimiento del feedback de satisfacción
 * Extraído del método analyzeFeedbackSentiment() de SatisfactionService
 * TODA LA LÓGICA ORIGINAL PRESERVADA
 */

export class AnalyzeFeedbackSentiment {
  constructor() {}

  execute(feedback: string): {
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    keywords: string[];
    suggestions: string[];
  } {
    const lowerFeedback = feedback.toLowerCase();
    
    // Simple sentiment analysis based on keywords (LÓGICA ORIGINAL)
    const positiveKeywords = ['excelente', 'bueno', 'rápido', 'eficiente', 'satisfecho', 'recomiendo'];
    const negativeKeywords = ['malo', 'lento', 'terrible', 'insatisfecho', 'problema', 'decepcionado'];
    
    const positiveCount = positiveKeywords.filter(word => lowerFeedback.includes(word)).length;
    const negativeCount = negativeKeywords.filter(word => lowerFeedback.includes(word)).length;
    
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    let confidence = 0.5;
    
    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      confidence = Math.min(0.9, 0.5 + (positiveCount * 0.1));
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      confidence = Math.min(0.9, 0.5 + (negativeCount * 0.1));
    }
    
    const keywords = [...positiveKeywords, ...negativeKeywords]
      .filter(word => lowerFeedback.includes(word));
    
    const suggestions = this.generateImprovementSuggestions(sentiment, keywords);
    
    return { sentiment, confidence, keywords, suggestions };
  }

  /**
   * Generate improvement suggestions based on feedback analysis (LÓGICA ORIGINAL)
   */
  private generateImprovementSuggestions(
    sentiment: 'positive' | 'neutral' | 'negative',
    keywords: string[]
  ): string[] {
    const suggestions: string[] = [];
    
    if (sentiment === 'negative') {
      if (keywords.includes('lento')) {
        suggestions.push('Mejorar los tiempos de respuesta del equipo de soporte');
      }
      if (keywords.includes('problema')) {
        suggestions.push('Revisar los procesos de resolución de problemas');
      }
      if (keywords.includes('insatisfecho')) {
        suggestions.push('Implementar seguimiento post-resolución para asegurar satisfacción');
      }
    }
    
    if (sentiment === 'positive') {
      if (keywords.includes('rápido')) {
        suggestions.push('Mantener los estándares actuales de tiempo de respuesta');
      }
      if (keywords.includes('eficiente')) {
        suggestions.push('Documentar las mejores prácticas utilizadas');
      }
    }
    
    return suggestions;
  }
}
