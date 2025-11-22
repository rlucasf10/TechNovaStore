/**
 * Tests para GetDetailedMetrics
 * Cobertura: Obtención de métricas detalladas con SLA
 */

import { GetDetailedMetrics } from './GetDetailedMetrics';
import { MetricsService } from '../shared/utils/MetricsService';

describe('GetDetailedMetrics', () => {
  let getDetailedMetrics: GetDetailedMetrics;
  let mockMetricsService: jest.Mocked<MetricsService>;

  beforeEach(() => {
    mockMetricsService = {
      getDetailedTicketMetrics: jest.fn()
    } as any;

    getDetailedMetrics = new GetDetailedMetrics(mockMetricsService);
  });

  it('debe obtener métricas detalladas sin filtros', async () => {
    // Arrange
    const expectedMetrics = {
      overview: {
        total_tickets: 100,
        open_tickets: 20,
        resolved_tickets: 70,
        closed_tickets: 10,
        average_resolution_time_hours: 24,
        average_first_response_minutes: 30,
        overall_sla_compliance: 85
      },
      by_category: {
        general_inquiry: { total: 0, avg_resolution_hours: 0, avg_first_response_minutes: 0, sla_compliance: 0 },
        product_question: { total: 0, avg_resolution_hours: 0, avg_first_response_minutes: 0, sla_compliance: 0 },
        order_issue: { total: 0, avg_resolution_hours: 0, avg_first_response_minutes: 0, sla_compliance: 0 },
        payment_problem: { total: 0, avg_resolution_hours: 0, avg_first_response_minutes: 0, sla_compliance: 0 },
        shipping_inquiry: { total: 0, avg_resolution_hours: 0, avg_first_response_minutes: 0, sla_compliance: 0 },
        technical_support: { total: 0, avg_resolution_hours: 0, avg_first_response_minutes: 0, sla_compliance: 0 },
        complaint: { total: 0, avg_resolution_hours: 0, avg_first_response_minutes: 0, sla_compliance: 0 },
        refund_request: { total: 0, avg_resolution_hours: 0, avg_first_response_minutes: 0, sla_compliance: 0 }
      },
      by_priority: {
        low: { total: 0, avg_resolution_hours: 0, avg_first_response_minutes: 0, sla_compliance: 0 },
        medium: { total: 0, avg_resolution_hours: 0, avg_first_response_minutes: 0, sla_compliance: 0 },
        high: { total: 0, avg_resolution_hours: 0, avg_first_response_minutes: 0, sla_compliance: 0 },
        urgent: { total: 0, avg_resolution_hours: 0, avg_first_response_minutes: 0, sla_compliance: 0 }
      },
      response_time_trends: [],
      sla_breaches: []
    };
    mockMetricsService.getDetailedTicketMetrics.mockResolvedValue(expectedMetrics);

    // Act
    const result = await getDetailedMetrics.execute();

    // Assert
    expect(mockMetricsService.getDetailedTicketMetrics).toHaveBeenCalledWith(undefined, undefined);
    expect(result).toEqual(expectedMetrics);
  });

  it('debe obtener métricas con rango de fechas', async () => {
    // Arrange
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');
    mockMetricsService.getDetailedTicketMetrics.mockResolvedValue({} as any);

    // Act
    await getDetailedMetrics.execute(startDate, endDate);

    // Assert
    expect(mockMetricsService.getDetailedTicketMetrics).toHaveBeenCalledWith(startDate, endDate);
  });

  it('debe propagar errores del servicio', async () => {
    // Arrange
    const error = new Error('Error de base de datos');
    mockMetricsService.getDetailedTicketMetrics.mockRejectedValue(error);

    // Act & Assert
    await expect(getDetailedMetrics.execute()).rejects.toThrow('Error de base de datos');
  });
});
