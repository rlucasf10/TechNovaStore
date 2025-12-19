/**
 * Tipos para el sistema de tickets de soporte
 */

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketCategory = 
  | 'technical' 
  | 'billing' 
  | 'product' 
  | 'shipping' 
  | 'account' 
  | 'other';

export interface TicketMessage {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  userRole: 'customer' | 'support' | 'admin';
  message: string;
  attachments?: string[];
  createdAt: Date;
  isInternal?: boolean;
}

export interface Ticket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: string;
  assignedToName?: string;
  messages: TicketMessage[];
  attachments?: string[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
}

export interface CreateTicketDto {
  subject: string;
  description: string;
  category: TicketCategory;
  priority?: TicketPriority;
  attachments?: File[];
}

export interface UpdateTicketDto {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedTo?: string;
  tags?: string[];
}

export interface AddMessageDto {
  message: string;
  attachments?: File[];
  isInternal?: boolean;
}

export interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  assignedTo?: string;
  userId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  averageResponseTime: number;
  averageResolutionTime: number;
}
