/**
 * Tests para GetSatisfactionMetrics
 * Cobertura: Obtención de métricas de satisfacción
 */

import { GetSatisfactionMetrics } from './GetSatisfactionMetrics';
import { TicketRepository } from '../shared/repositories/TicketRepository';

describe('GetSatisfactionMetrics', () => {
  let getSatisfactionMetrics: GetSatisfactionMetrics;
  let mockTicketRepository: jest.Mocked<TicketRepository>;

  beforeEach(() => {
    mockTicketRepository = {
      getTicketMetrics: jest.fn()
    } as any;

    getSatisfactionMetrics = new GetSatisfactionMetrics(mockTicketRepository);
  });

  describe('execute - Sin métricas de tickets', () => {
    it('debe retornar métricas de satisfacción sin filtros de fecha', async () => {
      // Act
      const result = await getSatisfactionMetrics.execute();

      // Assert
      expect(result).toHaveProperty('overall_satisfaction');
      expect(result).toHaveProperty('response_time_satisfaction');
      expect(result).toHaveProperty('resolution_quality_satisfaction');
      expect(result).toHaveProperty('agent_helpfulness_satisfaction');
      expect(result).toHaveProperty('satisfaction_trends');
      expect(result).toHaveProperty('nps_score');
      expect(result).toHaveProperty('satisfaction_by_category');
    });

    it('debe retornar métricas con fecha de inicio', async () => {
      // Arrange
      const startDate = new Date('2024-01-01');

      // Act
      const result = await getSatisfactionMetrics.execute(startDate);

      // Assert
      expect(result).toBeDefined();
      expect(result.overall_satisfaction).toBeDefined();
    });

    it('debe retornar métricas con fecha de fin', async () => {
      // Arrange
      const endDate = new Date('2024-12-31');

      // Act
      const result = await getSatisfactionMetrics.execute(undefined, endDate);

      // Assert
      expect(result).toBeDefined();
      expect(result.overall_satisfaction).toBeDefined();
    });

    it('debe retornar métricas con rango de fechas', async () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      // Act
      const result = await getSatisfactionMetrics.execute(startDate, endDate);

      // Assert
      expect(result).toBeDefined();
    });

    it('debe inicializar overall_satisfaction con valores por defecto', async () => {
      // Act
      const result = await getSatisfactionMetrics.execute();

      // Assert
      expect(result.overall_satisfaction.average_rating).toBe(0);
      expect(result.overall_satisfaction.total_responses).toBe(0);
      expect(result.overall_satisfaction.rating_distribution).toEqual({
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0
      });
    });

    it('debe inicializar response_time_satisfaction con valores por defecto', async () => {
      // Act
      const result = await getSatisfactionMetrics.execute();

      // Assert
      expect(result.response_time_satisfaction.average_rating).toBe(0);
      expect(result.response_time_satisfaction.total_responses).toBe(0);
    });

    it('debe inicializar resolution_quality_satisfaction con valores por defecto', async () => {
      // Act
      const result = await getSatisfactionMetrics.execute();

      // Assert
      expect(result.resolution_quality_satisfaction.average_rating).toBe(0);
      expect(result.resolution_quality_satisfaction.total_responses).toBe(0);
    });

    it('debe inicializar agent_helpfulness_satisfaction con valores por defecto', async () => {
      // Act
      const result = await getSatisfactionMetrics.execute();

      // Assert
      expect(result.agent_helpfulness_satisfaction.average_rating).toBe(0);
      expect(result.agent_helpfulness_satisfaction.total_responses).toBe(0);
    });

    it('debe inicializar satisfaction_trends como array vacío', async () => {
      // Act
      const result = await getSatisfactionMetrics.execute();

      // Assert
      expect(Array.isArray(result.satisfaction_trends)).toBe(true);
      expect(result.satisfaction_trends).toHaveLength(0);
    });

    it('debe inicializar nps_score en 0', async () => {
      // Act
      const result = await getSatisfactionMetrics.execute();

      // Assert
      expect(result.nps_score).toBe(0);
    });

    it('debe inicializar satisfaction_by_category como objeto vacío', async () => {
      // Act
      const result = await getSatisfactionMetrics.execute();

      // Assert
      expect(typeof result.satisfaction_by_category).toBe('object');
      expect(Object.keys(result.satisfaction_by_category)).toHaveLength(0);
    });
  });

  describe('execute - Con métricas de tickets', () => {
    it('debe incluir métricas de tickets cuando se solicita', async () => {
      // Arrange
      const ticketMetrics = {
        total_tickets: 100,
        open_tickets: 20,
        in_progress_tickets: 15,
        resolved_tickets: 60,
        closed_tickets: 5,
        average_resolution_time_hours: 24,
        average_first_response_time_hours: 2,
        tickets_by_priority: { low: 20, medium: 50, high: 25, urgent: 5 },
        tickets_by_category: {
          general_inquiry: 30,
          technical_support: 25,
          billing: 15,
          product_inquiry: 20,
          complaint: 10
        },
        escalated_tickets: 15,
        satisfaction_rate: 4.2
      };

      mockTicketRepository.getTicketMetrics.mockResolvedValue(ticketMetrics as any);

      // Act
      const result = await getSatisfactionMetrics.execute(undefined, undefined, true);

      // Assert
      expect(result.ticket_metrics).toBeDefined();
      expect(result.ticket_metrics).toEqual(ticketMetrics);
      expect(mockTicketRepository.getTicketMetrics).toHaveBeenCalledWith(undefined, undefined);
    });

    it('debe NO incluir métricas de tickets cuando no se solicita', async () => {
      // Act
      const result = await getSatisfactionMetrics.execute(undefined, undefined, false);

      // Assert
      expect(result.ticket_metrics).toBeUndefined();
      expect(mockTicketRepository.getTicketMetrics).not.toHaveBeenCalled();
    });

    it('debe incluir métricas de tickets por defecto', async () => {
      // Arrange
      mockTicketRepository.getTicketMetrics.mockResolvedValue({
        total_tickets: 50
      } as any);

      // Act
      const result = await getSatisfactionMetrics.execute();

      // Assert
      expect(result.ticket_metrics).toBeDefined();
      expect(mockTicketRepository.getTicketMetrics).toHaveBeenCalled();
    });

    it('debe pasar fechas correctamente al obtener métricas de tickets', async () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      mockTicketRepository.getTicketMetrics.mockResolvedValue({} as any);

      // Act
      await getSatisfactionMetrics.execute(startDate, endDate, true);

      // Assert
      expect(mockTicketRepository.getTicketMetrics).toHaveBeenCalledWith(startDate, endDate);
    });

    it('debe manejar métricas de tickets con valores completos', async () => {
      // Arrange
      const completeMetrics = {
        total_tickets: 200,
        open_tickets: 40,
        resolved_tickets: 110,
        average_resolution_time: 18.5,
        average_satisfaction_rating: 4.5,
        tickets_by_priority: {
          low: 50,
          medium: 80,
          high: 60,
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
        escalation_rate: 25
      };

      mockTicketRepository.getTicketMetrics.mockResolvedValue(completeMetrics as any);

      // Act
      const result = await getSatisfactionMetrics.execute(undefined, undefined, true);

      // Assert
      expect(result.ticket_metrics).toEqual(completeMetrics);
      expect(result.ticket_metrics!.total_tickets).toBe(200);
      expect(result.ticket_metrics!.average_satisfaction_rating).toBe(4.5);
    });
  });

  describe('execute - Estructura de respuesta', () => {
    it('debe retornar estructura completa de métricas de satisfacción', async () => {
      // Act
      const result = await getSatisfactionMetrics.execute();

      // Assert
      expect(result).toMatchObject({
        overall_satisfaction: {
          average_rating: expect.any(Number),
          total_responses: expect.any(Number),
          rating_distribution: expect.any(Object)
        },
        response_time_satisfaction: {
          average_rating: expect.any(Number),
          total_responses: expect.any(Number)
        },
        resolution_quality_satisfaction: {
          average_rating: expect.any(Number),
          total_responses: expect.any(Number)
        },
        agent_helpfulness_satisfaction: {
          average_rating: expect.any(Number),
          total_responses: expect.any(Number)
        },
        satisfaction_trends: expect.any(Array),
        nps_score: expect.any(Number),
        satisfaction_by_category: expect.any(Object)
      });
    });

    it('debe tener rating_distribution con todas las calificaciones', async () => {
      // Act
      const result = await getSatisfactionMetrics.execute();

      // Assert
      expect(result.overall_satisfaction.rating_distribution).toHaveProperty('1');
      expect(result.overall_satisfaction.rating_distribution).toHaveProperty('2');
      expect(result.overall_satisfaction.rating_distribution).toHaveProperty('3');
      expect(result.overall_satisfaction.rating_distribution).toHaveProperty('4');
      expect(result.overall_satisfaction.rating_distribution).toHaveProperty('5');
    });
  });

  describe('execute - Manejo de errores', () => {
    it('debe propagar errores del repositorio', async () => {
      // Arrange
      const error = new Error('Error de base de datos');
      mockTicketRepository.getTicketMetrics.mockRejectedValue(error);

      // Act & Assert
      await expect(
        getSatisfactionMetrics.execute(undefined, undefined, true)
      ).rejects.toThrow('Error de base de datos');
    });

    it('debe manejar error al obtener métricas de tickets', async () => {
      // Arrange
      mockTicketRepository.getTicketMetrics.mockRejectedValue(new Error('DB Error'));

      // Act & Assert
      await expect(
        getSatisfactionMetrics.execute(undefined, undefined, true)
      ).rejects.toThrow('DB Error');
    });
  });

  describe('execute - Casos especiales', () => {
    it('debe manejar fechas en diferentes formatos', async () => {
      // Arrange
      const startDate = new Date('2024-06-15T10:30:00Z');
      const endDate = new Date('2024-06-30T23:59:59Z');
      mockTicketRepository.getTicketMetrics.mockResolvedValue({} as any);

      // Act
      const result = await getSatisfactionMetrics.execute(startDate, endDate, true);

      // Assert
      expect(result).toBeDefined();
      expect(mockTicketRepository.getTicketMetrics).toHaveBeenCalledWith(startDate, endDate);
    });

    it('debe manejar solo fecha de inicio', async () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      mockTicketRepository.getTicketMetrics.mockResolvedValue({} as any);

      // Act
      const result = await getSatisfactionMetrics.execute(startDate, undefined, true);

      // Assert
      expect(result).toBeDefined();
      expect(mockTicketRepository.getTicketMetrics).toHaveBeenCalledWith(startDate, undefined);
    });

    it('debe manejar solo fecha de fin', async () => {
      // Arrange
      const endDate = new Date('2024-12-31');
      mockTicketRepository.getTicketMetrics.mockResolvedValue({} as any);

      // Act
      const result = await getSatisfactionMetrics.execute(undefined, endDate, true);

      // Assert
      expect(result).toBeDefined();
      expect(mockTicketRepository.getTicketMetrics).toHaveBeenCalledWith(undefined, endDate);
    });

    it('debe retornar métricas consistentes en múltiples llamadas', async () => {
      // Act
      const result1 = await getSatisfactionMetrics.execute();
      const result2 = await getSatisfactionMetrics.execute();

      // Assert
      expect(result1).toEqual(result2);
    });
  });
});
