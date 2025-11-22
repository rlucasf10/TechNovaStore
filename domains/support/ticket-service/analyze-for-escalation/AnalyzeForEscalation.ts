/**
 * Caso de uso: Analizar conversación y decidir si se necesita escalación
 * Extraído del método analyzeForEscalation() de EscalationService
 * TODA LA LÓGICA ORIGINAL PRESERVADA
 */

import { EscalationReason, TicketCategory } from '../shared/types';

export interface EscalationContext {
  sessionId: string;
  userId?: number;
  customerEmail: string;
  customerName: string;
  conversationHistory: Array<{
    message: string;
    timestamp: Date;
    sender: 'user' | 'bot';
  }>;
  detectedIntent?: string;
  confidence?: number;
  orderId?: number;
}

export interface EscalationDecision {
  shouldEscalate: boolean;
  reason?: EscalationReason;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  suggestedCategory?: TicketCategory;
  escalationMessage?: string;
}

export class AnalyzeForEscalation {
  constructor() {}

  execute(context: EscalationContext): EscalationDecision {
    const decision: EscalationDecision = {
      shouldEscalate: false
    };

    // Check for explicit escalation requests (LÓGICA ORIGINAL)
    const explicitEscalation = this.checkExplicitEscalationRequest(context);
    if (explicitEscalation.shouldEscalate) {
      return explicitEscalation;
    }

    // Check for low confidence responses (LÓGICA ORIGINAL)
    const confidenceEscalation = this.checkLowConfidence(context);
    if (confidenceEscalation.shouldEscalate) {
      return confidenceEscalation;
    }

    // Check for repetitive unresolved queries (LÓGICA ORIGINAL)
    const repetitiveEscalation = this.checkRepetitiveQueries(context);
    if (repetitiveEscalation.shouldEscalate) {
      return repetitiveEscalation;
    }

    // Check for complex technical queries (LÓGICA ORIGINAL)
    const complexityEscalation = this.checkComplexity(context);
    if (complexityEscalation.shouldEscalate) {
      return complexityEscalation;
    }

    // Check for complaint indicators (LÓGICA ORIGINAL)
    const complaintEscalation = this.checkComplaintIndicators(context);
    if (complaintEscalation.shouldEscalate) {
      return complaintEscalation;
    }

    return decision;
  }

  /**
   * Check for explicit escalation requests (LÓGICA ORIGINAL)
   */
  private checkExplicitEscalationRequest(context: EscalationContext): EscalationDecision {
    const recentMessages = context.conversationHistory.slice(-3);
    const userMessages = recentMessages
      .filter(msg => msg.sender === 'user')
      .map(msg => msg.message.toLowerCase());

    const escalationKeywords = [
      'hablar con una persona',
      'agente humano',
      'soporte técnico',
      'no me ayudas',
      'quiero hablar con alguien',
      'atención al cliente',
      'representante',
      'supervisor',
      'gerente'
    ];

    for (const message of userMessages) {
      for (const keyword of escalationKeywords) {
        if (message.includes(keyword)) {
          return {
            shouldEscalate: true,
            reason: EscalationReason.CUSTOMER_REQUEST,
            priority: 'medium',
            escalationMessage: 'El cliente ha solicitado específicamente hablar con un agente humano.'
          };
        }
      }
    }

    return { shouldEscalate: false };
  }

  /**
   * Check for low confidence in bot responses (LÓGICA ORIGINAL)
   */
  private checkLowConfidence(context: EscalationContext): EscalationDecision {
    if (context.confidence !== undefined && context.confidence < 0.3) {
      return {
        shouldEscalate: true,
        reason: EscalationReason.CHATBOT_LIMITATION,
        priority: 'low',
        escalationMessage: 'El chatbot no pudo entender la consulta del cliente con suficiente confianza.'
      };
    }

    return { shouldEscalate: false };
  }

