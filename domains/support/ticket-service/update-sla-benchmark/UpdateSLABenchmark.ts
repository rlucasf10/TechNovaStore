/**
 * Caso de uso: Actualizar benchmark de SLA
 * Extraído del método updateSLABenchmark() de TicketService
 * TODA LA LÓGICA ORIGINAL PRESERVADA
 */

import { MetricsService } from '../shared/utils/MetricsService';
import { TicketCategory, TicketPriority } from '../shared/types';

export class UpdateSLABenchmark {
  constructor(private metricsService: MetricsService) {}

  async execute(
    category: TicketCategory,
    priority: TicketPriority,
    targetFirstResponseMinutes: number,
    targetResolutionHours: number,
    escalationThresholdHours: number
  ) {
    return this.metricsService.updateSLABenchmark(
      category,
      priority,
      targetFirstResponseMinutes,
      targetResolutionHours,
      escalationThresholdHours
    );
  }
}
