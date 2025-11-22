/**
 * Tests para AnalyzeForEscalation
 * Cobertura: Análisis de conversaciones para decidir escalación
 */

import { AnalyzeForEscalation, EscalationContext } from './AnalyzeForEscalation';
import { EscalationReason, TicketCategory } from '../shared/types';

describe('AnalyzeForEscalation', () => {
  let analyzeForEscalation: AnalyzeForEscalation;

  beforeEach(() => {
    analyzeForEscalation = new AnalyzeForEscalation();
  });

  const createContext = (overrides?: Partial<EscalationContext>): EscalationContext => ({
    sessionId: 'session-123',
    customerEmail: 'test@example.com',
    customerName: 'Test User',
    conversationHistory: [],
    ...overrides
  });

  describe('Solicitudes explícitas de escalación', () => {
    it('debe detectar solicitud de hablar con una persona', () => {
      // Arrange
      const context = createContext({
        conversationHistory: [
          { message: 'Hola, tengo un problema', timestamp: new Date(), sender: 'user' },
          { message: '¿En qué puedo ayudarte?', timestamp: new Date(), sender: 'bot' },
          { message: 'Quiero hablar con una persona', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(true);
      expect(decision.reason).toBe(EscalationReason.CUSTOMER_REQUEST);
      expect(decision.priority).toBe('medium');
    });

    it('debe detectar solicitud de agente humano', () => {
      // Arrange
      const context = createContext({
        conversationHistory: [
          { message: 'Necesito ayuda urgente', timestamp: new Date(), sender: 'user' },
          { message: 'Claro, ¿qué necesitas?', timestamp: new Date(), sender: 'bot' },
          { message: 'Necesito un agente humano', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(true);
      expect(decision.reason).toBe(EscalationReason.CUSTOMER_REQUEST);
    });

    it('debe detectar solicitud de soporte técnico', () => {
      // Arrange
      const context = createContext({
        conversationHistory: [
          { message: 'Mi producto no funciona', timestamp: new Date(), sender: 'user' },
          { message: 'Déjame ayudarte', timestamp: new Date(), sender: 'bot' },
          { message: 'Necesito soporte técnico especializado', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(true);
      expect(decision.reason).toBe(EscalationReason.CUSTOMER_REQUEST);
    });

    it('debe detectar solicitud de supervisor', () => {
      // Arrange
      const context = createContext({
        conversationHistory: [
          { message: 'Esto no está bien', timestamp: new Date(), sender: 'user' },
          { message: 'Quiero hablar con un supervisor', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(true);
      expect(decision.reason).toBe(EscalationReason.CUSTOMER_REQUEST);
    });

    it('debe detectar solicitud de gerente', () => {
      // Arrange
      const context = createContext({
        conversationHistory: [
          { message: 'Necesito hablar con el gerente', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(true);
      expect(decision.reason).toBe(EscalationReason.CUSTOMER_REQUEST);
    });
  });

  describe('Baja confianza del chatbot', () => {
    it('debe escalar cuando la confianza es menor a 0.3', () => {
      // Arrange
      const context = createContext({
        confidence: 0.25,
        conversationHistory: [
          { message: 'Mensaje confuso del usuario', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(true);
      expect(decision.reason).toBe(EscalationReason.CHATBOT_LIMITATION);
      expect(decision.priority).toBe('low');
    });

    it('debe escalar cuando la confianza es 0', () => {
      // Arrange
      const context = createContext({
        confidence: 0,
        conversationHistory: [
          { message: 'Mensaje incomprensible', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(true);
      expect(decision.reason).toBe(EscalationReason.CHATBOT_LIMITATION);
    });

    it('NO debe escalar cuando la confianza es exactamente 0.3', () => {
      // Arrange
      const context = createContext({
        confidence: 0.3,
        conversationHistory: [
          { message: 'Mensaje normal', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(false);
    });

    it('NO debe escalar cuando la confianza es alta', () => {
      // Arrange
      const context = createContext({
        confidence: 0.85,
        conversationHistory: [
          { message: 'Mensaje claro', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(false);
    });

    it('NO debe escalar cuando no hay información de confianza', () => {
      // Arrange
      const context = createContext({
        confidence: undefined,
        conversationHistory: [
          { message: 'Mensaje sin confianza', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(false);
    });
  });

  describe('Consultas repetitivas sin resolver', () => {
    it('debe escalar cuando hay consultas similares repetidas', () => {
      // Arrange
      const context = createContext({
        conversationHistory: [
          { message: 'cuando llega mi pedido', timestamp: new Date(), sender: 'user' },
          { message: 'Tu pedido llegará pronto', timestamp: new Date(), sender: 'bot' },
          { message: 'cuando llega mi pedido', timestamp: new Date(), sender: 'user' },
          { message: 'Estamos verificando', timestamp: new Date(), sender: 'bot' },
          { message: 'cuando llega mi pedido', timestamp: new Date(), sender: 'user' },
          { message: 'Déjame revisar', timestamp: new Date(), sender: 'bot' },
          { message: 'cuando llega mi pedido', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(true);
      expect(decision.reason).toBe(EscalationReason.UNRESOLVED_ISSUE);
      expect(decision.priority).toBe('medium');
    });

    it('NO debe escalar con menos de 6 mensajes', () => {
      // Arrange
      const context = createContext({
        conversationHistory: [
          { message: '¿Cuándo llega mi pedido?', timestamp: new Date(), sender: 'user' },
          { message: 'Tu pedido llegará pronto', timestamp: new Date(), sender: 'bot' },
          { message: '¿Cuándo llega mi pedido?', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(false);
    });

    it('NO debe escalar cuando las consultas son diferentes', () => {
      // Arrange
      const context = createContext({
        conversationHistory: [
          { message: '¿Cuándo llega mi pedido?', timestamp: new Date(), sender: 'user' },
          { message: 'Tu pedido llegará pronto', timestamp: new Date(), sender: 'bot' },
          { message: '¿Cuánto cuesta el envío?', timestamp: new Date(), sender: 'user' },
          { message: 'El envío es gratis', timestamp: new Date(), sender: 'bot' },
          { message: '¿Puedo cambiar mi dirección?', timestamp: new Date(), sender: 'user' },
          { message: 'Sí, puedes cambiarla', timestamp: new Date(), sender: 'bot' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(false);
    });
  });

  describe('Consultas técnicas complejas', () => {
    it('debe escalar consultas con palabras clave de complejidad', () => {
      // Arrange
      const context = createContext({
        conversationHistory: [
          { message: 'Necesito ayuda con compatibilidad específica entre componentes', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(true);
      expect(decision.reason).toBe(EscalationReason.COMPLEX_QUERY);
      expect(decision.priority).toBe('high');
      expect(decision.suggestedCategory).toBe(TicketCategory.TECHNICAL_SUPPORT);
    });

    it('debe escalar consultas con múltiples términos técnicos', () => {
      // Arrange
      const context = createContext({
        conversationHistory: [
          { message: 'Tengo problemas con el driver y el firmware de mi dispositivo', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(true);
      expect(decision.reason).toBe(EscalationReason.COMPLEX_QUERY);
      expect(decision.priority).toBe('high');
    });

    it('debe escalar consultas sobre configuración avanzada', () => {
      // Arrange
      const context = createContext({
        conversationHistory: [
          { message: 'Necesito configuración avanzada para mi sistema', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(true);
      expect(decision.reason).toBe(EscalationReason.COMPLEX_QUERY);
    });

    it('debe escalar consultas sobre integración', () => {
      // Arrange
      const context = createContext({
        conversationHistory: [
          { message: 'Necesito ayuda con la integración de mi sistema', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(true);
      expect(decision.reason).toBe(EscalationReason.COMPLEX_QUERY);
    });

    it('debe escalar consultas sobre API', () => {
      // Arrange
      const context = createContext({
        conversationHistory: [
          { message: 'Tengo problemas con la api de su sistema', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(true);
      expect(decision.reason).toBe(EscalationReason.COMPLEX_QUERY);
    });

    it('debe escalar consultas con términos técnicos: bios y overclock', () => {
      // Arrange
      const context = createContext({
        conversationHistory: [
          { message: 'Necesito actualizar el bios para hacer overclock', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(true);
      expect(decision.reason).toBe(EscalationReason.COMPLEX_QUERY);
    });

    it('NO debe escalar consultas simples', () => {
      // Arrange
      const context = createContext({
        conversationHistory: [
          { message: '¿Cuánto cuesta este producto?', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(false);
    });
  });

  describe('Indicadores de quejas', () => {
    it('debe escalar cuando el cliente está molesto', () => {
      // Arrange
      const context = createContext({
        conversationHistory: [
          { message: 'Estoy muy molesto y furioso con este servicio', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(true);
      expect(decision.reason).toBe(EscalationReason.COMPLAINT_ESCALATION);
      expect(decision.priority).toBe('urgent');
      expect(decision.suggestedCategory).toBe(TicketCategory.COMPLAINT);
    });

    it('debe escalar cuando el cliente está insatisfecho', () => {
      // Arrange
      const context = createContext({
        conversationHistory: [
          { message: 'Estoy muy insatisfecho con mi compra', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(true);
      expect(decision.reason).toBe(EscalationReason.COMPLAINT_ESCALATION);
      expect(decision.priority).toBe('urgent');
    });

    it('debe escalar cuando el cliente menciona pésimo servicio', () => {
      // Arrange
      const context = createContext({
        conversationHistory: [
          { message: 'Esto es un pésimo servicio', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(true);
      expect(decision.reason).toBe(EscalationReason.COMPLAINT_ESCALATION);
    });

    it('debe escalar cuando el cliente quiere quejarse', () => {
      // Arrange
      const context = createContext({
        conversationHistory: [
          { message: 'Quiero quejarme formalmente', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(true);
      expect(decision.reason).toBe(EscalationReason.COMPLAINT_ESCALATION);
    });

    it('debe escalar cuando el cliente dice que es inaceptable', () => {
      // Arrange
      const context = createContext({
        conversationHistory: [
          { message: 'Esto es inaceptable', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(true);
      expect(decision.reason).toBe(EscalationReason.COMPLAINT_ESCALATION);
    });

    it('debe escalar cuando el cliente amenaza con mala reseña', () => {
      // Arrange
      const context = createContext({
        conversationHistory: [
          { message: 'Voy a dejar una mala reseña', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(true);
      expect(decision.reason).toBe(EscalationReason.COMPLAINT_ESCALATION);
    });

    it('debe escalar cuando el cliente pide reembolso', () => {
      // Arrange
      const context = createContext({
        conversationHistory: [
          { message: 'Quiero mi dinero de vuelta', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(true);
      expect(decision.reason).toBe(EscalationReason.COMPLAINT_ESCALATION);
    });

    it('debe escalar cuando el cliente está furioso', () => {
      // Arrange
      const context = createContext({
        conversationHistory: [
          { message: 'Estoy furioso con esta situación', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(true);
      expect(decision.reason).toBe(EscalationReason.COMPLAINT_ESCALATION);
    });

    it('debe escalar cuando el cliente está frustrado', () => {
      // Arrange
      const context = createContext({
        conversationHistory: [
          { message: 'Estoy muy frustrado', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(true);
      expect(decision.reason).toBe(EscalationReason.COMPLAINT_ESCALATION);
    });
  });

  describe('Casos sin escalación', () => {
    it('NO debe escalar conversaciones normales', () => {
      // Arrange
      const context = createContext({
        conversationHistory: [
          { message: 'Hola, ¿cómo estás?', timestamp: new Date(), sender: 'user' },
          { message: 'Bien, ¿en qué puedo ayudarte?', timestamp: new Date(), sender: 'bot' },
          { message: 'Quiero información sobre un producto', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(false);
    });

    it('NO debe escalar conversaciones vacías', () => {
      // Arrange
      const context = createContext({
        conversationHistory: []
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(false);
    });

    it('NO debe escalar con alta confianza y sin indicadores', () => {
      // Arrange
      const context = createContext({
        confidence: 0.95,
        conversationHistory: [
          { message: '¿Tienen este producto en stock?', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(false);
    });
  });

  describe('Prioridad de reglas de escalación', () => {
    it('debe priorizar solicitud explícita sobre baja confianza', () => {
      // Arrange
      const context = createContext({
        confidence: 0.1,
        conversationHistory: [
          { message: 'Quiero hablar con una persona', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(true);
      expect(decision.reason).toBe(EscalationReason.CUSTOMER_REQUEST);
    });

    it('debe detectar quejas incluso con alta confianza', () => {
      // Arrange
      const context = createContext({
        confidence: 0.9,
        conversationHistory: [
          { message: 'Estoy muy molesto y enojado con este servicio', timestamp: new Date(), sender: 'user' }
        ]
      });

      // Act
      const decision = analyzeForEscalation.execute(context);

      // Assert
      expect(decision.shouldEscalate).toBe(true);
      expect(decision.reason).toBe(EscalationReason.COMPLAINT_ESCALATION);
    });
  });
});
