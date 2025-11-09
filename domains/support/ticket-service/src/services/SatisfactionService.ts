import { TicketService } from './TicketService';
import { ISatisfactionSurvey, ITicketMetrics, CreateSatisfactionSurveyRequest } from '../types';

export interface SatisfactionMetrics {
  overall_satisfaction: {
    average_rating: number;
    total_responses: number;
    rating_distribution: Record<number, number>; // 1-5 scale
  };
  response_time_satisfaction: {
    average_rating: number;
    total_responses: number;
  };
  resolution_quality_satisfaction: {
    average_rating: number;
    total_responses: number;
  };
  agent_helpfulness_satisfaction: {
    average_rating: number;
    total_responses: number;
  };
  satisfaction_trends: {
    period: string;
    average_rating: number;
    response_count: number;
  }[];
  nps_score: number; // Net Promoter Score
  satisfaction_by_category: Record<string, {
    average_rating: number;
    response_count: number;
  }>;
}

export interface SatisfactionAlert {
  type: 'low_rating' | 'negative_trend' | 'low_response_rate';
  severity: 'low' | 'medium' | 'high';
  message: string;
  metric_value: number;
  threshold: number;
  recommendations: string[];
}

export class SatisfactionService {
  private ticketService: TicketService;

  constructor(ticketService: TicketService) {
    this.ticketService = ticketService;
  }

  /**
   * Create satisfaction survey for a ticket
   */
  async createSatisfactionSurvey(
    ticketId: number,
    surveyData: CreateSatisfactionSurveyRequest
  ): Promise<ISatisfactionSurvey> {
    // Validate ratings are within range
    this.validateRating(surveyData.rating, 'overall rating');
    this.validateRating(surveyData.response_time_rating, 'response time rating');
    this.validateRating(surveyData.resolution_quality_rating, 'resolution quality rating');
    this.validateRating(surveyData.agent_helpfulness_rating, 'agent helpfulness rating');

    const survey = await this.ticketService.createSatisfactionSurvey(ticketId, surveyData);

    // Add system message to ticket about survey completion
    await this.ticketService.addMessage(ticketId, {
      sender_type: 'system',
      sender_name: 'Sistema de Satisfacción',
      message: `Cliente completó encuesta de satisfacción. Puntuación general: ${surveyData.rating}/5`,
      is_internal: true
    });

    // Check for low satisfaction and create alerts
    await this.checkSatisfactionAlerts(survey);

    return survey;
  }

  /**
   * Get comprehensive satisfaction metrics
   */
  async getSatisfactionMetrics(
    startDate?: Date,
    endDate?: Date,
    includeTicketMetrics: boolean = true
  ): Promise<SatisfactionMetrics & { ticket_metrics?: ITicketMetrics }> {
    // This would typically query the database directly
    // For now, we'll create a placeholder implementation
    const metrics: SatisfactionMetrics = {
      overall_satisfaction: {
        average_rating: 0,
        total_responses: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      },
      response_time_satisfaction: {
        average_rating: 0,
        total_responses: 0
      },
      resolution_quality_satisfaction: {
        average_rating: 0,
        total_responses: 0
      },
      agent_helpfulness_satisfaction: {
        average_rating: 0,
        total_responses: 0
      },
      satisfaction_trends: [],
      nps_score: 0,
      satisfaction_by_category: {}
    };

    // In a real implementation, this would query the satisfaction_surveys table
    // and calculate all these metrics from the database

    let result: SatisfactionMetrics & { ticket_metrics?: ITicketMetrics } = metrics;

    if (includeTicketMetrics) {
      const ticketMetrics = await this.ticketService.getTicketMetrics(startDate, endDate);
      result.ticket_metrics = ticketMetrics;
    }

    return result;
  }

