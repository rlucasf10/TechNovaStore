/**
 * Caso de uso: Obtener resumen de auditoría de un ticket
 * Extraído del método getTicketAuditSummary() de TicketService
 * TODA LA LÓGICA ORIGINAL PRESERVADA
 */

import { AuditService } from '../shared/utils/AuditService';

export class GetTicketAuditSummary {
  constructor(private auditService: AuditService) {}

  async execute(ticketId: number) {
    return this.auditService.getTicketAuditSummary(ticketId);
  }
}
