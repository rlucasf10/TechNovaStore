/**
 * Tests para SendSatisfactionSurvey
 * Cobertura: Envío de encuestas de satisfacción al cliente
 */

import { SendSatisfactionSurvey } from './SendSatisfactionSurvey';
import { TicketRepository } from '../shared/repositories/TicketRepository';
import { TicketStatus, TicketPriority, TicketCategory } from '../shared/types';

describe('SendSatisfactionSurvey', () => {
  let sendSatisfactionSurvey: SendSatisfactionSurvey;
  let mockTicketRepository: jest.Mocked<TicketRepository>;

  beforeEach(() => {
    mockTicketRepository = {
      getTicketById: jest.fn(),
      addMessage: jest.fn()
    } as any;

    sendSatisfactionSurvey = new SendSatisfactionSurvey(mockTicketRepository);
    process.env.FRONTEND_URL = 'https://technovastore.com';
  });

  afterEach(() => {
    delete process.env.FRONTEND_URL;
  });

  describe('execute - Casos exitosos', () => {
    it('debe enviar encuesta y retornar URL y fecha de expiración', async () => {
      // Arrange
      const ticketId = 1;
      const ticket = {
        id: ticketId,
        ticket_number: 'TICKET-001',
        status: TicketStatus.RESOLVED,
        customer_email: 'cliente@example.com'
      };

      mockTicketRepository.getTicketById.mockResolvedValue(ticket as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      const result = await sendSatisfactionSurvey.execute(ticketId);

      // Assert
      expect(result).toHaveProperty('surveyUrl');
      expect(result).toHaveProperty('expiresAt');
      expect(result.surveyUrl).toContain('https://technovastore.com/satisfaction-survey/');
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('debe generar URL única para cada ticket', async () => {
      // Arrange
      const ticket1 = { id: 1, ticket_number: 'TICKET-001' };
      const ticket2 = { id: 2, ticket_number: 'TICKET-002' };

      mockTicketRepository.getTicketById
        .mockResolvedValueOnce(ticket1 as any)
        .mockResolvedValueOnce(ticket2 as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      const result1 = await sendSatisfactionSurvey.execute(1);
      const result2 = await sendSatisfactionSurvey.execute(2);

      // Assert
      expect(result1.surveyUrl).not.toBe(result2.surveyUrl);
    });

    it('debe configurar expiración a 7 días', async () => {
      // Arrange
      const ticketId = 1;
      const ticket = { id: ticketId, ticket_number: 'TICKET-001' };
      const now = Date.now();

      mockTicketRepository.getTicketById.mockResolvedValue(ticket as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      const result = await sendSatisfactionSurvey.execute(ticketId);

      // Assert
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      const expectedExpiration = now + sevenDaysInMs;
      const actualExpiration = result.expiresAt.getTime();
      
      // Permitir diferencia de 1 segundo por tiempo de ejecución
      expect(Math.abs(actualExpiration - expectedExpiration)).toBeLessThan(1000);
    });

    it('debe agregar mensaje del sistema sobre envío de encuesta', async () => {
      // Arrange
      const ticketId = 1;
      const ticket = { id: ticketId, ticket_number: 'TICKET-001' };

      mockTicketRepository.getTicketById.mockResolvedValue(ticket as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      await sendSatisfactionSurvey.execute(ticketId);

      // Assert
      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(
        ticketId,
        expect.objectContaining({
          sender_type: 'system',
          sender_name: 'Sistema de Satisfacción',
          message: 'Encuesta de satisfacción enviada al cliente por email',
          is_internal: true
        })
      );
    });

    it('debe incluir ID del ticket en el token de la encuesta', async () => {
      // Arrange
      const ticketId = 123;
      const ticket = { id: ticketId, ticket_number: 'TICKET-123' };

      mockTicketRepository.getTicketById.mockResolvedValue(ticket as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      const result = await sendSatisfactionSurvey.execute(ticketId);

      // Assert
      expect(result.surveyUrl).toContain('123-');
    });

    it('debe generar token con timestamp', async () => {
      // Arrange
      const ticketId = 1;
      const ticket = { id: ticketId, ticket_number: 'TICKET-001' };

      mockTicketRepository.getTicketById.mockResolvedValue(ticket as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      const result = await sendSatisfactionSurvey.execute(ticketId);

      // Assert
      const token = result.surveyUrl.split('/').pop();
      expect(token).toMatch(/^\d+-[a-z0-9]+-[a-z0-9]+$/);
    });

    it('debe generar tokens únicos en llamadas consecutivas', async () => {
      // Arrange
      const ticketId = 1;
      const ticket = { id: ticketId, ticket_number: 'TICKET-001' };

      mockTicketRepository.getTicketById.mockResolvedValue(ticket as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      const result1 = await sendSatisfactionSurvey.execute(ticketId);
      await new Promise(resolve => setTimeout(resolve, 10)); // Pequeña pausa
      const result2 = await sendSatisfactionSurvey.execute(ticketId);

      // Assert
      expect(result1.surveyUrl).not.toBe(result2.surveyUrl);
    });
  });

  describe('execute - Manejo de errores', () => {
    it('debe lanzar error cuando el ticket no existe', async () => {
      // Arrange
      const ticketId = 999;
      mockTicketRepository.getTicketById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        sendSatisfactionSurvey.execute(ticketId)
      ).rejects.toThrow('Ticket not found');
    });

    it('debe lanzar error cuando getTicketById retorna undefined', async () => {
      // Arrange
      const ticketId = 999;
      mockTicketRepository.getTicketById.mockResolvedValue(undefined as any);

      // Act & Assert
      await expect(
        sendSatisfactionSurvey.execute(ticketId)
      ).rejects.toThrow('Ticket not found');
    });

    it('debe propagar errores del repositorio al obtener ticket', async () => {
      // Arrange
      const ticketId = 1;
      const error = new Error('Error de base de datos');
      mockTicketRepository.getTicketById.mockRejectedValue(error);

      // Act & Assert
      await expect(
        sendSatisfactionSurvey.execute(ticketId)
      ).rejects.toThrow('Error de base de datos');
    });

    it('debe propagar errores del repositorio al agregar mensaje', async () => {
      // Arrange
      const ticketId = 1;
      const ticket = { id: ticketId, ticket_number: 'TICKET-001' };
      const error = new Error('Error al agregar mensaje');

      mockTicketRepository.getTicketById.mockResolvedValue(ticket as any);
      mockTicketRepository.addMessage.mockRejectedValue(error);

      // Act & Assert
      await expect(
        sendSatisfactionSurvey.execute(ticketId)
      ).rejects.toThrow('Error al agregar mensaje');
    });
  });

  describe('execute - Configuración de URL', () => {
    it('debe usar FRONTEND_URL del entorno', async () => {
      // Arrange
      process.env.FRONTEND_URL = 'https://custom-domain.com';
      const ticketId = 1;
      const ticket = { id: ticketId, ticket_number: 'TICKET-001' };

      mockTicketRepository.getTicketById.mockResolvedValue(ticket as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      const result = await sendSatisfactionSurvey.execute(ticketId);

      // Assert
      expect(result.surveyUrl).toContain('https://custom-domain.com/satisfaction-survey/');
    });

    it('debe manejar FRONTEND_URL sin barra final', async () => {
      // Arrange
      process.env.FRONTEND_URL = 'https://example.com';
      const ticketId = 1;
      const ticket = { id: ticketId, ticket_number: 'TICKET-001' };

      mockTicketRepository.getTicketById.mockResolvedValue(ticket as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      const result = await sendSatisfactionSurvey.execute(ticketId);

      // Assert
      expect(result.surveyUrl).toContain('https://example.com/satisfaction-survey/');
    });

    it('debe manejar FRONTEND_URL con puerto', async () => {
      // Arrange
      process.env.FRONTEND_URL = 'http://localhost:3000';
      const ticketId = 1;
      const ticket = { id: ticketId, ticket_number: 'TICKET-001' };

      mockTicketRepository.getTicketById.mockResolvedValue(ticket as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      const result = await sendSatisfactionSurvey.execute(ticketId);

      // Assert
      expect(result.surveyUrl).toContain('http://localhost:3000/satisfaction-survey/');
    });
  });

  describe('execute - Diferentes tipos de tickets', () => {
    it('debe enviar encuesta para ticket resuelto', async () => {
      // Arrange
      const ticketId = 1;
      const ticket = {
        id: ticketId,
        ticket_number: 'TICKET-001',
        status: TicketStatus.RESOLVED,
        priority: TicketPriority.MEDIUM,
        category: TicketCategory.TECHNICAL_SUPPORT
      };

      mockTicketRepository.getTicketById.mockResolvedValue(ticket as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      const result = await sendSatisfactionSurvey.execute(ticketId);

      // Assert
      expect(result).toBeDefined();
      expect(result.surveyUrl).toBeTruthy();
    });

    it('debe enviar encuesta para ticket cerrado', async () => {
      // Arrange
      const ticketId = 1;
      const ticket = {
        id: ticketId,
        ticket_number: 'TICKET-001',
        status: TicketStatus.CLOSED
      };

      mockTicketRepository.getTicketById.mockResolvedValue(ticket as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      const result = await sendSatisfactionSurvey.execute(ticketId);

      // Assert
      expect(result).toBeDefined();
    });

    it('debe enviar encuesta para diferentes prioridades', async () => {
      // Arrange
      const priorities = [
        TicketPriority.LOW,
        TicketPriority.MEDIUM,
        TicketPriority.HIGH,
        TicketPriority.URGENT
      ];

      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act & Assert
      for (let i = 0; i < priorities.length; i++) {
        const ticket = {
          id: i + 1,
          ticket_number: `TICKET-${i + 1}`,
          priority: priorities[i]
        };
        mockTicketRepository.getTicketById.mockResolvedValue(ticket as any);
        
        const result = await sendSatisfactionSurvey.execute(i + 1);
        expect(result).toBeDefined();
      }
    });

    it('debe enviar encuesta para diferentes categorías', async () => {
      // Arrange
      const categories = [
        TicketCategory.GENERAL_INQUIRY,
        TicketCategory.TECHNICAL_SUPPORT,
        TicketCategory.PRODUCT_QUESTION,
        TicketCategory.ORDER_ISSUE,
        TicketCategory.COMPLAINT
      ];

      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act & Assert
      for (let i = 0; i < categories.length; i++) {
        const ticket = {
          id: i + 1,
          ticket_number: `TICKET-${i + 1}`,
          category: categories[i]
        };
        mockTicketRepository.getTicketById.mockResolvedValue(ticket as any);
        
        const result = await sendSatisfactionSurvey.execute(i + 1);
        expect(result).toBeDefined();
      }
    });
  });

  describe('execute - Validación de datos retornados', () => {
    it('debe retornar estructura completa', async () => {
      // Arrange
      const ticketId = 1;
      const ticket = { id: ticketId, ticket_number: 'TICKET-001' };

      mockTicketRepository.getTicketById.mockResolvedValue(ticket as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      const result = await sendSatisfactionSurvey.execute(ticketId);

      // Assert
      expect(result).toHaveProperty('surveyUrl');
      expect(result).toHaveProperty('expiresAt');
      expect(typeof result.surveyUrl).toBe('string');
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('debe retornar URL válida', async () => {
      // Arrange
      const ticketId = 1;
      const ticket = { id: ticketId, ticket_number: 'TICKET-001' };

      mockTicketRepository.getTicketById.mockResolvedValue(ticket as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      const result = await sendSatisfactionSurvey.execute(ticketId);

      // Assert
      expect(result.surveyUrl).toMatch(/^https?:\/\/.+\/satisfaction-survey\/.+$/);
    });

    it('debe retornar fecha de expiración futura', async () => {
      // Arrange
      const ticketId = 1;
      const ticket = { id: ticketId, ticket_number: 'TICKET-001' };

      mockTicketRepository.getTicketById.mockResolvedValue(ticket as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      const result = await sendSatisfactionSurvey.execute(ticketId);

      // Assert
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('debe retornar fecha de expiración aproximadamente 7 días en el futuro', async () => {
      // Arrange
      const ticketId = 1;
      const ticket = { id: ticketId, ticket_number: 'TICKET-001' };

      mockTicketRepository.getTicketById.mockResolvedValue(ticket as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      const result = await sendSatisfactionSurvey.execute(ticketId);

      // Assert
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      const expectedTime = Date.now() + sevenDaysInMs;
      const actualTime = result.expiresAt.getTime();
      const difference = Math.abs(actualTime - expectedTime);
      
      // Permitir diferencia de 5 segundos
      expect(difference).toBeLessThan(5000);
    });
  });

  describe('execute - IDs de tickets especiales', () => {
    it('debe manejar ID de ticket muy grande', async () => {
      // Arrange
      const ticketId = 999999;
      const ticket = { id: ticketId, ticket_number: 'TICKET-999999' };

      mockTicketRepository.getTicketById.mockResolvedValue(ticket as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      const result = await sendSatisfactionSurvey.execute(ticketId);

      // Assert
      expect(result.surveyUrl).toContain('999999-');
    });

    it('debe manejar ID de ticket pequeño', async () => {
      // Arrange
      const ticketId = 1;
      const ticket = { id: ticketId, ticket_number: 'TICKET-001' };

      mockTicketRepository.getTicketById.mockResolvedValue(ticket as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      const result = await sendSatisfactionSurvey.execute(ticketId);

      // Assert
      expect(result.surveyUrl).toContain('1-');
    });
  });
});
