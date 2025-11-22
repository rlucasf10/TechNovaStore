/**
 * Tests para ProcessMessage
 */

import { ProcessMessage, ChatSession } from './ProcessMessage';
import { ProcessWithOllama } from '../process-with-ollama/ProcessWithOllama';
import { UseSimpleFallback } from '../use-simple-fallback/UseSimpleFallback';
import { OllamaAdapter } from '../shared/clients/OllamaAdapter';
import { EscalationIntegration } from '../shared/services/EscalationIntegration';

describe('ProcessMessage', () => {
  let processMessage: ProcessMessage;
  let mockProcessWithOllama: jest.Mocked<ProcessWithOllama>;
  let mockUseSimpleFallback: jest.Mocked<UseSimpleFallback>;
  let mockOllamaAdapter: jest.Mocked<OllamaAdapter>;
  let mockEscalationService: jest.Mocked<EscalationIntegration>;
  let mockSession: ChatSession;

  beforeEach(() => {
    // Crear mocks
    mockProcessWithOllama = {
      execute: jest.fn()
    } as any;

    mockUseSimpleFallback = {
      execute: jest.fn()
    } as any;

    mockOllamaAdapter = {
      checkHealth: jest.fn()
    } as any;

    mockEscalationService = {
      recordConversation: jest.fn(),
      analyzeForEscalation: jest.fn()
    } as any;

    // Crear instancia
    processMessage = new ProcessMessage(
      mockProcessWithOllama,
      mockUseSimpleFallback,
      mockOllamaAdapter,
      mockEscalationService
    );

    // Crear sesión mock
    mockSession = {
      sessionId: 'test-session',
      userId: 'test-user',
      context: {
        sessionId: 'test-session',
        userId: 'test-user',
        previousIntents: [],
        userPreferences: {
          categories: [],
          brands: []
        },
        conversationHistory: [],
        lastProductQuery: undefined,
        lastProducts: undefined
      },
      createdAt: new Date(),
      lastActivity: new Date()
    };
  });

  describe('execute', () => {
    it('debe procesar un mensaje correctamente con Ollama cuando está disponible', async () => {
      // Arrange
      process.env.USE_OLLAMA = 'true';
      mockOllamaAdapter.checkHealth.mockResolvedValue(true);
      mockProcessWithOllama.execute.mockResolvedValue({
        message: 'Respuesta de Ollama',
        intent: { name: 'product_search', confidence: 0.9, entities: {} },
        confidence: 0.9
      });
      mockEscalationService.analyzeForEscalation.mockReturnValue({
        shouldEscalate: false
      });

      // Act
      const result = await processMessage.execute('Busco un laptop', mockSession);

      // Assert
      expect(mockOllamaAdapter.checkHealth).toHaveBeenCalled();
      expect(mockProcessWithOllama.execute).toHaveBeenCalledWith(
        'Busco un laptop',
        mockSession.context
      );
      expect(result.message).toBe('Respuesta de Ollama');
      expect(mockSession.context.conversationHistory.length).toBeGreaterThan(0);
    });

    it('debe usar fallback cuando Ollama no está disponible', async () => {
      // Arrange
      process.env.USE_OLLAMA = 'true';
      mockOllamaAdapter.checkHealth.mockResolvedValue(false);
      mockUseSimpleFallback.execute.mockResolvedValue({
        message: 'Respuesta de fallback',
        intent: { name: 'product_search', confidence: 0.7, entities: {} },
        confidence: 0.7,
        usingFallback: true
      });
      mockEscalationService.analyzeForEscalation.mockReturnValue({
        shouldEscalate: false
      });

      // Act
      const result = await processMessage.execute('Busco un laptop', mockSession);

      // Assert
      expect(mockOllamaAdapter.checkHealth).toHaveBeenCalled();
      expect(mockUseSimpleFallback.execute).toHaveBeenCalled();
      expect(result.usingFallback).toBe(true);
    });

    it('debe usar fallback cuando Ollama falla', async () => {
      // Arrange
      process.env.USE_OLLAMA = 'true';
      mockOllamaAdapter.checkHealth.mockResolvedValue(true);
      mockProcessWithOllama.execute.mockRejectedValue(new Error('Ollama error'));
      mockUseSimpleFallback.execute.mockResolvedValue({
        message: 'Respuesta de fallback',
        intent: { name: 'product_search', confidence: 0.7, entities: {} },
        confidence: 0.7,
        usingFallback: true
      });
      mockEscalationService.analyzeForEscalation.mockReturnValue({
        shouldEscalate: false
      });

      // Act
      const result = await processMessage.execute('Busco un laptop', mockSession);

      // Assert
      expect(mockProcessWithOllama.execute).toHaveBeenCalled();
      expect(mockUseSimpleFallback.execute).toHaveBeenCalled();
      expect(result.usingFallback).toBe(true);
    });

    it('debe agregar sugerencia de escalación cuando es necesario', async () => {
      // Arrange
      process.env.USE_OLLAMA = 'false';
      mockUseSimpleFallback.execute.mockResolvedValue({
        message: 'No entiendo',
        intent: { name: 'unknown', confidence: 0.2, entities: {} },
        confidence: 0.2
      });
      mockEscalationService.analyzeForEscalation.mockReturnValue({
        shouldEscalate: true,
        reason: 'chatbot_limitation',
        escalationMessage: 'Baja confianza'
      });

      // Act
      const result = await processMessage.execute('Mensaje confuso', mockSession);

      // Assert
      expect(result.escalationSuggestion).toBeDefined();
      expect(result.escalationSuggestion?.shouldEscalate).toBe(true);
      expect(result.suggestedActions).toContain('Hablar con un agente humano');
    });

    it('debe actualizar la actividad de la sesión', async () => {
      // Arrange
      const initialActivity = mockSession.lastActivity;
      process.env.USE_OLLAMA = 'false';
      mockUseSimpleFallback.execute.mockResolvedValue({
        message: 'Respuesta',
        intent: { name: 'greeting', confidence: 0.8, entities: {} },
        confidence: 0.8
      });
      mockEscalationService.analyzeForEscalation.mockReturnValue({
        shouldEscalate: false
      });

      // Act
      await processMessage.execute('Hola', mockSession);

      // Assert
      expect(mockSession.lastActivity.getTime()).toBeGreaterThanOrEqual(initialActivity.getTime());
    });

    it('debe mantener el historial conversacional dentro del límite de tokens', async () => {
      // Arrange
      process.env.USE_OLLAMA = 'false';
      mockUseSimpleFallback.execute.mockResolvedValue({
        message: 'Respuesta',
        intent: { name: 'greeting', confidence: 0.8, entities: {} },
        confidence: 0.8
      });
      mockEscalationService.analyzeForEscalation.mockReturnValue({
        shouldEscalate: false
      });

      // Llenar el historial con muchos mensajes
      for (let i = 0; i < 50; i++) {
        mockSession.context.conversationHistory.push({
          role: 'user',
          content: 'Mensaje muy largo '.repeat(100),
          timestamp: new Date()
        });
      }

      // Act
      await processMessage.execute('Nuevo mensaje', mockSession);

      // Assert
      // El historial debe haberse reducido para mantener el límite de tokens
      expect(mockSession.context.conversationHistory.length).toBeLessThan(50);
    });

    it('debe retornar respuesta de error cuando falla todo', async () => {
      // Arrange
      process.env.USE_OLLAMA = 'false';
      mockUseSimpleFallback.execute.mockRejectedValue(new Error('Error crítico'));

      // Act
      const result = await processMessage.execute('Mensaje', mockSession);

      // Assert
      expect(result.intent.name).toBe('error');
      expect(result.confidence).toBe(0);
      expect(result.message).toContain('error');
    });

    it('debe registrar conversación en el servicio de escalación', async () => {
      // Arrange
      process.env.USE_OLLAMA = 'false';
      mockUseSimpleFallback.execute.mockResolvedValue({
        message: 'Respuesta',
        intent: { name: 'greeting', confidence: 0.8, entities: {} },
        confidence: 0.8
      });
      mockEscalationService.analyzeForEscalation.mockReturnValue({
        shouldEscalate: false
      });

      // Act
      await processMessage.execute('Hola', mockSession);

      // Assert
      expect(mockEscalationService.recordConversation).toHaveBeenCalledWith(
        mockSession.sessionId,
        'Hola',
        'user'
      );
      expect(mockEscalationService.recordConversation).toHaveBeenCalledWith(
        mockSession.sessionId,
        'Respuesta',
        'bot'
      );
    });

    it('debe actualizar el contexto de la sesión con las preferencias del usuario', async () => {
      // Arrange
      process.env.USE_OLLAMA = 'false';
      mockUseSimpleFallback.execute.mockResolvedValue({
        message: 'Respuesta',
        intent: {
          name: 'product_search',
          confidence: 0.8,
          entities: {
            PRODUCT_TYPE: 'laptop',
            BRAND: 'dell'
          }
        },
        confidence: 0.8
      });
      mockEscalationService.analyzeForEscalation.mockReturnValue({
        shouldEscalate: false
      });

      // Act
      await processMessage.execute('Busco laptop Dell', mockSession);

      // Assert
      expect(mockSession.context.userPreferences?.categories).toContain('laptop');
      expect(mockSession.context.userPreferences?.brands).toContain('dell');
    });
  });
});
