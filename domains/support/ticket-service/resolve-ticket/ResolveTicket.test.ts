/**
 * Tests MUY COMPLETOS para ResolveTicket
 * Cobertura completa de toda la lógica del caso de uso
 */

import { ResolveTicket } from './ResolveTicket';
import { TicketRepository } from '../shared/repositories/TicketRepository';
import { TicketStatus } from '../shared/types';

jest.mock('../shared/repositories/TicketRepository');

describe('ResolveTicket - Tests Completos', () => {
  let resolveTicket: ResolveTicket;
  let mockTicketRepository: jest.Mocked<TicketRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTicketRepository = new TicketRepository(null as any) as jest.Mocked<TicketRepository>;
    resolveTicket = new ResolveTicket(mockTicketRepository);
  });

  describe('Resolución básica de ticket', () => {
    it('debe resolver un ticket correctamente con agente identificado', async () => {
      const mockTicket = { id: 1, status: TicketStatus.RESOLVED };
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);

      const result = await resolveTicket.execute(1, 'Problema resuelto', 123, 'Agent Smith');

      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          sender_type: 'agent',
          sender_id: 123,
          sender_name: 'Agent Smith',
          message: 'Problema resuelto'
        })
      );
      expect(mockTicketRepository.updateTicket).toHaveBeenCalledWith(
        1,
        { status: TicketStatus.RESOLVED }
      );
      expect(result).toEqual(mockTicket);
    });

    it('debe resolver un ticket sin ID de agente', async () => {
      const mockTicket = { id: 1, status: TicketStatus.RESOLVED };
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);

      await resolveTicket.execute(1, 'Problema resuelto', undefined, 'Agent Smith');

      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          sender_type: 'agent',
          sender_id: undefined,
          sender_name: 'Agent Smith',
          message: 'Problema resuelto'
        })
      );
    });

    it('debe usar nombre por defecto si no se proporciona nombre de agente', async () => {
      const mockTicket = { id: 1, status: TicketStatus.RESOLVED };
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);

      await resolveTicket.execute(1, 'Problema resuelto', 123);

      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          sender_name: 'Agente de Soporte'
        })
      );
    });

    it('debe usar nombre por defecto si el nombre está vacío', async () => {
      const mockTicket = { id: 1, status: TicketStatus.RESOLVED };
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);

      await resolveTicket.execute(1, 'Problema resuelto', 123, '');

      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          sender_name: 'Agente de Soporte'
        })
      );
    });
  });

  describe('Mensajes de resolución', () => {
    it('debe agregar mensaje de resolución corto', async () => {
      const mockTicket = { id: 1, status: TicketStatus.RESOLVED };
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);

      await resolveTicket.execute(1, 'Resuelto', 123, 'Agent');

      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          message: 'Resuelto'
        })
      );
    });

    it('debe agregar mensaje de resolución largo', async () => {
      const longMessage = 'Este problema fue resuelto después de investigar a fondo. '.repeat(10);
      const mockTicket = { id: 1, status: TicketStatus.RESOLVED };
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);

      await resolveTicket.execute(1, longMessage, 123, 'Agent');

      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          message: longMessage
        })
      );
    });

    it('debe agregar mensaje con caracteres especiales', async () => {
      const specialMessage = 'Problema resuelto: ñáéíóú @#$%&*()';
      const mockTicket = { id: 1, status: TicketStatus.RESOLVED };
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);

      await resolveTicket.execute(1, specialMessage, 123, 'Agent');

      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          message: specialMessage
        })
      );
    });
  });

  describe('Orden de operaciones', () => {
    it('debe agregar mensaje ANTES de actualizar el estado', async () => {
      const callOrder: string[] = [];
      const mockTicket = { id: 1, status: TicketStatus.RESOLVED };
      
      mockTicketRepository.addMessage = jest.fn().mockImplementation(async () => {
        callOrder.push('addMessage');
        return {};
      });
      mockTicketRepository.updateTicket = jest.fn().mockImplementation(async () => {
        callOrder.push('updateTicket');
        return mockTicket;
      });

      await resolveTicket.execute(1, 'Resuelto', 123, 'Agent');

      expect(callOrder).toEqual(['addMessage', 'updateTicket']);
    });
  });

  describe('Retorno de valores', () => {
    it('debe retornar el ticket actualizado', async () => {
      const mockTicket = { 
        id: 1, 
        status: TicketStatus.RESOLVED,
        ticket_number: 'TKT-001',
        subject: 'Test'
      };
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);

      const result = await resolveTicket.execute(1, 'Resuelto', 123, 'Agent');

      expect(result).toEqual(mockTicket);
    });

    it('debe retornar null si el ticket no existe', async () => {
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(null);

      const result = await resolveTicket.execute(999, 'Resuelto', 123, 'Agent');

      expect(result).toBeNull();
    });
  });

  describe('Manejo de errores', () => {
    it('debe propagar error si falla al agregar mensaje', async () => {
      mockTicketRepository.addMessage = jest.fn().mockRejectedValue(new Error('Message error'));

      await expect(
        resolveTicket.execute(1, 'Resuelto', 123, 'Agent')
      ).rejects.toThrow('Message error');
    });

    it('debe propagar error si falla al actualizar ticket', async () => {
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});
      mockTicketRepository.updateTicket = jest.fn().mockRejectedValue(new Error('Update error'));

      await expect(
        resolveTicket.execute(1, 'Resuelto', 123, 'Agent')
      ).rejects.toThrow('Update error');
    });

    it('NO debe actualizar el ticket si falla al agregar mensaje', async () => {
      mockTicketRepository.addMessage = jest.fn().mockRejectedValue(new Error('Message error'));
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue({});

      try {
        await resolveTicket.execute(1, 'Resuelto', 123, 'Agent');
      } catch (error) {
        // Expected error
      }

      expect(mockTicketRepository.updateTicket).not.toHaveBeenCalled();
    });
  });

  describe('Casos edge', () => {
    it('debe manejar ticketId 0', async () => {
      const mockTicket = { id: 0, status: TicketStatus.RESOLVED };
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);

      await resolveTicket.execute(0, 'Resuelto', 123, 'Agent');

      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(0, expect.any(Object));
      expect(mockTicketRepository.updateTicket).toHaveBeenCalledWith(0, expect.any(Object));
    });

    it('debe manejar agentId 0', async () => {
      const mockTicket = { id: 1, status: TicketStatus.RESOLVED };
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);

      await resolveTicket.execute(1, 'Resuelto', 0, 'Agent');

      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ sender_id: 0 })
      );
    });
  });
});
