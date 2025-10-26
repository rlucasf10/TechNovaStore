import { Pool } from 'pg';
import { TicketCategory, TicketPriority, TicketStatus } from '../types';

export interface ResponseTimeMetrics {
  category: TicketCategory;
  priority: TicketPriority;
  average_first_response_minutes: number;
  average_resolution_hours: number;
  first_response_sla_compliance: number; // percentage
  resolution_sla_compliance: number; // percentage
  total_tickets: number;
  tickets_within_sla: number;
  tickets_breached_sla: number;
}

export interface DetailedTicketMetrics {
  overview: {
    total_tickets: number;
    open_tickets: number;
    resolved_tickets: number;
    closed_tickets: number;
    average_resolution_time_hours: number;
    average_first_response_minutes: number;
    overall_sla_compliance: number;
  };
  by_category: Record<TicketCategory, {
    total: number;
    avg_resolution_hours: number;
    avg_first_response_minutes: number;
    sla_compliance: number;
  }>;
  by_priority: Record<TicketPriority, {
    total: number;
    avg_resolution_hours: number;
    avg_first_response_minutes: number;
    sla_compliance: number;
  }>;
  response_time_trends: Array<{
    date: string;
    avg_first_response_minutes: number;
    avg_resolution_hours: number;
    sla_compliance: number;
    ticket_count: number;
  }>;
  sla_breaches: Array<{
    ticket_id: number;
    ticket_number: string;
    category: TicketCategory;
    priority: TicketPriority;
    breach_type: 'first_response' | 'resolution' | 'both';
    target_minutes: number;
    actual_minutes: number;
    breach_severity: 'minor' | 'major' | 'critical';
  }>;
}

export interface SLABenchmark {
  category: TicketCategory;
  priority: TicketPriority;
  target_first_response_minutes: number;
  target_resolution_hours: number;
  escalation_threshold_hours: number;
}

