/**
 * Caso de uso: Resolver ticket
 * Extraído del método resolveTicket() de TicketService
 */

import { TicketRepository } from '../shared/repositories/TicketRepository';
import { ITicket, TicketStatus } from '../shared/types';

export class ResolveTicket {
  constructor(private ticketRepository: TicketRepository) {}

  async execute(
    ticketId: number,
    resolutionMessage: string,
    agentId?: number,
    agentName?: string
  ): Promise<ITicket | null> {
    // Add resolution message (LÓGICA ORIGINAL)
    await this.ticketRepository.addMessage(ticketId, {
      sender_type: 'agent',
      sender_id: agentId,
      sender_name: agentName || 'Agente de Soporte',
      message: resolutionMessage
    });

    // Update ticket status (LÓGICA ORIGINAL)
    return this.ticketRepository.updateTicket(ticketId, {
      status: TicketStatus.RESOLVED
    });
  }
}
