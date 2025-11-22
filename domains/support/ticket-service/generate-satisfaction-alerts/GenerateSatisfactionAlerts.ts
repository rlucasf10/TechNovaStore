/**
 * Caso de uso: Generar alertas de satisfacción
 * Extraído del método generateSatisfactionAlerts() de SatisfactionService
 * TODA LA LÓGICA ORIGINAL PRESERVADA
 */

import { GetSatisfactionMetrics, SatisfactionMetrics } from '../get-satisfaction-metrics/GetSatisfactionMetrics';

export interface SatisfactionAlert {
  type: 'low_rating' | 'negative_trend' | 'low_response_rate';
  severity: 'low' | 'medium' | 'high';
  message: string;
  metric_value: number;
  threshold: number;
  recommendations: string[];
}

export class GenerateSatisfactionAlerts {
  constructor(private getSatisfactionMetrics: GetSatisfactionMetrics) {}

  async execute(
    startDate?: Date,
    endDate?: Date
  ): Promise<SatisfactionAlert[]> {
    const metrics = await this.getSatisfactionMetrics.execute(startDate, endDate);
    const alerts: SatisfactionAlert[] = [];

    // Check for low overall satisfaction (LÓGICA ORIGINAL)
    if (metrics.overall_satisfaction.average_rating < 3.0 && 
        metrics.overall_satisfaction.total_responses >= 10) {
      alerts.push({
        type: 'low_rating',
        severity: 'high',
        message: 'La satisfacción general está por debajo del umbral aceptable',
        metric_value: metrics.overall_satisfaction.average_rating,
        threshold: 3.0,
        recommendations: [
          'Revisar los procesos de atención al cliente',
          'Capacitar al equipo de soporte en mejores prácticas',
          'Analizar los comentarios negativos para identificar patrones'
        ]
      });
    }

    // Check for low response time satisfaction (LÓGICA ORIGINAL)
    if (metrics.response_time_satisfaction.average_rating < 3.5 && 
        metrics.response_time_satisfaction.total_responses >= 10) {
      alerts.push({
        type: 'low_rating',
        severity: 'medium',
        message: 'Los clientes no están satisfechos con los tiempos de respuesta',
        metric_value: metrics.response_time_satisfaction.average_rating,
        threshold: 3.5,
        recommendations: [
          'Reducir los tiempos de primera respuesta',
          'Implementar respuestas automáticas de confirmación',
          'Aumentar el personal de soporte en horarios pico'
        ]
      });
    }

    // Check for negative NPS (LÓGICA ORIGINAL)
    if (metrics.nps_score < 0) {
      alerts.push({
        type: 'negative_trend',
        severity: 'high',
        message: 'El Net Promoter Score es negativo',
        metric_value: metrics.nps_score,
        threshold: 0,
        recommendations: [
          'Implementar programa de mejora de experiencia del cliente',
          'Realizar entrevistas en profundidad con clientes insatisfechos',
          'Revisar y mejorar los procesos de resolución de problemas'
        ]
      });
    }

    return alerts;
  }
}
