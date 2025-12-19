/**
 * Página de Detalles de Campaña
 * 
 * Muestra los detalles completos de una campaña y permite acciones:
 * - Activar Ahora (para campañas programadas)
 * - Desactivar (para campañas activas)
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { campaignService } from '@/shared/services';
import type { Campaign, CampaignStatus } from '@/shared/types';
import { Badge, Loading } from '@/shared/components/ui';

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Cargar campaña
  useEffect(() => {
    loadCampaign();
  }, [campaignId]);

  const loadCampaign = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await campaignService.getCampaign(campaignId);
      setCampaign(data);
    } catch (err) {
      setError('Error al cargar la campaña. Por favor, intenta de nuevo.');
      console.error('Error loading campaign:', err);
    } finally {
      setLoading(false);
    }
  };

  // Determinar el estado de una campaña
  const getCampaignStatus = (campaign: Campaign): CampaignStatus => {
    const now = new Date();
    const startDate = new Date(campaign.startDate);
    const endDate = new Date(campaign.endDate);

    if (campaign.isActive && now >= startDate && now <= endDate) {
      return 'active';
    } else if (now < startDate) {
      return 'scheduled';
    } else {
      return 'finished';
    }
  };

  // Obtener el badge según el estado
  const getStatusBadge = (status: CampaignStatus) => {
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

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Activar campaña ahora
  const handleActivateNow = async () => {
    if (!campaign) return;

    if (!confirm('¿Estás seguro de que quieres activar esta campaña ahora? Se aplicarán los descuentos a todos los productos elegibles.')) {
      return;
    }

    try {
      setActionLoading(true);
      const result = await campaignService.applyDiscounts(campaignId);
      alert(`Campaña activada exitosamente. ${result.productsAffected} productos afectados.`);
      await loadCampaign();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al activar la campaña. Por favor, intenta de nuevo.');
      console.error('Error activating campaign:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Desactivar campaña
  const handleDeactivate = async () => {
    if (!campaign) return;

    if (!confirm('¿Estás seguro de que quieres desactivar esta campaña? Se removerán todos los descuentos aplicados.')) {
      return;
    }

    try {
      setActionLoading(true);
      const result = await campaignService.removeDiscounts(campaignId);
      alert(`Campaña desactivada exitosamente. ${result.productsRestored} productos restaurados.`);
      await loadCampaign();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al desactivar la campaña. Por favor, intenta de nuevo.');
      console.error('Error deactivating campaign:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading size="lg" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-lg mb-4">{error || 'Campaña no encontrada'}</p>
        <Link
          href="/dashboard/admin/campaigns"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Volver a Campañas
        </Link>
      </div>
    );
  }

  const status = getCampaignStatus(campaign);

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/admin/campaigns"
          className="text-blue-600 hover:text-blue-700 font-medium mb-2 inline-block"
        >
          ← Volver a Campañas
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{campaign.name}</h2>
            <p className="text-gray-600 mt-1">{campaign.slug}</p>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(status)}
            <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-semibold rounded">
              Prioridad: {campaign.priority}
            </span>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h3>
        <div className="flex items-center space-x-4">
          {/* Editar (solo si no ha iniciado) */}
          {status === 'scheduled' && (
            <Link
              href={`/dashboard/admin/campaigns/${campaign.id}/edit`}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              ✏️ Editar Campaña
            </Link>
          )}

          {/* Activar ahora (solo si está programada) */}
          {status === 'scheduled' && (
            <button
              onClick={handleActivateNow}
              disabled={actionLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Activando...' : '▶️ Activar Ahora'}
            </button>
          )}

          {/* Desactivar (solo si está activa) */}
          {status === 'active' && (
            <button
              onClick={handleDeactivate}
              disabled={actionLoading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Desactivando...' : '⏸️ Desactivar'}
            </button>
          )}

          {/* Ver Analytics */}
          <Link
            href={`/dashboard/admin/campaigns/${campaign.id}/analytics`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            📊 Ver Analytics
          </Link>
        </div>
      </div>

      {/* Información General */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información General</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Fecha de Inicio</p>
            <p className="text-base font-medium text-gray-900">{formatDate(campaign.startDate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Fecha de Fin</p>
            <p className="text-base font-medium text-gray-900">{formatDate(campaign.endDate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Estado</p>
            <p className="text-base font-medium text-gray-900">
              {campaign.isActive ? 'Activa' : 'Inactiva'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Descuentos Aplicados</p>
            <p className="text-base font-medium text-gray-900">
              {campaign.discountsApplied ? 'Sí' : 'No'}
            </p>
          </div>
          {campaign.appliedAt && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Aplicados el</p>
              <p className="text-base font-medium text-gray-900">{formatDate(campaign.appliedAt)}</p>
            </div>
          )}
          {campaign.deactivatedAt && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Desactivados el</p>
              <p className="text-base font-medium text-gray-900">{formatDate(campaign.deactivatedAt)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Reglas de Descuento */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reglas de Descuento</h3>
        
        {/* Descuento Global */}
        {campaign.discountRules.global && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Descuento Global</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-blue-700">Tipo:</p>
                <p className="font-medium text-blue-900">
                  {campaign.discountRules.global.type === 'percentage' ? 'Porcentaje' : 'Cantidad Fija'}
                </p>
              </div>
              <div>
                <p className="text-blue-700">Valor:</p>
                <p className="font-medium text-blue-900">
                  {campaign.discountRules.global.value}
                  {campaign.discountRules.global.type === 'percentage' ? '%' : '€'}
                </p>
              </div>
              {campaign.discountRules.global.maxDiscount && (
                <div>
                  <p className="text-blue-700">Descuento Máximo:</p>
                  <p className="font-medium text-blue-900">
                    {campaign.discountRules.global.maxDiscount}€
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Descuentos por Categoría */}
        {campaign.discountRules.categories && Object.keys(campaign.discountRules.categories).length > 0 && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="text-sm font-semibold text-green-900 mb-2">Descuentos por Categoría</h4>
            <div className="space-y-2">
              {Object.entries(campaign.discountRules.categories).map(([category, rule]) => (
                <div key={category} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-green-900">{category}</span>
                  <span className="text-green-700">
                    {rule.value}{rule.type === 'percentage' ? '%' : '€'}
                    {rule.maxDiscount && ` (máx: ${rule.maxDiscount}€)`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Descuentos por Producto */}
        {campaign.discountRules.products && Object.keys(campaign.discountRules.products).length > 0 && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="text-sm font-semibold text-purple-900 mb-2">Descuentos por Producto</h4>
            <div className="space-y-2">
              {Object.entries(campaign.discountRules.products).map(([productId, rule]) => (
                <div key={productId} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-purple-900">{productId}</span>
                  <span className="text-purple-700">
                    {rule.value}{rule.type === 'percentage' ? '%' : '€'}
                    {rule.maxDiscount && ` (máx: ${rule.maxDiscount}€)`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Configuración de Frontend */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Frontend</h3>
        
        {/* Banner Promocional */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Banner Promocional</h4>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded">
            {campaign.frontendConfig.promoBanner.messages.map((msg, idx) => (
              <p key={idx} className="text-sm text-gray-700">
                {msg.icon} {msg.text}
              </p>
            ))}
          </div>
        </div>

        {/* Hero Section */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Hero Section</h4>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-2">
            <p className="text-sm"><strong>Título:</strong> {campaign.frontendConfig.hero.title}</p>
            <p className="text-sm"><strong>Subtítulo:</strong> {campaign.frontendConfig.hero.subtitle}</p>
            <p className="text-sm"><strong>CTA:</strong> {campaign.frontendConfig.hero.ctaText}</p>
          </div>
        </div>

        {/* Sección de Ofertas */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Sección de Ofertas</h4>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-2">
            <p className="text-sm"><strong>Título:</strong> {campaign.frontendConfig.dealsSection.title}</p>
            <p className="text-sm"><strong>Subtítulo:</strong> {campaign.frontendConfig.dealsSection.subtitle}</p>
            <p className="text-sm"><strong>Badge:</strong> {campaign.frontendConfig.dealsSection.badge}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
