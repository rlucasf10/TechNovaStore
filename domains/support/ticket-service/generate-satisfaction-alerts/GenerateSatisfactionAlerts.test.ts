/**
 * Tests para GenerateSatisfactionAlerts
 * Cobertura: Generación de alertas de satisfacción
 */

import { GenerateSatisfactionAlerts } from './GenerateSatisfactionAlerts';
import { GetSatisfactionMetrics, SatisfactionMetrics } from '../get-satisfaction-metrics/GetSatisfactionMetrics';

describe('GenerateSatisfactionAlerts', () => {
  let generateSatisfactionAlerts: GenerateSatisfactionAlerts;
  let mockGetSatisfactionMetrics: jest.Mocked<GetSatisfactionMetrics>;

  beforeEach(() => {
    mockGetSatisfactionMetrics = {
      execute: jest.fn()
    } as any;

    generateSatisfactionAlerts = new GenerateSatisfactionAlerts(mockGetSatisfactionMetrics);
  });

  const createMockMetrics = (overrides?: Partial<SatisfactionMetrics>): SatisfactionMetrics => ({
    overall_satisfaction: {
      average_rating: 4.0,
      total_responses: 100,
      rating_distribution: { 1: 5, 2: 10, 3: 20, 4: 30, 5: 35 }
    },
    response_time_satisfaction: {
      average_rating: 4.0,
      total_responses: 100
    },
    resolution_quality_satisfaction: {
      average_rating: 4.0,
      total_responses: 100
    },
    agent_helpfulness_satisfaction: {
      average_rating: 4.0,
      total_responses: 100
    },
    satisfaction_trends: [],
    nps_score: 20,
    satisfaction_by_category: {},
    ...overrides
  });

  describe('execute - Sin alertas', () => {
    it('debe retornar array vacío cuando todas las métricas son buenas', async () => {
      // Arrange
      const goodMetrics = createMockMetrics();
      mockGetSatisfactionMetrics.execute.mockResolvedValue(goodMetrics);

      // Act
      const result = await generateSatisfactionAlerts.execute();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('debe NO generar alerta con satisfacción general alta', async () => {
      // Arrange
      const metrics = createMockMetrics({
        overall_satisfaction: {
          average_rating: 4.5,
          total_responses: 50,
          rating_distribution: { 1: 0, 2: 0, 3: 5, 4: 20, 5: 25 }
        }
      });
      mockGetSatisfactionMetrics.execute.mockResolvedValue(metrics);

      // Act
      const result = await generateSatisfactionAlerts.execute();

      // Assert
      expect(result).toHaveLength(0);
    });

    it('debe NO generar alerta con NPS positivo', async () => {
      // Arrange
      const metrics = createMockMetrics({ nps_score: 50 });
      mockGetSatisfactionMetrics.execute.mockResolvedValue(metrics);

      // Act
      const result = await generateSatisfactionAlerts.execute();

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('execute - Alerta de baja satisfacción general', () => {
    it('debe generar alerta cuando satisfacción general es menor a 3.0', async () => {
      // Arrange
      const metrics = createMockMetrics({
        overall_satisfaction: {
          average_rating: 2.5,
          total_responses: 50,
          rating_distribution: { 1: 15, 2: 20, 3: 10, 4: 3, 5: 2 }
        }
      });
      mockGetSatisfactionMetrics.execute.mockResolvedValue(metrics);

      // Act
      const result = await generateSatisfactionAlerts.execute();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('low_rating');
      expect(result[0].severity).toBe('high');
      expect(result[0].metric_value).toBe(2.5);
      expect(result[0].threshold).toBe(3.0);
    });

    it('debe incluir mensaje descriptivo en alerta de baja satisfacción', async () => {
      // Arrange
      const metrics = createMockMetrics({
        overall_satisfaction: {
          average_rating: 2.8,
          total_responses: 20,
          rating_distribution: { 1: 5, 2: 8, 3: 5, 4: 1, 5: 1 }
        }
      });
      mockGetSatisfactionMetrics.execute.mockResolvedValue(metrics);

      // Act
      const result = await generateSatisfactionAlerts.execute();

      // Assert
      expect(result[0].message).toContain('satisfacción general');
      expect(result[0].message).toContain('umbral aceptable');
    });

    it('debe incluir recomendaciones en alerta de baja satisfacción', async () => {
      // Arrange
      const metrics = createMockMetrics({
        overall_satisfaction: {
          average_rating: 2.0,
          total_responses: 30,
          rating_distribution: { 1: 10, 2: 15, 3: 3, 4: 1, 5: 1 }
        }
      });
      mockGetSatisfactionMetrics.execute.mockResolvedValue(metrics);

      // Act
      const result = await generateSatisfactionAlerts.execute();

      // Assert
      expect(result[0].recommendations).toContain('Revisar los procesos de atención al cliente');
      expect(result[0].recommendations).toContain('Capacitar al equipo de soporte en mejores prácticas');
      expect(result[0].recommendations).toContain('Analizar los comentarios negativos para identificar patrones');
      expect(result[0].recommendations).toHaveLength(3);
    });

    it('debe NO generar alerta si hay pocas respuestas (menos de 10)', async () => {
      // Arrange
      const metrics = createMockMetrics({
        overall_satisfaction: {
          average_rating: 2.0,
          total_responses: 5,
          rating_distribution: { 1: 2, 2: 2, 3: 1, 4: 0, 5: 0 }
        }
      });
      mockGetSatisfactionMetrics.execute.mockResolvedValue(metrics);

      // Act
      const result = await generateSatisfactionAlerts.execute();

      // Assert
      expect(result).toHaveLength(0);
    });

    it('debe generar alerta con exactamente 10 respuestas', async () => {
      // Arrange
      const metrics = createMockMetrics({
        overall_satisfaction: {
          average_rating: 2.5,
          total_responses: 10,
          rating_distribution: { 1: 3, 2: 4, 3: 2, 4: 1, 5: 0 }
        }
      });
      mockGetSatisfactionMetrics.execute.mockResolvedValue(metrics);

      // Act
      const result = await generateSatisfactionAlerts.execute();

      // Assert
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].type).toBe('low_rating');
    });
  });

  describe('execute - Alerta de tiempo de respuesta', () => {
    it('debe generar alerta cuando satisfacción de tiempo de respuesta es menor a 3.5', async () => {
      // Arrange
      const metrics = createMockMetrics({
        response_time_satisfaction: {
          average_rating: 3.0,
          total_responses: 50
        }
      });
      mockGetSatisfactionMetrics.execute.mockResolvedValue(metrics);

      // Act
      const result = await generateSatisfactionAlerts.execute();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('low_rating');
      expect(result[0].severity).toBe('medium');
      expect(result[0].metric_value).toBe(3.0);
      expect(result[0].threshold).toBe(3.5);
    });

    it('debe incluir mensaje sobre tiempos de respuesta', async () => {
      // Arrange
      const metrics = createMockMetrics({
        response_time_satisfaction: {
          average_rating: 2.5,
          total_responses: 30
        }
      });
      mockGetSatisfactionMetrics.execute.mockResolvedValue(metrics);

      // Act
      const result = await generateSatisfactionAlerts.execute();

      // Assert
      expect(result[0].message).toContain('tiempos de respuesta');
    });

    it('debe incluir recomendaciones para mejorar tiempos de respuesta', async () => {
      // Arrange
      const metrics = createMockMetrics({
        response_time_satisfaction: {
          average_rating: 3.0,
          total_responses: 20
        }
      });
      mockGetSatisfactionMetrics.execute.mockResolvedValue(metrics);

      // Act
      const result = await generateSatisfactionAlerts.execute();

      // Assert
      expect(result[0].recommendations).toContain('Reducir los tiempos de primera respuesta');
      expect(result[0].recommendations).toContain('Implementar respuestas automáticas de confirmación');
      expect(result[0].recommendations).toContain('Aumentar el personal de soporte en horarios pico');
    });

    it('debe NO generar alerta con pocas respuestas de tiempo', async () => {
      // Arrange
      const metrics = createMockMetrics({
        response_time_satisfaction: {
          average_rating: 2.0,
          total_responses: 8
        }
      });
      mockGetSatisfactionMetrics.execute.mockResolvedValue(metrics);

      // Act
      const result = await generateSatisfactionAlerts.execute();

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('execute - Alerta de NPS negativo', () => {
    it('debe generar alerta cuando NPS es negativo', async () => {
      // Arrange
      const metrics = createMockMetrics({ nps_score: -10 });
      mockGetSatisfactionMetrics.execute.mockResolvedValue(metrics);

      // Act
      const result = await generateSatisfactionAlerts.execute();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('negative_trend');
      expect(result[0].severity).toBe('high');
      expect(result[0].metric_value).toBe(-10);
      expect(result[0].threshold).toBe(0);
    });

    it('debe incluir mensaje sobre NPS negativo', async () => {
      // Arrange
      const metrics = createMockMetrics({ nps_score: -25 });
      mockGetSatisfactionMetrics.execute.mockResolvedValue(metrics);

      // Act
      const result = await generateSatisfactionAlerts.execute();

      // Assert
      expect(result[0].message).toContain('Net Promoter Score');
      expect(result[0].message).toContain('negativo');
    });

    it('debe incluir recomendaciones para mejorar NPS', async () => {
      // Arrange
      const metrics = createMockMetrics({ nps_score: -5 });
      mockGetSatisfactionMetrics.execute.mockResolvedValue(metrics);

      // Act
      const result = await generateSatisfactionAlerts.execute();

      // Assert
      expect(result[0].recommendations).toContain('Implementar programa de mejora de experiencia del cliente');
      expect(result[0].recommendations).toContain('Realizar entrevistas en profundidad con clientes insatisfechos');
      expect(result[0].recommendations).toContain('Revisar y mejorar los procesos de resolución de problemas');
    });

    it('debe NO generar alerta cuando NPS es exactamente 0', async () => {
      // Arrange
      const metrics = createMockMetrics({ nps_score: 0 });
      mockGetSatisfactionMetrics.execute.mockResolvedValue(metrics);

      // Act
      const result = await generateSatisfactionAlerts.execute();

      // Assert
      expect(result).toHaveLength(0);
    });

    it('debe NO generar alerta cuando NPS es positivo', async () => {
      // Arrange
      const metrics = createMockMetrics({ nps_score: 15 });
      mockGetSatisfactionMetrics.execute.mockResolvedValue(metrics);

      // Act
      const result = await generateSatisfactionAlerts.execute();

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('execute - Múltiples alertas', () => {
    it('debe generar múltiples alertas cuando hay varios problemas', async () => {
      // Arrange
      const metrics = createMockMetrics({
        overall_satisfaction: {
          average_rating: 2.5,
          total_responses: 50,
          rating_distribution: { 1: 15, 2: 20, 3: 10, 4: 3, 5: 2 }
        },
        response_time_satisfaction: {
          average_rating: 3.0,
          total_responses: 50
        },
        nps_score: -15
      });
      mockGetSatisfactionMetrics.execute.mockResolvedValue(metrics);

      // Act
      const result = await generateSatisfactionAlerts.execute();

      // Assert
      expect(result).toHaveLength(3);
      expect(result.map(a => a.type)).toContain('low_rating');
      expect(result.map(a => a.type)).toContain('negative_trend');
    });

    it('debe ordenar alertas por severidad', async () => {
      // Arrange
      const metrics = createMockMetrics({
        overall_satisfaction: {
          average_rating: 2.5,
          total_responses: 50,
          rating_distribution: { 1: 15, 2: 20, 3: 10, 4: 3, 5: 2 }
        },
        response_time_satisfaction: {
          average_rating: 3.0,
          total_responses: 50
        }
      });
      mockGetSatisfactionMetrics.execute.mockResolvedValue(metrics);

      // Act
      const result = await generateSatisfactionAlerts.execute();

      // Assert
      expect(result).toHaveLength(2);
      const severities = result.map(a => a.severity);
      expect(severities).toContain('high');
      expect(severities).toContain('medium');
    });
  });

  describe('execute - Con filtros de fecha', () => {
    it('debe pasar fechas al obtener métricas', async () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const metrics = createMockMetrics();
      mockGetSatisfactionMetrics.execute.mockResolvedValue(metrics);

      // Act
      await generateSatisfactionAlerts.execute(startDate, endDate);

      // Assert
      expect(mockGetSatisfactionMetrics.execute).toHaveBeenCalledWith(startDate, endDate);
    });

    it('debe funcionar sin fechas', async () => {
      // Arrange
      const metrics = createMockMetrics();
      mockGetSatisfactionMetrics.execute.mockResolvedValue(metrics);

      // Act
      await generateSatisfactionAlerts.execute();

      // Assert
      expect(mockGetSatisfactionMetrics.execute).toHaveBeenCalledWith(undefined, undefined);
    });
  });

  describe('execute - Estructura de alertas', () => {
    it('debe retornar alertas con estructura completa', async () => {
      // Arrange
      const metrics = createMockMetrics({
        overall_satisfaction: {
          average_rating: 2.5,
          total_responses: 50,
          rating_distribution: { 1: 15, 2: 20, 3: 10, 4: 3, 5: 2 }
        }
      });
      mockGetSatisfactionMetrics.execute.mockResolvedValue(metrics);

      // Act
      const result = await generateSatisfactionAlerts.execute();

      // Assert
      expect(result[0]).toHaveProperty('type');
      expect(result[0]).toHaveProperty('severity');
      expect(result[0]).toHaveProperty('message');
      expect(result[0]).toHaveProperty('metric_value');
      expect(result[0]).toHaveProperty('threshold');
      expect(result[0]).toHaveProperty('recommendations');
      expect(Array.isArray(result[0].recommendations)).toBe(true);
    });
  });

  describe('execute - Manejo de errores', () => {
    it('debe propagar errores al obtener métricas', async () => {
      // Arrange
      const error = new Error('Error al obtener métricas');
      mockGetSatisfactionMetrics.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        generateSatisfactionAlerts.execute()
      ).rejects.toThrow('Error al obtener métricas');
    });
  });

  describe('execute - Casos límite', () => {
    it('debe manejar satisfacción exactamente en el umbral (3.0)', async () => {
      // Arrange
      const metrics = createMockMetrics({
        overall_satisfaction: {
          average_rating: 3.0,
          total_responses: 50,
          rating_distribution: { 1: 5, 2: 10, 3: 20, 4: 10, 5: 5 }
        }
      });
      mockGetSatisfactionMetrics.execute.mockResolvedValue(metrics);

      // Act
      const result = await generateSatisfactionAlerts.execute();

      // Assert
      expect(result).toHaveLength(0);
    });

    it('debe manejar tiempo de respuesta exactamente en el umbral (3.5)', async () => {
      // Arrange
      const metrics = createMockMetrics({
        response_time_satisfaction: {
          average_rating: 3.5,
          total_responses: 50
        }
      });
      mockGetSatisfactionMetrics.execute.mockResolvedValue(metrics);

      // Act
      const result = await generateSatisfactionAlerts.execute();

      // Assert
      expect(result).toHaveLength(0);
    });

    it('debe manejar valores muy bajos de satisfacción', async () => {
      // Arrange
      const metrics = createMockMetrics({
        overall_satisfaction: {
          average_rating: 1.0,
          total_responses: 100,
          rating_distribution: { 1: 90, 2: 5, 3: 3, 4: 1, 5: 1 }
        }
      });
      mockGetSatisfactionMetrics.execute.mockResolvedValue(metrics);

      // Act
      const result = await generateSatisfactionAlerts.execute();

      // Assert
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].metric_value).toBe(1.0);
    });

    it('debe manejar NPS muy negativo', async () => {
      // Arrange
      const metrics = createMockMetrics({ nps_score: -100 });
      mockGetSatisfactionMetrics.execute.mockResolvedValue(metrics);

      // Act
      const result = await generateSatisfactionAlerts.execute();

      // Assert
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].metric_value).toBe(-100);
    });
  });
});
