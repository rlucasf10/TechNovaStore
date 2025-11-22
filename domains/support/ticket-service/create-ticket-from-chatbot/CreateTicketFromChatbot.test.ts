/**
 * Tests para CreateTicketFromChatbot
 * Cobertura: Creación de tickets desde escalación de chatbot
 */

import { CreateTicketFromChatbot } from './CreateTicketFromChatbot';
import { CreateTicket } from '../create-ticket/CreateTicket';
import { EscalationReason, TicketCategory, TicketStatus, TicketPriority } from '../shared/types';

describe('CreateTicketFromChatbot', () => {
  let createTicketFromChatbot: CreateTicketFromChatbot;
  let mockCreateTicket: jest.Mocked<CreateTicket>;

  beforeEach(() => {
    mockCreateTicket = {
      execute: jest.fn()
    } as any;

    createTicketFromChatbot = new CreateTicketFromChatbot(mockCreateTicket);
  });

  describe('execute', () => {
    it('debe crear un ticket desde chatbot con todos los datos requeridos', async () => {
      // Arrange
      const chatSessionId = 'session-123';
      const customerEmail = 'cliente@example.com';
      const customerName = 'Juan Pérez';
      const subject = 'Consulta sobre producto';
      const description = 'Necesito información sobre compatibilidad';
      const escalationReason = EscalationReason.CUSTOMER_REQUEST;

      const expectedTicket = {
        id: 1,
        ticket_number: 'TICKET-001',
        user_id: undefined,
        customer_email: customerEmail,
        customer_name: customerName,
        subject,
        description,
        status: TicketStatus.OPEN,
        priority: TicketPriority.MEDIUM,
        category: TicketCategory.GENERAL_INQUIRY,
        escalated_from_chatbot: true,
        escalation_reason: escalationReason,
        chat_session_id: chatSessionId,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockCreateTicket.execute.mockResolvedValue(expectedTicket as any);

      // Act
      const result = await createTicketFromChatbot.execute(
        chatSessionId,
        customerEmail,
        customerName,
        subject,
        description,
        escalationReason
      );

      // Assert
      expect(mockCreateTicket.execute).toHaveBeenCalledWith({
        user_id: undefined,
        customer_email: customerEmail,
        customer_name: customerName,
        subject,
        description,
        escalated_from_chatbot: true,
        escalation_reason: escalationReason,
        chat_session_id: chatSessionId,
        order_id: undefined
      });
      expect(result).toEqual(expectedTicket);
    });

    it('debe crear ticket con userId cuando se proporciona', async () => {
      // Arrange
      const userId = 42;
      const chatSessionId = 'session-456';
      const customerEmail = 'usuario@example.com';
      const customerName = 'María García';
      const subject = 'Problema técnico';
      const description = 'Mi producto no funciona correctamente';
      const escalationReason = EscalationReason.COMPLEX_QUERY;

      mockCreateTicket.execute.mockResolvedValue({
        id: 2,
        user_id: userId
      } as any);

      // Act
      await createTicketFromChatbot.execute(
        chatSessionId,
        customerEmail,
        customerName,
        subject,
        description,
        escalationReason,
        userId
      );

      // Assert
      expect(mockCreateTicket.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId
        })
      );
    });

    it('debe crear ticket con orderId cuando se proporciona', async () => {
      // Arrange
      const orderId = 789;
      const chatSessionId = 'session-789';
      const customerEmail = 'comprador@example.com';
      const customerName = 'Carlos López';
      const subject = 'Problema con mi pedido';
      const description = 'No he recibido mi pedido';
      const escalationReason = EscalationReason.UNRESOLVED_ISSUE;

      mockCreateTicket.execute.mockResolvedValue({
        id: 3,
        order_id: orderId
      } as any);

      // Act
      await createTicketFromChatbot.execute(
        chatSessionId,
        customerEmail,
        customerName,
        subject,
        description,
        escalationReason,
        undefined,
        orderId
      );

      // Assert
      expect(mockCreateTicket.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          order_id: orderId
        })
      );
    });

    it('debe crear ticket con userId y orderId cuando ambos se proporcionan', async () => {
      // Arrange
      const userId = 100;
      const orderId = 200;
      const chatSessionId = 'session-complete';
      const customerEmail = 'cliente@example.com';
      const customerName = 'Ana Martínez';
      const subject = 'Consulta sobre mi pedido';
      const description = 'Quiero cambiar la dirección de envío';
      const escalationReason = EscalationReason.CUSTOMER_REQUEST;

      mockCreateTicket.execute.mockResolvedValue({
        id: 4,
        user_id: userId,
        order_id: orderId
      } as any);

      // Act
      await createTicketFromChatbot.execute(
        chatSessionId,
        customerEmail,
        customerName,
        subject,
        description,
        escalationReason,
        userId,
        orderId
      );

      // Assert
      expect(mockCreateTicket.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          order_id: orderId
        })
      );
    });

    it('debe marcar el ticket como escalado desde chatbot', async () => {
      // Arrange
      const chatSessionId = 'session-escalated';
      const customerEmail = 'escalado@example.com';
      const customerName = 'Pedro Sánchez';
      const subject = 'Escalación necesaria';
      const description = 'El chatbot no pudo resolver mi problema';
      const escalationReason = EscalationReason.CHATBOT_LIMITATION;

      mockCreateTicket.execute.mockResolvedValue({
        id: 5,
        escalated_from_chatbot: true
      } as any);

      // Act
      await createTicketFromChatbot.execute(
        chatSessionId,
        customerEmail,
        customerName,
        subject,
        description,
        escalationReason
      );

      // Assert
      expect(mockCreateTicket.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          escalated_from_chatbot: true,
          escalation_reason: escalationReason,
          chat_session_id: chatSessionId
        })
      );
    });

    it('debe manejar diferentes razones de escalación', async () => {
      // Arrange
      const escalationReasons = [
        EscalationReason.CUSTOMER_REQUEST,
        EscalationReason.COMPLEX_QUERY,
        EscalationReason.CHATBOT_LIMITATION,
        EscalationReason.UNRESOLVED_ISSUE,
        EscalationReason.COMPLAINT_ESCALATION
      ];

      mockCreateTicket.execute.mockResolvedValue({ id: 6 } as any);

      // Act & Assert
      for (const reason of escalationReasons) {
        await createTicketFromChatbot.execute(
          'session-test',
          'test@example.com',
          'Test User',
          'Test Subject',
          'Test Description',
          reason
        );

        expect(mockCreateTicket.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            escalation_reason: reason
          })
        );
      }
    });

    it('debe propagar errores del CreateTicket', async () => {
      // Arrange
      const error = new Error('Error al crear ticket');
      mockCreateTicket.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        createTicketFromChatbot.execute(
          'session-error',
          'error@example.com',
          'Error User',
          'Error Subject',
          'Error Description',
          EscalationReason.CUSTOMER_REQUEST
        )
      ).rejects.toThrow('Error al crear ticket');
    });

    it('debe manejar emails con formato especial', async () => {
      // Arrange
      const specialEmails = [
        'usuario+tag@example.com',
        'usuario.nombre@subdomain.example.com',
        'usuario_123@example.co.uk'
      ];

      mockCreateTicket.execute.mockResolvedValue({ id: 7 } as any);

      // Act & Assert
      for (const email of specialEmails) {
        await createTicketFromChatbot.execute(
          'session-special',
          email,
          'Special User',
          'Special Subject',
          'Special Description',
          EscalationReason.CUSTOMER_REQUEST
        );

        expect(mockCreateTicket.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            customer_email: email
          })
        );
      }
    });

    it('debe manejar nombres con caracteres especiales', async () => {
      // Arrange
      const specialNames = [
        'José María García',
        "O'Connor",
        'François Müller',
        'María José Pérez-López'
      ];

      mockCreateTicket.execute.mockResolvedValue({ id: 8 } as any);

      // Act & Assert
      for (const name of specialNames) {
        await createTicketFromChatbot.execute(
          'session-names',
          'test@example.com',
          name,
          'Test Subject',
          'Test Description',
          EscalationReason.CUSTOMER_REQUEST
        );

        expect(mockCreateTicket.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            customer_name: name
          })
        );
      }
    });

    it('debe manejar descripciones largas', async () => {
      // Arrange
      const longDescription = 'A'.repeat(5000);
      mockCreateTicket.execute.mockResolvedValue({ id: 9 } as any);

      // Act
      await createTicketFromChatbot.execute(
        'session-long',
        'long@example.com',
        'Long User',
        'Long Subject',
        longDescription,
        EscalationReason.COMPLEX_QUERY
      );

      // Assert
      expect(mockCreateTicket.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          description: longDescription
        })
      );
    });

    it('debe manejar sessionIds únicos', async () => {
      // Arrange
      const sessionIds = [
        'session-uuid-123e4567-e89b-12d3-a456-426614174000',
        'session-timestamp-1234567890',
        'session-custom-abc123'
      ];

      mockCreateTicket.execute.mockResolvedValue({ id: 10 } as any);

      // Act & Assert
      for (const sessionId of sessionIds) {
        await createTicketFromChatbot.execute(
          sessionId,
          'test@example.com',
          'Test User',
          'Test Subject',
          'Test Description',
          EscalationReason.CUSTOMER_REQUEST
        );

        expect(mockCreateTicket.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            chat_session_id: sessionId
          })
        );
      }
    });

    it('debe retornar el ticket creado completo', async () => {
      // Arrange
      const expectedTicket = {
        id: 11,
        ticket_number: 'TICKET-011',
        user_id: 50,
        customer_email: 'complete@example.com',
        customer_name: 'Complete User',
        subject: 'Complete Subject',
        description: 'Complete Description',
        status: TicketStatus.OPEN,
        priority: TicketPriority.HIGH,
        category: TicketCategory.TECHNICAL_SUPPORT,
        escalated_from_chatbot: true,
        escalation_reason: EscalationReason.COMPLEX_QUERY,
        chat_session_id: 'session-complete',
        order_id: 300,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockCreateTicket.execute.mockResolvedValue(expectedTicket as any);

      // Act
      const result = await createTicketFromChatbot.execute(
        'session-complete',
        'complete@example.com',
        'Complete User',
        'Complete Subject',
        'Complete Description',
        EscalationReason.COMPLEX_QUERY,
        50,
        300
      );

      // Assert
      expect(result).toEqual(expectedTicket);
      expect(result.escalated_from_chatbot).toBe(true);
      expect(result.chat_session_id).toBe('session-complete');
    });
  });
});
