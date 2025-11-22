/**
 * Caso de uso: Agregar mensaje a ticket
 * Extraído del método addMessage() de TicketService
 */

import { TicketRepository } from '../shared/repositories/TicketRepository';
import { AuditService, AuditActionType } from '../shared/utils/AuditService';
import { ITicketMessage, AddMessageRequest, TicketStatus } from '../shared/types';

export class AddMessage {
  constructor(
    private ticketRepository: TicketRepository,
    private auditService: AuditService
  ) {}

  async execute(ticketId: number, messageData: AddMessageRequest): Promise<ITicketMessage> {
    const message = await this.ticketRepository.addMessage(ticketId, messageData);

    // Log audit entry for message (LÓGICA ORIGINAL)
    await this.auditService.logAuditEntry(
      ticketId,
      AuditActionType.MESSAGE_ADDED,
      messageData.sender_type,
      messageData.sender_name,
      messageData.sender_id,
      undefined,
      `Message added: ${messageData.message.substring(0, 100)}${messageData.message.length > 100 ? '...' : ''}`,
      { is_internal: messageData.is_internal }
    );

    // Track first response time for agent messages (LÓGICA ORIGINAL)
    if (messageData.sender_type === 'agent') {
      const ticket = await this.ticketRepository.getTicketById(ticketId);
      if (ticket && !ticket.first_response_at) {
        await this.ticketRepository.updateTicket(ticketId, {
          first_response_at: new Date()
        });
      }
    }

    // Auto-update ticket status if customer responds (LÓGICA ORIGINAL)
    if (messageData.sender_type === 'customer') {
      const ticket = await this.ticketRepository.getTicketById(ticketId);
      if (ticket && ticket.status === TicketStatus.WAITING_CUSTOMER) {
        await this.ticketRepository.updateTicket(ticketId, {
          status: TicketStatus.IN_PROGRESS
        });
      }
    }

    return message;
  }
}