  /**
   * Check for repetitive unresolved queries (LÓGICA ORIGINAL)
   */
  private checkRepetitiveQueries(context: EscalationContext): EscalationDecision {
    if (context.conversationHistory.length < 6) {
      return { shouldEscalate: false };
    }

    const userMessages = context.conversationHistory
      .filter(msg => msg.sender === 'user')
      .map(msg => msg.message.toLowerCase());

    // Check for similar questions being asked multiple times (LÓGICA ORIGINAL)
    const similarityThreshold = 0.7;
    let repetitiveCount = 0;

    for (let i = 0; i < userMessages.length - 1; i++) {
      for (let j = i + 1; j < userMessages.length; j++) {
        if (this.calculateSimilarity(userMessages[i], userMessages[j]) > similarityThreshold) {
          repetitiveCount++;
        }
      }
    }

    if (repetitiveCount >= 2) {
      return {
        shouldEscalate: true,
        reason: EscalationReason.UNRESOLVED_ISSUE,
        priority: 'medium',
        escalationMessage: 'El cliente ha repetido consultas similares sin obtener una resolución satisfactoria.'
      };
    }

    return { shouldEscalate: false };
  }

  /**
   * Check for complex technical queries (LÓGICA ORIGINAL)
   */
  private checkComplexity(context: EscalationContext): EscalationDecision {
    const recentMessages = context.conversationHistory.slice(-2);
    const userMessages = recentMessages
      .filter(msg => msg.sender === 'user')
      .map(msg => msg.message.toLowerCase());

    const complexKeywords = [
      'compatibilidad específica',
      'configuración avanzada',
      'problema técnico complejo',
      'integración',
      'personalización',
      'desarrollo',
      'api',
      'código de error específico'
    ];

    const technicalTerms = [
      'driver',
      'firmware',
      'bios',
      'overclock',
      'benchmark',
      'latencia',
      'throughput',
      'arquitectura'
    ];

    for (const message of userMessages) {
      const hasComplexKeywords = complexKeywords.some(keyword => message.includes(keyword));
      const hasTechnicalTerms = technicalTerms.filter(term => message.includes(term)).length >= 2;

      if (hasComplexKeywords || hasTechnicalTerms) {
        return {
          shouldEscalate: true,
          reason: EscalationReason.COMPLEX_QUERY,
          priority: 'high',
          suggestedCategory: TicketCategory.TECHNICAL_SUPPORT,
          escalationMessage: 'La consulta requiere conocimiento técnico especializado.'
        };
      }
    }

    return { shouldEscalate: false };
  }

  /**
   * Check for complaint indicators (LÓGICA ORIGINAL)
   */
  private checkComplaintIndicators(context: EscalationContext): EscalationDecision {
    const recentMessages = context.conversationHistory.slice(-3);
    const userMessages = recentMessages
      .filter(msg => msg.sender === 'user')
      .map(msg => msg.message.toLowerCase());

    const complaintKeywords = [
      'estoy molesto',
      'muy insatisfecho',
      'pésimo servicio',
      'quiero quejarme',
      'esto es inaceptable',
      'voy a dejar una mala reseña',
      'quiero mi dinero de vuelta',
      'esto es una estafa',
      'nunca más compro aquí'
    ];

    const emotionalIndicators = [
      'furioso',
      'enojado',
      'indignado',
      'decepcionado',
      'frustrado'
    ];

    for (const message of userMessages) {
      const hasComplaintKeywords = complaintKeywords.some(keyword => message.includes(keyword));
      const hasEmotionalIndicators = emotionalIndicators.some(indicator => message.includes(indicator));

      if (hasComplaintKeywords || hasEmotionalIndicators) {
        return {
          shouldEscalate: true,
          reason: EscalationReason.COMPLAINT_ESCALATION,
          priority: 'urgent',
          suggestedCategory: TicketCategory.COMPLAINT,
          escalationMessage: 'El cliente muestra signos de insatisfacción que requieren atención inmediata.'
        };
      }
    }

    return { shouldEscalate: false };
  }

  /**
   * Calculate similarity between two strings (simple implementation) (LÓGICA ORIGINAL)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    
    return commonWords.length / Math.max(words1.length, words2.length);
  }
}
