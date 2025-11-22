/**
 * Tests para EscalateToHuman
 * Cobertura: Escalación desde chatbot a soporte humano
 */

import { EscalateToHuman, EscalationContext } from './EscalateToHuman';
import { CreateTicketFromChatbot } from '../create-ticket-from-chatbot/CreateTicketFromChatbot';
import { TicketRepository } from '../shared/repositories/TicketRepository';
import { EscalationReason } from '../shared/types';

describe('EscalateToHuman', () => {
  let escalateToHuman: EscalateToHuman;
  let mockCreateTicketFromChatbot: jest.Mocked<CreateTicketFromChatbot>;
  let mockTicketRepository: jest.Mocked<TicketRepository>;

  beforeEach(() => {
    mockCreateTicketFromChatbot = {
      execute: jest.fn()
    } as any;

    mockTicketRepository = {
      addMessage: jest.fn()
    } as any;

    escalateToHuman = new EscalateToHuman(mockCreateTicketFromChatbot, mockTicketRepository);
  });

  const createContext = (overrides?: Partial<EscalationContext>): EscalationContext => ({
    sessionId: 'session-123',
    customerEmail: 'cliente@example.com',
    customerName: 'Juan Pérez',
    conversationHistory: [
      { message: 'Hola', timestamp: new Date(), sender: 'user' },
      { message: 'Hola, ¿en qué puedo ayudarte?', timestamp: new Date(), sender: 'bot' }
    ],
    ...overrides
  });

  describe('execute - Casos exitosos', () => {
    it('debe escalar y crear ticket desde chatbot', async () => {
      // Arrange
      const context = createContext();
      const reason = EscalationReason.CUSTOMER_REQUEST;
      const ticket = {
        id: 1,
        ticket_number: 'TICKET-001',
        customer_email: context.customerEmail
      };

      mockCreateTicketFromChatbot.execute.mockResolvedValue(ticket as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      const result = await escalateToHuman.execute(context, reason);

      // Assert
      expect(result.ticketId).toBe(1);
      expect(result.ticketNumber).toBe('TICKET-001');
    });

    it('debe generar subject apropiado para solicitud de cliente', async () => {
      // Arrange
      const context = createContext({ detectedIntent: 'consulta de producto' });
      const reason = EscalationReason.CUSTOMER_REQUEST;
      mockCreateTicketFromChatbot.execute.mockResolvedValue({ id: 1, ticket_number: 'TICKET-001' } as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      await escalateToHuman.execute(context, reason);

      // Assert
      expect(mockCreateTicketFromChatbot.execute).toHaveBeenCalledWith(
        context.sessionId,
        context.customerEmail,
        context.customerName,
        expect.stringContaining('Solicitud de agente humano'),
        expect.any(String),
        reason,
        undefined,
        undefined
      );
    });

    it('debe agregar historial de conversación como mensaje interno', async () => {
      // Arrange
      const context = createContext({
        conversationHistory: [
          { message: 'Mensaje 1', timestamp: new Date(), sender: 'user' },
          { message: 'Respuesta 1', timestamp: new Date(), sender: 'bot' },
          { message: 'Mensaje 2', timestamp: new Date(), sender: 'user' }
        ]
      });
      const ticket = { id: 1, ticket_number: 'TICKET-001' };
      mockCreateTicketFromChatbot.execute.mockResolvedValue(ticket as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      await escalateToHuman.execute(context, EscalationReason.CUSTOMER_REQUEST);

      // Assert
      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          sender_type: 'system',
          sender_name: 'Sistema de Escalación',
          is_internal: true,
          message: expect.stringContaining('Historial de conversación')
        })
      );
    });

    it('debe incluir userId cuando está disponible', async () => {
      // Arrange
      const context = createContext({ userId: 42 });
      mockCreateTicketFromChatbot.execute.mockResolvedValue({ id: 1, ticket_number: 'TICKET-001' } as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      await escalateToHuman.execute(context, EscalationReason.CUSTOMER_REQUEST);

      // Assert
      expect(mockCreateTicketFromChatbot.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        42,
        undefined
      );
    });

    it('debe incluir orderId cuando está disponible', async () => {
      // Arrange
      const context = createContext({ orderId: 789 });
      mockCreateTicketFromChatbot.execute.mockResolvedValue({ id: 1, ticket_number: 'TICKET-001' } as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      await escalateToHuman.execute(context, EscalationReason.CUSTOMER_REQUEST);

      // Assert
      expect(mockCreateTicketFromChatbot.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        undefined,
        789
      );
    });
  });

  describe('execute - Generación de subjects', () => {
    it('debe generar subject para consulta compleja', async () => {
      // Arrange
      const context = createContext({ detectedIntent: 'problema técnico' });
      mockCreateTicketFromChatbot.execute.mockResolvedValue({ id: 1, ticket_number: 'TICKET-001' } as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      await escalateToHuman.execute(context, EscalationReason.COMPLEX_QUERY);

      // Assert
      expect(mockCreateTicketFromChatbot.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.stringContaining('Consulta técnica compleja'),
        expect.any(String),
        EscalationReason.COMPLEX_QUERY,
        undefined,
        undefined
      );
    });

    it('debe generar subject para queja', async () => {
      // Arrange
      const context = createContext();
      mockCreateTicketFromChatbot.execute.mockResolvedValue({ id: 1, ticket_number: 'TICKET-001' } as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      await escalateToHuman.execute(context, EscalationReason.COMPLAINT_ESCALATION);

      // Assert
      expect(mockCreateTicketFromChatbot.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.stringContaining('Queja de cliente'),
        expect.any(String),
        EscalationReason.COMPLAINT_ESCALATION,
        undefined,
        undefined
      );
    });

    it('debe usar subject genérico sin detectedIntent', async () => {
      // Arrange
      const context = createContext({ detectedIntent: undefined });
      mockCreateTicketFromChatbot.execute.mockResolvedValue({ id: 1, ticket_number: 'TICKET-001' } as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      await escalateToHuman.execute(context, EscalationReason.CUSTOMER_REQUEST);

      // Assert
      expect(mockCreateTicketFromChatbot.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.stringContaining('Consulta de cliente'),
        expect.any(String),
        expect.any(String),
        undefined,
        undefined
      );
    });
  });

  describe('execute - Generación de descripciones', () => {
    it('debe incluir último mensaje del usuario en descripción', async () => {
      // Arrange
      const context = createContext({
        conversationHistory: [
          { message: 'Primer mensaje', timestamp: new Date(), sender: 'user' },
          { message: 'Respuesta bot', timestamp: new Date(), sender: 'bot' },
          { message: 'Último mensaje importante', timestamp: new Date(), sender: 'user' }
        ]
      });
      mockCreateTicketFromChatbot.execute.mockResolvedValue({ id: 1, ticket_number: 'TICKET-001' } as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      await escalateToHuman.execute(context, EscalationReason.CUSTOMER_REQUEST);

      // Assert
      expect(mockCreateTicketFromChatbot.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.stringContaining('Último mensaje importante'),
        expect.any(String),
        undefined,
        undefined
      );
    });

    it('debe usar mensaje personalizado cuando se proporciona', async () => {
      // Arrange
      const context = createContext();
      const customMessage = 'Mensaje personalizado de escalación';
      mockCreateTicketFromChatbot.execute.mockResolvedValue({ id: 1, ticket_number: 'TICKET-001' } as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      await escalateToHuman.execute(context, EscalationReason.CUSTOMER_REQUEST, customMessage);

      // Assert
      expect(mockCreateTicketFromChatbot.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        customMessage,
        expect.any(String),
        undefined,
        undefined
      );
    });

    it('debe incluir información de confianza en descripción', async () => {
      // Arrange
      const context = createContext({ confidence: 0.45 });
      mockCreateTicketFromChatbot.execute.mockResolvedValue({ id: 1, ticket_number: 'TICKET-001' } as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      await escalateToHuman.execute(context, EscalationReason.CHATBOT_LIMITATION);

      // Assert
      expect(mockCreateTicketFromChatbot.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.stringContaining('45.0%'),
        expect.any(String),
        undefined,
        undefined
      );
    });
  });

  describe('execute - Historial de conversación', () => {
    it('debe NO agregar historial si está vacío', async () => {
      // Arrange
      const context = createContext({ conversationHistory: [] });
      mockCreateTicketFromChatbot.execute.mockResolvedValue({ id: 1, ticket_number: 'TICKET-001' } as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      await escalateToHuman.execute(context, EscalationReason.CUSTOMER_REQUEST);

      // Assert
      expect(mockTicketRepository.addMessage).not.toHaveBeenCalled();
    });

    it('debe limitar historial a últimos 10 mensajes', async () => {
      // Arrange
      const manyMessages = Array.from({ length: 20 }, (_, i) => ({
        message: `Mensaje ${i}`,
        timestamp: new Date(),
        sender: (i % 2 === 0 ? 'user' : 'bot') as 'user' | 'bot'
      }));
      const context = createContext({ conversationHistory: manyMessages });
      mockCreateTicketFromChatbot.execute.mockResolvedValue({ id: 1, ticket_number: 'TICKET-001' } as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      await escalateToHuman.execute(context, EscalationReason.CUSTOMER_REQUEST);

      // Assert
      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          message: expect.stringContaining('Mensaje 10')
        })
      );
    });
  });

  describe('execute - Manejo de errores', () => {
    it('debe propagar errores al crear ticket', async () => {
      // Arrange
      const context = createContext();
      const error = new Error('Error al crear ticket');
      mockCreateTicketFromChatbot.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        escalateToHuman.execute(context, EscalationReason.CUSTOMER_REQUEST)
      ).rejects.toThrow('Error al crear ticket');
    });

    it('debe propagar errores al agregar mensaje', async () => {
      // Arrange
      const context = createContext();
      const error = new Error('Error al agregar mensaje');
      mockCreateTicketFromChatbot.execute.mockResolvedValue({ id: 1, ticket_number: 'TICKET-001' } as any);
      mockTicketRepository.addMessage.mockRejectedValue(error);

      // Act & Assert
      await expect(
        escalateToHuman.execute(context, EscalationReason.CUSTOMER_REQUEST)
      ).rejects.toThrow('Error al agregar mensaje');
    });
  });

  describe('execute - Diferentes razones de escalación', () => {
    it('debe manejar todas las razones de escalación', async () => {
      // Arrange
      const reasons = [
        EscalationReason.CUSTOMER_REQUEST,
        EscalationReason.COMPLEX_QUERY,
        EscalationReason.CHATBOT_LIMITATION,
        EscalationReason.UNRESOLVED_ISSUE,
        EscalationReason.COMPLAINT_ESCALATION
      ];
      const context = createContext();
      mockCreateTicketFromChatbot.execute.mockResolvedValue({ id: 1, ticket_number: 'TICKET-001' } as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act & Assert
      for (const reason of reasons) {
        const result = await escalateToHuman.execute(context, reason);
        expect(result.ticketId).toBe(1);
      }
    });
  });
});
