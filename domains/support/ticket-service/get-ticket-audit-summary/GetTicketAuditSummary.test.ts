/**
 * Tests para GetTicketAuditSummary
 * Cobertura: Obtención de resumen de auditoría de tickets
 */

import { GetTicketAuditSummary } from './GetTicketAuditSummary';
import { AuditService } from '../shared/utils/AuditService';

describe('GetTicketAuditSummary', () => {
  let getTicketAuditSummary: GetTicketAuditSummary;
  let mockAuditService: jest.Mocked<AuditService>;

  beforeEach(() => {
    mockAuditService = {
      getTicketAuditSummary: jest.fn()
    } as any;

    getTicketAuditSummary = new GetTicketAuditSummary(mockAuditService);
  });

  it('debe obtener resumen de auditoría de un ticket', async () => {
    // Arrange
    const ticketId = 1;
    const expectedSummary = {
      ticket_id: ticketId,
      total_actions: 5,
      actions_by_type: {
        created: 1,
        status_changed: 3,
        priority_changed: 1,
        assigned: 2,
        unassigned: 0,
        category_changed: 0,
        message_added: 0,
        resolved: 0,
        closed: 0,
        reopened: 0,
        escalated: 0
      },
      timeline: [],
      performance_metrics: {
        time_to_first_response_minutes: 30,
        time_to_resolution_hours: 24,
        number_of_status_changes: 3,
        number_of_reassignments: 2,
        escalation_count: 0
      }
    };

    mockAuditService.getTicketAuditSummary.mockResolvedValue(expectedSummary);

    // Act
    const result = await getTicketAuditSummary.execute(ticketId);

    // Assert
    expect(mockAuditService.getTicketAuditSummary).toHaveBeenCalledWith(ticketId);
    expect(result).toEqual(expectedSummary);
  });

  it('debe obtener resumen para ticket sin cambios', async () => {
    // Arrange
    const ticketId = 1;
    const expectedSummary = {
      ticket_id: ticketId,
      total_actions: 0,
      actions_by_type: {
        created: 0,
        status_changed: 0,
        priority_changed: 0,
        assigned: 0,
        unassigned: 0,
        category_changed: 0,
        message_added: 0,
        resolved: 0,
        closed: 0,
        reopened: 0,
        escalated: 0
      },
      timeline: [],
      performance_metrics: {
        number_of_status_changes: 0,
        number_of_reassignments: 0,
        escalation_count: 0
      }
    };

    mockAuditService.getTicketAuditSummary.mockResolvedValue(expectedSummary);

    // Act
    const result = await getTicketAuditSummary.execute(ticketId);

    // Assert
    expect(result.total_actions).toBe(0);
  });

  it('debe manejar diferentes IDs de ticket', async () => {
    // Arrange
    const ticketIds = [1, 100, 999, 12345];
    mockAuditService.getTicketAuditSummary.mockResolvedValue({} as any);

    // Act & Assert
    for (const ticketId of ticketIds) {
      await getTicketAuditSummary.execute(ticketId);
      expect(mockAuditService.getTicketAuditSummary).toHaveBeenCalledWith(ticketId);
    }
  });

  it('debe propagar errores del servicio', async () => {
    // Arrange
    const ticketId = 1;
    const error = new Error('Error de base de datos');
    mockAuditService.getTicketAuditSummary.mockRejectedValue(error);

    // Act & Assert
    await expect(getTicketAuditSummary.execute(ticketId)).rejects.toThrow('Error de base de datos');
  });

  it('debe obtener resumen con múltiples cambios', async () => {
    // Arrange
    const ticketId = 1;
    const expectedSummary = {
      ticket_id: ticketId,
      total_actions: 50,
      actions_by_type: {
        created: 1,
        status_changed: 10,
        priority_changed: 5,
        assigned: 8,
        unassigned: 2,
        category_changed: 3,
        message_added: 15,
        resolved: 3,
        closed: 2,
        reopened: 1,
        escalated: 0
      },
      timeline: [],
      performance_metrics: {
        time_to_first_response_minutes: 15,
        time_to_resolution_hours: 48,
        number_of_status_changes: 10,
        number_of_reassignments: 8,
        escalation_count: 0
      }
    };

    mockAuditService.getTicketAuditSummary.mockResolvedValue(expectedSummary);

    // Act
    const result = await getTicketAuditSummary.execute(ticketId);

    // Assert
    expect(result.total_actions).toBe(50);
    expect(result.performance_metrics.number_of_reassignments).toBe(8);
  });
});
