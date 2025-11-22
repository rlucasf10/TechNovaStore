/**
 * Tests para EscalateToHuman
 */

import { EscalateToHuman, EscalateRequest } from './EscalateToHuman';
import { EscalationIntegration } from '../shared/services/EscalationIntegration';

describe('EscalateToHuman', () => {
  let escalateToHuman: EscalateToHuman;
  let mockEscalationService: jest.Mocked<EscalationIntegration>;

  beforeEach(() => {
    mockEscalationService = {
      escalateToTicketSystem: jest.fn(),
      generateEscalationMessage: jest.fn()
    } as any;

    escalateToHuman = new EscalateToHuman(mockEscalationService);
  });

  describe('execute', () => {
    const validRequest: EscalateRequest = {
      sessionId: 'test-session',
      customerEmail: 'test@example.com',
      customerName: 'Test User',
      reason: 'customer_request'
    };

    it('debe escalar correctamente con datos válidos', async () => {
      // Arrange
      mockEscalationService.escalateToTicketSystem.mockResolvedValue({
        ticketId: 123,
        ticketNumber: 'TICKET-123'
      });
      mockEscalationService.generateEscalationMessage.mockReturnValue(
        'Ticket creado: TICKET-123'
      );

      // Act
      const result = await escalateToHuman.execute(validRequest);

      // Assert
      expect(mockEscalationService.escalateToTicketSystem).toHaveBeenCalledWith(
        'test-session',
        'test@example.com',
        'Test User',
        'customer_request',
        undefined,
        undefined,
        undefined
      );
      expect(result.success).toBe(true);
      expect(result.ticketId).toBe(123);
      expect(result.ticketNumber).toBe('TICKET-123');
      expect(result.message).toBe('Ticket creado: TICKET-123');
    });

    it('debe incluir mensaje personalizado cuando se proporciona', async () => {
      // Arrange
      const requestWithMessage = {
        ...validRequest,
        customMessage: 'Mensaje personalizado'
      };
      mockEscalationService.escalateToTicketSystem.mockResolvedValue({
        ticketId: 123,
        ticketNumber: 'TICKET-123'
      });
      mockEscalationService.generateEscalationMessage.mockReturnValue('Mensaje');

      // Act
      await escalateToHuman.execute(requestWithMessage);

      // Assert
      expect(mockEscalationService.escalateToTicketSystem).toHaveBeenCalledWith(
        'test-session',
        'test@example.com',
        'Test User',
        'customer_request',
        'Mensaje personalizado',
        undefined,
        undefined
      );
    });

    it('debe incluir userId y orderId cuando se proporcionan', async () => {
      // Arrange
      const requestWithIds = {
        ...validRequest,
        userId: 456,
        orderId: 789
      };
      mockEscalationService.escalateToTicketSystem.mockResolvedValue({
        ticketId: 123,
        ticketNumber: 'TICKET-123'
      });
      mockEscalationService.generateEscalationMessage.mockReturnValue('Mensaje');

      // Act
      await escalateToHuman.execute(requestWithIds);

      // Assert
      expect(mockEscalationService.escalateToTicketSystem).toHaveBeenCalledWith(
        'test-session',
        'test@example.com',
        'Test User',
        'customer_request',
        undefined,
        456,
        789
      );
    });

    it('debe lanzar error cuando falta sessionId', async () => {
      // Arrange
      const invalidRequest = {
        ...validRequest,
        sessionId: ''
      };

      // Act & Assert
      await expect(escalateToHuman.execute(invalidRequest)).rejects.toThrow('sessionId is required');
    });

    it('debe lanzar error cuando falta customerEmail', async () => {
      // Arrange
      const invalidRequest = {
        ...validRequest,
        customerEmail: ''
      };

      // Act & Assert
      await expect(escalateToHuman.execute(invalidRequest)).rejects.toThrow('customerEmail is required');
    });

    it('debe lanzar error cuando falta customerName', async () => {
      // Arrange
      const invalidRequest = {
        ...validRequest,
        customerName: ''
      };

      // Act & Assert
      await expect(escalateToHuman.execute(invalidRequest)).rejects.toThrow('customerName is required');
    });

    it('debe lanzar error cuando falta reason', async () => {
      // Arrange
      const invalidRequest = {
        ...validRequest,
        reason: ''
      };

      // Act & Assert
      await expect(escalateToHuman.execute(invalidRequest)).rejects.toThrow('reason is required');
    });

    it('debe validar formato de email', async () => {
      // Arrange
      const invalidRequest = {
        ...validRequest,
        customerEmail: 'invalid-email'
      };

      // Act & Assert
      await expect(escalateToHuman.execute(invalidRequest)).rejects.toThrow('Invalid email format');
    });

    it('debe aceptar emails válidos', async () => {
      // Arrange
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.com'
      ];

      mockEscalationService.escalateToTicketSystem.mockResolvedValue({
        ticketId: 123,
        ticketNumber: 'TICKET-123'
      });
      mockEscalationService.generateEscalationMessage.mockReturnValue('Mensaje');

      // Act & Assert
      for (const email of validEmails) {
        const request = { ...validRequest, customerEmail: email };
        await expect(escalateToHuman.execute(request)).resolves.toBeDefined();
      }
    });

    it('debe propagar errores del servicio de escalación', async () => {
      // Arrange
      mockEscalationService.escalateToTicketSystem.mockRejectedValue(
        new Error('Error del servicio')
      );

      // Act & Assert
      await expect(escalateToHuman.execute(validRequest)).rejects.toThrow(
        'Failed to escalate to human support'
      );
    });

    it('debe generar mensaje de escalación con el número de ticket', async () => {
      // Arrange
      mockEscalationService.escalateToTicketSystem.mockResolvedValue({
        ticketId: 123,
        ticketNumber: 'TICKET-123'
      });
      mockEscalationService.generateEscalationMessage.mockReturnValue(
        'Tu ticket TICKET-123 ha sido creado'
      );

      // Act
      const result = await escalateToHuman.execute(validRequest);

      // Assert
      expect(mockEscalationService.generateEscalationMessage).toHaveBeenCalledWith(
        'TICKET-123',
        'customer_request'
      );
      expect(result.message).toContain('TICKET-123');
    });

    it('debe manejar diferentes razones de escalación', async () => {
      // Arrange
      const reasons = ['customer_request', 'complex_query', 'chatbot_limitation', 'unresolved_issue'];
      mockEscalationService.escalateToTicketSystem.mockResolvedValue({
        ticketId: 123,
        ticketNumber: 'TICKET-123'
      });
      mockEscalationService.generateEscalationMessage.mockReturnValue('Mensaje');

      // Act & Assert
      for (const reason of reasons) {
        const request = { ...validRequest, reason };
        const result = await escalateToHuman.execute(request);
        expect(result.success).toBe(true);
      }
    });
  });
});
