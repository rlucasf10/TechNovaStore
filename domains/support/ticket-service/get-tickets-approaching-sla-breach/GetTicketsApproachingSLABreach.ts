/**
 * Caso de uso: Obtener tickets que se acercan a violar el SLA
 * Extraído del método getTicketsApproachingSLABreach() de TicketService
 * TODA LA LÓGICA ORIGINAL PRESERVADA
 */

import { MetricsService } from '../shared/utils/MetricsService';

export class GetTicketsApproachingSLABreach {
  constructor(private metricsService: MetricsService) {}

  async execute() {
    return this.metricsService.getTicketsApproachingSLABreach();
  }
}
