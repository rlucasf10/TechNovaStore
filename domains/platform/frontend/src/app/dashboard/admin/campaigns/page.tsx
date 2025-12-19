/**
 * Página de Listado de Campañas
 * 
 * Muestra todas las campañas con filtros por estado y acciones.
 * Protegida por AdminRoute a través del layout.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { campaignService } from '@/shared/services';
import type { Campaign, CampaignStatus } from '@/shared/types';
import { Badge, Loading } from '@/shared/components/ui';
import { AnimatedModal } from '@/ui/AnimatedModal';

// Tipos para los modales de confirmación
type ConfirmAction = 'activate' | 'deactivate' | 'delete' | null;

interface ConfirmModalState {
  isOpen: boolean;
  action: ConfirmAction;
  campaignId: string | null;
  campaignName: string | null;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Estado del modal de confirmación
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    action: null,
    campaignId: null,
    campaignName: null,
  });

  // Cargar campañas
  useEffect(() => {
    loadCampaigns();
  }, [statusFilter]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await campaignService.getCampaigns({ status: statusFilter });
      
      // Verificar que la respuesta tenga la estructura correcta
      if (response && Array.isArray(response.data)) {
        setCampaigns(response.data);
      } else if (Array.isArray(response)) {
        // Si la respuesta es directamente un array
        setCampaigns(response);
      } else {
        console.error('Unexpected response format:', response);
        setCampaigns([]);
        setError('Formato de respuesta inesperado del servidor.');
      }
    } catch (err: any) {
      setError('Error al cargar las campañas. Por favor, intenta de nuevo.');
      console.error('Error loading campaigns:', err);
      console.error('Error details:', err.response?.data);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  // Determinar el estado de una campaña basado en fechas y estado de activación
  const getCampaignStatus = (campaign: Campaign): CampaignStatus => {
    const now = new Date();
    // Normalizar las fechas para comparar solo día/mes/año
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDate = new Date(campaign.startDate);
    const endDate = new Date(campaign.endDate);
    const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    // Si la campaña está marcada como activa (tiene descuentos aplicados)
    if (campaign.isActive || campaign.discountsApplied) {
      return 'active';
    }
    
    // Si la fecha actual está dentro del rango de la campaña
    if (today >= startDay && today <= endDay) {
      // Está en el rango pero no activada - podría activarse
      return 'scheduled'; // Tratamos como programada (pendiente de activar)
    }
    
    // Si aún no ha llegado la fecha de inicio
    if (today < startDay) {
      return 'scheduled';
    }
    
    // Si ya pasó la fecha de fin
    return 'finished';
  };

  // Verificar si una campaña puede ser activada (no está activa actualmente)
  const canActivate = (campaign: Campaign): boolean => {
    return !campaign.isActive && !campaign.discountsApplied;
  };

  // Verificar si una campaña puede ser desactivada (está activa actualmente)
  const canDeactivate = (campaign: Campaign): boolean => {
    return campaign.isActive || campaign.discountsApplied;
  };

  // Obtener el badge según el estado
  const getStatusBadge = (status: CampaignStatus, isCurrentlyActive: boolean = false) => {
    // Si está activa, mostrar badge especial
    if (isCurrentlyActive) {
      return (
        <Badge variant="success" className="animate-pulse">
          🟢 Activa
        </Badge>
      );
    }
    
    switch (status) {
      case 'active':
        return <Badge variant="success">Activa</Badge>;
      case 'scheduled':
        return <Badge variant="info">Programada</Badge>;
      case 'finished':
        return <Badge variant="secondary">Finalizada</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  // Filtrar campañas en el frontend según el estado seleccionado
  const filteredCampaigns = campaigns.filter((campaign) => {
    if (statusFilter === 'all') return true;
    const status = getCampaignStatus(campaign);
    return status === statusFilter;
  });

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Abrir modal de confirmación
  const openConfirmModal = (action: ConfirmAction, campaignId: string, campaignName: string) => {
    setConfirmModal({
      isOpen: true,
      action,
      campaignId,
      campaignName,
    });
  };

  // Cerrar modal de confirmación
  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      action: null,
      campaignId: null,
      campaignName: null,
    });
  };

  // Ejecutar acción confirmada
  const executeConfirmedAction = async () => {
    if (!confirmModal.campaignId || !confirmModal.action) return;

    try {
      setProcessingId(confirmModal.campaignId);
      setError(null);
      setSuccessMessage(null);

      switch (confirmModal.action) {
        case 'activate':
          const activateResult = await campaignService.applyDiscounts(confirmModal.campaignId);
          setSuccessMessage(
            `Campaña activada exitosamente. ${activateResult.productsAffected} productos afectados.`
          );
          break;

        case 'deactivate':
          const deactivateResult = await campaignService.removeDiscounts(confirmModal.campaignId);
          setSuccessMessage(
            `Campaña desactivada exitosamente. ${deactivateResult.productsRestored} productos restaurados.`
          );
          break;

        case 'delete':
          await campaignService.deleteCampaign(confirmModal.campaignId);
          setSuccessMessage('Campaña eliminada exitosamente.');
          break;
      }

      await loadCampaigns();
      closeConfirmModal();

      // Limpiar mensaje de éxito después de 5 segundos
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 
        `Error al ${confirmModal.action === 'activate' ? 'activar' : 
          confirmModal.action === 'deactivate' ? 'desactivar' : 'eliminar'} la campaña.`;
      setError(errorMessage);
      console.error(`Error ${confirmModal.action}ing campaign:`, err);
    } finally {
      setProcessingId(null);
    }
  };

  // Obtener configuración del modal según la acción
  const getModalConfig = () => {
    switch (confirmModal.action) {
      case 'activate':
        return {
          title: 'Activar Campaña',
          description: '¿Estás seguro de que quieres activar esta campaña ahora?',
          message: 'Esta acción aplicará los descuentos a todos los productos elegibles inmediatamente.',
          confirmText: 'Activar Ahora',
          confirmColor: 'bg-green-600 hover:bg-green-700',
          icon: (
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
        };

      case 'deactivate':
        return {
          title: 'Desactivar Campaña',
          description: '¿Estás seguro de que quieres desactivar esta campaña?',
          message: 'Esta acción removerá todos los descuentos aplicados y restaurará los precios originales de los productos.',
          confirmText: 'Desactivar',
          confirmColor: 'bg-orange-600 hover:bg-orange-700',
          icon: (
            <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
        };

      case 'delete':
        return {
          title: 'Eliminar Campaña',
          description: '¿Estás seguro de que quieres eliminar esta campaña?',
          message: 'Esta acción no se puede deshacer. Si la campaña está activa, se removerán todos los descuentos antes de eliminarla.',
          confirmText: 'Eliminar',
          confirmColor: 'bg-red-600 hover:bg-red-700',
          icon: (
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          ),
        };

      default:
        return {
          title: '',
          description: '',
          message: '',
          confirmText: 'Confirmar',
          confirmColor: 'bg-blue-600 hover:bg-blue-700',
          icon: null,
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading size="lg" />
      </div>
    );
  }

  const modalConfig = getModalConfig();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Campañas</h2>
          <p className="text-gray-600 mt-1">
            Gestiona las campañas promocionales de la tienda
          </p>
        </div>
        <Link
          href="/dashboard/admin/campaigns/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Nueva Campaña
        </Link>
      </div>

      {/* Mensaje de éxito */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {successMessage}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Filtrar por estado:</span>
          <div className="flex space-x-2">
            {(['all', 'active', 'scheduled', 'finished'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {status === 'all' ? 'Todas' : 
                 status === 'active' ? 'Activas' :
                 status === 'scheduled' ? 'Programadas' : 'Finalizadas'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Tabla de Campañas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {statusFilter === 'all' 
                ? 'No hay campañas disponibles' 
                : `No hay campañas ${statusFilter === 'active' ? 'activas' : statusFilter === 'scheduled' ? 'programadas' : 'finalizadas'}`}
            </p>
            {statusFilter === 'all' && (
              <Link
                href="/dashboard/admin/campaigns/new"
                className="inline-block mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Crear primera campaña →
              </Link>
            )}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Inicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Fin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prioridad
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCampaigns.map((campaign) => {
                const status = getCampaignStatus(campaign);
                const isCurrentlyActive = campaign.isActive || campaign.discountsApplied;

                return (
                  <tr 
                    key={campaign.id} 
                    className={`hover:bg-gray-50 ${isCurrentlyActive ? 'bg-green-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {isCurrentlyActive && (
                          <span className="mr-2 text-green-500" title="Campaña activa actualmente">
                            ●
                          </span>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {campaign.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {campaign.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(campaign.startDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(campaign.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(status, isCurrentlyActive)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded">
                        {campaign.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {/* Ver detalles */}
                      <Link
                        href={`/dashboard/admin/campaigns/${campaign.id}`}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        Ver
                      </Link>

                      {/* Editar (solo si no está activa) */}
                      {!isCurrentlyActive && (
                        <Link
                          href={`/dashboard/admin/campaigns/${campaign.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors"
                        >
                          Editar
                        </Link>
                      )}

                      {/* Activar ahora (disponible si no está activa) */}
                      {canActivate(campaign) && (
                        <button
                          onClick={() => openConfirmModal('activate', campaign.id, campaign.name)}
                          disabled={processingId === campaign.id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                          {processingId === campaign.id ? 'Procesando...' : 'Activar Ahora'}
                        </button>
                      )}

                      {/* Desactivar (disponible si está activa) */}
                      {canDeactivate(campaign) && (
                        <button
                          onClick={() => openConfirmModal('deactivate', campaign.id, campaign.name)}
                          disabled={processingId === campaign.id}
                          className="text-orange-600 hover:text-orange-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                          {processingId === campaign.id ? 'Procesando...' : 'Desactivar'}
                        </button>
                      )}

                      {/* Eliminar */}
                      <button
                        onClick={() => openConfirmModal('delete', campaign.id, campaign.name)}
                        disabled={processingId === campaign.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {processingId === campaign.id ? 'Procesando...' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Confirmación */}
      <AnimatedModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        title={modalConfig.title}
        description={modalConfig.description}
        size="md"
        animationType="scale"
      >
        <div className="space-y-4">
          {/* Icono y mensaje */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {modalConfig.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">
                {modalConfig.message}
              </p>
              {confirmModal.campaignName && (
                <p className="mt-2 text-sm font-medium text-gray-900">
                  Campaña: <span className="font-semibold">{confirmModal.campaignName}</span>
                </p>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={closeConfirmModal}
              disabled={processingId !== null}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={executeConfirmedAction}
              disabled={processingId !== null}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${modalConfig.confirmColor}`}
            >
              {processingId !== null ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Procesando...
                </span>
              ) : (
                modalConfig.confirmText
              )}
            </button>
          </div>
        </div>
      </AnimatedModal>
    </div>
  );
}
