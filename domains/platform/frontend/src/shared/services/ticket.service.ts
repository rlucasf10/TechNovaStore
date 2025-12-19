/**
 * Servicio para gestión de tickets de soporte
 * Conecta con el microservicio ticket-service
 */

import axios from 'axios';
import type {
  Ticket,
  CreateTicketDto,
  UpdateTicketDto,
  AddMessageDto,
  TicketFilters,
  TicketStats,
  TicketMessage,
} from '@/types/ticket.types';

const TICKET_SERVICE_URL = process.env.NEXT_PUBLIC_TICKET_SERVICE_URL || 'http://localhost:3012/api';

// Configurar axios con interceptor para incluir token JWT
const ticketApi = axios.create({
  baseURL: TICKET_SERVICE_URL,
  withCredentials: true,
});

// ✅ SEGURIDAD: NO agregar interceptor de Authorization header
// La autenticación se maneja mediante httpOnly cookies que el navegador envía automáticamente
// con withCredentials: true. Esto previene ataques XSS ya que JavaScript no puede acceder
// a las cookies httpOnly.

// Función para transformar ticket del backend al formato del frontend
function transformTicket(backendTicket: any): Ticket {
  return {
    id: backendTicket.id?.toString() || backendTicket.ticket_number,
    userId: backendTicket.user_id?.toString() || '',
    userName: backendTicket.customer_name,
    userEmail: backendTicket.customer_email,
    subject: backendTicket.subject,
    description: backendTicket.description,
    category: backendTicket.category,
    priority: backendTicket.priority,
    status: backendTicket.status,
    assignedTo: backendTicket.assigned_to?.toString(),
    assignedToName: backendTicket.assigned_to_name,
    messages: [],
    attachments: backendTicket.attachments,
    tags: backendTicket.tags,
    createdAt: new Date(backendTicket.created_at),
    updatedAt: new Date(backendTicket.updated_at),
    resolvedAt: backendTicket.resolved_at ? new Date(backendTicket.resolved_at) : undefined,
    closedAt: backendTicket.closed_at ? new Date(backendTicket.closed_at) : undefined,
  };
}

// Función para transformar mensaje del backend al formato del frontend
function transformMessage(backendMessage: any): TicketMessage {
  return {
    id: backendMessage.id?.toString(),
    ticketId: backendMessage.ticket_id?.toString(),
    userId: backendMessage.sender_id?.toString() || '',
    userName: backendMessage.sender_name,
    userRole: backendMessage.sender_type === 'agent' ? 'support' : backendMessage.sender_type,
    message: backendMessage.message,
    attachments: backendMessage.attachments,
    createdAt: new Date(backendMessage.created_at),
    isInternal: backendMessage.is_internal,
  };
}

export class TicketService {
  /**
   * Obtener lista de tickets con filtros opcionales
   */
  static async getTickets(filters?: TicketFilters): Promise<Ticket[]> {
    const params = new URLSearchParams();
    
    if (filters?.status && filters.status.length > 0) {
      params.append('status', filters.status.join(','));
    }
    if (filters?.priority && filters.priority.length > 0) {
      params.append('priority', filters.priority.join(','));
    }
    if (filters?.category && filters.category.length > 0) {
      params.append('category', filters.category.join(','));
    }
    if (filters?.assignedTo) {
      params.append('assignedTo', filters.assignedTo);
    }
    if (filters?.userId) {
      params.append('userId', filters.userId);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.dateFrom) {
      params.append('dateFrom', filters.dateFrom.toISOString());
    }
    if (filters?.dateTo) {
      params.append('dateTo', filters.dateTo.toISOString());
    }

    const response = await ticketApi.get<{ success: boolean; data: any[] }>(`/tickets?${params.toString()}`);
    return (response.data.data || []).map(transformTicket);
  }

  /**
   * Obtener un ticket por ID
   */
  static async getTicket(id: string): Promise<Ticket> {
    const response = await ticketApi.get<{ success: boolean; data: any }>(`/tickets/${id}`);
    return transformTicket(response.data.data);
  }

  /**
   * Obtener un ticket por número
   */
  static async getTicketByNumber(number: string): Promise<Ticket> {
    const response = await ticketApi.get<Ticket>(`/tickets/number/${number}`);
    return response.data;
  }

  /**
   * Crear un nuevo ticket
   */
  static async createTicket(data: CreateTicketDto): Promise<Ticket> {
    const formData = new FormData();
    formData.append('subject', data.subject);
    formData.append('description', data.description);
    formData.append('category', data.category);
    if (data.priority) {
      formData.append('priority', data.priority);
    }
    if (data.attachments) {
      data.attachments.forEach((file) => {
        formData.append('attachments', file);
      });
    }

    const response = await ticketApi.post<Ticket>('/tickets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Actualizar un ticket
   */
  static async updateTicket(id: string, data: UpdateTicketDto): Promise<Ticket> {
    const response = await ticketApi.put<{ success: boolean; data: any }>(`/tickets/${id}`, data);
    return transformTicket(response.data.data);
  }

  /**
   * Asignar un ticket a un agente
   */
  static async assignTicket(id: string, agentId: string): Promise<Ticket> {
    const response = await ticketApi.post<{ success: boolean; data: any }>(`/tickets/${id}/assign`, {
      assignedTo: agentId,
    });
    return transformTicket(response.data.data);
  }

  /**
   * Resolver un ticket
   */
  static async resolveTicket(id: string): Promise<Ticket> {
    const response = await ticketApi.post<Ticket>(`/tickets/${id}/resolve`);
    return response.data;
  }

  /**
   * Cerrar un ticket
   */
  static async closeTicket(id: string): Promise<Ticket> {
    const response = await ticketApi.post<Ticket>(`/tickets/${id}/close`);
    return response.data;
  }

  /**
   * Agregar un mensaje a un ticket
   */
  static async addMessage(ticketId: string, data: AddMessageDto): Promise<TicketMessage> {
    const formData = new FormData();
    formData.append('message', data.message);
    if (data.isInternal !== undefined) {
      formData.append('isInternal', String(data.isInternal));
    }
    if (data.attachments) {
      data.attachments.forEach((file) => {
        formData.append('attachments', file);
      });
    }

    const response = await ticketApi.post<TicketMessage>(
      `/tickets/${ticketId}/messages`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * Obtener mensajes de un ticket
   */
  static async getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
    const response = await ticketApi.get<{ success: boolean; data: any[] }>(`/tickets/${ticketId}/messages`);
    return (response.data.data || []).map(transformMessage);
  }

  /**
   * Obtener estadísticas de tickets
   */
  static async getTicketStats(): Promise<TicketStats> {
    const response = await ticketApi.get<TicketStats>('/metrics/tickets');
    return response.data;
  }
}
