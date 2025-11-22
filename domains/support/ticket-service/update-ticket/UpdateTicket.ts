/**
 * Caso de uso: Actualizar ticket
 * Extraído del método updateTicket() de TicketService
 */

import { TicketRepository } from '../shared/repositories/TicketRepository';
import { ITicket, UpdateTicketRequest, TicketStatus } from '../shared/types';

export class UpdateTicket {
  constructor(private ticketRepository: TicketRepository) {}

  async execute(ticketId: number, updateData: UpdateTicketRequest): Promise<ITicket | null> {
    const ticket = await this.ticketRepository.updateTicket(ticketId, updateData);
    
    if (ticket && updateData.status) {
      // Add system message for status changes (LÓGICA ORIGINAL)
      const statusMessage = this.getStatusChangeMessage(updateData.status);
      await this.ticketRepository.addMessage(ticketId, {
        sender_type: 'system',
        sender_name: 'Sistema TechNovaStore',
        message: statusMessage
      });
    }

    return ticket;
  }

  /**
   * Get status change message (LÓGICA ORIGINAL)
   */
  private getStatusChangeMessage(status: TicketStatus): string {
    switch (status) {
      case TicketStatus.IN_PROGRESS:
        return 'Ticket asignado y en proceso de resolución.';
      case TicketStatus.WAITING_CUSTOMER:
        return 'Esperando respuesta del cliente.';
      case TicketStatus.RESOLVED:
        return 'Ticket resuelto. Si el problema persiste, puede responder a este ticket.';
      case TicketStatus.CLOSED:
        return 'Ticket cerrado. Gracias por contactarnos.';
      default:
        return `Estado del ticket actualizado a: ${status}`;
    }
  }
}
