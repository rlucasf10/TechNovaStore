import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { NLPEngine, ChatContext, ChatResponse } from './NLPEngine';
import { EscalationIntegration } from './services/EscalationIntegration';
import dotenv from 'dotenv';

dotenv.config();

export interface ChatSession {
  sessionId: string;
  userId?: string;
  context: ChatContext;
  createdAt: Date;
  lastActivity: Date;
}

export class ChatbotService {
  private app: express.Application;
  private server: any;
  private io: Server;
  private nlpEngine: NLPEngine;
  private escalationService: EscalationIntegration;
  private sessions: Map<string, ChatSession>;
  private port: number;
  // Cache for common responses
  private responseCache: Map<string, ChatResponse>;

  constructor(port: number = 3001) {
    this.port = port;
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });
    this.nlpEngine = new NLPEngine();
    this.escalationService = new EscalationIntegration();
    this.sessions = new Map();
    this.responseCache = new Map();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketHandlers();
    this.startSessionCleanup();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true
    }));
    // Increased timeout for request processing
    this.app.use((req, res, next) => {
      req.setTimeout(60000); // 60 seconds
      res.setTimeout(60000);
      next();
    });
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  /**
   * Setup REST API routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      return res.json({ 
        status: 'healthy', 
        service: 'chatbot',
        timestamp: new Date().toISOString()
      });
    });

    // Create new session endpoint - FAST, no NLP processing
    this.app.post('/api/session', (req, res) => {
      try {
        const { userId } = req.body;
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create new session
        const session = this.createSession(sessionId, userId);
        this.sessions.set(sessionId, session);
        
        return res.json({
          session_id: sessionId,
          created_at: session.createdAt,
          message: 'Session created successfully'
        });
      } catch (error) {
        console.error('Error creating session:', error);
        return res.status(500).json({
          error: 'Failed to create session'
        });
      }
    });

    // Chat endpoint for REST API - Uses NLP processing
    this.app.post('/api/chat', async (req, res) => {
      try {
        const { message, sessionId, userId } = req.body;

        if (!message || !sessionId) {
          return res.status(400).json({
            error: 'Message and sessionId are required'
          });
        }

        // Check cache first for common queries
        const cacheKey = message.toLowerCase().trim();
        if (this.responseCache.has(cacheKey)) {
          console.log('Returning cached response');
          return res.json(this.responseCache.get(cacheKey));
        }

        const response = await this.processMessage(message, sessionId, userId);
        
        // Cache common responses
        if (response.confidence > 0.8) {
          this.responseCache.set(cacheKey, response);
          // Limit cache size
          if (this.responseCache.size > 100) {
            const firstKey = this.responseCache.keys().next().value;
            if (firstKey) {
              this.responseCache.delete(firstKey);
            }
          }
        }

        return res.json(response);
      } catch (error) {
        console.error('Error processing chat message:', error);
        return res.status(500).json({
          error: 'Internal server error',
          message: 'Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo.'
        });
      }
    });

    // Get session context
    this.app.get('/api/chat/session/:sessionId', (req, res) => {
      const { sessionId } = req.params;
      const session = this.sessions.get(sessionId);
      
      if (session) {
        return res.json({
          sessionId: session.sessionId,
          userId: session.userId,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity,
          intentHistory: session.context.previousIntents.slice(-5)
        });
      } else {
        return res.status(404).json({ error: 'Session not found' });
      }
    });

    // Get available intents (for debugging)
    this.app.get('/api/chat/intents', (req, res) => {
      return res.json({
        intents: this.nlpEngine.getAvailableIntents()
      });
    });

    // Escalate to human support
    this.app.post('/api/chat/escalate', async (req, res) => {
      try {
        const { 
          sessionId, 
          customerEmail, 
          customerName, 
          reason, 
          customMessage,
          userId,
          orderId 
        } = req.body;

        if (!sessionId || !customerEmail || !customerName || !reason) {
          return res.status(400).json({
            error: 'Missing required fields: sessionId, customerEmail, customerName, reason'
          });
        }

        const result = await this.escalationService.escalateToTicketSystem(
          sessionId,
          customerEmail,
          customerName,
          reason,
          customMessage,
          userId,
          orderId
        );

        const escalationMessage = this.escalationService.generateEscalationMessage(
          result.ticketNumber,
          reason
        );

        return res.json({
          success: true,
          data: {
            ticketId: result.ticketId,
            ticketNumber: result.ticketNumber,
            message: escalationMessage
          }
        });
      } catch (error) {
        console.error('Error escalating to human support:', error);
        return res.status(500).json({
          error: 'Failed to escalate to human support'
        });
      }
    });
  }

  /**
   * Setup Socket.IO handlers for real-time chat
   */
  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle chat messages
      socket.on('chat_message', async (data) => {
        try {
          const { message, sessionId, userId } = data;
          
          if (!message || !sessionId) {
            socket.emit('error', { message: 'Message and sessionId are required' });
            return;
          }

          const response = await this.processMessage(message, sessionId, userId);
          
          // Send response back to client
          socket.emit('chat_response', response);
          
          // Optionally broadcast to room if it's a group chat
          // socket.to(sessionId).emit('chat_response', response);
        } catch (error) {
          console.error('Error processing socket message:', error);
          socket.emit('error', { message: 'Failed to process message' });
        }
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        socket.to(data.sessionId).emit('user_typing', {
          userId: data.userId,
          typing: true
        });
      });

      socket.on('typing_stop', (data) => {
        socket.to(data.sessionId).emit('user_typing', {
          userId: data.userId,
          typing: false
        });
      });

      // Handle session joining
      socket.on('join_session', (sessionId) => {
        socket.join(sessionId);
        console.log(`Client ${socket.id} joined session ${sessionId}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Process chat message using NLP engine
   */
  private async processMessage(
    message: string, 
    sessionId: string, 
    userId?: string
  ): Promise<ChatResponse & { escalationSuggestion?: { 
    shouldEscalate: boolean; 
    reason?: string; 
    message?: string; 
  } }> {
    try {
      // Get or create session
      let session = this.sessions.get(sessionId);
      
      if (!session) {
        session = this.createSession(sessionId, userId);
        this.sessions.set(sessionId, session);
      }

      // Update session activity
      session.lastActivity = new Date();
      if (userId && !session.userId) {
        session.userId = userId;
      }

      // Record user message for escalation analysis
      this.escalationService.recordConversation(sessionId, message, 'user');

      // Process message with NLP engine
      const response = await this.nlpEngine.processUserInput(message, session.context);

      // Record bot response for escalation analysis
      this.escalationService.recordConversation(sessionId, response.message, 'bot');

      // Analyze for potential escalation
      const escalationDecision = this.escalationService.analyzeForEscalation(
        sessionId,
        message,
        response,
        session.context
      );

      // Update session context based on response
      this.updateSessionContext(session, response);

      // Add escalation suggestion if needed
      let enhancedResponse: ChatResponse & { escalationSuggestion?: any } = response;
      
      if (escalationDecision.shouldEscalate) {
        enhancedResponse.escalationSuggestion = {
          shouldEscalate: true,
          reason: escalationDecision.reason,
          message: escalationDecision.escalationMessage
        };

        // Add escalation action to suggested actions
        if (!enhancedResponse.suggestedActions) {
          enhancedResponse.suggestedActions = [];
        }
        enhancedResponse.suggestedActions.unshift('Hablar con un agente humano');
      }

      return enhancedResponse;
    } catch (error) {
      console.error('Error processing message:', error);
      // Return fallback response
      return {
        message: 'Lo siento, ha ocurrido un error procesando tu mensaje. ¿Podrías intentar de nuevo?',
        intent: { name: 'error', confidence: 0, entities: {} },
        confidence: 0
      };
    }
  }

  /**
   * Create new chat session
   */
  private createSession(sessionId: string, userId?: string): ChatSession {
    const now = new Date();
    
    return {
      sessionId,
      userId,
      context: {
        sessionId,
        userId,
        previousIntents: [],
        userPreferences: {
          categories: [],
          brands: []
        }
      },
      createdAt: now,
      lastActivity: now
    };
  }

  /**
   * Update session context based on chat response
   */
  private updateSessionContext(session: ChatSession, response: ChatResponse): void {
    // Update current topic based on intent
    if (response.intent.name !== 'unknown' && response.intent.confidence > 0.5) {
      session.context.currentTopic = response.intent.name;
    }

    // Update user preferences based on entities
    if (response.intent.entities.PRODUCT_TYPE) {
      const category = response.intent.entities.PRODUCT_TYPE;
      if (!session.context.userPreferences?.categories.includes(category)) {
        session.context.userPreferences?.categories.push(category);
      }
    }

    if (response.intent.entities.BRAND) {
      const brand = response.intent.entities.BRAND;
      if (!session.context.userPreferences?.brands.includes(brand)) {
        session.context.userPreferences?.brands.push(brand);
      }
    }

    // Limit preferences to avoid memory bloat
    if (session.context.userPreferences) {
      session.context.userPreferences.categories = 
        session.context.userPreferences.categories.slice(-10);
      session.context.userPreferences.brands = 
        session.context.userPreferences.brands.slice(-10);
    }
  }

  /**
   * Start periodic session cleanup
   */
  private startSessionCleanup(): void {
    setInterval(() => {
      const now = new Date();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      for (const [sessionId, session] of this.sessions.entries()) {
        if (now.getTime() - session.lastActivity.getTime() > maxAge) {
          this.sessions.delete(sessionId);
          console.log(`Cleaned up expired session: ${sessionId}`);
        }
      }

      // Clean up old conversation histories in escalation service
      this.escalationService.cleanupOldConversations();
      
      // Clean up old cache entries
      if (this.responseCache.size > 50) {
        const keysToDelete = Array.from(this.responseCache.keys()).slice(0, 25);
        keysToDelete.forEach(key => this.responseCache.delete(key));
      }
    }, 60 * 60 * 1000); // Run every hour
  }

  /**
   * Start the chatbot service
   */
  public start(): void {
    this.server.listen(this.port, () => {
      console.log(`Chatbot service running on port ${this.port}`);
      console.log(`Health check: http://localhost:${this.port}/health`);
      console.log(`Chat API: http://localhost:${this.port}/api/chat`);
    });
  }

  /**
   * Stop the chatbot service
   */
  public stop(): void {
    this.server.close(() => {
      console.log('Chatbot service stopped');
    });
  }

  /**
   * Get service statistics
   */
  public getStats(): {
    activeSessions: number;
    totalSessions: number;
    uptime: number;
    cacheSize: number;
  } {
    return {
      activeSessions: this.sessions.size,
      totalSessions: this.sessions.size,
      uptime: process.uptime(),
      cacheSize: this.responseCache.size
    };
  }
}
