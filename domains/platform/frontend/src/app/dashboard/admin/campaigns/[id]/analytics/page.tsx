/**
 * Página de Analytics de Campaña
 * 
 * Dashboard completo con métricas, gráficos y reportes de una campaña.
 * Incluye:
 * - Métricas clave en cards (productos, descuento promedio, ventas, ingresos)
 * - Tasa de conversión y ROI
 * - Gráficos de ventas diarias y categorías
 * - Tabla de productos más vendidos
 * - Actualización en tiempo real cada 30 segundos
 * - Exportación a PDF
 * - Link a Grafana
 * 
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.10
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { campaignService } from '@/shared/services';
import type { Campaign, CampaignReport, CampaignStatus } from '@/shared/types';
import { Badge, Loading } from '@/shared/components/ui';
import { MetricsCards } from './components/MetricsCards';
import { SalesChart } from './components/SalesChart';
import { CategoryChart } from './components/CategoryChart';
import { TopProductsTable } from './components/TopProductsTable';

// Intervalo de actualización en tiempo real (30 segundos)
const REFRESH_INTERVAL = 30000;

// URL de Grafana para métricas detalladas
const GRAFANA_BASE_URL = process.env.NEXT_PUBLIC_GRAFANA_URL || 'http://localhost:3013';

export default function CampaignAnalyticsPage() {
  const params = useParams();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [report, setReport] = useState<CampaignReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Referencia para el intervalo de actualización
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Determinar el estado de una campaña
  const getCampaignStatus = useCallback((campaign: Campaign): CampaignStatus => {
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
  }, []);

  // Cargar datos de la campaña y analytics
  const loadData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      // Cargar campaña y analytics en paralelo
      const [campaignData, analyticsData] = await Promise.all([
        campaignService.getCampaign(campaignId),
        campaignService.getCampaignAnalytics(campaignId),
      ]);

      setCampaign(campaignData);
      setReport(analyticsData);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Error al cargar los datos de analytics. Por favor, intenta de nuevo.');
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Configurar actualización en tiempo real para campañas activas
  useEffect(() => {
    if (campaign && getCampaignStatus(campaign) === 'active') {
      // Iniciar actualización automática cada 30 segundos
      refreshIntervalRef.current = setInterval(() => {
        loadData(false); // No mostrar loading en actualizaciones automáticas
      }, REFRESH_INTERVAL);
    }

    return () => {
      // Limpiar intervalo al desmontar o cuando cambie el estado
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [campaign, getCampaignStatus, loadData]);

  // Exportar reporte a PDF
  const handleExportPDF = async () => {
    if (!campaign || !report) return;

    try {
      setIsExporting(true);
      
      // Crear contenido HTML para el PDF
      const htmlContent = generatePDFContent(campaign, report);
      
      // Abrir ventana de impresión del navegador
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        
        // Esperar a que se cargue el contenido antes de imprimir
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert('Error al exportar el reporte. Por favor, intenta de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  // Generar contenido HTML para el PDF
  const generatePDFContent = (campaign: Campaign, report: CampaignReport): string => {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
      }).format(value);
    };

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Reporte de Campaña - ${campaign.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h1 { color: #1a56db; border-bottom: 2px solid #1a56db; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 30px; }
          .header { display: flex; justify-content: space-between; align-items: center; }
          .date { color: #6b7280; font-size: 14px; }
          .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
          .metric-card { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; }
          .metric-value { font-size: 24px; font-weight: bold; color: #1a56db; }
          .metric-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background: #f3f4f6; font-weight: 600; }
          .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Reporte de Campaña: ${campaign.name}</h1>
          <span class="date">Generado: ${new Date().toLocaleString('es-ES')}</span>
        </div>
        
        <p><strong>Período:</strong> ${formatDate(campaign.startDate)} - ${formatDate(campaign.endDate)}</p>
        <p><strong>Prioridad:</strong> ${campaign.priority}</p>
        
        <h2>Métricas Principales</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">${report.metrics.productsWithDiscount}</div>
            <div class="metric-label">Productos con Descuento</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${report.metrics.averageDiscountPercentage.toFixed(1)}%</div>
            <div class="metric-label">Descuento Promedio</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${report.metrics.totalUnitsSold || 0}</div>
            <div class="metric-label">Unidades Vendidas</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${formatCurrency(report.metrics.totalRevenue)}</div>
            <div class="metric-label">Ingresos Totales</div>
          </div>
        </div>
        
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">${(report.metrics.conversionRate * 100).toFixed(2)}%</div>
            <div class="metric-label">Tasa de Conversión</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${report.metrics.roi.toFixed(2)}%</div>
            <div class="metric-label">ROI</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${report.metrics.totalViews}</div>
            <div class="metric-label">Visualizaciones</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${report.metrics.totalClicks}</div>
            <div class="metric-label">Clics</div>
          </div>
        </div>
        
        <h2>Productos Más Vendidos</h2>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Unidades Vendidas</th>
              <th>Ingresos</th>
            </tr>
          </thead>
          <tbody>
            ${report.topProducts.slice(0, 10).map(product => `
              <tr>
                <td>${product.productName}</td>
                <td>${product.unitsSold}</td>
                <td>${formatCurrency(product.revenue)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>TechNovaStore - Campaign Manager Service</p>
          <p>Este reporte fue generado automáticamente</p>
        </div>
      </body>
      </html>
    `;
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
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
  const isActive = status === 'active';

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/dashboard/admin/campaigns/${campaignId}`}
          className="text-blue-600 hover:text-blue-700 font-medium mb-2 inline-block"
        >
          ← Volver a Detalles
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              📊 Analytics: {campaign.name}
            </h2>
            <p className="text-gray-600 mt-1">
              {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {getStatusBadge(status)}
            
            {/* Indicador de actualización en tiempo real */}
            {isActive && (
              <span className="flex items-center text-sm text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                En vivo
              </span>
            )}
          </div>
        </div>
        
        {/* Última actualización */}
        {lastUpdated && (
          <p className="text-sm text-gray-500 mt-2">
            Última actualización: {lastUpdated.toLocaleTimeString('es-ES')}
            {isActive && ' (actualización automática cada 30s)'}
          </p>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center space-x-4 mb-6">
        {/* Botón de exportar PDF */}
        <button
          onClick={handleExportPDF}
          disabled={isExporting || !report}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isExporting ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Exportando...
            </>
          ) : (
            <>📄 Exportar PDF</>
          )}
        </button>
        
        {/* Link a Grafana */}
        <a
          href={`${GRAFANA_BASE_URL}/d/campaigns/campaign-metrics?var-campaign_id=${campaignId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center"
        >
          📈 Ver en Grafana
        </a>
        
        {/* Botón de actualizar manualmente */}
        <button
          onClick={() => loadData(true)}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Contenido principal */}
      {report ? (
        <>
          {/* Métricas en Cards */}
          <MetricsCards metrics={report.metrics} />
          
          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Gráfico de ventas diarias */}
            <SalesChart dailyMetrics={report.dailyMetrics} />
            
            {/* Gráfico de categorías */}
            <CategoryChart categorySales={report.categorySales || []} />
          </div>
          
          {/* Tabla de productos más vendidos */}
          <div className="mt-6">
            <TopProductsTable products={report.topProducts} />
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 text-lg">
            No hay datos de analytics disponibles para esta campaña.
          </p>
          <p className="text-gray-400 mt-2">
            Los datos se generarán cuando la campaña esté activa y tenga ventas.
          </p>
        </div>
      )}
    </div>
  );
}
