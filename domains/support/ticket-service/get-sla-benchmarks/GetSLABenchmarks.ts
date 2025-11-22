/**
 * Caso de uso: Obtener benchmarks de SLA
 * Extraído del método getSLABenchmarks() de TicketService
 * TODA LA LÓGICA ORIGINAL PRESERVADA
 */

import { MetricsService } from '../shared/utils/MetricsService';

export class GetSLABenchmarks {
  constructor(private metricsService: MetricsService) {}

  async execute() {
    return this.metricsService.getSLABenchmarks();
  }
}
