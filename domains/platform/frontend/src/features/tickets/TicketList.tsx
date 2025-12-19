'use client';

/**
 * Componente de lista de tickets con filtros y búsqueda
 */

import { useState, useMemo } from 'react';
import { useTickets } from '@/hooks/useTickets';
import type { TicketFilters, TicketStatus, TicketPriority, TicketCategory } from '@/types/ticket.types';
import { Search, Filter, ChevronDown, Clock, AlertCircle } from 'lucide-react';

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

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  technical: 'Técnico',
  billing: 'Facturación',
  product: 'Producto',
  shipping: 'Envío',
  account: 'Cuenta',
  other: 'Otro',
};

const STATUS_COLORS: Record<TicketStatus, string> = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

interface TicketListProps {
  onTicketClick?: (ticketId: string) => void;
}

export function TicketList({ onTicketClick }: TicketListProps) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<TicketFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Obtener tickets con filtros
  const { data: tickets, isLoading, error } = useTickets(filters);

  // Filtrar y ordenar tickets
  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    // Asegurar que tickets sea un array
    let ticketsArray = Array.isArray(tickets) ? tickets : [];
    
    // Filtrar por búsqueda
    if (search) {
      const searchLower = search.toLowerCase();
      ticketsArray = ticketsArray.filter(
        (ticket) =>
          ticket.subject.toLowerCase().includes(searchLower) ||
          ticket.id.toLowerCase().includes(searchLower) ||
          ticket.userName.toLowerCase().includes(searchLower) ||
          ticket.userEmail.toLowerCase().includes(searchLower)
      );
    }

    // Ordenar tickets
    const sorted = [...ticketsArray].sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else {
        // Ordenar por prioridad: urgent > high > medium > low
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const priorityA = priorityOrder[a.priority];
        const priorityB = priorityOrder[b.priority];
        return sortOrder === 'desc' ? priorityB - priorityA : priorityA - priorityB;
      }
    });

    return sorted;
  }, [tickets, search, sortBy, sortOrder]);

  const handleStatusFilter = (status: TicketStatus) => {
    setFilters((prev) => {
      const currentStatuses = prev.status || [];
      const newStatuses = currentStatuses.includes(status)
        ? currentStatuses.filter((s) => s !== status)
        : [...currentStatuses, status];
      return { ...prev, status: newStatuses.length > 0 ? newStatuses : undefined };
    });
  };

  const handlePriorityFilter = (priority: TicketPriority) => {
    setFilters((prev) => {
      const currentPriorities = prev.priority || [];
      const newPriorities = currentPriorities.includes(priority)
        ? currentPriorities.filter((p) => p !== priority)
        : [...currentPriorities, priority];
      return { ...prev, priority: newPriorities.length > 0 ? newPriorities : undefined };
    });
  };

  const handleCategoryFilter = (category: TicketCategory) => {
    setFilters((prev) => {
      const currentCategories = prev.category || [];
      const newCategories = currentCategories.includes(category)
        ? currentCategories.filter((c) => c !== category)
        : [...currentCategories, category];
      return { ...prev, category: newCategories.length > 0 ? newCategories : undefined };
    });
  };

  const clearFilters = () => {
    setFilters({});
    setSearch('');
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

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar tickets</h3>
          <p className="text-gray-600">
            {error instanceof Error ? error.message : 'Ha ocurrido un error'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda, ordenamiento y filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por número, asunto, cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Ordenamiento */}
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'priority')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="date">Fecha</option>
            <option value="priority">Prioridad</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title={sortOrder === 'desc' ? 'Descendente' : 'Ascendente'}
          >
            {sortOrder === 'desc' ? '↓' : '↑'}
          </button>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Filter className="w-5 h-5" />
          Filtros
          <ChevronDown
            className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          {/* Filtros de estado */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Estado</h4>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STATUS_LABELS) as TicketStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusFilter(status)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filters.status?.includes(status)
                      ? STATUS_COLORS[status]
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>

          {/* Filtros de prioridad */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Prioridad</h4>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PRIORITY_LABELS) as TicketPriority[]).map((priority) => (
                <button
                  key={priority}
                  onClick={() => handlePriorityFilter(priority)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filters.priority?.includes(priority)
                      ? PRIORITY_COLORS[priority]
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {PRIORITY_LABELS[priority]}
                </button>
              ))}
            </div>
          </div>

          {/* Filtros de categoría */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Categoría</h4>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CATEGORY_LABELS) as TicketCategory[]).map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryFilter(category)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filters.category?.includes(category)
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {CATEGORY_LABELS[category]}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro por asignado */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Asignado a</h4>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters((prev) => ({ ...prev, assignedTo: undefined }))}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  !filters.assignedTo
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilters((prev) => ({ ...prev, assignedTo: 'unassigned' }))}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  filters.assignedTo === 'unassigned'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Sin asignar
              </button>
            </div>
          </div>

          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Lista de tickets */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay tickets</h3>
          <p className="text-gray-600">
            {search || Object.keys(filters).length > 0
              ? 'No se encontraron tickets con los filtros aplicados'
              : 'Aún no tienes tickets de soporte'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => onTicketClick?.(ticket.id)}
              className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-mono text-gray-500">#{ticket.id.slice(0, 8)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>
                      {STATUS_LABELS[ticket.status]}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
                      {PRIORITY_LABELS[ticket.priority]}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">{ticket.subject}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <span>{ticket.userName}</span>
                  <span className="text-gray-400">•</span>
                  <span>{CATEGORY_LABELS[ticket.category]}</span>
                  {ticket.assignedToName && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span>Asignado a: {ticket.assignedToName}</span>
                    </>
                  )}
                </div>
                <span>{formatDate(ticket.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
