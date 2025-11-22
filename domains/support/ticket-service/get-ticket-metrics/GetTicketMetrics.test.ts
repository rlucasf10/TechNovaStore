/**
 * Tests para GetTicketMetrics
 * Cobertura: Obtención de métricas básicas de tickets
 */

import { GetTicketMetrics } from './GetTicketMetrics';
import { TicketRepository } from '../shared/repositories/TicketRepository';
import { ITicketMetrics } from '../shared/types';

describe('GetTicketMetrics', () => {
  let getTicketMetrics: GetTicketMetrics;
  let mockTicketRepository: jest.Mocked<TicketRepository>;

  beforeEach(() => {
    mockTicketRepository = {
      getTicketMetrics: jest.fn()
    } as any;

    getTicketMetrics = new GetTicketMetrics(mockTicketRepository);
  });

  describe('execute', () => {
    it('debe obtener métricas sin filtros de fecha', async () => {
      // Arrange
      const expectedMetrics: ITicketMetrics = {
        total_tickets: 100,
        open_tickets: 25,
        resolved_tickets: 5,
        average_resolution_time: 24.5,
        average_satisfaction_rating: 4.2,
        tickets_by_priority: {
          low: 20,
          medium: 50,
          high: 25,
          urgent: 5
        },
        tickets_by_category: {
          general_inquiry: 30,
          technical_support: 25,
          payment_problem: 15,
          product_question: 20,
          complaint: 10,
          order_issue: 0,
          shipping_inquiry: 0,
          refund_request: 0
        },
        escalation_rate: 15
      };

      mockTicketRepository.getTicketMetrics.mockResolvedValue(expectedMetrics);

      // Act
      const result = await getTicketMetrics.execute();

      // Assert
      expect(mockTicketRepository.getTicketMetrics).toHaveBeenCalledWith(undefined, undefined);
      expect(result).toEqual(expectedMetrics);
    });

    it('debe obtener métricas con fecha de inicio', async () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const expectedMetrics: ITicketMetrics = {
        total_tickets: 50,
        open_tickets: 10,
        resolved_tickets: 5,
        average_resolution_time: 20.0,
        average_satisfaction_rating: 4.2,
        tickets_by_priority: {
          low: 10,
          medium: 25,
          high: 12,
          urgent: 3
        },
        tickets_by_category: {
          general_inquiry: 15,
          technical_support: 12,
          payment_problem: 8,
          product_question: 10,
          complaint: 5,
          order_issue: 0,
          shipping_inquiry: 0,
          refund_request: 0
        },
        escalation_rate: 8
      };

      mockTicketRepository.getTicketMetrics.mockResolvedValue(expectedMetrics);

      // Act
      const result = await getTicketMetrics.execute(startDate);

      // Assert
      expect(mockTicketRepository.getTicketMetrics).toHaveBeenCalledWith(startDate, undefined);
      expect(result).toEqual(expectedMetrics);
    });

    it('debe obtener métricas con fecha de fin', async () => {
      // Arrange
      const endDate = new Date('2024-12-31');
      const expectedMetrics: ITicketMetrics = {
        total_tickets: 75,
        open_tickets: 18,
        resolved_tickets: 7,
        average_resolution_time: 22.0,
        average_satisfaction_rating: 4.2,
        tickets_by_priority: {
          low: 15,
          medium: 40,
          high: 18,
          urgent: 2
        },
        tickets_by_category: {
          general_inquiry: 25,
          technical_support: 20,
          payment_problem: 10,
          product_question: 15,
          complaint: 5,
          order_issue: 0,
          shipping_inquiry: 0,
          refund_request: 0
        },
        escalation_rate: 10
      };

      mockTicketRepository.getTicketMetrics.mockResolvedValue(expectedMetrics);

      // Act
      const result = await getTicketMetrics.execute(undefined, endDate);

      // Assert
      expect(mockTicketRepository.getTicketMetrics).toHaveBeenCalledWith(undefined, endDate);
      expect(result).toEqual(expectedMetrics);
    });

    it('debe obtener métricas con rango de fechas completo', async () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const expectedMetrics: ITicketMetrics = {
        total_tickets: 200,
        open_tickets: 45,
        resolved_tickets: 15,
        average_resolution_time: 25.0,
        average_satisfaction_rating: 4.2,
        tickets_by_priority: {
          low: 40,
          medium: 100,
          high: 50,
          urgent: 10
        },
        tickets_by_category: {
          general_inquiry: 60,
          technical_support: 50,
          payment_problem: 30,
          product_question: 40,
          complaint: 20,
          order_issue: 0,
          shipping_inquiry: 0,
          refund_request: 0
        },
        escalation_rate: 30
      };

      mockTicketRepository.getTicketMetrics.mockResolvedValue(expectedMetrics);

      // Act
      const result = await getTicketMetrics.execute(startDate, endDate);

      // Assert
      expect(mockTicketRepository.getTicketMetrics).toHaveBeenCalledWith(startDate, endDate);
      expect(result).toEqual(expectedMetrics);
    });

    it('debe manejar métricas con cero tickets', async () => {
      // Arrange
      const expectedMetrics: ITicketMetrics = {
        total_tickets: 0,
        open_tickets: 0,
        resolved_tickets: 0,
        average_resolution_time: 0,
        average_satisfaction_rating: 0,
        tickets_by_priority: {
          low: 0,
          medium: 0,
          high: 0,
          urgent: 0
        },
        tickets_by_category: {
          general_inquiry: 0,
          technical_support: 0,
          payment_problem: 0,
          product_question: 0,
          complaint: 0,
          order_issue: 0,
          shipping_inquiry: 0,
          refund_request: 0
        },
        escalation_rate: 0
      };

      mockTicketRepository.getTicketMetrics.mockResolvedValue(expectedMetrics);

      // Act
      const result = await getTicketMetrics.execute();

      // Assert
      expect(result.total_tickets).toBe(0);
      expect(result.open_tickets).toBe(0);
      expect(result.average_satisfaction_rating).toBe(0);
    });

    it('debe manejar métricas con alta satisfacción', async () => {
      // Arrange
      const expectedMetrics: ITicketMetrics = {
        total_tickets: 100,
        open_tickets: 15,
        resolved_tickets: 5,
        average_resolution_time: 12.0,
        average_satisfaction_rating: 4.9,
        tickets_by_priority: {
          low: 50,
          medium: 40,
          high: 8,
          urgent: 2
        },
        tickets_by_category: {
          general_inquiry: 60,
          technical_support: 20,
          payment_problem: 10,
          product_question: 8,
          complaint: 2,
          order_issue: 0,
          shipping_inquiry: 0,
          refund_request: 0
        },
        escalation_rate: 5
      };

      mockTicketRepository.getTicketMetrics.mockResolvedValue(expectedMetrics);

      // Act
      const result = await getTicketMetrics.execute();

      // Assert
      expect(result.average_satisfaction_rating).toBe(4.9);
      expect(result.average_resolution_time).toBe(12.0);
    });

    it('debe manejar métricas con baja satisfacción', async () => {
      // Arrange
      const expectedMetrics: ITicketMetrics = {
        total_tickets: 100,
        open_tickets: 30,
        resolved_tickets: 5,
        average_resolution_time: 48.0,
        average_satisfaction_rating: 2.1,
        tickets_by_priority: {
          low: 10,
          medium: 30,
          high: 40,
          urgent: 20
        },
        tickets_by_category: {
          general_inquiry: 10,
          technical_support: 30,
          payment_problem: 20,
          product_question: 15,
          complaint: 25,
          order_issue: 0,
          shipping_inquiry: 0,
          refund_request: 0
        },
        escalation_rate: 40
      };

      mockTicketRepository.getTicketMetrics.mockResolvedValue(expectedMetrics);

      // Act
      const result = await getTicketMetrics.execute();

      // Assert
      expect(result.average_satisfaction_rating).toBe(2.1);
      expect(result.escalation_rate).toBe(40);
      expect(result.average_resolution_time).toBe(48.0);
    });

    it('debe propagar errores del repositorio', async () => {
      // Arrange
      const error = new Error('Error de base de datos');
      mockTicketRepository.getTicketMetrics.mockRejectedValue(error);

      // Act & Assert
      await expect(getTicketMetrics.execute()).rejects.toThrow('Error de base de datos');
    });

    it('debe manejar fechas en diferentes formatos', async () => {
      // Arrange
      const startDate = new Date('2024-06-15T10:30:00Z');
      const endDate = new Date('2024-06-30T23:59:59Z');
      
      mockTicketRepository.getTicketMetrics.mockResolvedValue({
        total_tickets: 25
      } as any);

      // Act
      await getTicketMetrics.execute(startDate, endDate);

      // Assert
      expect(mockTicketRepository.getTicketMetrics).toHaveBeenCalledWith(startDate, endDate);
    });

    it('debe manejar métricas con todos los tickets urgentes', async () => {
      // Arrange
      const expectedMetrics: ITicketMetrics = {
        total_tickets: 50,
        open_tickets: 15,
        resolved_tickets: 5,
        average_resolution_time: 6.0,
        average_satisfaction_rating: 4.2,
        tickets_by_priority: {
          low: 0,
          medium: 0,
          high: 0,
          urgent: 50
        },
        tickets_by_category: {
          general_inquiry: 0,
          technical_support: 20,
          payment_problem: 10,
          product_question: 5,
          complaint: 15,
          order_issue: 0,
          shipping_inquiry: 0,
          refund_request: 0
        },
        escalation_rate: 45
      };

      mockTicketRepository.getTicketMetrics.mockResolvedValue(expectedMetrics);

      // Act
      const result = await getTicketMetrics.execute();

      // Assert
      expect(result.tickets_by_priority.urgent).toBe(50);
      expect(result.tickets_by_priority.low).toBe(0);
    });

    it('debe manejar métricas con distribución equilibrada', async () => {
      // Arrange
      const expectedMetrics: ITicketMetrics = {
        total_tickets: 100,
        open_tickets: 25,
        resolved_tickets: 25,
        average_resolution_time: 24.0,
        average_satisfaction_rating: 4.2,
        tickets_by_priority: {
          low: 25,
          medium: 25,
          high: 25,
          urgent: 25
        },
        tickets_by_category: {
          general_inquiry: 20,
          technical_support: 20,
          payment_problem: 20,
          product_question: 20,
          complaint: 20,
          order_issue: 0,
          shipping_inquiry: 0,
          refund_request: 0
        },
        escalation_rate: 20
      };

      mockTicketRepository.getTicketMetrics.mockResolvedValue(expectedMetrics);

      // Act
      const result = await getTicketMetrics.execute();

      // Assert
      expect(result.open_tickets).toBe(25);
      expect(result.open_tickets).toBe(25);
      expect(result.resolved_tickets).toBe(25);
      expect(result.resolved_tickets).toBe(25);
    });

    it('debe manejar tiempos de respuesta muy rápidos', async () => {
      // Arrange
      const expectedMetrics: ITicketMetrics = {
        total_tickets: 100,
        open_tickets: 20,
        resolved_tickets: 5,
        average_resolution_time: 0.5,
        average_satisfaction_rating: 4.2,
        tickets_by_priority: {
          low: 80,
          medium: 15,
          high: 4,
          urgent: 1
        },
        tickets_by_category: {
          general_inquiry: 90,
          technical_support: 5,
          payment_problem: 3,
          product_question: 2,
          complaint: 0,
          order_issue: 0,
          shipping_inquiry: 0,
          refund_request: 0
        },
        escalation_rate: 2
      };

      mockTicketRepository.getTicketMetrics.mockResolvedValue(expectedMetrics);

      // Act
      const result = await getTicketMetrics.execute();

      // Assert
      expect(result.average_resolution_time).toBe(0.5);
      expect(result.escalation_rate).toBe(2);
    });

    it('debe manejar tiempos de respuesta muy lentos', async () => {
      // Arrange
      const expectedMetrics: ITicketMetrics = {
        total_tickets: 100,
        open_tickets: 30,
        resolved_tickets: 2,
        average_resolution_time: 120.0,
        average_satisfaction_rating: 4.2,
        tickets_by_priority: {
          low: 5,
          medium: 15,
          high: 50,
          urgent: 30
        },
        tickets_by_category: {
          general_inquiry: 10,
          technical_support: 40,
          payment_problem: 20,
          product_question: 10,
          complaint: 20,
          order_issue: 0,
          shipping_inquiry: 0,
          refund_request: 0
        },
        escalation_rate: 70
      };

      mockTicketRepository.getTicketMetrics.mockResolvedValue(expectedMetrics);

      // Act
      const result = await getTicketMetrics.execute();

      // Assert
      expect(result.average_resolution_time).toBe(120.0);
      expect(result.escalation_rate).toBe(70);
    });
  });
});




