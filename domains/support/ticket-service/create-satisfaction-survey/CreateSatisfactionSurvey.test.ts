/**
 * Tests para CreateSatisfactionSurvey
 * Cobertura: Creación de encuestas de satisfacción
 */

import { CreateSatisfactionSurvey } from './CreateSatisfactionSurvey';
import { TicketRepository } from '../shared/repositories/TicketRepository';
import { CreateSatisfactionSurveyRequest } from '../shared/types';

describe('CreateSatisfactionSurvey', () => {
  let createSatisfactionSurvey: CreateSatisfactionSurvey;
  let mockTicketRepository: jest.Mocked<TicketRepository>;

  beforeEach(() => {
    mockTicketRepository = {
      createSatisfactionSurvey: jest.fn(),
      addMessage: jest.fn()
    } as any;

    createSatisfactionSurvey = new CreateSatisfactionSurvey(mockTicketRepository);
  });

  const createValidSurveyData = (): CreateSatisfactionSurveyRequest => ({
    rating: 5,
    response_time_rating: 5,
    resolution_quality_rating: 5,
    agent_helpfulness_rating: 5,
    feedback: 'Excelente servicio'
  });

  describe('execute - Casos exitosos', () => {
    it('debe crear encuesta con todas las calificaciones válidas', async () => {
      // Arrange
      const ticketId = 1;
      const surveyData = createValidSurveyData();
      const expectedSurvey = {
        id: 1,
        ticket_id: ticketId,
        ...surveyData,
        created_at: new Date()
      };

      mockTicketRepository.createSatisfactionSurvey.mockResolvedValue(expectedSurvey as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      const result = await createSatisfactionSurvey.execute(ticketId, surveyData);

      // Assert
      expect(mockTicketRepository.createSatisfactionSurvey).toHaveBeenCalledWith(ticketId, surveyData);
      expect(result).toEqual(expectedSurvey);
    });

    it('debe agregar mensaje del sistema sobre encuesta completada', async () => {
      // Arrange
      const ticketId = 1;
      const surveyData = createValidSurveyData();

      mockTicketRepository.createSatisfactionSurvey.mockResolvedValue({ id: 1, ticket_id: ticketId } as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      await createSatisfactionSurvey.execute(ticketId, surveyData);

      // Assert
      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(
        ticketId,
        expect.objectContaining({
          sender_type: 'system',
          sender_name: 'Sistema de Satisfacción',
          message: expect.stringContaining('Cliente completó encuesta de satisfacción'),
          is_internal: true
        })
      );
    });

    it('debe incluir puntuación en el mensaje del sistema', async () => {
      // Arrange
      const ticketId = 1;
      const surveyData = { ...createValidSurveyData(), rating: 4 };

      mockTicketRepository.createSatisfactionSurvey.mockResolvedValue({ id: 1, ticket_id: ticketId } as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      await createSatisfactionSurvey.execute(ticketId, surveyData);

      // Assert
      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(
        ticketId,
        expect.objectContaining({
          message: expect.stringContaining('4/5')
        })
      );
    });

    it('debe crear encuesta con calificación mínima (1)', async () => {
      // Arrange
      const ticketId = 1;
      const surveyData: CreateSatisfactionSurveyRequest = {
        rating: 1,
        response_time_rating: 1,
        resolution_quality_rating: 1,
        agent_helpfulness_rating: 1,
        feedback: 'Muy insatisfecho'
      };

      mockTicketRepository.createSatisfactionSurvey.mockResolvedValue({ id: 1, ticket_id: ticketId } as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      const result = await createSatisfactionSurvey.execute(ticketId, surveyData);

      // Assert
      expect(result).toBeDefined();
      expect(mockTicketRepository.createSatisfactionSurvey).toHaveBeenCalled();
    });

    it('debe crear encuesta con calificación máxima (5)', async () => {
      // Arrange
      const ticketId = 1;
      const surveyData = createValidSurveyData();

      mockTicketRepository.createSatisfactionSurvey.mockResolvedValue({ id: 1, ticket_id: ticketId } as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      const result = await createSatisfactionSurvey.execute(ticketId, surveyData);

      // Assert
      expect(result).toBeDefined();
      expect(mockTicketRepository.createSatisfactionSurvey).toHaveBeenCalled();
    });

    it('debe crear encuesta con calificaciones mixtas', async () => {
      // Arrange
      const ticketId = 1;
      const surveyData: CreateSatisfactionSurveyRequest = {
        rating: 3,
        response_time_rating: 4,
        resolution_quality_rating: 2,
        agent_helpfulness_rating: 5,
        feedback: 'Experiencia mixta'
      };

      mockTicketRepository.createSatisfactionSurvey.mockResolvedValue({ id: 1, ticket_id: ticketId } as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      const result = await createSatisfactionSurvey.execute(ticketId, surveyData);

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('execute - Validación de calificaciones', () => {
    it('debe rechazar calificación general menor a 1', async () => {
      // Arrange
      const ticketId = 1;
      const surveyData = { ...createValidSurveyData(), rating: 0 };

      // Act & Assert
      await expect(
        createSatisfactionSurvey.execute(ticketId, surveyData)
      ).rejects.toThrow('overall rating must be an integer between 1 and 5');
    });

    it('debe rechazar calificación general mayor a 5', async () => {
      // Arrange
      const ticketId = 1;
      const surveyData = { ...createValidSurveyData(), rating: 6 };

      // Act & Assert
      await expect(
        createSatisfactionSurvey.execute(ticketId, surveyData)
      ).rejects.toThrow('overall rating must be an integer between 1 and 5');
    });

    it('debe rechazar calificación de tiempo de respuesta inválida', async () => {
      // Arrange
      const ticketId = 1;
      const surveyData = { ...createValidSurveyData(), response_time_rating: 0 };

      // Act & Assert
      await expect(
        createSatisfactionSurvey.execute(ticketId, surveyData)
      ).rejects.toThrow('response time rating must be an integer between 1 and 5');
    });

    it('debe rechazar calificación de calidad de resolución inválida', async () => {
      // Arrange
      const ticketId = 1;
      const surveyData = { ...createValidSurveyData(), resolution_quality_rating: 7 };

      // Act & Assert
      await expect(
        createSatisfactionSurvey.execute(ticketId, surveyData)
      ).rejects.toThrow('resolution quality rating must be an integer between 1 and 5');
    });

    it('debe rechazar calificación de ayuda del agente inválida', async () => {
      // Arrange
      const ticketId = 1;
      const surveyData = { ...createValidSurveyData(), agent_helpfulness_rating: -1 };

      // Act & Assert
      await expect(
        createSatisfactionSurvey.execute(ticketId, surveyData)
      ).rejects.toThrow('agent helpfulness rating must be an integer between 1 and 5');
    });

    it('debe rechazar calificaciones decimales', async () => {
      // Arrange
      const ticketId = 1;
      const surveyData = { ...createValidSurveyData(), rating: 3.5 };

      // Act & Assert
      await expect(
        createSatisfactionSurvey.execute(ticketId, surveyData)
      ).rejects.toThrow('overall rating must be an integer between 1 and 5');
    });

    it('debe validar todas las calificaciones antes de crear', async () => {
      // Arrange
      const ticketId = 1;
      const surveyData: CreateSatisfactionSurveyRequest = {
        rating: 10,
        response_time_rating: 10,
        resolution_quality_rating: 10,
        agent_helpfulness_rating: 10,
        feedback: 'Invalid'
      };

      // Act & Assert
      await expect(
        createSatisfactionSurvey.execute(ticketId, surveyData)
      ).rejects.toThrow();
      expect(mockTicketRepository.createSatisfactionSurvey).not.toHaveBeenCalled();
    });
  });

  describe('execute - Alertas de baja satisfacción', () => {
    it('debe crear alerta para calificación muy baja (1)', async () => {
      // Arrange
      const ticketId = 1;
      const surveyData = { ...createValidSurveyData(), rating: 1 };
      const survey = { id: 1, ticket_id: ticketId, rating: 1 };

      mockTicketRepository.createSatisfactionSurvey.mockResolvedValue(survey as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      await createSatisfactionSurvey.execute(ticketId, surveyData);

      // Assert
      expect(mockTicketRepository.addMessage).toHaveBeenCalledTimes(2);
      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(
        ticketId,
        expect.objectContaining({
          sender_name: 'Sistema de Alertas',
          message: expect.stringContaining('ALERTA'),
          is_internal: true
        })
      );
    });

    it('debe crear alerta para calificación baja (2)', async () => {
      // Arrange
      const ticketId = 1;
      const surveyData = { ...createValidSurveyData(), rating: 2 };
      const survey = { id: 1, ticket_id: ticketId, rating: 2 };

      mockTicketRepository.createSatisfactionSurvey.mockResolvedValue(survey as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      await createSatisfactionSurvey.execute(ticketId, surveyData);

      // Assert
      expect(mockTicketRepository.addMessage).toHaveBeenCalledTimes(2);
      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(
        ticketId,
        expect.objectContaining({
          message: expect.stringContaining('Cliente muy insatisfecho')
        })
      );
    });

    it('NO debe crear alerta para calificación media (3)', async () => {
      // Arrange
      const ticketId = 1;
      const surveyData = { ...createValidSurveyData(), rating: 3 };
      const survey = { id: 1, ticket_id: ticketId, rating: 3 };

      mockTicketRepository.createSatisfactionSurvey.mockResolvedValue(survey as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      await createSatisfactionSurvey.execute(ticketId, surveyData);

      // Assert
      expect(mockTicketRepository.addMessage).toHaveBeenCalledTimes(1);
      expect(mockTicketRepository.addMessage).not.toHaveBeenCalledWith(
        ticketId,
        expect.objectContaining({
          sender_name: 'Sistema de Alertas'
        })
      );
    });

    it('NO debe crear alerta para calificación alta (4)', async () => {
      // Arrange
      const ticketId = 1;
      const surveyData = { ...createValidSurveyData(), rating: 4 };
      const survey = { id: 1, ticket_id: ticketId, rating: 4 };

      mockTicketRepository.createSatisfactionSurvey.mockResolvedValue(survey as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      await createSatisfactionSurvey.execute(ticketId, surveyData);

      // Assert
      expect(mockTicketRepository.addMessage).toHaveBeenCalledTimes(1);
    });

    it('NO debe crear alerta para calificación máxima (5)', async () => {
      // Arrange
      const ticketId = 1;
      const surveyData = createValidSurveyData();
      const survey = { id: 1, ticket_id: ticketId, rating: 5 };

      mockTicketRepository.createSatisfactionSurvey.mockResolvedValue(survey as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      await createSatisfactionSurvey.execute(ticketId, surveyData);

      // Assert
      expect(mockTicketRepository.addMessage).toHaveBeenCalledTimes(1);
    });

    it('debe incluir calificación en mensaje de alerta', async () => {
      // Arrange
      const ticketId = 1;
      const surveyData = { ...createValidSurveyData(), rating: 1 };
      const survey = { id: 1, ticket_id: ticketId, rating: 1 };

      mockTicketRepository.createSatisfactionSurvey.mockResolvedValue(survey as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      await createSatisfactionSurvey.execute(ticketId, surveyData);

      // Assert
      expect(mockTicketRepository.addMessage).toHaveBeenCalledWith(
        ticketId,
        expect.objectContaining({
          message: expect.stringContaining('1/5')
        })
      );
    });
  });

  describe('execute - Manejo de errores', () => {
    it('debe propagar errores del repositorio al crear encuesta', async () => {
      // Arrange
      const ticketId = 1;
      const surveyData = createValidSurveyData();
      const error = new Error('Error de base de datos');

      mockTicketRepository.createSatisfactionSurvey.mockRejectedValue(error);

      // Act & Assert
      await expect(
        createSatisfactionSurvey.execute(ticketId, surveyData)
      ).rejects.toThrow('Error de base de datos');
    });

    it('debe propagar errores del repositorio al agregar mensaje', async () => {
      // Arrange
      const ticketId = 1;
      const surveyData = createValidSurveyData();
      const error = new Error('Error al agregar mensaje');

      mockTicketRepository.createSatisfactionSurvey.mockResolvedValue({ id: 1, ticket_id: ticketId } as any);
      mockTicketRepository.addMessage.mockRejectedValue(error);

      // Act & Assert
      await expect(
        createSatisfactionSurvey.execute(ticketId, surveyData)
      ).rejects.toThrow('Error al agregar mensaje');
    });
  });

  describe('execute - Casos especiales', () => {
    it('debe manejar feedback vacío', async () => {
      // Arrange
      const ticketId = 1;
      const surveyData = { ...createValidSurveyData(), feedback: '' };

      mockTicketRepository.createSatisfactionSurvey.mockResolvedValue({ id: 1, ticket_id: ticketId } as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      const result = await createSatisfactionSurvey.execute(ticketId, surveyData);

      // Assert
      expect(result).toBeDefined();
    });

    it('debe manejar feedback muy largo', async () => {
      // Arrange
      const ticketId = 1;
      const surveyData = { ...createValidSurveyData(), feedback: 'A'.repeat(5000) };

      mockTicketRepository.createSatisfactionSurvey.mockResolvedValue({ id: 1, ticket_id: ticketId } as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      const result = await createSatisfactionSurvey.execute(ticketId, surveyData);

      // Assert
      expect(result).toBeDefined();
    });

    it('debe manejar diferentes IDs de ticket', async () => {
      // Arrange
      const ticketIds = [1, 100, 999, 12345];
      const surveyData = createValidSurveyData();

      mockTicketRepository.createSatisfactionSurvey.mockResolvedValue({ id: 1 } as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act & Assert
      for (const ticketId of ticketIds) {
        const result = await createSatisfactionSurvey.execute(ticketId, surveyData);
        expect(result).toBeDefined();
      }
    });

    it('debe retornar la encuesta creada completa', async () => {
      // Arrange
      const ticketId = 1;
      const surveyData = createValidSurveyData();
      const expectedSurvey = {
        id: 1,
        ticket_id: ticketId,
        rating: 5,
        response_time_rating: 5,
        resolution_quality_rating: 5,
        agent_helpfulness_rating: 5,
        feedback: 'Excelente servicio',
        created_at: new Date()
      };

      mockTicketRepository.createSatisfactionSurvey.mockResolvedValue(expectedSurvey as any);
      mockTicketRepository.addMessage.mockResolvedValue({} as any);

      // Act
      const result = await createSatisfactionSurvey.execute(ticketId, surveyData);

      // Assert
      expect(result).toEqual(expectedSurvey);
      expect(result.id).toBe(1);
      expect(result.ticket_id).toBe(ticketId);
      expect(result.rating).toBe(5);
    });
  });
});
