import axios from 'axios';
import { ChatContext, ChatResponse } from '../types';
import { logger } from '../utils/logger';

export interface EscalationDecision {
  shouldEscalate: boolean;
  reason?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  escalationMessage?: string;
}

export class EscalationIntegration {
  private ticketServiceUrl: string;
  private conversationHistories: Map<string, Array<{
    message: string;
    timestamp: Date;
    sender: 'user' | 'bot';
  }>>;

  constructor() {
    this.ticketServiceUrl = process.env.TICKET_SERVICE_URL || 'http://localhost:3005';
    this.conversationHistories = new Map();
  }

  recordConversation(sessionId: string, message: string, sender: 'user' | 'bot'): void {
    if (!this.conversationHistories.has(sessionId)) {
      this.conversationHistories.set(sessionId, []);
    }

    const history = this.conversationHistories.get(sessionId)!;
    history.push({
      message,
      timestamp: new Date(),
      sender
    });

    if (history.length > 20) {
      history.shift();
    }
  }

  analyzeForEscalation(
    sessionId: string,
    userMessage: string,
    botResponse: ChatResponse,
    context: ChatContext
  ): EscalationDecision {
    const decision: EscalationDecision = {
      shouldEscalate: false
    };

    // Verificar solicitud explícita de escalación
    const explicitEscalation = this.checkExplicitEscalationRequest(userMessage);
    if (explicitEscalation.shouldEscalate) {
      return explicitEscalation;
    }

    // Verificar baja confianza
    if (botResponse.confidence < 0.3) {
      return {
        shouldEscalate: true,
        reason: 'chatbot_limitation',
        priority: 'low',
        escalationMessage: 'El chatbot no pudo entender la consulta con suficiente confianza.'
      };
    }

    return decision;
  }

  async escalateToTicketSystem(
    sessionId: string,
    customerEmail: string,
    customerName: string,
    escalationReason: string,
    customMessage?: string,
    userId?: number,
    orderId?: number
  ): Promise<{ ticketId: number; ticketNumber: string }> {
    try {
      const conversationHistory = this.conversationHistories.get(sessionId) || [];
      const lastUserMessage = conversationHistory
        .filter(msg => msg.sender === 'user')
        .slice(-1)[0]?.message || 'Consulta general';

      const subject = this.generateEscalationSubject(lastUserMessage, escalationReason);
      const description = customMessage || this.generateEscalationDescription(
        lastUserMessage,
        escalationReason,
        conversationHistory
      );

      const escalationData = {
        chat_session_id: sessionId,
        customer_email: customerEmail,
        customer_name: customerName,
        subject,
        description,
        escalation_reason: escalationReason,
        user_id: userId,
        order_id: orderId,
        conversation_history: conversationHistory.slice(-10)
      };

      const response = await axios.post(
        `${this.ticketServiceUrl}/api/escalate`,
        escalationData,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data.success) {
        this.conversationHistories.delete(sessionId);

        return {
          ticketId: response.data.data.ticketId,
          ticketNumber: response.data.data.ticketNumber
        };
      } else {
        throw new Error('Failed to create ticket');
      }
    } catch (error) {
      logger.error('Error al escalar a sistema de tickets', { 
        error: error instanceof Error ? error.message : error 
      });
      throw new Error('No se pudo crear el ticket de soporte. Por favor, intenta más tarde.');
    }
  }

  generateEscalationMessage(ticketNumber: string, reason: string): string {
    let message = `He creado un ticket de soporte para ti: **${ticketNumber}**\n\n`;

    switch (reason) {
      case 'customer_request':
        message += 'Un agente humano se pondrá en contacto contigo pronto para ayudarte con tu consulta.';
        break;
      case 'complex_query':
        message += 'Tu consulta requiere atención especializada. Un experto técnico revisará tu caso.';
        break;
      default:
        message += 'Un miembro de nuestro equipo de soporte revisará tu consulta y te contactará pronto.';
    }

    message += '\n\nRecibirás una confirmación por email con los detalles del ticket.';
    message += '\n\n¿Hay algo más en lo que pueda ayudarte mientras tanto?';

    return message;
  }

  private checkExplicitEscalationRequest(userMessage: string): EscalationDecision {
    const message = userMessage.toLowerCase();
    const escalationKeywords = [
      'hablar con una persona',
      'agente humano',
      'soporte técnico',
      'no me ayudas',
      'quiero hablar con alguien',
      'atención al cliente'
    ];

    for (const keyword of escalationKeywords) {
      if (message.includes(keyword)) {
        return {
          shouldEscalate: true,
          reason: 'customer_request',
          priority: 'medium',
          escalationMessage: 'El cliente ha solicitado específicamente hablar con un agente humano.'
        };
      }
    }

    return { shouldEscalate: false };
  }

  private generateEscalationSubject(lastMessage: string, reason: string): string {
    const baseSubject = 'Consulta desde chatbot';

    switch (reason) {
      case 'customer_request':
        return `${baseSubject} - Solicitud de agente humano`;
      case 'complex_query':
        return `${baseSubject} - Consulta técnica compleja`;
      default:
        return `${baseSubject} - Escalación automática`;
    }
  }

  private generateEscalationDescription(
    lastMessage: string,
    reason: string,
    conversationHistory: Array<{ message: string; timestamp: Date; sender: 'user' | 'bot' }>
  ): string {
    let description = `Escalación automática desde el chatbot.\n\n`;
    description += `Razón de escalación: ${this.getEscalationReasonText(reason)}\n\n`;
    description += `Último mensaje del cliente: "${lastMessage}"\n\n`;

    if (conversationHistory.length > 0) {
      description += `Historial de conversación reciente:\n`;
      conversationHistory.slice(-5).forEach(msg => {
        const timestamp = msg.timestamp.toLocaleString('es-ES');
        const sender = msg.sender === 'user' ? 'Cliente' : 'Chatbot';
        description += `[${timestamp}] ${sender}: ${msg.message}\n`;
      });
    }

    return description;
  }

  private getEscalationReasonText(reason: string): string {
    switch (reason) {
      case 'complex_query':
        return 'Consulta compleja que requiere conocimiento especializado';
      case 'customer_request':
        return 'Solicitud específica del cliente para hablar con un agente';
      case 'chatbot_limitation':
        return 'Limitación del chatbot para entender o resolver la consulta';
      default:
        return 'Razón de escalación no especificada';
    }
  }

  cleanupOldConversations(): void {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const now = new Date();

    for (const [sessionId, history] of this.conversationHistories.entries()) {
      if (history.length > 0) {
        const lastMessage = history[history.length - 1];
        if (now.getTime() - lastMessage.timestamp.getTime() > maxAge) {
          this.conversationHistories.delete(sessionId);
        }
      }
    }
  }
}
