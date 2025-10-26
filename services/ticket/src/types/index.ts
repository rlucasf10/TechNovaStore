export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_CUSTOMER = 'waiting_customer',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum TicketCategory {
  GENERAL_INQUIRY = 'general_inquiry',
  PRODUCT_QUESTION = 'product_question',
  ORDER_ISSUE = 'order_issue',
  PAYMENT_PROBLEM = 'payment_problem',
  SHIPPING_INQUIRY = 'shipping_inquiry',
  TECHNICAL_SUPPORT = 'technical_support',
  COMPLAINT = 'complaint',
  REFUND_REQUEST = 'refund_request'
}

export enum EscalationReason {
  COMPLEX_QUERY = 'complex_query',
  CUSTOMER_REQUEST = 'customer_request',
  CHATBOT_LIMITATION = 'chatbot_limitation',
  UNRESOLVED_ISSUE = 'unresolved_issue',
  COMPLAINT_ESCALATION = 'complaint_escalation'
}

export interface ITicket {
  id: number;
  ticket_number: string;
  user_id?: number;
  customer_email: string;
  customer_name: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_to?: number;
  escalated_from_chatbot: boolean;
  escalation_reason?: EscalationReason;
  chat_session_id?: string;
  order_id?: number;
  created_at: Date;
  updated_at: Date;
  resolved_at?: Date;
  closed_at?: Date;
  first_response_at?: Date;
  last_agent_response_at?: Date;
  response_time_minutes?: number;
  resolution_time_minutes?: number;
}

export interface ITicketMessage {
  id: number;
  ticket_id: number;
  sender_type: 'customer' | 'agent' | 'system';
  sender_id?: number;
  sender_name: string;
  message: string;
  is_internal: boolean;
  created_at: Date;
}

export interface ISatisfactionSurvey {
  id: number;
  ticket_id: number;
  rating: number; // 1-5 scale
  feedback?: string;
  response_time_rating: number; // 1-5 scale
  resolution_quality_rating: number; // 1-5 scale
  agent_helpfulness_rating: number; // 1-5 scale
  created_at: Date;
}

export interface ITicketMetrics {
  total_tickets: number;
  open_tickets: number;
  resolved_tickets: number;
  average_resolution_time: number; // in hours
  average_satisfaction_rating: number;
  tickets_by_category: Record<TicketCategory, number>;
  tickets_by_priority: Record<TicketPriority, number>;
  escalation_rate: number; // percentage of chatbot escalations
}

export interface CreateTicketRequest {
  user_id?: number;
  customer_email: string;
  customer_name: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority?: TicketPriority;
  escalated_from_chatbot?: boolean;
  escalation_reason?: EscalationReason;
  chat_session_id?: string;
  order_id?: number;
}

export interface UpdateTicketRequest {
  status?: TicketStatus;
  priority?: TicketPriority;
  assigned_to?: number;
  category?: TicketCategory;
  first_response_at?: Date;
  last_agent_response_at?: Date;
}

export interface AddMessageRequest {
  sender_type: 'customer' | 'agent' | 'system';
  sender_id?: number;
  sender_name: string;
  message: string;
  is_internal?: boolean;
}

export interface CreateSatisfactionSurveyRequest {
  rating: number;
  feedback?: string;
  response_time_rating: number;
  resolution_quality_rating: number;
  agent_helpfulness_rating: number;
}