  /**
   * Generate satisfaction alerts based on metrics
   */
  async generateSatisfactionAlerts(
    startDate?: Date,
    endDate?: Date
  ): Promise<SatisfactionAlert[]> {
    const metrics = await this.getSatisfactionMetrics(startDate, endDate);
    const alerts: SatisfactionAlert[] = [];

    // Check for low overall satisfaction
    if (metrics.overall_satisfaction.average_rating < 3.0 && 
        metrics.overall_satisfaction.total_responses >= 10) {
      alerts.push({
        type: 'low_rating',
        severity: 'high',
        message: 'La satisfacción general está por debajo del umbral aceptable',
        metric_value: metrics.overall_satisfaction.average_rating,
        threshold: 3.0,
        recommendations: [
          'Revisar los procesos de atención al cliente',
          'Capacitar al equipo de soporte en mejores prácticas',
          'Analizar los comentarios negativos para identificar patrones'
        ]
      });
    }

    // Check for low response time satisfaction
    if (metrics.response_time_satisfaction.average_rating < 3.5 && 
        metrics.response_time_satisfaction.total_responses >= 10) {
      alerts.push({
        type: 'low_rating',
        severity: 'medium',
        message: 'Los clientes no están satisfechos con los tiempos de respuesta',
        metric_value: metrics.response_time_satisfaction.average_rating,
        threshold: 3.5,
        recommendations: [
          'Reducir los tiempos de primera respuesta',
          'Implementar respuestas automáticas de confirmación',
          'Aumentar el personal de soporte en horarios pico'
        ]
      });
    }

    // Check for negative NPS
    if (metrics.nps_score < 0) {
      alerts.push({
        type: 'negative_trend',
        severity: 'high',
        message: 'El Net Promoter Score es negativo',
        metric_value: metrics.nps_score,
        threshold: 0,
        recommendations: [
          'Implementar programa de mejora de experiencia del cliente',
          'Realizar entrevistas en profundidad con clientes insatisfechos',
          'Revisar y mejorar los procesos de resolución de problemas'
        ]
      });
    }

    return alerts;
  }

  /**
   * Send satisfaction survey to customer
   */
  async sendSatisfactionSurvey(ticketId: number): Promise<{ surveyUrl: string; expiresAt: Date }> {
    const ticket = await this.ticketService.getTicketById(ticketId);
    
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Generate survey token and URL
    const surveyToken = this.generateSurveyToken(ticketId);
    const surveyUrl = `${process.env.FRONTEND_URL}/satisfaction-survey/${surveyToken}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // In a real implementation, you would:
    // 1. Store the survey token in the database
    // 2. Send an email to the customer with the survey link
    // 3. Set up the survey expiration

    // Add system message about survey sent
    await this.ticketService.addMessage(ticketId, {
      sender_type: 'system',
      sender_name: 'Sistema de Satisfacción',
      message: 'Encuesta de satisfacción enviada al cliente por email',
      is_internal: true
    });

    return { surveyUrl, expiresAt };
  }

  /**
   * Get satisfaction trends over time
   */
  async getSatisfactionTrends(
    period: 'daily' | 'weekly' | 'monthly' = 'weekly',
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{
    period: string;
    average_rating: number;
    response_count: number;
    nps_score: number;
  }>> {
    // This would typically query the database and group by time periods
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Analyze satisfaction feedback text for insights
   */
  analyzeFeedbackSentiment(feedback: string): {
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    keywords: string[];
    suggestions: string[];
  } {
    const lowerFeedback = feedback.toLowerCase();
    
    // Simple sentiment analysis based on keywords
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
   * Check for satisfaction alerts after survey completion
   */
  private async checkSatisfactionAlerts(survey: ISatisfactionSurvey): Promise<void> {
    // Check for very low ratings
    if (survey.rating <= 2) {
      // In a real implementation, this would trigger notifications to management
      console.log(`Low satisfaction alert: Ticket ${survey.ticket_id} received rating ${survey.rating}/5`);
      
      // Add urgent flag to ticket or escalate to management
      await this.ticketService.addMessage(survey.ticket_id, {
        sender_type: 'system',
        sender_name: 'Sistema de Alertas',
        message: `⚠️ ALERTA: Cliente muy insatisfecho (${survey.rating}/5). Requiere seguimiento inmediato.`,
        is_internal: true
      });
    }
  }

  /**
   * Validate rating is within acceptable range
   */
  private validateRating(rating: number, fieldName: string): void {
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      throw new Error(`${fieldName} must be an integer between 1 and 5`);
    }
  }

  /**
   * Generate survey token for secure access
   */
  private generateSurveyToken(ticketId: number): string {
    // In a real implementation, use a proper JWT or secure token generation
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 8);
    return `${ticketId}-${timestamp}-${random}`;
  }

  /**
   * Generate improvement suggestions based on feedback analysis
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