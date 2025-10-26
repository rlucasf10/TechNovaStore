import { Pool } from 'pg';

export interface AuditLogEntry {
  id: number;
  ticket_id: number;
  action_type: AuditActionType;
  old_value?: string;
  new_value?: string;
  performed_by_type: 'customer' | 'agent' | 'system';
  performed_by_id?: number;
  performed_by_name: string;
  details?: Record<string, any>;
  created_at: Date;
}

export enum AuditActionType {
  CREATED = 'created',
  STATUS_CHANGED = 'status_changed',
  PRIORITY_CHANGED = 'priority_changed',
  ASSIGNED = 'assigned',
  UNASSIGNED = 'unassigned',
  CATEGORY_CHANGED = 'category_changed',
  MESSAGE_ADDED = 'message_added',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  REOPENED = 'reopened',
  ESCALATED = 'escalated'
}

export interface AuditSummary {
  ticket_id: number;
  total_actions: number;
  actions_by_type: Record<AuditActionType, number>;
  timeline: AuditLogEntry[];
  performance_metrics: {
    time_to_first_response_minutes?: number;
    time_to_resolution_hours?: number;
    number_of_status_changes: number;
    number_of_reassignments: number;
    escalation_count: number;
  };
}

export interface SystemAuditReport {
  date_range: {
    start_date: Date;
    end_date: Date;
  };
  summary: {
    total_tickets_created: number;
    total_actions_logged: number;
    most_common_actions: Array<{
      action_type: AuditActionType;
      count: number;
      percentage: number;
    }>;
    agent_activity: Array<{
      agent_id: number;
      agent_name: string;
      actions_count: number;
      tickets_handled: number;
      avg_resolution_time_hours: number;
    }>;
  };
  compliance_metrics: {
    tickets_with_complete_audit_trail: number;
    audit_trail_completeness_percentage: number;
    data_retention_compliance: boolean;
  };
}

