/**
 * Tests MUY COMPLETOS para CreateTicket
 * Cobertura completa de toda la lógica del caso de uso
 */

import { CreateTicket } from './CreateTicket';
import { TicketRepository } from '../shared/repositories/TicketRepository';
import { TicketCategory, TicketPriority, EscalationReason, CreateTicketRequest } from '../shared/types';

// Mock del repositorio
jest.mock('../shared/repositories/TicketRepository');

describe('CreateTicket - Tests Completos', () => {
  let createTicket: CreateTicket;
  let mockTicketRepository: jest.Mocked<TicketRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTicketRepository = new TicketRepository(null as any) as jest.Mocked<TicketRepository>;
    createTicket = new CreateTicket(mockTicketRepository);
  });

  describe('Auto-categorización de tickets', () => {
    it('debe categorizar como PAYMENT_PROBLEM cuando contiene palabras clave de pago', async () => {
      const ticketData: CreateTicketRequest = {
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Problema con mi pago',
        description: 'No se procesó mi tarjeta de crédito'
      };

      const mockTicket = { id: 1, ...ticketData, category: TicketCategory.PAYMENT_PROBLEM };
      mockTicketRepository.createTicket = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});

      await createTicket.execute(ticketData);

      expect(mockTicketRepository.createTicket).toHaveBeenCalledWith(
        expect.objectContaining({ category: TicketCategory.PAYMENT_PROBLEM })
      );
    });

    it('debe categorizar como SHIPPING_INQUIRY cuando contiene palabras de envío', async () => {
      const ticketData: CreateTicketRequest = {
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Consulta sobre envío',
        description: 'Quiero saber el tracking de mi pedido'
      };

      const mockTicket = { id: 1, ...ticketData };
      mockTicketRepository.createTicket = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});

      await createTicket.execute(ticketData);

      expect(mockTicketRepository.createTicket).toHaveBeenCalledWith(
        expect.objectContaining({ category: TicketCategory.SHIPPING_INQUIRY })
      );
    });

    it('debe categorizar como ORDER_ISSUE cuando contiene palabras de pedido', async () => {
      const ticketData: CreateTicketRequest = {
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Problema con mi pedido',
        description: 'Mi orden no llegó'
      };

      const mockTicket = { id: 1, ...ticketData };
      mockTicketRepository.createTicket = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});

      await createTicket.execute(ticketData);

      expect(mockTicketRepository.createTicket).toHaveBeenCalledWith(
        expect.objectContaining({ category: TicketCategory.ORDER_ISSUE })
      );
    });

    it('debe categorizar como PRODUCT_QUESTION cuando contiene palabras de producto', async () => {
      const ticketData: CreateTicketRequest = {
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Consulta sobre producto',
        description: 'Quiero saber las especificaciones del producto'
      };

      const mockTicket = { id: 1, ...ticketData };
      mockTicketRepository.createTicket = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});

      await createTicket.execute(ticketData);

      expect(mockTicketRepository.createTicket).toHaveBeenCalledWith(
        expect.objectContaining({ category: TicketCategory.PRODUCT_QUESTION })
      );
    });

    it('debe categorizar como TECHNICAL_SUPPORT cuando contiene palabras técnicas', async () => {
      const ticketData: CreateTicketRequest = {
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Error técnico',
        description: 'Tengo un error y fallo en el sistema'
      };

      const mockTicket = { id: 1, ...ticketData };
      mockTicketRepository.createTicket = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});

      await createTicket.execute(ticketData);

      expect(mockTicketRepository.createTicket).toHaveBeenCalledWith(
        expect.objectContaining({ category: TicketCategory.TECHNICAL_SUPPORT })
      );
    });

    it('debe categorizar como REFUND_REQUEST cuando contiene palabras de devolución', async () => {
      const ticketData: CreateTicketRequest = {
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Solicitud de reembolso',
        description: 'Quiero un reembolso y devolución'
      };

      const mockTicket = { id: 1, ...ticketData };
      mockTicketRepository.createTicket = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});

      await createTicket.execute(ticketData);

      expect(mockTicketRepository.createTicket).toHaveBeenCalledWith(
        expect.objectContaining({ category: TicketCategory.REFUND_REQUEST })
      );
    });

    it('debe categorizar como COMPLAINT cuando contiene palabras de queja', async () => {
      const ticketData: CreateTicketRequest = {
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Queja formal',
        description: 'Estoy muy insatisfecho con el servicio'
      };

      const mockTicket = { id: 1, ...ticketData };
      mockTicketRepository.createTicket = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});

      await createTicket.execute(ticketData);

      expect(mockTicketRepository.createTicket).toHaveBeenCalledWith(
        expect.objectContaining({ category: TicketCategory.COMPLAINT })
      );
    });

    it('debe categorizar como GENERAL_INQUIRY por defecto', async () => {
      const ticketData: CreateTicketRequest = {
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Consulta general',
        description: 'Tengo una pregunta'
      };

      const mockTicket = { id: 1, ...ticketData };
      mockTicketRepository.createTicket = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});

      await createTicket.execute(ticketData);

      expect(mockTicketRepository.createTicket).toHaveBeenCalledWith(
        expect.objectContaining({ category: TicketCategory.GENERAL_INQUIRY })
      );
    });
  });

  describe('Auto-priorización de tickets', () => {
    it('debe asignar prioridad URGENT cuando contiene palabras urgentes', async () => {
      const ticketData: CreateTicketRequest = {
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'URGENTE: Problema crítico',
        description: 'Necesito ayuda inmediata'
      };

      const mockTicket = { id: 1, ...ticketData };
      mockTicketRepository.createTicket = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});

      await createTicket.execute(ticketData);

      expect(mockTicketRepository.createTicket).toHaveBeenCalledWith(
        expect.objectContaining({ priority: TicketPriority.URGENT })
      );
    });

    it('debe asignar prioridad HIGH para quejas', async () => {
      const ticketData: CreateTicketRequest = {
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Queja',
        description: 'Estoy insatisfecho',
        category: TicketCategory.COMPLAINT
      };

      const mockTicket = { id: 1, ...ticketData };
      mockTicketRepository.createTicket = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});

      await createTicket.execute(ticketData);

      expect(mockTicketRepository.createTicket).toHaveBeenCalledWith(
        expect.objectContaining({ priority: TicketPriority.HIGH })
      );
    });

    it('debe asignar prioridad HIGH para problemas de pago', async () => {
      const ticketData: CreateTicketRequest = {
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Problema de pago',
        description: 'No puedo pagar',
        category: TicketCategory.PAYMENT_PROBLEM
      };

      const mockTicket = { id: 1, ...ticketData };
      mockTicketRepository.createTicket = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});

      await createTicket.execute(ticketData);

      expect(mockTicketRepository.createTicket).toHaveBeenCalledWith(
        expect.objectContaining({ priority: TicketPriority.HIGH })
      );
    });

    it('debe asignar prioridad MEDIUM para problemas de pedidos', async () => {
      const ticketData: CreateTicketRequest = {
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Problema con pedido',
        description: 'Mi pedido no llegó',
        category: TicketCategory.ORDER_ISSUE
      };

      const mockTicket = { id: 1, ...ticketData };
      mockTicketRepository.createTicket = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});

      await createTicket.execute(ticketData);

      expect(mockTicketRepository.createTicket).toHaveBeenCalledWith(
        expect.objectContaining({ priority: TicketPriority.MEDIUM })
      );
    });

    it('debe asignar prioridad LOW por defecto', async () => {
      const ticketData: CreateTicketRequest = {
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Consulta',
        description: 'Tengo una pregunta'
      };

      const mockTicket = { id: 1, ...ticketData };
      mockTicketRepository.createTicket = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});

      await createTicket.execute(ticketData);

      expect(mockTicketRepository.createTicket).toHaveBeenCalledWith(
        expect.objectContaining({ priority: TicketPriority.LOW })
      );
    });
  });

  describe('Mensaje inicial del sistema', () => {
    it('debe agregar mensaje de sistema para ticket creado directamente', async () => {
      const ticketData: CreateTicketRequest = {
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Test',
        description: 'Test description',
        escalated_from_chatbot: false
      };

      const mockTicket = { id: 1, ...ticketData };
      mockTicketRepository.createTicket = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});

      await createTicket.execute(ticketData);

      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          sender_type: 'system',
          sender_name: 'Sistema TechNovaStore',
          message: expect.stringContaining('Creado directamente por el cliente')
        })
      );
    });

    it('debe agregar mensaje de sistema para ticket escalado desde chatbot', async () => {
      const ticketData: CreateTicketRequest = {
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Test',
        description: 'Test description',
        escalated_from_chatbot: true,
        escalation_reason: EscalationReason.CUSTOMER_REQUEST
      };

      const mockTicket = { id: 1, ...ticketData };
      mockTicketRepository.createTicket = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});

      await createTicket.execute(ticketData);

      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          sender_type: 'system',
          sender_name: 'Sistema TechNovaStore',
          message: expect.stringContaining('Escalado desde chatbot')
        })
      );
    });
  });

  describe('Respeto de categoría y prioridad manual', () => {
    it('debe respetar la categoría si ya está definida', async () => {
      const ticketData: CreateTicketRequest = {
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Test',
        description: 'Test description',
        category: TicketCategory.TECHNICAL_SUPPORT
      };

      const mockTicket = { id: 1, ...ticketData };
      mockTicketRepository.createTicket = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});

      await createTicket.execute(ticketData);

      expect(mockTicketRepository.createTicket).toHaveBeenCalledWith(
        expect.objectContaining({ category: TicketCategory.TECHNICAL_SUPPORT })
      );
    });

    it('debe respetar la prioridad si ya está definida', async () => {
      const ticketData: CreateTicketRequest = {
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Test',
        description: 'Test description',
        priority: TicketPriority.URGENT
      };

      const mockTicket = { id: 1, ...ticketData };
      mockTicketRepository.createTicket = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});

      await createTicket.execute(ticketData);

      expect(mockTicketRepository.createTicket).toHaveBeenCalledWith(
        expect.objectContaining({ priority: TicketPriority.URGENT })
      );
    });
  });
});
