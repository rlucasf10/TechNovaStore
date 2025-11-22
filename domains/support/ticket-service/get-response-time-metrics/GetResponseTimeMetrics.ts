/**
 * Caso de uso: Obtener métricas de tiempo de respuesta
 * Extraído del método getResponseTimeMetrics() de TicketService
 * TODA LA LÓGICA ORIGINAL PRESERVADA
 */

import { MetricsService } from '../shared/utils/MetricsService';
import { TicketCategory, TicketPriority } from '../shared/types';

export class GetResponseTimeMetrics {
  constructor(private metricsService: MetricsService) {}

  async execute(
    startDate?: Date,
    endDate?: Date,
    category?: TicketCategory,
    priority?: TicketPriority
  ) {
    return this.metricsService.getResponseTimeMetrics(startDate, endDate, category, priority);
  }
}
