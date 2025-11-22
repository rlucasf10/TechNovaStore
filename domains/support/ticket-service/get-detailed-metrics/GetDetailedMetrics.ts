/**
 * Caso de uso: Obtener métricas detalladas con tiempos de respuesta y cumplimiento de SLA
 * Extraído del método getDetailedMetrics() de TicketService
 * TODA LA LÓGICA ORIGINAL PRESERVADA
 */

import { MetricsService } from '../shared/utils/MetricsService';

export class GetDetailedMetrics {
  constructor(private metricsService: MetricsService) {}

  async execute(startDate?: Date, endDate?: Date) {
    return this.metricsService.getDetailedTicketMetrics(startDate, endDate);
  }
}
