/**
 * Caso de uso: Obtener ticket por ID o número
 * Extraído de los métodos getTicketById() y getTicketByNumber() de TicketService
 */

import { TicketRepository } from '../shared/repositories/TicketRepository';
import { ITicket } from '../shared/types';

export class GetTicket {
  constructor(private ticketRepository: TicketRepository) {}

  async executeById(ticketId: number): Promise<ITicket | null> {
    return this.ticketRepository.getTicketById(ticketId);
  }

  async executeByNumber(ticketNumber: string): Promise<ITicket | null> {
    return this.ticketRepository.getTicketByNumber(ticketNumber);
  }
}
