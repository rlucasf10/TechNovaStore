/**
 * Caso de uso: Obtener mensajes de un ticket
 * Extraído del método getTicketMessages() de TicketService
 */

import { TicketRepository } from '../shared/repositories/TicketRepository';
import { ITicketMessage } from '../shared/types';

export class GetTicketMessages {
  constructor(private ticketRepository: TicketRepository) {}

  async execute(ticketId: number, includeInternal: boolean = false): Promise<ITicketMessage[]> {
    return this.ticketRepository.getTicketMessages(ticketId, includeInternal);
  }
}
