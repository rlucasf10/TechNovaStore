/**
 * Caso de uso: Obtener historial de auditoría de un ticket
 * Extraído del método getTicketAuditTrail() de TicketService
 * TODA LA LÓGICA ORIGINAL PRESERVADA
 */

import { AuditService } from '../shared/utils/AuditService';

export class GetTicketAuditTrail {
  constructor(private auditService: AuditService) {}

  async execute(ticketId: number) {
    return this.auditService.getTicketAuditTrail(ticketId);
  }
}