export class AuditService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Log an audit entry manually (for actions not covered by triggers)
   */
  async logAuditEntry(
    ticketId: number,
    actionType: AuditActionType,
    performedByType: 'customer' | 'agent' | 'system',
    performedByName: string,
    performedById?: number,
    oldValue?: string,
    newValue?: string,
    details?: Record<string, any>
  ): Promise<AuditLogEntry> {
    const client = await this.pool.connect();

    try {
      const query = `
        INSERT INTO ticket_audit_log (
          ticket_id, action_type, old_value, new_value,
          performed_by_type, performed_by_id, performed_by_name, details
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const values = [
        ticketId,
        actionType,
        oldValue || null,
        newValue || null,
        performedByType,
        performedById || null,
        performedByName,
        details ? JSON.stringify(details) : null
      ];

      const result = await client.query(query, values);
      const auditEntry = result.rows[0];

      return {
        ...auditEntry,
        details: auditEntry.details ? JSON.parse(auditEntry.details) : undefined
      } as AuditLogEntry;
    } finally {
      client.release();
    }
  }

  /**
   * Get complete audit trail for a specific ticket
   */
  async getTicketAuditTrail(ticketId: number): Promise<AuditLogEntry[]> {
    const client = await this.pool.connect();

    try {
      const query = `
        SELECT * FROM ticket_audit_log 
        WHERE ticket_id = $1 
        ORDER BY created_at ASC
      `;

      const result = await client.query(query, [ticketId]);
      return result.rows.map(row => ({
        ...row,
        details: row.details ? JSON.parse(row.details) : undefined
      })) as AuditLogEntry[];
    } finally {
      client.release();
    }
  }

  /**
   * Get audit summary for a ticket with performance metrics
   */
  async getTicketAuditSummary(ticketId: number): Promise<AuditSummary> {
    const client = await this.pool.connect();

    try {
      // Get all audit entries
      const auditEntries = await this.getTicketAuditTrail(ticketId);

      // Count actions by type
      const actionsByType = {} as Record<AuditActionType, number>;
      Object.values(AuditActionType).forEach(action => {
        actionsByType[action] = 0;
      });

      auditEntries.forEach(entry => {
        actionsByType[entry.action_type]++;
      });

      // Calculate performance metrics
      const createdEntry = auditEntries.find(e => e.action_type === AuditActionType.CREATED);
      const firstMessageEntry = auditEntries.find(e => 
        e.action_type === AuditActionType.MESSAGE_ADDED && 
        e.performed_by_type === 'agent'
      );
      const resolvedEntry = auditEntries.find(e => e.action_type === AuditActionType.RESOLVED);

      let timeToFirstResponseMinutes: number | undefined;
      let timeToResolutionHours: number | undefined;

      if (createdEntry && firstMessageEntry) {
        const diffMs = firstMessageEntry.created_at.getTime() - createdEntry.created_at.getTime();
        timeToFirstResponseMinutes = diffMs / (1000 * 60);
      }

      if (createdEntry && resolvedEntry) {
        const diffMs = resolvedEntry.created_at.getTime() - createdEntry.created_at.getTime();
        timeToResolutionHours = diffMs / (1000 * 60 * 60);
      }

      const statusChanges = auditEntries.filter(e => e.action_type === AuditActionType.STATUS_CHANGED).length;
      const reassignments = auditEntries.filter(e => 
        e.action_type === AuditActionType.ASSIGNED || e.action_type === AuditActionType.UNASSIGNED
      ).length;
      const escalations = auditEntries.filter(e => e.action_type === AuditActionType.ESCALATED).length;

      return {
        ticket_id: ticketId,
        total_actions: auditEntries.length,
        actions_by_type: actionsByType,
        timeline: auditEntries,
        performance_metrics: {
          time_to_first_response_minutes: timeToFirstResponseMinutes,
          time_to_resolution_hours: timeToResolutionHours,
          number_of_status_changes: statusChanges,
          number_of_reassignments: reassignments,
          escalation_count: escalations
        }
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get system-wide audit report
   */
  async getSystemAuditReport(
    startDate: Date,
    endDate: Date
  ): Promise<SystemAuditReport> {
    const client = await this.pool.connect();

    try {
      // Get total tickets created in period
      const ticketsQuery = `
        SELECT COUNT(*) as total_tickets
        FROM tickets 
        WHERE created_at >= $1 AND created_at <= $2
      `;
      const ticketsResult = await client.query(ticketsQuery, [startDate, endDate]);
      const totalTicketsCreated = parseInt(ticketsResult.rows[0].total_tickets);

      // Get total actions logged
      const actionsQuery = `
        SELECT COUNT(*) as total_actions
        FROM ticket_audit_log 
        WHERE created_at >= $1 AND created_at <= $2
      `;
      const actionsResult = await client.query(actionsQuery, [startDate, endDate]);
      const totalActionsLogged = parseInt(actionsResult.rows[0].total_actions);

      // Get most common actions
      const commonActionsQuery = `
        SELECT 
          action_type, 
          COUNT(*) as count,
          (COUNT(*) * 100.0 / $3) as percentage
        FROM ticket_audit_log 
        WHERE created_at >= $1 AND created_at <= $2
        GROUP BY action_type
        ORDER BY count DESC
        LIMIT 10
      `;
      const commonActionsResult = await client.query(commonActionsQuery, [startDate, endDate, totalActionsLogged]);
      const mostCommonActions = commonActionsResult.rows.map(row => ({
        action_type: row.action_type as AuditActionType,
        count: parseInt(row.count),
        percentage: parseFloat(row.percentage)
      }));

      // Get agent activity
      const agentActivityQuery = `
        SELECT 
          al.performed_by_id as agent_id,
          al.performed_by_name as agent_name,
          COUNT(*) as actions_count,
          COUNT(DISTINCT al.ticket_id) as tickets_handled,
          AVG(EXTRACT(EPOCH FROM (t.resolved_at - t.created_at)) / 3600) as avg_resolution_time_hours
        FROM ticket_audit_log al
        JOIN tickets t ON al.ticket_id = t.id
        WHERE al.created_at >= $1 AND al.created_at <= $2
        AND al.performed_by_type = 'agent'
        AND al.performed_by_id IS NOT NULL
        GROUP BY al.performed_by_id, al.performed_by_name
        ORDER BY actions_count DESC
      `;
      const agentActivityResult = await client.query(agentActivityQuery, [startDate, endDate]);
      const agentActivity = agentActivityResult.rows.map(row => ({
        agent_id: row.agent_id,
        agent_name: row.agent_name,
        actions_count: parseInt(row.actions_count),
        tickets_handled: parseInt(row.tickets_handled),
        avg_resolution_time_hours: parseFloat(row.avg_resolution_time_hours) || 0
      }));

      // Get compliance metrics
      const complianceQuery = `
        SELECT 
          COUNT(DISTINCT t.id) as tickets_with_audit,
          COUNT(DISTINCT t.id) * 100.0 / $3 as completeness_percentage
        FROM tickets t
        JOIN ticket_audit_log al ON t.id = al.ticket_id
        WHERE t.created_at >= $1 AND t.created_at <= $2
      `;
      const complianceResult = await client.query(complianceQuery, [startDate, endDate, totalTicketsCreated]);
      const compliance = complianceResult.rows[0];

      // Check data retention compliance (assuming 7 years retention policy)
      const retentionDate = new Date();
      retentionDate.setFullYear(retentionDate.getFullYear() - 7);
      const dataRetentionCompliance = startDate >= retentionDate;

      return {
        date_range: {
          start_date: startDate,
          end_date: endDate
        },
        summary: {
          total_tickets_created: totalTicketsCreated,
          total_actions_logged: totalActionsLogged,
          most_common_actions: mostCommonActions,
          agent_activity: agentActivity
        },
        compliance_metrics: {
          tickets_with_complete_audit_trail: parseInt(compliance.tickets_with_audit),
          audit_trail_completeness_percentage: parseFloat(compliance.completeness_percentage) || 0,
          data_retention_compliance: dataRetentionCompliance
        }
      };
    } finally {
      client.release();
    }
  }

  /**
   * Search audit logs with filters
   */
  async searchAuditLogs(
    filters: {
      ticketId?: number;
      actionType?: AuditActionType;
      performedByType?: 'customer' | 'agent' | 'system';
      performedById?: number;
      startDate?: Date;
      endDate?: Date;
    },
    page: number = 1,
    limit: number = 50
  ): Promise<{ entries: AuditLogEntry[]; total: number; pages: number }> {
    const client = await this.pool.connect();

    try {
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (filters.ticketId) {
        conditions.push(`ticket_id = $${paramIndex++}`);
        values.push(filters.ticketId);
      }

      if (filters.actionType) {
        conditions.push(`action_type = $${paramIndex++}`);
        values.push(filters.actionType);
      }

      if (filters.performedByType) {
        conditions.push(`performed_by_type = $${paramIndex++}`);
        values.push(filters.performedByType);
      }

      if (filters.performedById) {
        conditions.push(`performed_by_id = $${paramIndex++}`);
        values.push(filters.performedById);
      }

      if (filters.startDate) {
        conditions.push(`created_at >= $${paramIndex++}`);
        values.push(filters.startDate);
      }

      if (filters.endDate) {
        conditions.push(`created_at <= $${paramIndex++}`);
        values.push(filters.endDate);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM ticket_audit_log ${whereClause}`;
      const countResult = await client.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Get entries with pagination
      const offset = (page - 1) * limit;
      values.push(limit, offset);
      const entriesQuery = `
        SELECT * FROM ticket_audit_log 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;

      const entriesResult = await client.query(entriesQuery, values);
      const entries = entriesResult.rows.map(row => ({
        ...row,
        details: row.details ? JSON.parse(row.details) : undefined
      })) as AuditLogEntry[];

      return {
        entries,
        total,
        pages: Math.ceil(total / limit)
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get audit statistics for a date range
   */
  async getAuditStatistics(
    startDate: Date,
    endDate: Date
  ): Promise<{
    total_entries: number;
    entries_by_action_type: Record<AuditActionType, number>;
    entries_by_performer_type: Record<'customer' | 'agent' | 'system', number>;
    daily_activity: Array<{
      date: string;
      entry_count: number;
      unique_tickets: number;
      unique_agents: number;
    }>;
  }> {
    const client = await this.pool.connect();

    try {
      // Get total entries
      const totalQuery = `
        SELECT COUNT(*) as total
        FROM ticket_audit_log 
        WHERE created_at >= $1 AND created_at <= $2
      `;
      const totalResult = await client.query(totalQuery, [startDate, endDate]);
      const totalEntries = parseInt(totalResult.rows[0].total);

      // Get entries by action type
      const actionTypeQuery = `
        SELECT action_type, COUNT(*) as count
        FROM ticket_audit_log 
        WHERE created_at >= $1 AND created_at <= $2
        GROUP BY action_type
      `;
      const actionTypeResult = await client.query(actionTypeQuery, [startDate, endDate]);
      const entriesByActionType = {} as Record<AuditActionType, number>;
      Object.values(AuditActionType).forEach(action => {
        entriesByActionType[action] = 0;
      });
      actionTypeResult.rows.forEach(row => {
        entriesByActionType[row.action_type as AuditActionType] = parseInt(row.count);
      });

      // Get entries by performer type
      const performerTypeQuery = `
        SELECT performed_by_type, COUNT(*) as count
        FROM ticket_audit_log 
        WHERE created_at >= $1 AND created_at <= $2
        GROUP BY performed_by_type
      `;
      const performerTypeResult = await client.query(performerTypeQuery, [startDate, endDate]);
      const entriesByPerformerType = {
        customer: 0,
        agent: 0,
        system: 0
      };
      performerTypeResult.rows.forEach(row => {
        entriesByPerformerType[row.performed_by_type as keyof typeof entriesByPerformerType] = parseInt(row.count);
      });

      // Get daily activity
      const dailyActivityQuery = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as entry_count,
          COUNT(DISTINCT ticket_id) as unique_tickets,
          COUNT(DISTINCT CASE WHEN performed_by_type = 'agent' THEN performed_by_id END) as unique_agents
        FROM ticket_audit_log 
        WHERE created_at >= $1 AND created_at <= $2
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
      `;
      const dailyActivityResult = await client.query(dailyActivityQuery, [startDate, endDate]);
      const dailyActivity = dailyActivityResult.rows.map(row => ({
        date: row.date,
        entry_count: parseInt(row.entry_count),
        unique_tickets: parseInt(row.unique_tickets),
        unique_agents: parseInt(row.unique_agents)
      }));

      return {
        total_entries: totalEntries,
        entries_by_action_type: entriesByActionType,
        entries_by_performer_type: entriesByPerformerType,
        daily_activity: dailyActivity
      };
    } finally {
      client.release();
    }
  }

  /**
   * Clean up old audit logs (for data retention compliance)
   */
  async cleanupOldAuditLogs(retentionYears: number = 7): Promise<number> {
    const client = await this.pool.connect();

    try {
      const cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - retentionYears);

      const query = `
        DELETE FROM ticket_audit_log 
        WHERE created_at < $1
      `;

      const result = await client.query(query, [cutoffDate]);
      return result.rowCount || 0;
    } finally {
      client.release();
    }
  }
}