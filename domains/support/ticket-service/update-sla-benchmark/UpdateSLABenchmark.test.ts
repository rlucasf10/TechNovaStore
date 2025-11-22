/**
 * Tests para UpdateSLABenchmark
 * Cobertura: Actualización de benchmarks de SLA
 */

import { UpdateSLABenchmark } from './UpdateSLABenchmark';
import { MetricsService } from '../shared/utils/MetricsService';
import { TicketCategory, TicketPriority } from '../shared/types';

describe('UpdateSLABenchmark', () => {
  let updateSLABenchmark: UpdateSLABenchmark;
  let mockMetricsService: jest.Mocked<MetricsService>;

  beforeEach(() => {
    mockMetricsService = {
      updateSLABenchmark: jest.fn()
    } as any;

    updateSLABenchmark = new UpdateSLABenchmark(mockMetricsService);
  });

  it('debe actualizar benchmark de SLA', async () => {
    // Arrange
    const category = TicketCategory.TECHNICAL_SUPPORT;
    const priority = TicketPriority.URGENT;
    const targetFirstResponseMinutes = 15;
    const targetResolutionHours = 4;
    const escalationThresholdHours = 2;

    const expectedBenchmark = {
      category,
      priority,
      target_first_response_minutes: targetFirstResponseMinutes,
      target_resolution_hours: targetResolutionHours,
      escalation_threshold_hours: escalationThresholdHours
    };

    mockMetricsService.updateSLABenchmark.mockResolvedValue(expectedBenchmark);

    // Act
    const result = await updateSLABenchmark.execute(
      category,
      priority,
      targetFirstResponseMinutes,
      targetResolutionHours,
      escalationThresholdHours
    );

    // Assert
    expect(mockMetricsService.updateSLABenchmark).toHaveBeenCalledWith(
      category,
      priority,
      targetFirstResponseMinutes,
      targetResolutionHours,
      escalationThresholdHours
    );
    expect(result).toEqual(expectedBenchmark);
  });

  it('debe actualizar benchmark para diferentes categorías', async () => {
    // Arrange
    const categories = [
      TicketCategory.TECHNICAL_SUPPORT,
      TicketCategory.PAYMENT_PROBLEM,
      TicketCategory.GENERAL_INQUIRY
    ];
    mockMetricsService.updateSLABenchmark.mockResolvedValue({} as any);

    // Act & Assert
    for (const category of categories) {
      await updateSLABenchmark.execute(category, TicketPriority.HIGH, 30, 8, 4);
      expect(mockMetricsService.updateSLABenchmark).toHaveBeenCalledWith(
        category,
        TicketPriority.HIGH,
        30,
        8,
        4
      );
    }
  });

  it('debe actualizar benchmark para diferentes prioridades', async () => {
    // Arrange
    const priorities = [
      TicketPriority.LOW,
      TicketPriority.MEDIUM,
      TicketPriority.HIGH,
      TicketPriority.URGENT
    ];
    mockMetricsService.updateSLABenchmark.mockResolvedValue({} as any);

    // Act & Assert
    for (const priority of priorities) {
      await updateSLABenchmark.execute(TicketCategory.TECHNICAL_SUPPORT, priority, 30, 8, 4);
      expect(mockMetricsService.updateSLABenchmark).toHaveBeenCalledWith(
        TicketCategory.TECHNICAL_SUPPORT,
        priority,
        30,
        8,
        4
      );
    }
  });

  it('debe propagar errores del servicio', async () => {
    // Arrange
    const error = new Error('Error de base de datos');
    mockMetricsService.updateSLABenchmark.mockRejectedValue(error);

    // Act & Assert
    await expect(
      updateSLABenchmark.execute(
        TicketCategory.TECHNICAL_SUPPORT,
        TicketPriority.HIGH,
        30,
        8,
        4
      )
    ).rejects.toThrow('Error de base de datos');
  });
});
