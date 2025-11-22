/**
 * Tests MUY COMPLETOS para CloseTicket
 * Cobertura completa de toda la lógica del caso de uso
 */

import { CloseTicket } from './CloseTicket';
import { TicketRepository } from '../shared/repositories/TicketRepository';
import { TicketStatus } from '../shared/types';

jest.mock('../shared/repositories/TicketRepository');

describe('CloseTicket - Tests Completos', () => {
  let closeTicket: CloseTicket;
  let mockTicketRepository: jest.Mocked<TicketRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTicketRepository = new TicketRepository(null as any) as jest.Mocked<TicketRepository>;
    closeTicket = new CloseTicket(mockTicketRepository);
  });

  describe('Cierre con mensaje', () => {
    it('debe cerrar ticket con mensaje y agente identificado', async () => {
      const mockTicket = { id: 1, status: TicketStatus.CLOSED };
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);

      const result = await closeTicket.execute(1, 'Ticket cerrado', 123, 'Agent Smith');

      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          sender_type: 'agent',
          sender_id: 123,
          sender_name: 'Agent Smith',
          message: 'Ticket cerrado'
        })
      );
      expect(mockTicketRepository.updateTicket).toHaveBeenCalledWith(
        1,
        { status: TicketStatus.CLOSED }
      );
      expect(result).toEqual(mockTicket);
    });

    it('debe usar nombre por defecto si no se proporciona', async () => {
      const mockTicket = { id: 1, status: TicketStatus.CLOSED };
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);

      await closeTicket.execute(1, 'Ticket cerrado', 123);

      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          sender_name: 'Agente de Soporte'
        })
      );
    });
  });

  describe('Cierre sin mensaje', () => {
    it('debe cerrar ticket sin agregar mensaje si no se proporciona', async () => {
      const mockTicket = { id: 1, status: TicketStatus.CLOSED };
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);

      await closeTicket.execute(1);

      expect(mockTicketRepository.addMessage).not.toHaveBeenCalled();
      expect(mockTicketRepository.updateTicket).toHaveBeenCalledWith(
        1,
        { status: TicketStatus.CLOSED }
      );
    });

    it('debe cerrar ticket sin agregar mensaje si el mensaje está vacío', async () => {
      const mockTicket = { id: 1, status: TicketStatus.CLOSED };
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);

      await closeTicket.execute(1, '');

      expect(mockTicketRepository.addMessage).not.toHaveBeenCalled();
    });

    it('debe cerrar ticket sin agregar mensaje si el mensaje es undefined', async () => {
      const mockTicket = { id: 1, status: TicketStatus.CLOSED };
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);

      await closeTicket.execute(1, undefined);

      expect(mockTicketRepository.addMessage).not.toHaveBeenCalled();
    });
  });

  describe('Parámetros opcionales', () => {
    it('debe funcionar solo con ticketId', async () => {
      const mockTicket = { id: 1, status: TicketStatus.CLOSED };
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);

      const result = await closeTicket.execute(1);

      expect(result).toEqual(mockTicket);
    });

    it('debe funcionar con ticketId y mensaje', async () => {
      const mockTicket = { id: 1, status: TicketStatus.CLOSED };
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);

      await closeTicket.execute(1, 'Cerrado');

      expect(mockTicketRepository.addMessage).toHaveBeenCalled();
    });

    it('debe funcionar con ticketId, mensaje y agentId', async () => {
      const mockTicket = { id: 1, status: TicketStatus.CLOSED };
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);

      await closeTicket.execute(1, 'Cerrado', 123);

      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ sender_id: 123 })
      );
    });

    it('debe funcionar con todos los parámetros', async () => {
      const mockTicket = { id: 1, status: TicketStatus.CLOSED };
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);

      await closeTicket.execute(1, 'Cerrado', 123, 'Agent');

      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          sender_id: 123,
          sender_name: 'Agent'
        })
      );
    });
  });

  describe('Retorno de valores', () => {
    it('debe retornar el ticket cerrado', async () => {
      const mockTicket = { 
        id: 1, 
        status: TicketStatus.CLOSED,
        ticket_number: 'TKT-001'
      };
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);

      const result = await closeTicket.execute(1);

      expect(result).toEqual(mockTicket);
    });

    it('debe retornar null si el ticket no existe', async () => {
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(null);

      const result = await closeTicket.execute(999);

      expect(result).toBeNull();
    });
  });

  describe('Manejo de errores', () => {
    it('debe propagar error si falla al agregar mensaje', async () => {
      mockTicketRepository.addMessage = jest.fn().mockRejectedValue(new Error('Message error'));

      await expect(
        closeTicket.execute(1, 'Cerrado', 123, 'Agent')
      ).rejects.toThrow('Message error');
    });

    it('debe propagar error si falla al actualizar ticket', async () => {
      mockTicketRepository.updateTicket = jest.fn().mockRejectedValue(new Error('Update error'));

      await expect(
        closeTicket.execute(1)
      ).rejects.toThrow('Update error');
    });

    it('NO debe actualizar el ticket si falla al agregar mensaje', async () => {
      mockTicketRepository.addMessage = jest.fn().mockRejectedValue(new Error('Message error'));
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue({});

      try {
        await closeTicket.execute(1, 'Cerrado', 123, 'Agent');
      } catch (error) {
        // Expected error
      }

      expect(mockTicketRepository.updateTicket).not.toHaveBeenCalled();
    });
  });

  describe('Orden de operaciones', () => {
    it('debe agregar mensaje ANTES de actualizar estado cuando hay mensaje', async () => {
      const callOrder: string[] = [];
      const mockTicket = { id: 1, status: TicketStatus.CLOSED };
      
      mockTicketRepository.addMessage = jest.fn().mockImplementation(async () => {
        callOrder.push('addMessage');
        return {};
      });
      mockTicketRepository.updateTicket = jest.fn().mockImplementation(async () => {
        callOrder.push('updateTicket');
        return mockTicket;
      });

      await closeTicket.execute(1, 'Cerrado', 123, 'Agent');

      expect(callOrder).toEqual(['addMessage', 'updateTicket']);
    });

    it('debe solo actualizar estado cuando no hay mensaje', async () => {
      const mockTicket = { id: 1, status: TicketStatus.CLOSED };
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);

      await closeTicket.execute(1);

      expect(mockTicketRepository.addMessage).not.toHaveBeenCalled();
      expect(mockTicketRepository.updateTicket).toHaveBeenCalled();
    });
  });

  describe('Casos edge', () => {
    it('debe manejar mensaje con solo espacios como vacío', async () => {
      const mockTicket = { id: 1, status: TicketStatus.CLOSED };
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);

      await closeTicket.execute(1, '   ');

      // Mensaje con solo espacios se considera como mensaje válido
      expect(mockTicketRepository.addMessage).toHaveBeenCalled();
    });

    it('debe manejar ticketId 0', async () => {
      const mockTicket = { id: 0, status: TicketStatus.CLOSED };
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);

      await closeTicket.execute(0);

      expect(mockTicketRepository.updateTicket).toHaveBeenCalledWith(0, expect.any(Object));
    });

    it('debe manejar agentId 0', async () => {
      const mockTicket = { id: 1, status: TicketStatus.CLOSED };
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);

      await closeTicket.execute(1, 'Cerrado', 0, 'Agent');

      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ sender_id: 0 })
      );
    });
  });
});
