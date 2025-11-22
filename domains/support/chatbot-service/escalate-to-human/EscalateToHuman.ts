/**
 * Caso de uso: Escalar a soporte humano
 * 
 * Este caso de uso maneja la escalación de conversaciones a agentes humanos:
 * 1. Valida los datos de escalación
 * 2. Crea un ticket en el sistema de tickets
 * 3. Genera mensaje de confirmación para el usuario
 */

import { EscalationIntegration } from '../shared/services/EscalationIntegration';

export interface EscalateRequest {
  sessionId: string;
  customerEmail: string;
  customerName: string;
  reason: string;
  customMessage?: string;
  userId?: number;
  orderId?: number;
}

export interface EscalateResponse {
  success: boolean;
  ticketId: number;
  ticketNumber: string;
  message: string;
}

export class EscalateToHuman {
  private escalationService: EscalationIntegration;

  constructor(escalationService: EscalationIntegration) {
    this.escalationService = escalationService;
  }

  /**
   * Ejecuta la escalación a soporte humano
   */
  async execute(request: EscalateRequest): Promise<EscalateResponse> {
    // Validar datos requeridos
    this.validateRequest(request);

    try {
      // Crear ticket en el sistema de tickets
      const result = await this.escalationService.escalateToTicketSystem(
        request.sessionId,
        request.customerEmail,
        request.customerName,
        request.reason,
        request.customMessage,
        request.userId,
        request.orderId
      );

      // Generar mensaje de confirmación
      const escalationMessage = this.escalationService.generateEscalationMessage(
        result.ticketNumber,
        request.reason
      );

      return {
        success: true,
        ticketId: result.ticketId,
        ticketNumber: result.ticketNumber,
        message: escalationMessage
      };
    } catch (error) {
      console.error('Error escalating to human support:', error);
      throw new Error('Failed to escalate to human support');
    }
  }

  /**
   * Valida la solicitud de escalación
   */
  private validateRequest(request: EscalateRequest): void {
    if (!request.sessionId) {
      throw new Error('sessionId is required');
    }

    if (!request.customerEmail) {
      throw new Error('customerEmail is required');
    }

    if (!request.customerName) {
      throw new Error('customerName is required');
    }

    if (!request.reason) {
      throw new Error('reason is required');
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.customerEmail)) {
      throw new Error('Invalid email format');
    }
  }
}
