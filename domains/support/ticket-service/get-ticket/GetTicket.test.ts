/**
 * Tests MUY COMPLETOS para GetTicket
 * Cobertura completa de toda la lógica del caso de uso
 */

import { GetTicket } from './GetTicket';
import { TicketRepository } from '../shared/repositories/TicketRepository';
import { TicketStatus, TicketCategory, TicketPriority } from '../shared/types';

jest.mock('../shared/repositories/TicketRepository');

describe('GetTicket - Tests Completos', () => {
  let getTicket: GetTicket;
  let mockTicketRepository: jest.Mocked<TicketRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTicketRepository = new TicketRepository(null as any) as jest.Mocked<TicketRepository>;
    getTicket = new GetTicket(mockTicketRepository);
  });

  describe('Obtener ticket por ID', () => {
    it('debe retornar un ticket existente por ID', async () => {
      const mockTicket = {
        id: 1,
        ticket_number: 'TKT-001',
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Test Subject',
        description: 'Test Description',
        status: TicketStatus.OPEN,
        category: TicketCategory.GENERAL_INQUIRY,
        priority: TicketPriority.MEDIUM
      };

      mockTicketRepository.getTicketById = jest.fn().mockResolvedValue(mockTicket);

      const result = await getTicket.executeById(1);

      expect(result).toEqual(mockTicket);
      expect(mockTicketRepository.getTicketById).toHaveBeenCalledWith(1);
    });

    it('debe retornar null si el ticket no existe', async () => {
      mockTicketRepository.getTicketById = jest.fn().mockResolvedValue(null);

      const result = await getTicket.executeById(999);

      expect(result).toBeNull();
      expect(mockTicketRepository.getTicketById).toHaveBeenCalledWith(999);
    });

    it('debe manejar ID 0', async () => {
      const mockTicket = { id: 0, ticket_number: 'TKT-000' };
      mockTicketRepository.getTicketById = jest.fn().mockResolvedValue(mockTicket);

      const result = await getTicket.executeById(0);

      expect(result).toEqual(mockTicket);
    });

    it('debe manejar IDs muy grandes', async () => {
      const largeId = 999999999;
      const mockTicket = { id: largeId, ticket_number: 'TKT-999999999' };
      mockTicketRepository.getTicketById = jest.fn().mockResolvedValue(mockTicket);

      const result = await getTicket.executeById(largeId);

      expect(result).toEqual(mockTicket);
    });

    it('debe retornar ticket con todos los campos completos', async () => {
      const mockTicket = {
        id: 1,
        ticket_number: 'TKT-001',
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Test Subject',
        description: 'Test Description',
        status: TicketStatus.IN_PROGRESS,
        category: TicketCategory.TECHNICAL_SUPPORT,
        priority: TicketPriority.HIGH,
        assigned_to: 123,
        escalated_from_chatbot: true,
        escalation_reason: 'CUSTOMER_REQUEST',
        chat_session_id: 'session-123',
        order_id: 456,
        first_response_at: new Date('2024-01-01'),
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-02')
      };

      mockTicketRepository.getTicketById = jest.fn().mockResolvedValue(mockTicket);

      const result = await getTicket.executeById(1);

      expect(result).toEqual(mockTicket);
    });
  });

  describe('Obtener ticket por número', () => {
    it('debe retornar un ticket existente por número', async () => {
      const mockTicket = {
        id: 1,
        ticket_number: 'TKT-001',
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Test Subject',
        status: TicketStatus.OPEN
      };

      mockTicketRepository.getTicketByNumber = jest.fn().mockResolvedValue(mockTicket);

      const result = await getTicket.executeByNumber('TKT-001');

      expect(result).toEqual(mockTicket);
      expect(mockTicketRepository.getTicketByNumber).toHaveBeenCalledWith('TKT-001');
    });

    it('debe retornar null si el ticket no existe', async () => {
      mockTicketRepository.getTicketByNumber = jest.fn().mockResolvedValue(null);

      const result = await getTicket.executeByNumber('TKT-999');

      expect(result).toBeNull();
      expect(mockTicketRepository.getTicketByNumber).toHaveBeenCalledWith('TKT-999');
    });

    it('debe manejar números de ticket con diferentes formatos', async () => {
      const formats = ['TKT-001', 'TICKET-123', 'T-999', '12345'];

      for (const format of formats) {
        const mockTicket = { id: 1, ticket_number: format };
        mockTicketRepository.getTicketByNumber = jest.fn().mockResolvedValue(mockTicket);

        const result = await getTicket.executeByNumber(format);

        expect(result).toEqual(mockTicket);
        expect(mockTicketRepository.getTicketByNumber).toHaveBeenCalledWith(format);
      }
    });

    it('debe manejar números de ticket con espacios', async () => {
      const ticketNumber = 'TKT-001 ';
      const mockTicket = { id: 1, ticket_number: ticketNumber };
      mockTicketRepository.getTicketByNumber = jest.fn().mockResolvedValue(mockTicket);

      const result = await getTicket.executeByNumber(ticketNumber);

      expect(result).toEqual(mockTicket);
    });

    it('debe manejar números de ticket en minúsculas', async () => {
      const ticketNumber = 'tkt-001';
      const mockTicket = { id: 1, ticket_number: ticketNumber };
      mockTicketRepository.getTicketByNumber = jest.fn().mockResolvedValue(mockTicket);

      const result = await getTicket.executeByNumber(ticketNumber);

      expect(result).toEqual(mockTicket);
    });

    it('debe manejar números de ticket vacíos', async () => {
      mockTicketRepository.getTicketByNumber = jest.fn().mockResolvedValue(null);

      const result = await getTicket.executeByNumber('');

      expect(result).toBeNull();
    });
  });

  describe('Diferentes estados de ticket', () => {
    it('debe retornar ticket en estado OPEN', async () => {
      const mockTicket = { id: 1, status: TicketStatus.OPEN };
      mockTicketRepository.getTicketById = jest.fn().mockResolvedValue(mockTicket);

      const result = await getTicket.executeById(1);

      expect(result?.status).toBe(TicketStatus.OPEN);
    });

    it('debe retornar ticket en estado IN_PROGRESS', async () => {
      const mockTicket = { id: 1, status: TicketStatus.IN_PROGRESS };
      mockTicketRepository.getTicketById = jest.fn().mockResolvedValue(mockTicket);

      const result = await getTicket.executeById(1);

      expect(result?.status).toBe(TicketStatus.IN_PROGRESS);
    });

    it('debe retornar ticket en estado RESOLVED', async () => {
      const mockTicket = { id: 1, status: TicketStatus.RESOLVED };
      mockTicketRepository.getTicketById = jest.fn().mockResolvedValue(mockTicket);

      const result = await getTicket.executeById(1);

      expect(result?.status).toBe(TicketStatus.RESOLVED);
    });

    it('debe retornar ticket en estado CLOSED', async () => {
      const mockTicket = { id: 1, status: TicketStatus.CLOSED };
      mockTicketRepository.getTicketById = jest.fn().mockResolvedValue(mockTicket);

      const result = await getTicket.executeById(1);

      expect(result?.status).toBe(TicketStatus.CLOSED);
    });

    it('debe retornar ticket en estado WAITING_CUSTOMER', async () => {
      const mockTicket = { id: 1, status: TicketStatus.WAITING_CUSTOMER };
      mockTicketRepository.getTicketById = jest.fn().mockResolvedValue(mockTicket);

      const result = await getTicket.executeById(1);

      expect(result?.status).toBe(TicketStatus.WAITING_CUSTOMER);
    });
  });

  describe('Diferentes categorías de ticket', () => {
    const categories = [
      TicketCategory.GENERAL_INQUIRY,
      TicketCategory.TECHNICAL_SUPPORT,
      TicketCategory.ORDER_ISSUE,
      TicketCategory.PAYMENT_PROBLEM,
      TicketCategory.SHIPPING_INQUIRY,
      TicketCategory.PRODUCT_QUESTION,
      TicketCategory.REFUND_REQUEST,
      TicketCategory.COMPLAINT
    ];

    categories.forEach(category => {
      it(`debe retornar ticket con categoría ${category}`, async () => {
        const mockTicket = { id: 1, category };
        mockTicketRepository.getTicketById = jest.fn().mockResolvedValue(mockTicket);

        const result = await getTicket.executeById(1);

        expect(result?.category).toBe(category);
      });
    });
  });

  describe('Diferentes prioridades de ticket', () => {
    const priorities = [
      TicketPriority.LOW,
      TicketPriority.MEDIUM,
      TicketPriority.HIGH,
      TicketPriority.URGENT
    ];

    priorities.forEach(priority => {
      it(`debe retornar ticket con prioridad ${priority}`, async () => {
        const mockTicket = { id: 1, priority };
        mockTicketRepository.getTicketById = jest.fn().mockResolvedValue(mockTicket);

        const result = await getTicket.executeById(1);

        expect(result?.priority).toBe(priority);
      });
    });
  });

  describe('Manejo de errores', () => {
    it('debe propagar error del repositorio al buscar por ID', async () => {
      mockTicketRepository.getTicketById = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(getTicket.executeById(1)).rejects.toThrow('Database error');
    });

    it('debe propagar error del repositorio al buscar por número', async () => {
      mockTicketRepository.getTicketByNumber = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(getTicket.executeByNumber('TKT-001')).rejects.toThrow('Database error');
    });

    it('debe manejar errores de conexión', async () => {
      mockTicketRepository.getTicketById = jest.fn().mockRejectedValue(new Error('Connection timeout'));

      await expect(getTicket.executeById(1)).rejects.toThrow('Connection timeout');
    });
  });

  describe('Llamadas al repositorio', () => {
    it('debe llamar al repositorio exactamente una vez por ID', async () => {
      mockTicketRepository.getTicketById = jest.fn().mockResolvedValue({ id: 1 });

      await getTicket.executeById(1);

      expect(mockTicketRepository.getTicketById).toHaveBeenCalledTimes(1);
    });

    it('debe llamar al repositorio exactamente una vez por número', async () => {
      mockTicketRepository.getTicketByNumber = jest.fn().mockResolvedValue({ id: 1 });

      await getTicket.executeByNumber('TKT-001');

      expect(mockTicketRepository.getTicketByNumber).toHaveBeenCalledTimes(1);
    });

    it('NO debe llamar a getTicketByNumber cuando se usa executeById', async () => {
      mockTicketRepository.getTicketById = jest.fn().mockResolvedValue({ id: 1 });

      await getTicket.executeById(1);

      expect(mockTicketRepository.getTicketByNumber).not.toHaveBeenCalled();
    });

    it('NO debe llamar a getTicketById cuando se usa executeByNumber', async () => {
      mockTicketRepository.getTicketByNumber = jest.fn().mockResolvedValue({ id: 1 });

      await getTicket.executeByNumber('TKT-001');

      expect(mockTicketRepository.getTicketById).not.toHaveBeenCalled();
    });
  });
});
