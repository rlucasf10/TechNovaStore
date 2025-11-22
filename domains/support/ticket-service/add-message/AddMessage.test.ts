/**
 * Tests MUY COMPLETOS para AddMessage
 * Cobertura completa de toda la lógica del caso de uso
 */

import { AddMessage } from './AddMessage';
import { TicketRepository } from '../shared/repositories/TicketRepository';
import { AuditService, AuditActionType } from '../shared/utils/AuditService';
import { AddMessageRequest, TicketStatus } from '../shared/types';

jest.mock('../shared/repositories/TicketRepository');
jest.mock('../shared/utils/AuditService');

describe('AddMessage - Tests Completos', () => {
  let addMessage: AddMessage;
  let mockTicketRepository: jest.Mocked<TicketRepository>;
  let mockAuditService: jest.Mocked<AuditService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTicketRepository = new TicketRepository(null as any) as jest.Mocked<TicketRepository>;
    mockAuditService = new AuditService(null as any) as jest.Mocked<AuditService>;
    addMessage = new AddMessage(mockTicketRepository, mockAuditService);
  });

  describe('Agregar mensaje básico', () => {
    it('debe agregar un mensaje de cliente correctamente', async () => {
      const messageData: AddMessageRequest = {
        sender_type: 'customer',
        sender_name: 'Test User',
        message: 'Este es mi mensaje'
      };

      const mockMessage = { id: 1, ticket_id: 1, ...messageData };
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue(mockMessage);
      mockAuditService.logAuditEntry = jest.fn().mockResolvedValue({});
      mockTicketRepository.getTicketById = jest.fn().mockResolvedValue({ id: 1, status: TicketStatus.OPEN });

      const result = await addMessage.execute(1, messageData);

      expect(result).toEqual(mockMessage);
      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(1, messageData);
    });

    it('debe agregar un mensaje de agente correctamente', async () => {
      const messageData: AddMessageRequest = {
        sender_type: 'agent',
        sender_id: 123,
        sender_name: 'Agent Smith',
        message: 'Respuesta del agente'
      };

      const mockMessage = { id: 1, ticket_id: 1, ...messageData };
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue(mockMessage);
      mockAuditService.logAuditEntry = jest.fn().mockResolvedValue({});
      mockTicketRepository.getTicketById = jest.fn().mockResolvedValue({ 
        id: 1, 
        status: TicketStatus.OPEN,
        first_response_at: null 
      });
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue({});

      await addMessage.execute(1, messageData);

      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(1, messageData);
    });

    it('debe agregar un mensaje del sistema correctamente', async () => {
      const messageData: AddMessageRequest = {
        sender_type: 'system',
        sender_name: 'Sistema',
        message: 'Mensaje automático del sistema'
      };

      const mockMessage = { id: 1, ticket_id: 1, ...messageData };
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue(mockMessage);
      mockAuditService.logAuditEntry = jest.fn().mockResolvedValue({});
      mockTicketRepository.getTicketById = jest.fn().mockResolvedValue({ id: 1, status: TicketStatus.OPEN });

      await addMessage.execute(1, messageData);

      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(1, messageData);
    });
  });

  describe('Registro de auditoría', () => {
    it('debe registrar entrada de auditoría para mensaje público', async () => {
      const messageData: AddMessageRequest = {
        sender_type: 'customer',
        sender_name: 'Test User',
        message: 'Mensaje público',
        is_internal: false
      };

      const mockMessage = { id: 1, ticket_id: 1, ...messageData };
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue(mockMessage);
      mockAuditService.logAuditEntry = jest.fn().mockResolvedValue({});
      mockTicketRepository.getTicketById = jest.fn().mockResolvedValue({ id: 1, status: TicketStatus.OPEN });

      await addMessage.execute(1, messageData);

      expect(mockAuditService.logAuditEntry).toHaveBeenCalledWith(
        1,
        AuditActionType.MESSAGE_ADDED,
        'customer',
        'Test User',
        undefined,
        undefined,
        'Message added: Mensaje público',
        { is_internal: false }
      );
    });

    it('debe registrar entrada de auditoría para mensaje interno', async () => {
      const messageData: AddMessageRequest = {
        sender_type: 'agent',
        sender_id: 123,
        sender_name: 'Agent Smith',
        message: 'Nota interna del agente',
        is_internal: true
      };

      const mockMessage = { id: 1, ticket_id: 1, ...messageData };
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue(mockMessage);
      mockAuditService.logAuditEntry = jest.fn().mockResolvedValue({});
      mockTicketRepository.getTicketById = jest.fn().mockResolvedValue({ 
        id: 1, 
        status: TicketStatus.OPEN,
        first_response_at: new Date()
      });

      await addMessage.execute(1, messageData);

      expect(mockAuditService.logAuditEntry).toHaveBeenCalledWith(
        1,
        AuditActionType.MESSAGE_ADDED,
        'agent',
        'Agent Smith',
        123,
        undefined,
        'Message added: Nota interna del agente',
        { is_internal: true }
      );
    });

    it('debe truncar mensajes largos en el log de auditoría', async () => {
      const longMessage = 'A'.repeat(150);
      const messageData: AddMessageRequest = {
        sender_type: 'customer',
        sender_name: 'Test User',
        message: longMessage
      };

      const mockMessage = { id: 1, ticket_id: 1, ...messageData };
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue(mockMessage);
      mockAuditService.logAuditEntry = jest.fn().mockResolvedValue({});
      mockTicketRepository.getTicketById = jest.fn().mockResolvedValue({ id: 1, status: TicketStatus.OPEN });

      await addMessage.execute(1, messageData);

      expect(mockAuditService.logAuditEntry).toHaveBeenCalledWith(
        1,
        AuditActionType.MESSAGE_ADDED,
        'customer',
        'Test User',
        undefined,
        undefined,
        expect.stringContaining('...'),
        expect.any(Object)
      );
    });
  });

  describe('Tracking de primera respuesta del agente', () => {
    it('debe actualizar first_response_at cuando es la primera respuesta del agente', async () => {
      const messageData: AddMessageRequest = {
        sender_type: 'agent',
        sender_id: 123,
        sender_name: 'Agent Smith',
        message: 'Primera respuesta'
      };

      const mockMessage = { id: 1, ticket_id: 1, ...messageData };
      const mockTicket = { 
        id: 1, 
        status: TicketStatus.OPEN,
        first_response_at: null 
      };

      mockTicketRepository.addMessage = jest.fn().mockResolvedValue(mockMessage);
      mockAuditService.logAuditEntry = jest.fn().mockResolvedValue({});
      mockTicketRepository.getTicketById = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue({});

      await addMessage.execute(1, messageData);

      expect(mockTicketRepository.updateTicket).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          first_response_at: expect.any(Date)
        })
      );
    });

    it('NO debe actualizar first_response_at si ya existe', async () => {
      const messageData: AddMessageRequest = {
        sender_type: 'agent',
        sender_id: 123,
        sender_name: 'Agent Smith',
        message: 'Segunda respuesta'
      };

      const mockMessage = { id: 1, ticket_id: 1, ...messageData };
      const mockTicket = { 
        id: 1, 
        status: TicketStatus.OPEN,
        first_response_at: new Date('2024-01-01')
      };

      mockTicketRepository.addMessage = jest.fn().mockResolvedValue(mockMessage);
      mockAuditService.logAuditEntry = jest.fn().mockResolvedValue({});
      mockTicketRepository.getTicketById = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue({});

      await addMessage.execute(1, messageData);

      expect(mockTicketRepository.updateTicket).not.toHaveBeenCalled();
    });

    it('NO debe actualizar first_response_at para mensajes de cliente', async () => {
      const messageData: AddMessageRequest = {
        sender_type: 'customer',
        sender_name: 'Test User',
        message: 'Mensaje del cliente'
      };

      const mockMessage = { id: 1, ticket_id: 1, ...messageData };
      const mockTicket = { 
        id: 1, 
        status: TicketStatus.OPEN,
        first_response_at: null 
      };

      mockTicketRepository.addMessage = jest.fn().mockResolvedValue(mockMessage);
      mockAuditService.logAuditEntry = jest.fn().mockResolvedValue({});
      mockTicketRepository.getTicketById = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue({});

      await addMessage.execute(1, messageData);

      expect(mockTicketRepository.updateTicket).not.toHaveBeenCalled();
    });

    it('NO debe actualizar first_response_at para mensajes del sistema', async () => {
      const messageData: AddMessageRequest = {
        sender_type: 'system',
        sender_name: 'Sistema',
        message: 'Mensaje del sistema'
      };

      const mockMessage = { id: 1, ticket_id: 1, ...messageData };
      const mockTicket = { 
        id: 1, 
        status: TicketStatus.OPEN,
        first_response_at: null 
      };

      mockTicketRepository.addMessage = jest.fn().mockResolvedValue(mockMessage);
      mockAuditService.logAuditEntry = jest.fn().mockResolvedValue({});
      mockTicketRepository.getTicketById = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue({});

      await addMessage.execute(1, messageData);

      expect(mockTicketRepository.updateTicket).not.toHaveBeenCalled();
    });
  });

  describe('Auto-actualización de estado del ticket', () => {
    it('debe cambiar estado de WAITING_CUSTOMER a IN_PROGRESS cuando el cliente responde', async () => {
      const messageData: AddMessageRequest = {
        sender_type: 'customer',
        sender_name: 'Test User',
        message: 'Respuesta del cliente'
      };

      const mockMessage = { id: 1, ticket_id: 1, ...messageData };
      const mockTicket = { 
        id: 1, 
        status: TicketStatus.WAITING_CUSTOMER
      };

      mockTicketRepository.addMessage = jest.fn().mockResolvedValue(mockMessage);
      mockAuditService.logAuditEntry = jest.fn().mockResolvedValue({});
      mockTicketRepository.getTicketById = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue({});

      await addMessage.execute(1, messageData);

      expect(mockTicketRepository.updateTicket).toHaveBeenCalledWith(
        1,
        { status: TicketStatus.IN_PROGRESS }
      );
    });

    it('NO debe cambiar estado si el ticket no está en WAITING_CUSTOMER', async () => {
      const messageData: AddMessageRequest = {
        sender_type: 'customer',
        sender_name: 'Test User',
        message: 'Respuesta del cliente'
      };

      const mockMessage = { id: 1, ticket_id: 1, ...messageData };
      const mockTicket = { 
        id: 1, 
        status: TicketStatus.IN_PROGRESS
      };

      mockTicketRepository.addMessage = jest.fn().mockResolvedValue(mockMessage);
      mockAuditService.logAuditEntry = jest.fn().mockResolvedValue({});
      mockTicketRepository.getTicketById = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue({});

      await addMessage.execute(1, messageData);

      expect(mockTicketRepository.updateTicket).not.toHaveBeenCalled();
    });

    it('NO debe cambiar estado para mensajes de agente', async () => {
      const messageData: AddMessageRequest = {
        sender_type: 'agent',
        sender_id: 123,
        sender_name: 'Agent Smith',
        message: 'Respuesta del agente'
      };

      const mockMessage = { id: 1, ticket_id: 1, ...messageData };
      const mockTicket = { 
        id: 1, 
        status: TicketStatus.WAITING_CUSTOMER,
        first_response_at: new Date()
      };

      mockTicketRepository.addMessage = jest.fn().mockResolvedValue(mockMessage);
      mockAuditService.logAuditEntry = jest.fn().mockResolvedValue({});
      mockTicketRepository.getTicketById = jest.fn().mockResolvedValue(mockTicket);
      mockTicketRepository.updateTicket = jest.fn().mockResolvedValue({});

      await addMessage.execute(1, messageData);

      expect(mockTicketRepository.updateTicket).not.toHaveBeenCalled();
    });
  });

  describe('Manejo de errores', () => {
    it('debe propagar errores del repositorio', async () => {
      const messageData: AddMessageRequest = {
        sender_type: 'customer',
        sender_name: 'Test User',
        message: 'Test'
      };

      mockTicketRepository.addMessage = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(addMessage.execute(1, messageData)).rejects.toThrow('Database error');
    });

    it('debe propagar errores del servicio de auditoría', async () => {
      const messageData: AddMessageRequest = {
        sender_type: 'customer',
        sender_name: 'Test User',
        message: 'Test'
      };

      const mockMessage = { id: 1, ticket_id: 1, ...messageData };
      mockTicketRepository.addMessage = jest.fn().mockResolvedValue(mockMessage);
      mockAuditService.logAuditEntry = jest.fn().mockRejectedValue(new Error('Audit error'));

      await expect(addMessage.execute(1, messageData)).rejects.toThrow('Audit error');
    });
  });
});
