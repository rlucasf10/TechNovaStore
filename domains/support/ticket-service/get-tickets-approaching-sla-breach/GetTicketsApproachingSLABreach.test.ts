/**
 * Tests para GetTicketsApproachingSLABreach
 * Cobertura: Obtención de tickets que se acercan a violar el SLA
 */

import { GetTicketsApproachingSLABreach } from './GetTicketsApproachingSLABreach';
import { MetricsService } from '../shared/utils/MetricsService';
import { TicketCategory, TicketPriority, TicketStatus } from '../shared/types';

describe('GetTicketsApproachingSLABreach', () => {
  let getTicketsApproachingSLABreach: GetTicketsApproachingSLABreach;
  let mockMetricsService: jest.Mocked<MetricsService>;

  beforeEach(() => {
    mockMetricsService = {
      getTicketsApproachingSLABreach: jest.fn()
    } as any;

    getTicketsApproachingSLABreach = new GetTicketsApproachingSLABreach(mockMetricsService);
  });

  describe('execute', () => {
    it('debe obtener tickets que se acercan a violar SLA de primera respuesta', async () => {
      // Arrange
      const expectedTickets = [
        {
          ticket_id: 1,
          ticket_number: 'TICKET-001',
          category: TicketCategory.TECHNICAL_SUPPORT,
          priority: TicketPriority.URGENT,
          status: TicketStatus.OPEN,
          created_at: new Date('2024-01-01T10:00:00Z'),
          minutes_until_breach: 5,
          breach_type: 'first_response' as const
        },
        {
          ticket_id: 2,
          ticket_number: 'TICKET-002',
          category: TicketCategory.COMPLAINT,
          priority: TicketPriority.HIGH,
          status: TicketStatus.OPEN,
          created_at: new Date('2024-01-01T10:30:00Z'),
          minutes_until_breach: 10,
          breach_type: 'first_response' as const
        }
      ];

      mockMetricsService.getTicketsApproachingSLABreach.mockResolvedValue(expectedTickets);

      // Act
      const result = await getTicketsApproachingSLABreach.execute();

      // Assert
      expect(mockMetricsService.getTicketsApproachingSLABreach).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedTickets);
      expect(result).toHaveLength(2);
      expect(result[0].breach_type).toBe('first_response');
    });

    it('debe obtener tickets que se acercan a violar SLA de resolución', async () => {
      // Arrange
      const expectedTickets = [
        {
          ticket_id: 3,
          ticket_number: 'TICKET-003',
          category: TicketCategory.PAYMENT_PROBLEM,
          priority: TicketPriority.HIGH,
          status: TicketStatus.IN_PROGRESS,
          created_at: new Date('2024-01-01T08:00:00Z'),
          minutes_until_breach: 30,
          breach_type: 'resolution' as const
        }
      ];

      mockMetricsService.getTicketsApproachingSLABreach.mockResolvedValue(expectedTickets);

      // Act
      const result = await getTicketsApproachingSLABreach.execute();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].breach_type).toBe('resolution');
      expect(result[0].status).toBe(TicketStatus.IN_PROGRESS);
    });

    it('debe obtener tickets ordenados por tiempo hasta violación', async () => {
      // Arrange
      const expectedTickets = [
        {
          ticket_id: 1,
          ticket_number: 'TICKET-001',
          category: TicketCategory.TECHNICAL_SUPPORT,
          priority: TicketPriority.URGENT,
          status: TicketStatus.OPEN,
          created_at: new Date(),
          minutes_until_breach: 2,
          breach_type: 'first_response' as const
        },
        {
          ticket_id: 2,
          ticket_number: 'TICKET-002',
          category: TicketCategory.GENERAL_INQUIRY,
          priority: TicketPriority.MEDIUM,
          status: TicketStatus.OPEN,
          created_at: new Date(),
          minutes_until_breach: 15,
          breach_type: 'first_response' as const
        },
        {
          ticket_id: 3,
          ticket_number: 'TICKET-003',
          category: TicketCategory.PRODUCT_QUESTION,
          priority: TicketPriority.LOW,
          status: TicketStatus.OPEN,
          created_at: new Date(),
          minutes_until_breach: 45,
          breach_type: 'first_response' as const
        }
      ];

      mockMetricsService.getTicketsApproachingSLABreach.mockResolvedValue(expectedTickets);

      // Act
      const result = await getTicketsApproachingSLABreach.execute();

      // Assert
      expect(result[0].minutes_until_breach).toBeLessThan(result[1].minutes_until_breach);
      expect(result[1].minutes_until_breach).toBeLessThan(result[2].minutes_until_breach);
    });

    it('debe manejar lista vacía cuando no hay tickets cerca de violación', async () => {
      // Arrange
      mockMetricsService.getTicketsApproachingSLABreach.mockResolvedValue([]);

      // Act
      const result = await getTicketsApproachingSLABreach.execute();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('debe obtener tickets con diferentes prioridades', async () => {
      // Arrange
      const expectedTickets = [
        {
          ticket_id: 1,
          ticket_number: 'TICKET-001',
          category: TicketCategory.TECHNICAL_SUPPORT,
          priority: TicketPriority.URGENT,
          status: TicketStatus.OPEN,
          created_at: new Date(),
          minutes_until_breach: 5,
          breach_type: 'first_response' as const
        },
        {
          ticket_id: 2,
          ticket_number: 'TICKET-002',
          category: TicketCategory.GENERAL_INQUIRY,
          priority: TicketPriority.HIGH,
          status: TicketStatus.OPEN,
          created_at: new Date(),
          minutes_until_breach: 10,
          breach_type: 'first_response' as const
        },
        {
          ticket_id: 3,
          ticket_number: 'TICKET-003',
          category: TicketCategory.PRODUCT_QUESTION,
          priority: TicketPriority.MEDIUM,
          status: TicketStatus.OPEN,
          created_at: new Date(),
          minutes_until_breach: 20,
          breach_type: 'first_response' as const
        },
        {
          ticket_id: 4,
          ticket_number: 'TICKET-004',
          category: TicketCategory.PAYMENT_PROBLEM,
          priority: TicketPriority.LOW,
          status: TicketStatus.OPEN,
          created_at: new Date(),
          minutes_until_breach: 60,
          breach_type: 'first_response' as const
        }
      ];

      mockMetricsService.getTicketsApproachingSLABreach.mockResolvedValue(expectedTickets);

      // Act
      const result = await getTicketsApproachingSLABreach.execute();

      // Assert
      expect(result).toHaveLength(4);
      expect(result.map(t => t.priority)).toEqual([
        TicketPriority.URGENT,
        TicketPriority.HIGH,
        TicketPriority.MEDIUM,
        TicketPriority.LOW
      ]);
    });

    it('debe obtener tickets con diferentes categorías', async () => {
      // Arrange
      const expectedTickets = [
        {
          ticket_id: 1,
          ticket_number: 'TICKET-001',
          category: TicketCategory.TECHNICAL_SUPPORT,
          priority: TicketPriority.HIGH,
          status: TicketStatus.OPEN,
          created_at: new Date(),
          minutes_until_breach: 10,
          breach_type: 'first_response' as const
        },
        {
          ticket_id: 2,
          ticket_number: 'TICKET-002',
          category: TicketCategory.PAYMENT_PROBLEM,
          priority: TicketPriority.HIGH,
          status: TicketStatus.OPEN,
          created_at: new Date(),
          minutes_until_breach: 15,
          breach_type: 'first_response' as const
        },
        {
          ticket_id: 3,
          ticket_number: 'TICKET-003',
          category: TicketCategory.COMPLAINT,
          priority: TicketPriority.HIGH,
          status: TicketStatus.OPEN,
          created_at: new Date(),
          minutes_until_breach: 20,
          breach_type: 'first_response' as const
        }
      ];

      mockMetricsService.getTicketsApproachingSLABreach.mockResolvedValue(expectedTickets);

      // Act
      const result = await getTicketsApproachingSLABreach.execute();

      // Assert
      expect(result).toHaveLength(3);
      expect(result.map(t => t.category)).toEqual([
        TicketCategory.TECHNICAL_SUPPORT,
        TicketCategory.PAYMENT_PROBLEM,
        TicketCategory.COMPLAINT
      ]);
    });

    it('debe obtener tickets con diferentes estados', async () => {
      // Arrange
      const expectedTickets = [
        {
          ticket_id: 1,
          ticket_number: 'TICKET-001',
          category: TicketCategory.TECHNICAL_SUPPORT,
          priority: TicketPriority.HIGH,
          status: TicketStatus.OPEN,
          created_at: new Date(),
          minutes_until_breach: 10,
          breach_type: 'first_response' as const
        },
        {
          ticket_id: 2,
          ticket_number: 'TICKET-002',
          category: TicketCategory.PAYMENT_PROBLEM,
          priority: TicketPriority.HIGH,
          status: TicketStatus.IN_PROGRESS,
          created_at: new Date(),
          minutes_until_breach: 15,
          breach_type: 'resolution' as const
        },
        {
          ticket_id: 3,
          ticket_number: 'TICKET-003',
          category: TicketCategory.COMPLAINT,
          priority: TicketPriority.HIGH,
          status: TicketStatus.WAITING_CUSTOMER,
          created_at: new Date(),
          minutes_until_breach: 20,
          breach_type: 'resolution' as const
        }
      ];

      mockMetricsService.getTicketsApproachingSLABreach.mockResolvedValue(expectedTickets);

      // Act
      const result = await getTicketsApproachingSLABreach.execute();

      // Assert
      expect(result).toHaveLength(3);
      expect(result.map(t => t.status)).toEqual([
        TicketStatus.OPEN,
        TicketStatus.IN_PROGRESS,
        TicketStatus.WAITING_CUSTOMER
      ]);
    });

    it('debe manejar tickets con tiempo negativo (ya violados)', async () => {
      // Arrange
      const expectedTickets = [
        {
          ticket_id: 1,
          ticket_number: 'TICKET-001',
          category: TicketCategory.TECHNICAL_SUPPORT,
          priority: TicketPriority.URGENT,
          status: TicketStatus.OPEN,
          created_at: new Date('2024-01-01T08:00:00Z'),
          minutes_until_breach: -10,
          breach_type: 'first_response' as const
        }
      ];

      mockMetricsService.getTicketsApproachingSLABreach.mockResolvedValue(expectedTickets);

      // Act
      const result = await getTicketsApproachingSLABreach.execute();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].minutes_until_breach).toBeLessThan(0);
    });

    it('debe manejar tickets muy cerca de violación (menos de 1 minuto)', async () => {
      // Arrange
      const expectedTickets = [
        {
          ticket_id: 1,
          ticket_number: 'TICKET-001',
          category: TicketCategory.TECHNICAL_SUPPORT,
          priority: TicketPriority.URGENT,
          status: TicketStatus.OPEN,
          created_at: new Date(),
          minutes_until_breach: 0.5,
          breach_type: 'first_response' as const
        }
      ];

      mockMetricsService.getTicketsApproachingSLABreach.mockResolvedValue(expectedTickets);

      // Act
      const result = await getTicketsApproachingSLABreach.execute();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].minutes_until_breach).toBeLessThan(1);
    });

    it('debe propagar errores del MetricsService', async () => {
      // Arrange
      const error = new Error('Error de base de datos');
      mockMetricsService.getTicketsApproachingSLABreach.mockRejectedValue(error);

      // Act & Assert
      await expect(getTicketsApproachingSLABreach.execute()).rejects.toThrow('Error de base de datos');
    });

    it('debe manejar múltiples tickets del mismo tipo de violación', async () => {
      // Arrange
      const expectedTickets = Array.from({ length: 10 }, (_, i) => ({
        ticket_id: i + 1,
        ticket_number: `TICKET-${String(i + 1).padStart(3, '0')}`,
        category: TicketCategory.TECHNICAL_SUPPORT,
        priority: TicketPriority.HIGH,
        status: TicketStatus.OPEN,
        created_at: new Date(),
        minutes_until_breach: (i + 1) * 5,
        breach_type: 'first_response' as const
      }));

      mockMetricsService.getTicketsApproachingSLABreach.mockResolvedValue(expectedTickets);

      // Act
      const result = await getTicketsApproachingSLABreach.execute();

      // Assert
      expect(result).toHaveLength(10);
      expect(result.every(t => t.breach_type === 'first_response')).toBe(true);
    });

    it('debe manejar mezcla de tipos de violación', async () => {
      // Arrange
      const expectedTickets = [
        {
          ticket_id: 1,
          ticket_number: 'TICKET-001',
          category: TicketCategory.TECHNICAL_SUPPORT,
          priority: TicketPriority.URGENT,
          status: TicketStatus.OPEN,
          created_at: new Date(),
          minutes_until_breach: 5,
          breach_type: 'first_response' as const
        },
        {
          ticket_id: 2,
          ticket_number: 'TICKET-002',
          category: TicketCategory.PAYMENT_PROBLEM,
          priority: TicketPriority.HIGH,
          status: TicketStatus.IN_PROGRESS,
          created_at: new Date(),
          minutes_until_breach: 10,
          breach_type: 'resolution' as const
        },
        {
          ticket_id: 3,
          ticket_number: 'TICKET-003',
          category: TicketCategory.COMPLAINT,
          priority: TicketPriority.URGENT,
          status: TicketStatus.OPEN,
          created_at: new Date(),
          minutes_until_breach: 15,
          breach_type: 'first_response' as const
        },
        {
          ticket_id: 4,
          ticket_number: 'TICKET-004',
          category: TicketCategory.PRODUCT_QUESTION,
          priority: TicketPriority.MEDIUM,
          status: TicketStatus.IN_PROGRESS,
          created_at: new Date(),
          minutes_until_breach: 20,
          breach_type: 'resolution' as const
        }
      ];

      mockMetricsService.getTicketsApproachingSLABreach.mockResolvedValue(expectedTickets);

      // Act
      const result = await getTicketsApproachingSLABreach.execute();

      // Assert
      expect(result).toHaveLength(4);
      expect(result.filter(t => t.breach_type === 'first_response')).toHaveLength(2);
      expect(result.filter(t => t.breach_type === 'resolution')).toHaveLength(2);
    });

    it('debe incluir información completa del ticket', async () => {
      // Arrange
      const expectedTickets = [
        {
          ticket_id: 1,
          ticket_number: 'TICKET-001',
          category: TicketCategory.TECHNICAL_SUPPORT,
          priority: TicketPriority.URGENT,
          status: TicketStatus.OPEN,
          created_at: new Date('2024-01-01T10:00:00Z'),
          minutes_until_breach: 5,
          breach_type: 'first_response' as const
        }
      ];

      mockMetricsService.getTicketsApproachingSLABreach.mockResolvedValue(expectedTickets);

      // Act
      const result = await getTicketsApproachingSLABreach.execute();

      // Assert
      const ticket = result[0];
      expect(ticket).toHaveProperty('ticket_id');
      expect(ticket).toHaveProperty('ticket_number');
      expect(ticket).toHaveProperty('category');
      expect(ticket).toHaveProperty('priority');
      expect(ticket).toHaveProperty('status');
      expect(ticket).toHaveProperty('created_at');
      expect(ticket).toHaveProperty('minutes_until_breach');
      expect(ticket).toHaveProperty('breach_type');
    });
  });
});

