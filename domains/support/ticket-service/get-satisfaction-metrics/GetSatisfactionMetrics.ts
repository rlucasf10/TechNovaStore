/**
 * Caso de uso: Obtener métricas de satisfacción
 * Extraído del método getSatisfactionMetrics() de SatisfactionService
 * TODA LA LÓGICA ORIGINAL PRESERVADA
 */

import { TicketRepository } from '../shared/repositories/TicketRepository';
import { ITicketMetrics } from '../shared/types';

export interface SatisfactionMetrics {
  overall_satisfaction: {
    average_rating: number;
    total_responses: number;
    rating_distribution: Record<number, number>; // 1-5 scale
  };
  response_time_satisfaction: {
    average_rating: number;
    total_responses: number;
  };
  resolution_quality_satisfaction: {
    average_rating: number;
    total_responses: number;
  };
  agent_helpfulness_satisfaction: {
    average_rating: number;
    total_responses: number;
  };
  satisfaction_trends: {
    period: string;
    average_rating: number;
    response_count: number;
  }[];
  nps_score: number; // Net Promoter Score
  satisfaction_by_category: Record<string, {
    average_rating: number;
    response_count: number;
  }>;
}

export class GetSatisfactionMetrics {
  constructor(private ticketRepository: TicketRepository) {}

  async execute(
    startDate?: Date,
    endDate?: Date,
    includeTicketMetrics: boolean = true
  ): Promise<SatisfactionMetrics & { ticket_metrics?: ITicketMetrics }> {
    // This would typically query the database directly (LÓGICA ORIGINAL)
    // For now, we'll create a placeholder implementation
    const metrics: SatisfactionMetrics = {
      overall_satisfaction: {
        average_rating: 0,
        total_responses: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      },
      response_time_satisfaction: {
        average_rating: 0,
        total_responses: 0
      },
      resolution_quality_satisfaction: {
        average_rating: 0,
        total_responses: 0
      },
      agent_helpfulness_satisfaction: {
        average_rating: 0,
        total_responses: 0
      },
      satisfaction_trends: [],
      nps_score: 0,
      satisfaction_by_category: {}
    };

    // In a real implementation, this would query the satisfaction_surveys table
    // and calculate all these metrics from the database (LÓGICA ORIGINAL)

    let result: SatisfactionMetrics & { ticket_metrics?: ITicketMetrics } = metrics;

    if (includeTicketMetrics) {
      const ticketMetrics = await this.ticketRepository.getTicketMetrics(startDate, endDate);
      result.ticket_metrics = ticketMetrics;
    }

    return result;
  }
}
