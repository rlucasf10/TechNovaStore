import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import {
  ITicket,
  ITicketMessage,
  ISatisfactionSurvey,
  ITicketMetrics,
  CreateTicketRequest,
  UpdateTicketRequest,
  AddMessageRequest,
  CreateSatisfactionSurveyRequest,
  TicketStatus,
  TicketPriority,
  TicketCategory
} from '../types';

export class TicketRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create a new ticket
   */
  async createTicket(ticketData: CreateTicketRequest): Promise<ITicket> {
    const client = await this.pool.connect();

    try {
      const ticketNumber = this.generateTicketNumber();
      const priority = ticketData.priority || TicketPriority.MEDIUM;

      const query = `
        INSERT INTO tickets (
          ticket_number, user_id, customer_email, customer_name, subject, 
          description, category, priority, status, escalated_from_chatbot, 
          escalation_reason, chat_session_id, order_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;

      const values = [
        ticketNumber,
        ticketData.user_id || null,
        ticketData.customer_email,
        ticketData.customer_name,
        ticketData.subject,
        ticketData.description,
        ticketData.category,
        priority,
        TicketStatus.OPEN,
        ticketData.escalated_from_chatbot || false,
        ticketData.escalation_reason || null,
        ticketData.chat_session_id || null,
        ticketData.order_id || null,
        new Date(),
        new Date()
      ];

      const result = await client.query(query, values);
      return result.rows[0] as ITicket;
    } finally {
      client.release();
    }
  }

  /**
   * Get ticket by ID
   */
  async getTicketById(ticketId: number): Promise<ITicket | null> {
    const client = await this.pool.connect();

    try {
      const query = 'SELECT * FROM tickets WHERE id = $1';
      const result = await client.query(query, [ticketId]);

      return result.rows.length > 0 ? result.rows[0] as ITicket : null;
    } finally {
      client.release();
    }
  }

  /**
   * Get ticket by ticket number
   */
  async getTicketByNumber(ticketNumber: string): Promise<ITicket | null> {
    const client = await this.pool.connect();

    try {
      const query = 'SELECT * FROM tickets WHERE ticket_number = $1';
      const result = await client.query(query, [ticketNumber]);

      return result.rows.length > 0 ? result.rows[0] as ITicket : null;
    } finally {
      client.release();
    }
  }

  /**
   * Update ticket
   */
  async updateTicket(ticketId: number, updateData: UpdateTicketRequest): Promise<ITicket | null> {
    const client = await this.pool.connect();

    try {
      const setClause: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updateData.status !== undefined) {
        setClause.push(`status = $${paramIndex++}`);
        values.push(updateData.status);

        // Set resolved_at or closed_at timestamps
        if (updateData.status === TicketStatus.RESOLVED) {
          setClause.push(`resolved_at = $${paramIndex++}`);
          values.push(new Date());
        } else if (updateData.status === TicketStatus.CLOSED) {
          setClause.push(`closed_at = $${paramIndex++}`);
          values.push(new Date());
        }
      }

      if (updateData.priority !== undefined) {
        setClause.push(`priority = $${paramIndex++}`);
        values.push(updateData.priority);
      }

      if (updateData.assigned_to !== undefined) {
        setClause.push(`assigned_to = $${paramIndex++}`);
        values.push(updateData.assigned_to);
      }

      if (updateData.category !== undefined) {
        setClause.push(`category = $${paramIndex++}`);
        values.push(updateData.category);
      }

      if (updateData.first_response_at !== undefined) {
        setClause.push(`first_response_at = $${paramIndex++}`);
        values.push(updateData.first_response_at);
      }

      if (updateData.last_agent_response_at !== undefined) {
        setClause.push(`last_agent_response_at = $${paramIndex++}`);
        values.push(updateData.last_agent_response_at);
      }

      setClause.push(`updated_at = $${paramIndex++}`);
      values.push(new Date());

      values.push(ticketId);

      const query = `
        UPDATE tickets 
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(query, values);
      return result.rows.length > 0 ? result.rows[0] as ITicket : null;
    } finally {
      client.release();
    }
  }

  /**
   * Get tickets with pagination and filtering
   */
  async getTickets(
    page: number = 1,
    limit: number = 20,
    status?: TicketStatus,
    category?: TicketCategory,
    priority?: TicketPriority,
    assignedTo?: number
  ): Promise<{ tickets: ITicket[]; total: number }> {
    const client = await this.pool.connect();

    try {
      const offset = (page - 1) * limit;
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (status) {
        conditions.push(`status = $${paramIndex++}`);
        values.push(status);
      }

      if (category) {
        conditions.push(`category = $${paramIndex++}`);
        values.push(category);
      }

      if (priority) {
        conditions.push(`priority = $${paramIndex++}`);
        values.push(priority);
      }

      if (assignedTo) {
        conditions.push(`assigned_to = $${paramIndex++}`);
        values.push(assignedTo);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM tickets ${whereClause}`;
      const countResult = await client.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Get tickets
      values.push(limit, offset);
      const ticketsQuery = `
        SELECT * FROM tickets 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;

      const ticketsResult = await client.query(ticketsQuery, values);

      return {
        tickets: ticketsResult.rows as ITicket[],
        total
      };
    } finally {
      client.release();
    }
  }

  /**
   * Add message to ticket
   */
  async addMessage(ticketId: number, messageData: AddMessageRequest): Promise<ITicketMessage> {
    const client = await this.pool.connect();

    try {
      const query = `
        INSERT INTO ticket_messages (
          ticket_id, sender_type, sender_id, sender_name, message, is_internal, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const values = [
        ticketId,
        messageData.sender_type,
        messageData.sender_id || null,
        messageData.sender_name,
        messageData.message,
        messageData.is_internal || false,
        new Date()
      ];

      const result = await client.query(query, values);
      return result.rows[0] as ITicketMessage;
    } finally {
      client.release();
    }
  }

  /**
   * Get messages for a ticket
   */
  async getTicketMessages(ticketId: number, includeInternal: boolean = false): Promise<ITicketMessage[]> {
    const client = await this.pool.connect();

    try {
      const whereClause = includeInternal ?
        'WHERE ticket_id = $1' :
        'WHERE ticket_id = $1 AND is_internal = false';

      const query = `
        SELECT * FROM ticket_messages 
        ${whereClause}
        ORDER BY created_at ASC
      `;

      const result = await client.query(query, [ticketId]);
      return result.rows as ITicketMessage[];
    } finally {
      client.release();
    }
  }

  /**
   * Create satisfaction survey
   */
  async createSatisfactionSurvey(
    ticketId: number,
    surveyData: CreateSatisfactionSurveyRequest
  ): Promise<ISatisfactionSurvey> {
    const client = await this.pool.connect();

    try {
      const query = `
        INSERT INTO satisfaction_surveys (
          ticket_id, rating, feedback, response_time_rating, 
          resolution_quality_rating, agent_helpfulness_rating, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const values = [
        ticketId,
        surveyData.rating,
        surveyData.feedback || null,
        surveyData.response_time_rating,
        surveyData.resolution_quality_rating,
        surveyData.agent_helpfulness_rating,
        new Date()
      ];

      const result = await client.query(query, values);
      return result.rows[0] as ISatisfactionSurvey;
    } finally {
      client.release();
    }
  }

  /**
   * Get ticket metrics
   */
  async getTicketMetrics(startDate?: Date, endDate?: Date): Promise<ITicketMetrics> {
    const client = await this.pool.connect();

    try {
      const dateFilter = this.buildDateFilter(startDate, endDate);

      // Get basic counts
      const countsQuery = `
        SELECT 
          COUNT(*) as total_tickets,
          COUNT(CASE WHEN status IN ('open', 'in_progress', 'waiting_customer') THEN 1 END) as open_tickets,
          COUNT(CASE WHEN status IN ('resolved', 'closed') THEN 1 END) as resolved_tickets
        FROM tickets 
        ${dateFilter.whereClause}
      `;

      const countsResult = await client.query(countsQuery, dateFilter.values);
      const counts = countsResult.rows[0];

      // Get average resolution time
      const resolutionTimeQuery = `
        SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_resolution_hours
        FROM tickets 
        WHERE resolved_at IS NOT NULL ${dateFilter.whereClause ? 'AND ' + dateFilter.whereClause.replace('WHERE ', '') : ''}
      `;

      const resolutionResult = await client.query(resolutionTimeQuery, dateFilter.values);
      const avgResolutionTime = parseFloat(resolutionResult.rows[0].avg_resolution_hours) || 0;

      // Get average satisfaction rating
      const satisfactionQuery = `
        SELECT AVG(rating) as avg_rating
        FROM satisfaction_surveys s
        JOIN tickets t ON s.ticket_id = t.id
        ${dateFilter.whereClause ? dateFilter.whereClause.replace('tickets', 't') : ''}
      `;

      const satisfactionResult = await client.query(satisfactionQuery, dateFilter.values);
      const avgSatisfaction = parseFloat(satisfactionResult.rows[0].avg_rating) || 0;

      // Get tickets by category
      const categoryQuery = `
        SELECT category, COUNT(*) as count
        FROM tickets 
        ${dateFilter.whereClause}
        GROUP BY category
      `;

      const categoryResult = await client.query(categoryQuery, dateFilter.values);
      const ticketsByCategory = this.buildCategoryMap(categoryResult.rows);

      // Get tickets by priority
      const priorityQuery = `
        SELECT priority, COUNT(*) as count
        FROM tickets 
        ${dateFilter.whereClause}
        GROUP BY priority
      `;

      const priorityResult = await client.query(priorityQuery, dateFilter.values);
      const ticketsByPriority = this.buildPriorityMap(priorityResult.rows);

      // Get escalation rate
      const escalationQuery = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN escalated_from_chatbot = true THEN 1 END) as escalated
        FROM tickets 
        ${dateFilter.whereClause}
      `;

      const escalationResult = await client.query(escalationQuery, dateFilter.values);
      const escalationData = escalationResult.rows[0];
      const escalationRate = escalationData.total > 0 ?
        (escalationData.escalated / escalationData.total) * 100 : 0;

      return {
        total_tickets: parseInt(counts.total_tickets),
        open_tickets: parseInt(counts.open_tickets),
        resolved_tickets: parseInt(counts.resolved_tickets),
        average_resolution_time: avgResolutionTime,
        average_satisfaction_rating: avgSatisfaction,
        tickets_by_category: ticketsByCategory,
        tickets_by_priority: ticketsByPriority,
        escalation_rate: escalationRate
      };
    } finally {
      client.release();
    }
  }

  /**
   * Generate unique ticket number
   */
  private generateTicketNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `TKT-${timestamp}-${random}`;
  }

  /**
   * Build date filter for queries
   */
  private buildDateFilter(startDate?: Date, endDate?: Date): { whereClause: string; values: any[] } {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (startDate) {
      conditions.push(`created_at >= $${paramIndex++}`);
      values.push(startDate);
    }

    if (endDate) {
      conditions.push(`created_at <= $${paramIndex++}`);
      values.push(endDate);
    }

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      values
    };
  }

  /**
   * Build category map from query results
   */
  private buildCategoryMap(rows: any[]): Record<TicketCategory, number> {
    const map = {} as Record<TicketCategory, number>;

    // Initialize all categories with 0
    Object.values(TicketCategory).forEach(category => {
      map[category] = 0;
    });

    // Fill with actual counts
    rows.forEach(row => {
      map[row.category as TicketCategory] = parseInt(row.count);
    });

    return map;
  }

  /**
   * Build priority map from query results
   */
  private buildPriorityMap(rows: any[]): Record<TicketPriority, number> {
    const map = {} as Record<TicketPriority, number>;

    // Initialize all priorities with 0
    Object.values(TicketPriority).forEach(priority => {
      map[priority] = 0;
    });

    // Fill with actual counts
    rows.forEach(row => {
      map[row.priority as TicketPriority] = parseInt(row.count);
    });

    return map;
  }
}