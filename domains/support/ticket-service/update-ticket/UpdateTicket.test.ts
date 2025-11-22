/**
 * Tests MUY COMPLETOS para UpdateTicket
 * Cobertura completa de toda la lógica del caso de uso
 */

import { UpdateTicket } from './UpdateTicket';
import { TicketRepository } from '../shared/repositories/TicketRepository';
import { UpdateTicketRequest, TicketStatus, TicketPriority } from '../shared/types';

jest.mock('../shared/repositories/TicketRepository');

describe('UpdateTicket - Tests Completos', () => {
  let updateTicket: UpdateTicket;
  let mockTicketRepository: jest.Mocked<TicketRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTicketRepository = new TicketRepository(null as any) as jest.Mocked<TicketRepository>;
    updateTicket = new UpdateTicket(mockTicketRepository);
  });

  describe('Actualización básica de ticket', () => {
    it('debe actualizar el ticket correctamente', async () => {
      const updateData: UpdateTicketRequest = {
        assigned_to: 123
      };

      const mockTicket = { id: 1, assigned_to: 123 };
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);

      const result = await updateTicket.execute(1, updateData);

      expect(result).toEqual(mockTicket);
      expect(mockTicketRepository.updateTicket).toHaveBeenCalledWith(1, updateData);
    });

    it('debe retornar null si el ticket no existe', async () => {
      const updateData: UpdateTicketRequest = {
        assigned_to: 123
      };

      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(null);

      const result = await updateTicket.execute(999, updateData);

      expect(result).toBeNull();
    });

    it('debe actualizar múltiples campos a la vez', async () => {
      const updateData: UpdateTicketRequest = {
        assigned_to: 123,
        priority: TicketPriority.HIGH,
        status: TicketStatus.IN_PROGRESS
      };

      const mockTicket = { id: 1, ...updateData };
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});

      await updateTicket.execute(1, updateData);

      expect(mockTicketRepository.updateTicket).toHaveBeenCalledWith(1, updateData);
    });
  });

  describe('Mensajes automáticos al cambiar estado', () => {
    it('debe agregar mensaje cuando cambia a IN_PROGRESS', async () => {
      const updateData: UpdateTicketRequest = {
        status: TicketStatus.IN_PROGRESS
      };

      const mockTicket = { id: 1, status: TicketStatus.IN_PROGRESS };
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});

      await updateTicket.execute(1, updateData);

      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          sender_type: 'system',
          sender_name: 'Sistema TechNovaStore',
          message: 'Ticket asignado y en proceso de resolución.'
        })
      );
    });

    it('debe agregar mensaje cuando cambia a WAITING_CUSTOMER', async () => {
      const updateData: UpdateTicketRequest = {
        status: TicketStatus.WAITING_CUSTOMER
      };

      const mockTicket = { id: 1, status: TicketStatus.WAITING_CUSTOMER };
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});

      await updateTicket.execute(1, updateData);

      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          message: 'Esperando respuesta del cliente.'
        })
      );
    });

    it('debe agregar mensaje cuando cambia a RESOLVED', async () => {
      const updateData: UpdateTicketRequest = {
        status: TicketStatus.RESOLVED
      };

      const mockTicket = { id: 1, status: TicketStatus.RESOLVED };
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});

      await updateTicket.execute(1, updateData);

      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          message: 'Ticket resuelto. Si el problema persiste, puede responder a este ticket.'
        })
      );
    });

    it('debe agregar mensaje cuando cambia a CLOSED', async () => {
      const updateData: UpdateTicketRequest = {
        status: TicketStatus.CLOSED
      };

      const mockTicket = { id: 1, status: TicketStatus.CLOSED };
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});

      await updateTicket.execute(1, updateData);

      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          message: 'Ticket cerrado. Gracias por contactarnos.'
        })
      );
    });

    it('debe agregar mensaje genérico para otros estados', async () => {
      const updateData: UpdateTicketRequest = {
        status: TicketStatus.OPEN
      };

      const mockTicket = { id: 1, status: TicketStatus.OPEN };
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});

      await updateTicket.execute(1, updateData);

      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          message: expect.stringContaining('Estado del ticket actualizado a:')
        })
      );
    });

    it('NO debe agregar mensaje si no se cambia el estado', async () => {
      const updateData: UpdateTicketRequest = {
        assigned_to: 123
      };

      const mockTicket = { id: 1, assigned_to: 123 };
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});

      await updateTicket.execute(1, updateData);

      expect(mockTicketRepository.addMessage).not.toHaveBeenCalled();
    });

    it('NO debe agregar mensaje si el ticket no existe', async () => {
      const updateData: UpdateTicketRequest = {
        status: TicketStatus.RESOLVED
      };

      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(null);
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue({});

      await updateTicket.execute(999, updateData);

      expect(mockTicketRepository.addMessage).not.toHaveBeenCalled();
    });
  });

  describe('Actualización de campos específicos', () => {
    it('debe actualizar solo el agente asignado', async () => {
      const updateData: UpdateTicketRequest = {
        assigned_to: 456
      };

      const mockTicket = { id: 1, assigned_to: 456 };
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);

      await updateTicket.execute(1, updateData);

      expect(mockTicketRepository.updateTicket).toHaveBeenCalledWith(1, { assigned_to: 456 });
    });

    it('debe actualizar solo la prioridad', async () => {
      const updateData: UpdateTicketRequest = {
        priority: TicketPriority.URGENT
      };

      const mockTicket = { id: 1, priority: TicketPriority.URGENT };
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);

      await updateTicket.execute(1, updateData);

      expect(mockTicketRepository.updateTicket).toHaveBeenCalledWith(1, { priority: TicketPriority.URGENT });
    });

    it('debe actualizar la fecha de primera respuesta', async () => {
      const firstResponseDate = new Date('2024-01-01');
      const updateData: UpdateTicketRequest = {
        first_response_at: firstResponseDate
      };

      const mockTicket = { id: 1, first_response_at: firstResponseDate };
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);

      await updateTicket.execute(1, updateData);

      expect(mockTicketRepository.updateTicket).toHaveBeenCalledWith(1, { first_response_at: firstResponseDate });
    });
  });

  describe('Manejo de errores', () => {
    it('debe propagar errores del repositorio', async () => {
      const updateData: UpdateTicketRequest = {
        status: TicketStatus.RESOLVED
      };

      mockTicketRepository.updateTicket = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(updateTicket.execute(1, updateData)).rejects.toThrow('Database error');
    });

    it('debe manejar errores al agregar mensaje del sistema', async () => {
      const updateData: UpdateTicketRequest = {
        status: TicketStatus.RESOLVED
      };

      const mockTicket = { id: 1, status: TicketStatus.RESOLVED };
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.addMessage = jest.fn().mockRejectedValue(new Error('Message error'));

      await expect(updateTicket.execute(1, updateData)).rejects.toThrow('Message error');
    });
  });
});
