/**
 * Hooks de React Query para gestión de tickets
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TicketService } from '@/services/ticket.service';
import type {
  CreateTicketDto,
  UpdateTicketDto,
  AddMessageDto,
  TicketFilters,
} from '@/types/ticket.types';

// Query keys
export const ticketKeys = {
  all: ['tickets'] as const,
  lists: () => [...ticketKeys.all, 'list'] as const,
  list: (filters?: TicketFilters) => [...ticketKeys.lists(), filters] as const,
  details: () => [...ticketKeys.all, 'detail'] as const,
  detail: (id: string) => [...ticketKeys.details(), id] as const,
  messages: (id: string) => [...ticketKeys.detail(id), 'messages'] as const,
  stats: () => [...ticketKeys.all, 'stats'] as const,
};

/**
 * Hook para obtener lista de tickets con actualización automática
 */
export function useTickets(filters?: TicketFilters, enableRealtime = true) {
  return useQuery({
    queryKey: ticketKeys.list(filters),
    queryFn: () => TicketService.getTickets(filters),
    staleTime: 30000, // 30 segundos
    refetchInterval: enableRealtime ? 10000 : false, // Actualizar cada 10 segundos si está habilitado
    refetchIntervalInBackground: false, // No actualizar cuando la pestaña está en segundo plano
  });
}

/**
 * Hook para obtener un ticket específico con actualización automática
 */
export function useTicket(id: string, enableRealtime = true) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => TicketService.getTicket(id),
    enabled: !!id,
    refetchInterval: enableRealtime ? 5000 : false, // Actualizar cada 5 segundos si está habilitado
    refetchIntervalInBackground: false,
  });
}

/**
 * Hook para obtener mensajes de un ticket con actualización automática
 */
export function useTicketMessages(ticketId: string, enableRealtime = true) {
  return useQuery({
    queryKey: ticketKeys.messages(ticketId),
    queryFn: () => TicketService.getTicketMessages(ticketId),
    enabled: !!ticketId,
    refetchInterval: enableRealtime ? 5000 : false, // Actualizar cada 5 segundos si está habilitado
    refetchIntervalInBackground: false,
  });
}

/**
 * Hook para obtener estadísticas de tickets
 */
export function useTicketStats() {
  return useQuery({
    queryKey: ticketKeys.stats(),
    queryFn: () => TicketService.getTicketStats(),
    staleTime: 60000, // 1 minuto
  });
}

/**
 * Hook para crear un ticket
 */
export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTicketDto) => TicketService.createTicket(data),
    onSuccess: () => {
      // Invalidar lista de tickets para refrescar
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ticketKeys.stats() });
    },
  });
}

/**
 * Hook para actualizar un ticket
 */
export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTicketDto }) =>
      TicketService.updateTicket(id, data),
    onSuccess: (updatedTicket) => {
      // Actualizar cache del ticket específico
      queryClient.setQueryData(ticketKeys.detail(updatedTicket.id), updatedTicket);
      // Invalidar lista de tickets
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ticketKeys.stats() });
    },
  });
}

/**
 * Hook para resolver un ticket
 */
export function useResolveTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => TicketService.resolveTicket(id),
    onSuccess: (updatedTicket) => {
      queryClient.setQueryData(ticketKeys.detail(updatedTicket.id), updatedTicket);
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ticketKeys.stats() });
    },
  });
}

/**
 * Hook para cerrar un ticket
 */
export function useCloseTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => TicketService.closeTicket(id),
    onSuccess: (updatedTicket) => {
      queryClient.setQueryData(ticketKeys.detail(updatedTicket.id), updatedTicket);
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ticketKeys.stats() });
    },
  });
}

/**
 * Hook para agregar un mensaje a un ticket
 */
export function useAddMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, data }: { ticketId: string; data: AddMessageDto }) =>
      TicketService.addMessage(ticketId, data),
    onSuccess: (_, variables) => {
      // Invalidar mensajes del ticket
      queryClient.invalidateQueries({ queryKey: ticketKeys.messages(variables.ticketId) });
      // Invalidar detalle del ticket (puede haber cambiado updatedAt)
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(variables.ticketId) });
    },
  });
}

/**
 * Hook para asignar un ticket
 */
export function useAssignTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, agentId }: { id: string; agentId: string }) =>
      TicketService.assignTicket(id, agentId),
    onSuccess: (updatedTicket) => {
      queryClient.setQueryData(ticketKeys.detail(updatedTicket.id), updatedTicket);
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ticketKeys.stats() });
    },
  });
}
