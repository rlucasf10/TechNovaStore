'use client';

/**
 * Componente de detalle de ticket con sistema de mensajería
 */

import { useState } from 'react';
import { useTicket, useTicketMessages, useAddMessage, useUpdateTicket, useResolveTicket, useCloseTicket, useAssignTicket } from '@/hooks/useTickets';
import type { TicketStatus, TicketPriority, AddMessageDto } from '@/types/ticket.types';
import {
  ArrowLeft,
  Send,
  Paperclip,
  Clock,
  User,
  Tag,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  UserPlus,
} from 'lucide-react';

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Abierto',
  in_progress: 'En Progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

interface TicketDetailProps {
  ticketId: string;
  onBack?: () => void;
}

export function TicketDetail({ ticketId, onBack }: TicketDetailProps) {
  const [message, setMessage] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [agentId, setAgentId] = useState('');

  const { data: ticket, isLoading: ticketLoading, error: ticketError } = useTicket(ticketId);
  const { data: messages, isLoading: messagesLoading } = useTicketMessages(ticketId);
  const addMessageMutation = useAddMessage();
  const updateTicketMutation = useUpdateTicket();
  const resolveTicketMutation = useResolveTicket();
  const closeTicketMutation = useCloseTicket();
  const assignTicketMutation = useAssignTicket();

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const messageData: AddMessageDto = {
      message: message.trim(),
    };

    try {
      await addMessageMutation.mutateAsync({ ticketId, data: messageData });
      setMessage('');
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  };

  const handleUpdateStatus = async (status: TicketStatus) => {
    try {
      await updateTicketMutation.mutateAsync({
        id: ticketId,
        data: { status },
      });
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  };

  const handleUpdatePriority = async (priority: TicketPriority) => {
    try {
      await updateTicketMutation.mutateAsync({
        id: ticketId,
        data: { priority },
      });
    } catch (error) {
      console.error('Error al actualizar prioridad:', error);
    }
  };

  const handleResolve = async () => {
    try {
      await resolveTicketMutation.mutateAsync(ticketId);
    } catch (error) {
      console.error('Error al resolver ticket:', error);
    }
  };

  const handleClose = async () => {
    try {
      await closeTicketMutation.mutateAsync(ticketId);
    } catch (error) {
      console.error('Error al cerrar ticket:', error);
    }
  };

  const handleAssign = async () => {
    if (!agentId.trim()) return;
    
    try {
      await assignTicketMutation.mutateAsync({ id: ticketId, agentId: agentId.trim() });
      setShowAssignModal(false);
      setAgentId('');
    } catch (error) {
      console.error('Error al asignar ticket:', error);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (ticketLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (ticketError || !ticket) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar ticket</h3>
          <p className="text-gray-600 mb-4">
            {ticketError instanceof Error ? ticketError.message : 'Ha ocurrido un error'}
          </p>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Volver
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-mono text-gray-500">#{ticket.id.slice(0, 8)}</span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-600">{formatDate(ticket.createdAt)}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">Actualización en tiempo real</span>
            </div>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="flex items-center gap-2">
          {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
            <button
              onClick={handleResolve}
              disabled={resolveTicketMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resolveTicketMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Resolver
            </button>
          )}
          {ticket.status === 'resolved' && (
            <button
              onClick={handleClose}
              disabled={closeTicketMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {closeTicketMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              Cerrar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal - Mensajes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Descripción inicial */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-900">{ticket.userName}</span>
                  <span className="text-sm text-gray-500">{ticket.userEmail}</span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                <div className="mt-3 text-sm text-gray-500">
                  {formatDate(ticket.createdAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Mensajes */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Conversación</h2>
            {messagesLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : messages && messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`bg-white p-4 rounded-lg border ${
                      msg.isInternal ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.userRole === 'customer' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        <User className={`w-5 h-5 ${
                          msg.userRole === 'customer' ? 'text-blue-600' : 'text-purple-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-gray-900">{msg.userName}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {msg.userRole === 'customer' ? 'Cliente' : msg.userRole === 'support' ? 'Soporte' : 'Admin'}
                          </span>
                          {msg.isInternal && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                              Nota interna
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                        <div className="mt-2 text-sm text-gray-500">
                          {formatDate(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay mensajes aún
              </div>
            )}
          </div>

          {/* Input de mensaje */}
          {ticket.status !== 'closed' && (
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe tu mensaje..."
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="flex items-center justify-between mt-3">
                <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <Paperclip className="w-4 h-4" />
                  Adjuntar archivo
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || addMessageMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addMessageMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Enviar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Información del ticket */}
        <div className="space-y-4">
          {/* Estado */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Estado</h3>
            <div className="space-y-2">
              {(Object.keys(STATUS_LABELS) as TicketStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => handleUpdateStatus(status)}
                  disabled={updateTicketMutation.isPending}
                  className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    ticket.status === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>

          {/* Prioridad */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Prioridad</h3>
            <div className="space-y-2">
              {(Object.keys(PRIORITY_LABELS) as TicketPriority[]).map((priority) => (
                <button
                  key={priority}
                  onClick={() => handleUpdatePriority(priority)}
                  disabled={updateTicketMutation.isPending}
                  className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    ticket.priority === priority
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {PRIORITY_LABELS[priority]}
                </button>
              ))}
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Información</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Tag className="w-4 h-4" />
                <span>Categoría: {ticket.category}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Creado: {formatDate(ticket.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Actualizado: {formatDate(ticket.updatedAt)}</span>
              </div>
              {ticket.assignedToName ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-4 h-4" />
                  <span>Asignado a: {ticket.assignedToName}</span>
                </div>
              ) : (
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Asignar ticket
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de asignación */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setShowAssignModal(false)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Asignar Ticket</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="agentId" className="block text-sm font-medium text-gray-700 mb-2">
                    ID del Agente
                  </label>
                  <input
                    type="text"
                    id="agentId"
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value)}
                    placeholder="Ingresa el ID del agente"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAssign}
                    disabled={!agentId.trim() || assignTicketMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {assignTicketMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Asignando...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Asignar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
