import { TicketService } from '../services/TicketService';
import { EscalationService } from '../services/EscalationService';
import { SatisfactionService } from '../services/SatisfactionService';
import { Pool } from 'pg';
import { TicketCategory, TicketPriority, EscalationReason } from '../types';

// Mock the database pool
const mockPool = {
  connect: jest.fn(),
  query: jest.fn(),
  end: jest.fn()
} as unknown as Pool;

// Mock client
const mockClient = {
  query: jest.fn(),
  release: jest.fn()
};

describe('TicketService', () => {
  let ticketService: TicketService;
  let escalationService: EscalationService;
  let satisfactionService: SatisfactionService;

  beforeEach(() => {
    jest.clearAllMocks();
    (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
    
    ticketService = new TicketService(mockPool);
    escalationService = new EscalationService(ticketService);
    satisfactionService = new SatisfactionService(ticketService);
  });

  describe('createTicket', () => {
    it('should create a ticket with auto-categorization', async () => {
      const mockTicket = {
        id: 1,
        ticket_number: 'TKT-123',
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Problema con mi pedido',
        description: 'No he recibido mi pedido',
        category: TicketCategory.ORDER_ISSUE,
        priority: TicketPriority.MEDIUM,
        status: 'open',
        created_at: new Date()
      };

      (mockClient.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockTicket] }) // Create ticket
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Add system message

      const result = await ticketService.createTicket({
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Problema con mi pedido',
        description: 'No he recibido mi pedido',
        category: TicketCategory.ORDER_ISSUE
      });

      expect(result).toEqual(mockTicket);
      expect(mockClient.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('EscalationService', () => {
    it('should detect explicit escalation requests', () => {
      const context = {
        sessionId: 'test-session',
        customerEmail: 'test@example.com',
        customerName: 'Test User',
        conversationHistory: [
          {
            message: 'Quiero hablar con una persona',
            timestamp: new Date(),
            sender: 'user' as const
          }
        ]
      };

      const decision = escalationService.analyzeForEscalation(context);

      expect(decision.shouldEscalate).toBe(true);
      expect(decision.reason).toBe(EscalationReason.CUSTOMER_REQUEST);
    });

    it('should detect complaint indicators', () => {
      const context = {
        sessionId: 'test-session',
        customerEmail: 'test@example.com',
        customerName: 'Test User',
        conversationHistory: [
          {
            message: 'Estoy muy molesto con el servicio',
            timestamp: new Date(),
            sender: 'user' as const
          }
        ]
      };

      const decision = escalationService.analyzeForEscalation(context);

      expect(decision.shouldEscalate).toBe(true);
      expect(decision.reason).toBe(EscalationReason.COMPLAINT_ESCALATION);
      expect(decision.priority).toBe('urgent');
    });
  });

  describe('SatisfactionService', () => {
    it('should validate satisfaction survey ratings', async () => {
      const invalidSurvey = {
        rating: 6, // Invalid rating > 5
        response_time_rating: 3,
        resolution_quality_rating: 4,
        agent_helpfulness_rating: 5
      };

      await expect(
        satisfactionService.createSatisfactionSurvey(1, invalidSurvey)
      ).rejects.toThrow('overall rating must be an integer between 1 and 5');
    });

    it('should analyze feedback sentiment', () => {
      const positiveFeedback = 'Excelente servicio, muy rápido y eficiente';
      const analysis = satisfactionService.analyzeFeedbackSentiment(positiveFeedback);

      expect(analysis.sentiment).toBe('positive');
      expect(analysis.confidence).toBeGreaterThan(0.5);
      expect(analysis.keywords).toContain('excelente');
    });
  });
});