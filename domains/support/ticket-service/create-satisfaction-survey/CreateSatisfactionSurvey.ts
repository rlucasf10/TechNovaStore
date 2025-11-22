/**
 * Caso de uso: Crear encuesta de satisfacción
 * Extraído del método createSatisfactionSurvey() de SatisfactionService
 * TODA LA LÓGICA ORIGINAL PRESERVADA
 */

import { TicketRepository } from '../shared/repositories/TicketRepository';
import { ISatisfactionSurvey, CreateSatisfactionSurveyRequest } from '../shared/types';

export class CreateSatisfactionSurvey {
  constructor(private ticketRepository: TicketRepository) {}

  async execute(
    ticketId: number,
    surveyData: CreateSatisfactionSurveyRequest
  ): Promise<ISatisfactionSurvey> {
    // Validate ratings are within range (LÓGICA ORIGINAL)
    this.validateRating(surveyData.rating, 'overall rating');
    this.validateRating(surveyData.response_time_rating, 'response time rating');
    this.validateRating(surveyData.resolution_quality_rating, 'resolution quality rating');
    this.validateRating(surveyData.agent_helpfulness_rating, 'agent helpfulness rating');

    const survey = await this.ticketRepository.createSatisfactionSurvey(ticketId, surveyData);

    // Add system message to ticket about survey completion (LÓGICA ORIGINAL)
    await this.ticketRepository.addMessage(ticketId, {
      sender_type: 'system',
      sender_name: 'Sistema de Satisfacción',
      message: `Cliente completó encuesta de satisfacción. Puntuación general: ${surveyData.rating}/5`,
      is_internal: true
    });

    // Check for low satisfaction and create alerts (LÓGICA ORIGINAL)
    await this.checkSatisfactionAlerts(survey);

    return survey;
  }

  /**
   * Validate rating is within acceptable range (LÓGICA ORIGINAL)
   */
  private validateRating(rating: number, fieldName: string): void {
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      throw new Error(`${fieldName} must be an integer between 1 and 5`);
    }
  }

  /**
   * Check for satisfaction alerts after survey completion (LÓGICA ORIGINAL)
   */
  private async checkSatisfactionAlerts(survey: ISatisfactionSurvey): Promise<void> {
    // Check for very low ratings (LÓGICA ORIGINAL)
    if (survey.rating <= 2) {
      // In a real implementation, this would trigger notifications to management
      console.log(`Low satisfaction alert: Ticket ${survey.ticket_id} received rating ${survey.rating}/5`);
      
      // Add urgent flag to ticket or escalate to management (LÓGICA ORIGINAL)
      await this.ticketRepository.addMessage(survey.ticket_id, {
        sender_type: 'system',
        sender_name: 'Sistema de Alertas',
        message: `⚠️ ALERTA: Cliente muy insatisfecho (${survey.rating}/5). Requiere seguimiento inmediato.`,
        is_internal: true
      });
    }
  }
}
