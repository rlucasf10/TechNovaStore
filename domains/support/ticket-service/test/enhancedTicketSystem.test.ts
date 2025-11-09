import { Pool } from 'pg';
import { TicketService } from '../src/services/TicketService';
import { MetricsService } from '../src/services/MetricsService';
import { AuditService, AuditActionType } from '../src/services/AuditService';
import { MigrationRunner } from '../src/database/migrationRunner';
import { TicketCategory, TicketPriority, TicketStatus } from '../src/types';

describe('Enhanced Ticket Management System', () => {
  let pool: Pool;
  let ticketService: TicketService;
  let metricsService: MetricsService;
  let auditService: AuditService;
  let migrationRunner: MigrationRunner;

  beforeAll(async () => {
    // Setup test database connection - use same DB as development
    pool = new Pool({
      host: process.env.POSTGRES_HOST || 'postgresql',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'technovastore',
      user: process.env.POSTGRES_USER || 'admin',
      password: process.env.POSTGRES_PASSWORD || 'password',
    });

    // Initialize services (migrations already run)
    ticketService = new TicketService(pool);
    metricsService = new MetricsService(pool);
    auditService = new AuditService(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    // Clean up test data
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM ticket_audit_log');
      await client.query('DELETE FROM ticket_sla_metrics');
      await client.query('DELETE FROM satisfaction_surveys');
      await client.query('DELETE FROM ticket_messages');
      await client.query('DELETE FROM tickets');
    } finally {
      client.release();
    }
  });

  describe('Automatic Ticket Categorization', () => {
    test('should automatically categorize order-related tickets', async () => {
      const ticket = await ticketService.createTicket({
        customer_email: 'test@example.com',
        customer_name: 'Test Customer',
        subject: 'Problema con mi pedido',
        description: 'Mi pedido no ha llegado y necesito información sobre el envío'
        // No category provided - should auto-categorize
      });

      expect(ticket.category).toBe(TicketCategory.SHIPPING_INQUIRY);
    });

    test('should automatically categorize payment-related tickets', async () => {
      const ticket = await ticketService.createTicket({
        customer_email: 'test@example.com',
        customer_name: 'Test Customer',
        subject: 'Error en el pago',
        description: 'Mi tarjeta fue cobrada pero no recibí confirmación del pedido'
        // No category provided - should auto-categorize
      });

      expect(ticket.category).toBe(TicketCategory.PAYMENT_PROBLEM);
    });

    test('should automatically categorize technical support tickets', async () => {
      const ticket = await ticketService.createTicket({
        customer_email: 'test@example.com',
        customer_name: 'Test Customer',
        subject: 'Error técnico en la web',
        description: 'La página no funciona correctamente, hay un bug en el checkout'
        // No category provided - should auto-categorize
      });

      expect(ticket.category).toBe(TicketCategory.TECHNICAL_SUPPORT);
    });
  });

  describe('Automatic Ticket Prioritization', () => {
    test('should set urgent priority for urgent keywords', async () => {
      const ticket = await ticketService.createTicket({
        customer_email: 'test@example.com',
        customer_name: 'Test Customer',
        subject: 'URGENTE: Problema crítico',
        description: 'Necesito ayuda inmediata, es una emergencia',
        category: TicketCategory.GENERAL_INQUIRY
      });

      expect(ticket.priority).toBe(TicketPriority.URGENT);
    });

    test('should set high priority for complaints', async () => {
      const ticket = await ticketService.createTicket({
        customer_email: 'test@example.com',
        customer_name: 'Test Customer',
        subject: 'Queja sobre el servicio',
        description: 'Estoy muy insatisfecho con el servicio recibido',
        category: TicketCategory.COMPLAINT
      });

      expect(ticket.priority).toBe(TicketPriority.HIGH);
    });

    test('should set medium priority for order issues', async () => {
      const ticket = await ticketService.createTicket({
        customer_email: 'test@example.com',
        customer_name: 'Test Customer',
        subject: 'Problema con pedido',
        description: 'Mi pedido tiene un problema menor',
        category: TicketCategory.ORDER_ISSUE
      });

      expect(ticket.priority).toBe(TicketPriority.MEDIUM);
    });
  });

  describe('Response Time Metrics', () => {
    test('should track first response time when agent responds', async () => {
      // Create ticket
      const ticket = await ticketService.createTicket({
        customer_email: 'test@example.com',
        customer_name: 'Test Customer',
        subject: 'Test ticket',
        description: 'Test description',
        category: TicketCategory.GENERAL_INQUIRY
      });

      // Wait a moment to simulate response time
      await new Promise(resolve => setTimeout(resolve, 100));

      // Add agent response
      await ticketService.addMessage(ticket.id, {
        sender_type: 'agent',
        sender_id: 1,
        sender_name: 'Test Agent',
        message: 'Thank you for contacting us. We are looking into your issue.'
      });

      // Get updated ticket
      const updatedTicket = await ticketService.getTicketById(ticket.id);
      expect(updatedTicket?.first_response_at).toBeDefined();
      expect(updatedTicket?.response_time_minutes).toBeGreaterThanOrEqual(0);
    });

    test('should calculate resolution time when ticket is resolved', async () => {
      // Create ticket
      const ticket = await ticketService.createTicket({
        customer_email: 'test@example.com',
        customer_name: 'Test Customer',
        subject: 'Test ticket',
        description: 'Test description',
        category: TicketCategory.GENERAL_INQUIRY
      });

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 100));

      // Resolve ticket
      await ticketService.resolveTicket(ticket.id, 'Issue resolved', 1, 'Test Agent');

      // Get updated ticket
      const updatedTicket = await ticketService.getTicketById(ticket.id);
      expect(updatedTicket?.resolved_at).toBeDefined();
      expect(updatedTicket?.resolution_time_minutes).toBeGreaterThanOrEqual(0);
    });
  });

  describe('SLA Metrics and Benchmarks', () => {
    test('should get SLA benchmarks for all categories and priorities', async () => {
      const benchmarks = await metricsService.getSLABenchmarks();
      
      expect(benchmarks.length).toBeGreaterThan(0);
      expect(benchmarks[0]).toHaveProperty('category');
      expect(benchmarks[0]).toHaveProperty('priority');
      expect(benchmarks[0]).toHaveProperty('target_first_response_minutes');
      expect(benchmarks[0]).toHaveProperty('target_resolution_hours');
    });

    test('should update SLA benchmarks', async () => {
      const updatedBenchmark = await metricsService.updateSLABenchmark(
        TicketCategory.GENERAL_INQUIRY,
        TicketPriority.HIGH,
        30, // 30 minutes first response
        4,  // 4 hours resolution
        8   // 8 hours escalation threshold
      );

      expect(updatedBenchmark.target_first_response_minutes).toBe(30);
      expect(updatedBenchmark.target_resolution_hours).toBe(4);
      expect(updatedBenchmark.escalation_threshold_hours).toBe(8);
    });

    test('should identify tickets approaching SLA breach', async () => {
      // First, ensure we have benchmarks for this category/priority
      const benchmarks = await metricsService.getSLABenchmarks();
      const urgentComplaintBenchmark = benchmarks.find(
        b => b.category === TicketCategory.COMPLAINT && b.priority === TicketPriority.URGENT
      );
      
      // If no benchmark exists, create one
      if (!urgentComplaintBenchmark) {
        await metricsService.updateSLABenchmark(
          TicketCategory.COMPLAINT,
          TicketPriority.URGENT,
          5, // 5 minutes first response
          2, // 2 hours resolution
          4  // 4 hours escalation threshold
        );
      }

      // Create a high priority ticket
      const ticket = await ticketService.createTicket({
        customer_email: 'test@example.com',
        customer_name: 'Test Customer',
        subject: 'Urgent issue',
        description: 'This is urgent',
        category: TicketCategory.COMPLAINT,
        priority: TicketPriority.URGENT
      });

      // Manually update created_at to simulate an old ticket
      // For 5 min target, 80% = 4 minutes, so we need > 4 minutes
      await ticketService['ticketRepository']['pool'].query(
        'UPDATE tickets SET created_at = created_at - INTERVAL \'4.5 minutes\' WHERE id = $1',
        [ticket.id]
      );

      // Get tickets approaching breach (should include our ticket now)
      const approachingBreach = await metricsService.getTicketsApproachingSLABreach();
      
      // The ticket should appear in the list since it's urgent and hasn't been responded to
      const foundTicket = approachingBreach.find(t => t.ticket_id === ticket.id);
      expect(foundTicket).toBeDefined();
      if (foundTicket) {
        expect(foundTicket.breach_type).toBe('first_response');
        expect(foundTicket.minutes_until_breach).toBeLessThan(1); // Should be close to breach
      }
    });
  });

  describe('Audit Trail Functionality', () => {
    test('should create audit entries for ticket creation', async () => {
      const ticket = await ticketService.createTicket({
        customer_email: 'test@example.com',
        customer_name: 'Test Customer',
        subject: 'Test ticket',
        description: 'Test description',
        category: TicketCategory.GENERAL_INQUIRY
      });

      const auditTrail = await auditService.getTicketAuditTrail(ticket.id);
      
      expect(auditTrail.length).toBeGreaterThan(0);
      expect(auditTrail[0].action_type).toBe(AuditActionType.CREATED);
      expect(auditTrail[0].performed_by_type).toBe('system');
    });

    test('should create audit entries for messages', async () => {
      const ticket = await ticketService.createTicket({
        customer_email: 'test@example.com',
        customer_name: 'Test Customer',
        subject: 'Test ticket',
        description: 'Test description',
        category: TicketCategory.GENERAL_INQUIRY
      });

      await ticketService.addMessage(ticket.id, {
        sender_type: 'agent',
        sender_id: 1,
        sender_name: 'Test Agent',
        message: 'Test response'
      });

      const auditTrail = await auditService.getTicketAuditTrail(ticket.id);
      const messageEntry = auditTrail.find(entry => entry.action_type === AuditActionType.MESSAGE_ADDED);
      
      expect(messageEntry).toBeDefined();
      expect(messageEntry?.performed_by_type).toBe('agent');
      expect(messageEntry?.performed_by_name).toBe('Test Agent');
    });

    test('should generate audit summary with performance metrics', async () => {
      const ticket = await ticketService.createTicket({
        customer_email: 'test@example.com',
        customer_name: 'Test Customer',
        subject: 'Test ticket',
        description: 'Test description',
        category: TicketCategory.GENERAL_INQUIRY
      });

      // Add some interactions
      await ticketService.addMessage(ticket.id, {
        sender_type: 'agent',
        sender_id: 1,
        sender_name: 'Test Agent',
        message: 'First response'
      });

      await ticketService.resolveTicket(ticket.id, 'Issue resolved', 1, 'Test Agent');

      const auditSummary = await auditService.getTicketAuditSummary(ticket.id);
      
      expect(auditSummary.ticket_id).toBe(ticket.id);
      expect(auditSummary.total_actions).toBeGreaterThan(0);
      expect(auditSummary.performance_metrics.time_to_first_response_minutes).toBeDefined();
      expect(auditSummary.performance_metrics.time_to_resolution_hours).toBeDefined();
    });
  });

  describe('Detailed Metrics and Reporting', () => {
    test('should generate comprehensive ticket metrics', async () => {
      // Create some test tickets
      await ticketService.createTicket({
        customer_email: 'test1@example.com',
        customer_name: 'Test Customer 1',
        subject: 'Test ticket 1',
        description: 'Test description 1',
        category: TicketCategory.ORDER_ISSUE,
        priority: TicketPriority.HIGH
      });

      await ticketService.createTicket({
        customer_email: 'test2@example.com',
        customer_name: 'Test Customer 2',
        subject: 'Test ticket 2',
        description: 'Test description 2',
        category: TicketCategory.PAYMENT_PROBLEM,
        priority: TicketPriority.MEDIUM
      });

      const detailedMetrics = await metricsService.getDetailedTicketMetrics();
      
      expect(detailedMetrics.overview.total_tickets).toBe(2);
      expect(detailedMetrics.by_category[TicketCategory.ORDER_ISSUE].total).toBe(1);
      expect(detailedMetrics.by_category[TicketCategory.PAYMENT_PROBLEM].total).toBe(1);
      expect(detailedMetrics.by_priority[TicketPriority.HIGH].total).toBe(1);
      expect(detailedMetrics.by_priority[TicketPriority.MEDIUM].total).toBe(1);
    });

    test('should generate response time metrics by category and priority', async () => {
      // Create and respond to a ticket
      const ticket = await ticketService.createTicket({
        customer_email: 'test@example.com',
        customer_name: 'Test Customer',
        subject: 'Test ticket',
        description: 'Test description',
        category: TicketCategory.TECHNICAL_SUPPORT,
        priority: TicketPriority.HIGH
      });

      await ticketService.addMessage(ticket.id, {
        sender_type: 'agent',
        sender_id: 1,
        sender_name: 'Test Agent',
        message: 'Response'
      });

      await ticketService.resolveTicket(ticket.id, 'Resolved', 1, 'Test Agent');

      const responseMetrics = await metricsService.getResponseTimeMetrics(
        undefined, undefined, TicketCategory.TECHNICAL_SUPPORT, TicketPriority.HIGH
      );
      
      expect(responseMetrics.length).toBeGreaterThan(0);
      const metric = responseMetrics[0];
      expect(metric.category).toBe(TicketCategory.TECHNICAL_SUPPORT);
      expect(metric.priority).toBe(TicketPriority.HIGH);
      expect(metric.total_tickets).toBe(1);
    });
  });

  describe('System Audit and Compliance', () => {
    test('should search audit logs with filters', async () => {
      const ticket = await ticketService.createTicket({
        customer_email: 'test@example.com',
        customer_name: 'Test Customer',
        subject: 'Test ticket',
        description: 'Test description',
        category: TicketCategory.GENERAL_INQUIRY
      });

      await ticketService.addMessage(ticket.id, {
        sender_type: 'agent',
        sender_id: 1,
        sender_name: 'Test Agent',
        message: 'Test message'
      });

      const searchResults = await auditService.searchAuditLogs({
        ticketId: ticket.id,
        actionType: AuditActionType.MESSAGE_ADDED
      });

      expect(searchResults.entries.length).toBeGreaterThan(0);
      expect(searchResults.entries[0].action_type).toBe(AuditActionType.MESSAGE_ADDED);
      expect(searchResults.entries[0].ticket_id).toBe(ticket.id);
    });

    test('should generate audit statistics', async () => {
      const ticket = await ticketService.createTicket({
        customer_email: 'test@example.com',
        customer_name: 'Test Customer',
        subject: 'Test ticket',
        description: 'Test description',
        category: TicketCategory.GENERAL_INQUIRY
      });

      await ticketService.addMessage(ticket.id, {
        sender_type: 'agent',
        sender_id: 1,
        sender_name: 'Test Agent',
        message: 'Test message'
      });

      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      const endDate = new Date();

      const statistics = await auditService.getAuditStatistics(startDate, endDate);
      
      expect(statistics.total_entries).toBeGreaterThan(0);
      expect(statistics.entries_by_action_type[AuditActionType.CREATED]).toBeGreaterThan(0);
      expect(statistics.entries_by_performer_type.system).toBeGreaterThan(0);
    });
  });
});
