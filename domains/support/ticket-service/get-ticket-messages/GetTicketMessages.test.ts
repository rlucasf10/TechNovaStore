/**
 * Tests MUY COMPLETOS para GetTicketMessages
 * Cobertura completa de toda la lógica del caso de uso
 */

import { GetTicketMessages } from './GetTicketMessages';
import { TicketRepository } from '../shared/repositories/TicketRepository';

jest.mock('../shared/repositories/TicketRepository');

describe('GetTicketMessages - Tests Completos', () => {
  let getTicketMessages: GetTicketMessages;
  let mockTicketRepository: jest.Mocked<TicketRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTicketRepository = new TicketRepository(null as any) as jest.Mocked<TicketRepository>;
    getTicketMessages = new GetTicketMessages(mockTicketRepository);
  });

  describe('Obtener mensajes sin incluir internos', () => {
    it('debe retornar solo mensajes públicos por defecto', async () => {
      const mockMessages = [
        { id: 1, ticket_id: 1, message: 'Mensaje público 1', is_internal: false },
        { id: 2, ticket_id: 1, message: 'Mensaje público 2', is_internal: false }
      ];

      mockTicketRepository.getTicketMessages = jest.fn().mockResolvedValue(mockMessages);

      const result = await getTicketMessages.execute(1);

      expect(result).toEqual(mockMessages);
      expect(mockTicketRepository.getTicketMessages).toHaveBeenCalledWith(1, false);
    });

    it('debe retornar array vacío si no hay mensajes', async () => {
      mockTicketRepository.getTicketMessages = jest.fn().mockResolvedValue([]);

      const result = await getTicketMessages.execute(1);

      expect(result).toEqual([]);
    });

    it('debe retornar mensajes ordenados cronológicamente', async () => {
      const mockMessages = [
        { id: 1, created_at: new Date('2024-01-01'), message: 'Primero' },
        { id: 2, created_at: new Date('2024-01-02'), message: 'Segundo' },
        { id: 3, created_at: new Date('2024-01-03'), message: 'Tercero' }
      ];

      mockTicketRepository.getTicketMessages = jest.fn().mockResolvedValue(mockMessages);

      const result = await getTicketMessages.execute(1);

      expect(result).toEqual(mockMessages);
    });

    it('debe retornar mensajes de diferentes tipos de remitente', async () => {
      const mockMessages = [
        { id: 1, sender_type: 'customer', message: 'Mensaje del cliente' },
        { id: 2, sender_type: 'agent', message: 'Respuesta del agente' },
        { id: 3, sender_type: 'system', message: 'Mensaje del sistema' }
      ];

      mockTicketRepository.getTicketMessages = jest.fn().mockResolvedValue(mockMessages);

      const result = await getTicketMessages.execute(1);

      expect(result).toHaveLength(3);
      expect(result[0].sender_type).toBe('customer');
      expect(result[1].sender_type).toBe('agent');
      expect(result[2].sender_type).toBe('system');
    });
  });

  describe('Obtener mensajes incluyendo internos', () => {
    it('debe retornar todos los mensajes cuando includeInternal es true', async () => {
      const mockMessages = [
        { id: 1, message: 'Mensaje público', is_internal: false },
        { id: 2, message: 'Nota interna', is_internal: true },
        { id: 3, message: 'Otro público', is_internal: false }
      ];

      mockTicketRepository.getTicketMessages = jest.fn().mockResolvedValue(mockMessages);

      const result = await getTicketMessages.execute(1, true);

      expect(result).toEqual(mockMessages);
      expect(mockTicketRepository.getTicketMessages).toHaveBeenCalledWith(1, true);
    });

    it('debe retornar solo mensajes internos si todos son internos', async () => {
      const mockMessages = [
        { id: 1, message: 'Nota interna 1', is_internal: true },
        { id: 2, message: 'Nota interna 2', is_internal: true }
      ];

      mockTicketRepository.getTicketMessages = jest.fn().mockResolvedValue(mockMessages);

      const result = await getTicketMessages.execute(1, true);

      expect(result).toEqual(mockMessages);
    });

    it('debe retornar array vacío si no hay mensajes internos ni públicos', async () => {
      mockTicketRepository.getTicketMessages = jest.fn().mockResolvedValue([]);

      const result = await getTicketMessages.execute(1, true);

      expect(result).toEqual([]);
    });
  });

  describe('Parámetro includeInternal', () => {
    it('debe usar false por defecto si no se especifica', async () => {
      mockTicketRepository.getTicketMessages = jest.fn().mockResolvedValue([]);

      await getTicketMessages.execute(1);

      expect(mockTicketRepository.getTicketMessages).toHaveBeenCalledWith(1, false);
    });

    it('debe respetar includeInternal=false explícito', async () => {
      mockTicketRepository.getTicketMessages = jest.fn().mockResolvedValue([]);

      await getTicketMessages.execute(1, false);

      expect(mockTicketRepository.getTicketMessages).toHaveBeenCalledWith(1, false);
    });

    it('debe respetar includeInternal=true explícito', async () => {
      mockTicketRepository.getTicketMessages = jest.fn().mockResolvedValue([]);

      await getTicketMessages.execute(1, true);

      expect(mockTicketRepository.getTicketMessages).toHaveBeenCalledWith(1, true);
    });
  });

  describe('Diferentes IDs de ticket', () => {
    it('debe funcionar con ticketId 0', async () => {
      mockTicketRepository.getTicketMessages = jest.fn().mockResolvedValue([]);

      await getTicketMessages.execute(0);

      expect(mockTicketRepository.getTicketMessages).toHaveBeenCalledWith(0, false);
    });

    it('debe funcionar con ticketId muy grande', async () => {
      const largeId = 999999999;
      mockTicketRepository.getTicketMessages = jest.fn().mockResolvedValue([]);

      await getTicketMessages.execute(largeId);

      expect(mockTicketRepository.getTicketMessages).toHaveBeenCalledWith(largeId, false);
    });

    it('debe funcionar con diferentes ticketIds', async () => {
      const ticketIds = [1, 5, 10, 100, 1000];

      for (const ticketId of ticketIds) {
        mockTicketRepository.getTicketMessages = jest.fn().mockResolvedValue([]);

        await getTicketMessages.execute(ticketId);

        expect(mockTicketRepository.getTicketMessages).toHaveBeenCalledWith(ticketId, false);
      }
    });
  });

  describe('Manejo de errores', () => {
    it('debe propagar error del repositorio', async () => {
      mockTicketRepository.getTicketMessages = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(getTicketMessages.execute(1)).rejects.toThrow('Database error');
    });

    it('debe propagar error de conexión', async () => {
      mockTicketRepository.getTicketMessages = jest.fn().mockRejectedValue(new Error('Connection timeout'));

      await expect(getTicketMessages.execute(1, true)).rejects.toThrow('Connection timeout');
    });

    it('debe propagar error de permisos', async () => {
      mockTicketRepository.getTicketMessages = jest.fn().mockRejectedValue(new Error('Permission denied'));

      await expect(getTicketMessages.execute(1)).rejects.toThrow('Permission denied');
    });
  });

  describe('Llamadas al repositorio', () => {
    it('debe llamar al repositorio exactamente una vez', async () => {
      mockTicketRepository.getTicketMessages = jest.fn().mockResolvedValue([]);

      await getTicketMessages.execute(1);

      expect(mockTicketRepository.getTicketMessages).toHaveBeenCalledTimes(1);
    });

    it('debe pasar los parámetros correctos al repositorio', async () => {
      mockTicketRepository.getTicketMessages = jest.fn().mockResolvedValue([]);

      await getTicketMessages.execute(123, true);

      expect(mockTicketRepository.getTicketMessages).toHaveBeenCalledWith(123, true);
    });
  });
});
