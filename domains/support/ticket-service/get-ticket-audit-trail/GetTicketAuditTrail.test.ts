/**
 * Tests para GetTicketAuditTrail
 * Cobertura: Obtención de historial de auditoría de tickets
 */

import { GetTicketAuditTrail } from './GetTicketAuditTrail';
import { AuditService, AuditActionType } from '../shared/utils/AuditService';

describe('GetTicketAuditTrail', () => {
  let getTicketAuditTrail: GetTicketAuditTrail;
  let mockAuditService: jest.Mocked<AuditService>;

  beforeEach(() => {
    mockAuditService = {
      getTicketAuditTrail: jest.fn()
    } as any;

    getTicketAuditTrail = new GetTicketAuditTrail(mockAuditService);
  });

  it('debe obtener historial de auditoría de un ticket', async () => {
    // Arrange
    const ticketId = 1;
    const expectedAuditTrail = [
      {
        id: 1,
        ticket_id: ticketId,
        action_type: AuditActionType.CREATED,
        performed_by_type: 'agent' as const,
        performed_by_id: 100,
        performed_by_name: 'Admin',
        created_at: new Date(),
        new_value: 'open'
      },
      {
        id: 2,
        ticket_id: ticketId,
        action_type: AuditActionType.STATUS_CHANGED,
        performed_by_type: 'agent' as const,
        performed_by_id: 100,
        performed_by_name: 'Admin',
        created_at: new Date(),
        old_value: 'open',
        new_value: 'in_progress'
      }
    ];

    mockAuditService.getTicketAuditTrail.mockResolvedValue(expectedAuditTrail);

    // Act
    const result = await getTicketAuditTrail.execute(ticketId);

    // Assert
    expect(mockAuditService.getTicketAuditTrail).toHaveBeenCalledWith(ticketId);
    expect(result).toEqual(expectedAuditTrail);
  });

  it('debe obtener historial vacío para ticket sin cambios', async () => {
    // Arrange
    const ticketId = 1;
    mockAuditService.getTicketAuditTrail.mockResolvedValue([]);

    // Act
    const result = await getTicketAuditTrail.execute(ticketId);

    // Assert
    expect(result).toEqual([]);
  });

  it('debe manejar diferentes IDs de ticket', async () => {
    // Arrange
    const ticketIds = [1, 100, 999, 12345];
    mockAuditService.getTicketAuditTrail.mockResolvedValue([]);

    // Act & Assert
    for (const ticketId of ticketIds) {
      await getTicketAuditTrail.execute(ticketId);
      expect(mockAuditService.getTicketAuditTrail).toHaveBeenCalledWith(ticketId);
    }
  });

  it('debe propagar errores del servicio', async () => {
    // Arrange
    const ticketId = 1;
    const error = new Error('Error de base de datos');
    mockAuditService.getTicketAuditTrail.mockRejectedValue(error);

    // Act & Assert
    await expect(getTicketAuditTrail.execute(ticketId)).rejects.toThrow('Error de base de datos');
  });

  it('debe obtener historial completo con múltiples cambios', async () => {
    // Arrange
    const ticketId = 1;
    const expectedAuditTrail = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      ticket_id: ticketId,
      action_type: AuditActionType.MESSAGE_ADDED,
      performed_by_type: 'agent' as const,
      performed_by_id: 100,
      performed_by_name: 'Admin',
      created_at: new Date()
    }));

    mockAuditService.getTicketAuditTrail.mockResolvedValue(expectedAuditTrail);

    // Act
    const result = await getTicketAuditTrail.execute(ticketId);

    // Assert
    expect(result).toHaveLength(10);
  });
});
