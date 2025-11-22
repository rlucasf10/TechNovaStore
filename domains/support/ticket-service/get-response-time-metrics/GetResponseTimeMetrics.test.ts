/**
 * Tests para GetResponseTimeMetrics
 * Cobertura: Obtención de métricas de tiempo de respuesta
 */

import { GetResponseTimeMetrics } from './GetResponseTimeMetrics';
import { MetricsService } from '../shared/utils/MetricsService';
import { TicketCategory, TicketPriority } from '../shared/types';

describe('GetResponseTimeMetrics', () => {
  let getResponseTimeMetrics: GetResponseTimeMetrics;
  let mockMetricsService: jest.Mocked<MetricsService>;

  beforeEach(() => {
    mockMetricsService = {
      getResponseTimeMetrics: jest.fn()
    } as any;

    getResponseTimeMetrics = new GetResponseTimeMetrics(mockMetricsService);
  });

  it('debe obtener métricas sin filtros', async () => {
    // Arrange
    const expectedMetrics = [
      {
        category: TicketCategory.TECHNICAL_SUPPORT,
        priority: TicketPriority.HIGH,
        average_first_response_minutes: 15,
        average_resolution_hours: 4,
        first_response_sla_compliance: 95,
        resolution_sla_compliance: 90,
        total_tickets: 100,
        tickets_within_sla: 90,
        tickets_breached_sla: 10
      }
    ];
    mockMetricsService.getResponseTimeMetrics.mockResolvedValue(expectedMetrics);

    // Act
    const result = await getResponseTimeMetrics.execute();

    // Assert
    expect(mockMetricsService.getResponseTimeMetrics).toHaveBeenCalledWith(undefined, undefined, undefined, undefined);
    expect(result).toEqual(expectedMetrics);
  });

  it('debe obtener métricas con rango de fechas', async () => {
    // Arrange
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');
    mockMetricsService.getResponseTimeMetrics.mockResolvedValue([]);

    // Act
    await getResponseTimeMetrics.execute(startDate, endDate);

    // Assert
    expect(mockMetricsService.getResponseTimeMetrics).toHaveBeenCalledWith(startDate, endDate, undefined, undefined);
  });

  it('debe obtener métricas filtradas por categoría', async () => {
    // Arrange
    const category = TicketCategory.PAYMENT_PROBLEM;
    mockMetricsService.getResponseTimeMetrics.mockResolvedValue([]);

    // Act
    await getResponseTimeMetrics.execute(undefined, undefined, category);

    // Assert
    expect(mockMetricsService.getResponseTimeMetrics).toHaveBeenCalledWith(undefined, undefined, category, undefined);
  });

  it('debe obtener métricas filtradas por prioridad', async () => {
    // Arrange
    const priority = TicketPriority.URGENT;
    mockMetricsService.getResponseTimeMetrics.mockResolvedValue([]);

    // Act
    await getResponseTimeMetrics.execute(undefined, undefined, undefined, priority);

    // Assert
    expect(mockMetricsService.getResponseTimeMetrics).toHaveBeenCalledWith(undefined, undefined, undefined, priority);
  });

  it('debe obtener métricas con todos los filtros', async () => {
    // Arrange
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');
    const category = TicketCategory.TECHNICAL_SUPPORT;
    const priority = TicketPriority.HIGH;
    mockMetricsService.getResponseTimeMetrics.mockResolvedValue([]);

    // Act
    await getResponseTimeMetrics.execute(startDate, endDate, category, priority);

    // Assert
    expect(mockMetricsService.getResponseTimeMetrics).toHaveBeenCalledWith(startDate, endDate, category, priority);
  });

  it('debe propagar errores del servicio', async () => {
    // Arrange
    const error = new Error('Error de base de datos');
    mockMetricsService.getResponseTimeMetrics.mockRejectedValue(error);

    // Act & Assert
    await expect(getResponseTimeMetrics.execute()).rejects.toThrow('Error de base de datos');
  });
});
