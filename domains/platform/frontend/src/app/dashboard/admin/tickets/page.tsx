'use client';

/**
 * Página de gestión de tickets de soporte para administradores
 * Visualiza y responde tickets creados por clientes
 */

import { useState } from 'react';
import { TicketList } from '@/features/tickets/TicketList';
import { TicketDetail } from '@/features/tickets/TicketDetail';
import { Ticket, MessageSquare } from 'lucide-react';

export default function AdminTicketsPage() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <MessageSquare className="w-8 h-8 text-blue-600" />
                Gestión de Tickets
              </h1>
              <p className="mt-2 text-gray-600">
                Visualiza y responde las solicitudes de soporte de los clientes
              </p>
            </div>
            {/* Badge de información */}
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <Ticket className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Panel de Administración
              </span>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        {selectedTicketId ? (
          <TicketDetail
            ticketId={selectedTicketId}
            onBack={() => setSelectedTicketId(null)}
          />
        ) : (
          <TicketList onTicketClick={setSelectedTicketId} />
        )}
      </div>
    </div>
  );
}