export class MetricsService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Get comprehensive response time metrics
   */
  async getResponseTimeMetrics(
    startDate?: Date,
    endDate?: Date,
    category?: TicketCategory,
    priority?: TicketPriority
  ): Promise<ResponseTimeMetrics[]> {
    const client = await this.pool.connect();

    try {
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (startDate) {
        conditions.push(`t.created_at >= $${paramIndex++}`);
        values.push(startDate);
      }

      if (endDate) {
        conditions.push(`t.created_at <= $${paramIndex++}`);
        values.push(endDate);
      }

      if (category) {
        conditions.push(`t.category = $${paramIndex++}`);
        values.push(category);
      }

      if (priority) {
        conditions.push(`t.priority = $${paramIndex++}`);
        values.push(priority);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const query = `
        SELECT 
          t.category,
          t.priority,
          AVG(t.response_time_minutes) as avg_first_response_minutes,
          AVG(t.resolution_time_minutes / 60.0) as avg_resolution_hours,
          COUNT(*) as total_tickets,
          COUNT(CASE WHEN sla.first_response_sla_met = true THEN 1 END) as first_response_sla_met,
          COUNT(CASE WHEN sla.resolution_sla_met = true THEN 1 END) as resolution_sla_met,
          (COUNT(CASE WHEN sla.first_response_sla_met = true THEN 1 END) * 100.0 / COUNT(*)) as first_response_sla_compliance,
          (COUNT(CASE WHEN sla.resolution_sla_met = true THEN 1 END) * 100.0 / COUNT(*)) as resolution_sla_compliance
        FROM tickets t
        LEFT JOIN ticket_sla_metrics sla ON t.id = sla.ticket_id
        ${whereClause}
        GROUP BY t.category, t.priority
        ORDER BY t.category, t.priority
      `;

      const result = await client.query(query, values);

      return result.rows.map(row => ({
        category: row.category as TicketCategory,
        priority: row.priority as TicketPriority,
        average_first_response_minutes: parseFloat(row.avg_first_response_minutes) || 0,
        average_resolution_hours: parseFloat(row.avg_resolution_hours) || 0,
        first_response_sla_compliance: parseFloat(row.first_response_sla_compliance) || 0,
        resolution_sla_compliance: parseFloat(row.resolution_sla_compliance) || 0,
        total_tickets: parseInt(row.total_tickets),
        tickets_within_sla: parseInt(row.first_response_sla_met) + parseInt(row.resolution_sla_met),
        tickets_breached_sla: (parseInt(row.total_tickets) * 2) - (parseInt(row.first_response_sla_met) + parseInt(row.resolution_sla_met))
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get detailed ticket metrics with trends and SLA analysis
   */
  async getDetailedTicketMetrics(
    startDate?: Date,
    endDate?: Date
  ): Promise<DetailedTicketMetrics> {
    const client = await this.pool.connect();

    try {
      const dateFilter = this.buildDateFilter(startDate, endDate);

      // Get overview metrics
      const overviewQuery = `
        SELECT 
          COUNT(*) as total_tickets,
          COUNT(CASE WHEN status IN ('open', 'in_progress', 'waiting_customer') THEN 1 END) as open_tickets,
          COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_tickets,
          COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_tickets,
          AVG(resolution_time_minutes / 60.0) as avg_resolution_hours,
          AVG(response_time_minutes) as avg_first_response_minutes,
          AVG(CASE WHEN sla.first_response_sla_met = true AND sla.resolution_sla_met = true THEN 100.0 ELSE 0.0 END) as overall_sla_compliance
        FROM tickets t
        LEFT JOIN ticket_sla_metrics sla ON t.id = sla.ticket_id
        ${dateFilter.whereClause}
      `;

      const overviewResult = await client.query(overviewQuery, dateFilter.values);
      const overview = overviewResult.rows[0];

      // Get metrics by category
      const categoryQuery = `
        SELECT 
          category,
          COUNT(*) as total,
          AVG(resolution_time_minutes / 60.0) as avg_resolution_hours,
          AVG(response_time_minutes) as avg_first_response_minutes,
          AVG(CASE WHEN sla.first_response_sla_met = true AND sla.resolution_sla_met = true THEN 100.0 ELSE 0.0 END) as sla_compliance
        FROM tickets t
        LEFT JOIN ticket_sla_metrics sla ON t.id = sla.ticket_id
        ${dateFilter.whereClause}
        GROUP BY category
      `;

      const categoryResult = await client.query(categoryQuery, dateFilter.values);
      const byCategory = this.buildCategoryMetricsMap(categoryResult.rows);

      // Get metrics by priority
      const priorityQuery = `
        SELECT 
          priority,
          COUNT(*) as total,
          AVG(resolution_time_minutes / 60.0) as avg_resolution_hours,
          AVG(response_time_minutes) as avg_first_response_minutes,
          AVG(CASE WHEN sla.first_response_sla_met = true AND sla.resolution_sla_met = true THEN 100.0 ELSE 0.0 END) as sla_compliance
        FROM tickets t
        LEFT JOIN ticket_sla_metrics sla ON t.id = sla.ticket_id
        ${dateFilter.whereClause}
        GROUP BY priority
      `;

      const priorityResult = await client.query(priorityQuery, dateFilter.values);
      const byPriority = this.buildPriorityMetricsMap(priorityResult.rows);

      // Get response time trends (daily)
      const trendsQuery = `
        SELECT 
          DATE(t.created_at) as date,
          AVG(t.response_time_minutes) as avg_first_response_minutes,
          AVG(t.resolution_time_minutes / 60.0) as avg_resolution_hours,
          AVG(CASE WHEN sla.first_response_sla_met = true AND sla.resolution_sla_met = true THEN 100.0 ELSE 0.0 END) as sla_compliance,
          COUNT(*) as ticket_count
        FROM tickets t
        LEFT JOIN ticket_sla_metrics sla ON t.id = sla.ticket_id
        ${dateFilter.whereClause}
        GROUP BY DATE(t.created_at)
        ORDER BY DATE(t.created_at) DESC
        LIMIT 30
      `;

      const trendsResult = await client.query(trendsQuery, dateFilter.values);
      const responseTrends = trendsResult.rows.map(row => ({
        date: row.date,
        avg_first_response_minutes: parseFloat(row.avg_first_response_minutes) || 0,
        avg_resolution_hours: parseFloat(row.avg_resolution_hours) || 0,
        sla_compliance: parseFloat(row.sla_compliance) || 0,
        ticket_count: parseInt(row.ticket_count)
      }));

      // Get SLA breaches
      const breachesQuery = `
        SELECT 
          t.id as ticket_id,
          t.ticket_number,
          t.category,
          t.priority,
          sla.target_first_response_minutes,
          sla.target_resolution_hours,
          sla.actual_first_response_minutes,
          sla.actual_resolution_hours,
          sla.first_response_sla_met,
          sla.resolution_sla_met
        FROM tickets t
        JOIN ticket_sla_metrics sla ON t.id = sla.ticket_id
        ${dateFilter.whereClause ? dateFilter.whereClause + ' AND' : 'WHERE'} 
        (sla.first_response_sla_met = false OR sla.resolution_sla_met = false)
        ORDER BY t.created_at DESC
        LIMIT 50
      `;

      const breachesResult = await client.query(breachesQuery, dateFilter.values);
      const slaBreaches = breachesResult.rows.map(row => {
        const firstResponseBreach = !row.first_response_sla_met;
        const resolutionBreach = !row.resolution_sla_met;
        
        let breachType: 'first_response' | 'resolution' | 'both';
        if (firstResponseBreach && resolutionBreach) {
          breachType = 'both';
        } else if (firstResponseBreach) {
          breachType = 'first_response';
        } else {
          breachType = 'resolution';
        }

        // Calculate breach severity
        const firstResponseOverage = row.actual_first_response_minutes - row.target_first_response_minutes;
        const resolutionOverage = (row.actual_resolution_hours - row.target_resolution_hours) * 60;
        const maxOverage = Math.max(firstResponseOverage || 0, resolutionOverage || 0);
        
        let breachSeverity: 'minor' | 'major' | 'critical';
        if (maxOverage > 480) { // 8 hours
          breachSeverity = 'critical';
        } else if (maxOverage > 120) { // 2 hours
          breachSeverity = 'major';
        } else {
          breachSeverity = 'minor';
        }

        return {
          ticket_id: row.ticket_id,
          ticket_number: row.ticket_number,
          category: row.category as TicketCategory,
          priority: row.priority as TicketPriority,
          breach_type: breachType,
          target_minutes: breachType === 'resolution' ? row.target_resolution_hours * 60 : row.target_first_response_minutes,
          actual_minutes: breachType === 'resolution' ? row.actual_resolution_hours * 60 : row.actual_first_response_minutes,
          breach_severity: breachSeverity
        };
      });

      return {
        overview: {
          total_tickets: parseInt(overview.total_tickets),
          open_tickets: parseInt(overview.open_tickets),
          resolved_tickets: parseInt(overview.resolved_tickets),
          closed_tickets: parseInt(overview.closed_tickets),
          average_resolution_time_hours: parseFloat(overview.avg_resolution_hours) || 0,
          average_first_response_minutes: parseFloat(overview.avg_first_response_minutes) || 0,
          overall_sla_compliance: parseFloat(overview.overall_sla_compliance) || 0
        },
        by_category: byCategory,
        by_priority: byPriority,
        response_time_trends: responseTrends,
        sla_breaches: slaBreaches
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get SLA benchmarks for all categories and priorities
   */
  async getSLABenchmarks(): Promise<SLABenchmark[]> {
    const client = await this.pool.connect();

    try {
      const query = `
        SELECT category, priority, target_first_response_minutes, 
               target_resolution_hours, escalation_threshold_hours
        FROM response_time_benchmarks
        ORDER BY category, priority
      `;

      const result = await client.query(query);
      return result.rows as SLABenchmark[];
    } finally {
      client.release();
    }
  }

  /**
   * Update SLA benchmarks
   */
  async updateSLABenchmark(
    category: TicketCategory,
    priority: TicketPriority,
    targetFirstResponseMinutes: number,
    targetResolutionHours: number,
    escalationThresholdHours: number
  ): Promise<SLABenchmark> {
    const client = await this.pool.connect();

    try {
      const query = `
        INSERT INTO response_time_benchmarks 
        (category, priority, target_first_response_minutes, target_resolution_hours, escalation_threshold_hours, updated_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        ON CONFLICT (category, priority) 
        DO UPDATE SET 
          target_first_response_minutes = $3,
          target_resolution_hours = $4,
          escalation_threshold_hours = $5,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      const values = [category, priority, targetFirstResponseMinutes, targetResolutionHours, escalationThresholdHours];
      const result = await client.query(query, values);
      return result.rows[0] as SLABenchmark;
    } finally {
      client.release();
    }
  }

  /**
   * Get tickets that are approaching SLA breach
   */
  async getTicketsApproachingSLABreach(): Promise<Array<{
    ticket_id: number;
    ticket_number: string;
    category: TicketCategory;
    priority: TicketPriority;
    status: TicketStatus;
    created_at: Date;
    minutes_until_breach: number;
    breach_type: 'first_response' | 'resolution';
  }>> {
    const client = await this.pool.connect();

    try {
      const query = `
        SELECT 
          t.id as ticket_id,
          t.ticket_number,
          t.category,
          t.priority,
          t.status,
          t.created_at,
          b.target_first_response_minutes,
          b.target_resolution_hours,
          EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.created_at)) / 60 as minutes_elapsed,
          CASE 
            WHEN t.first_response_at IS NULL THEN 
              b.target_first_response_minutes - EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.created_at)) / 60
            ELSE 
              (b.target_resolution_hours * 60) - EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.created_at)) / 60
          END as minutes_until_breach,
          CASE 
            WHEN t.first_response_at IS NULL THEN 'first_response'
            ELSE 'resolution'
          END as breach_type
        FROM tickets t
        JOIN response_time_benchmarks b ON t.category = b.category AND t.priority = b.priority
        WHERE t.status IN ('open', 'in_progress', 'waiting_customer')
        AND (
          (t.first_response_at IS NULL AND 
           EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.created_at)) / 60 > (b.target_first_response_minutes * 0.8))
          OR
          (t.first_response_at IS NOT NULL AND t.resolved_at IS NULL AND
           EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.created_at)) / 60 > (b.target_resolution_hours * 60 * 0.8))
        )
        ORDER BY minutes_until_breach ASC
      `;

      const result = await client.query(query);
      return result.rows.map(row => ({
        ticket_id: row.ticket_id,
        ticket_number: row.ticket_number,
        category: row.category as TicketCategory,
        priority: row.priority as TicketPriority,
        status: row.status as TicketStatus,
        created_at: row.created_at,
        minutes_until_breach: parseFloat(row.minutes_until_breach),
        breach_type: row.breach_type as 'first_response' | 'resolution'
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Build date filter for queries
   */
  private buildDateFilter(startDate?: Date, endDate?: Date): { whereClause: string; values: any[] } {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (startDate) {
      conditions.push(`t.created_at >= $${paramIndex++}`);
      values.push(startDate);
    }

    if (endDate) {
      conditions.push(`t.created_at <= $${paramIndex++}`);
      values.push(endDate);
    }

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      values
    };
  }

  /**
   * Build category metrics map from query results
   */
  private buildCategoryMetricsMap(rows: any[]): Record<TicketCategory, {
    total: number;
    avg_resolution_hours: number;
    avg_first_response_minutes: number;
    sla_compliance: number;
  }> {
    const map = {} as Record<TicketCategory, any>;

    // Initialize all categories with 0
    Object.values(TicketCategory).forEach(category => {
      map[category] = {
        total: 0,
        avg_resolution_hours: 0,
        avg_first_response_minutes: 0,
        sla_compliance: 0
      };
    });

    // Fill with actual data
    rows.forEach(row => {
      map[row.category as TicketCategory] = {
        total: parseInt(row.total),
        avg_resolution_hours: parseFloat(row.avg_resolution_hours) || 0,
        avg_first_response_minutes: parseFloat(row.avg_first_response_minutes) || 0,
        sla_compliance: parseFloat(row.sla_compliance) || 0
      };
    });

    return map;
  }

  /**
   * Build priority metrics map from query results
   */
  private buildPriorityMetricsMap(rows: any[]): Record<TicketPriority, {
    total: number;
    avg_resolution_hours: number;
    avg_first_response_minutes: number;
    sla_compliance: number;
  }> {
    const map = {} as Record<TicketPriority, any>;

    // Initialize all priorities with 0
    Object.values(TicketPriority).forEach(priority => {
      map[priority] = {
        total: 0,
        avg_resolution_hours: 0,
        avg_first_response_minutes: 0,
        sla_compliance: 0
      };
    });

    // Fill with actual data
    rows.forEach(row => {
      map[row.priority as TicketPriority] = {
        total: parseInt(row.total),
        avg_resolution_hours: parseFloat(row.avg_resolution_hours) || 0,
        avg_first_response_minutes: parseFloat(row.avg_first_response_minutes) || 0,
        sla_compliance: parseFloat(row.sla_compliance) || 0
      };
    });

    return map;
  }
}