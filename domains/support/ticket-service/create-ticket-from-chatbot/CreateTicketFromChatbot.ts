/**
 * Caso de uso: Crear ticket desde escalación de chatbot
 * Extraído del método createTicketFromChatbot() de TicketService
 */

import { CreateTicket } from '../create-ticket/CreateTicket';
import { ITicket, CreateTicketRequest, EscalationReason } from '../shared/types';

export class CreateTicketFromChatbot {
  constructor(private createTicket: CreateTicket) {}

  async execute(
    chatSessionId: string,
    customerEmail: string,
    customerName: string,
    subject: string,
    description: string,
    escalationReason: EscalationReason,
    userId?: number,
    orderId?: number
  ): Promise<ITicket> {
    const ticketData: CreateTicketRequest = {
      user_id: userId,
      customer_email: customerEmail,
      customer_name: customerName,
      subject,
      description,
      escalated_from_chatbot: true,
      escalation_reason: escalationReason,
      chat_session_id: chatSessionId,
      order_id: orderId
    };

    return this.createTicket.execute(ticketData);
  }
}
