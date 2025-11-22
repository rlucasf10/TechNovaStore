/**
 * Caso de uso: Enviar encuesta de satisfacción al cliente
 * Extraído del método sendSatisfactionSurvey() de SatisfactionService
 * TODA LA LÓGICA ORIGINAL PRESERVADA
 */

import { TicketRepository } from '../shared/repositories/TicketRepository';

export class SendSatisfactionSurvey {
  constructor(private ticketRepository: TicketRepository) {}

  async execute(ticketId: number): Promise<{ surveyUrl: string; expiresAt: Date }> {
    const ticket = await this.ticketRepository.getTicketById(ticketId);
    
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Generate survey token and URL (LÓGICA ORIGINAL)
    const surveyToken = this.generateSurveyToken(ticketId);
    const surveyUrl = `${process.env.FRONTEND_URL}/satisfaction-survey/${surveyToken}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // In a real implementation, you would: (LÓGICA ORIGINAL)
    // 1. Store the survey token in the database
    // 2. Send an email to the customer with the survey link
    // 3. Set up the survey expiration

    // Add system message about survey sent (LÓGICA ORIGINAL)
    await this.ticketRepository.addMessage(ticketId, {
      sender_type: 'system',
      sender_name: 'Sistema de Satisfacción',
      message: 'Encuesta de satisfacción enviada al cliente por email',
      is_internal: true
    });

    return { surveyUrl, expiresAt };
  }

  /**
   * Generate survey token for secure access (LÓGICA ORIGINAL)
   */
  private generateSurveyToken(ticketId: number): string {
    // In a real implementation, use a proper JWT or secure token generation
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 8);
    return `${ticketId}-${timestamp}-${random}`;
  }
}
