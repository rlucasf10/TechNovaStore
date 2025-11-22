/**
 * Caso de uso: Obtener métricas básicas de tickets
 * Extraído del método getTicketMetrics() de TicketService
 * TODA LA LÓGICA ORIGINAL PRESERVADA
 */

import { TicketRepository } from '../shared/repositories/TicketRepository';
import { ITicketMetrics } from '../shared/types';

export class GetTicketMetrics {
  constructor(private ticketRepository: TicketRepository) {}

  async execute(startDate?: Date, endDate?: Date): Promise<ITicketMetrics> {
    return this.ticketRepository.getTicketMetrics(startDate, endDate);
  }
}
