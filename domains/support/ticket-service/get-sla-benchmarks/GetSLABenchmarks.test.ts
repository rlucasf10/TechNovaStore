/**
 * Tests para GetSLABenchmarks
 * Cobertura: Obtención de benchmarks de SLA
 */

import { GetSLABenchmarks } from './GetSLABenchmarks';
import { MetricsService } from '../shared/utils/MetricsService';
import { TicketCategory, TicketPriority } from '../shared/types';

describe('GetSLABenchmarks', () => {
  let getSLABenchmarks: GetSLABenchmarks;
  let mockMetricsService: jest.Mocked<MetricsService>;

  beforeEach(() => {
    mockMetricsService = {
      getSLABenchmarks: jest.fn()
    } as any;

    getSLABenchmarks = new GetSLABenchmarks(mockMetricsService);
  });

  it('debe obtener todos los benchmarks de SLA', async () => {
    // Arrange
    const expectedBenchmarks = [
      {
        category: TicketCategory.TECHNICAL_SUPPORT,
        priority: TicketPriority.URGENT,
        target_first_response_minutes: 15,
        target_resolution_hours: 4,
        escalation_threshold_hours: 2
      },
      {
        category: TicketCategory.PAYMENT_PROBLEM,
        priority: TicketPriority.HIGH,
        target_first_response_minutes: 30,
        target_resolution_hours: 8,
        escalation_threshold_hours: 4
      }
    ];
    mockMetricsService.getSLABenchmarks.mockResolvedValue(expectedBenchmarks);

    // Act
    const result = await getSLABenchmarks.execute();

    // Assert
    expect(mockMetricsService.getSLABenchmarks).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expectedBenchmarks);
  });

  it('debe retornar array vacío cuando no hay benchmarks', async () => {
    // Arrange
    mockMetricsService.getSLABenchmarks.mockResolvedValue([]);

    // Act
    const result = await getSLABenchmarks.execute();

    // Assert
    expect(result).toEqual([]);
  });

  it('debe propagar errores del servicio', async () => {
    // Arrange
    const error = new Error('Error de base de datos');
    mockMetricsService.getSLABenchmarks.mockRejectedValue(error);

    // Act & Assert
    await expect(getSLABenchmarks.execute()).rejects.toThrow('Error de base de datos');
  });
});
