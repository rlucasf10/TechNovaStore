/**
 * Página de Creación de Campaña
 * 
 * Formulario para crear una nueva campaña promocional.
 * Incluye editor visual de reglas de descuento y configuración de frontend.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { campaignService } from '@/shared/services';
import type { DiscountRules, DiscountRule, FrontendConfig } from '@/shared/types';

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado del formulario
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [priority, setPriority] = useState(1);

  // Reglas de descuento (se construyen dinámicamente con buildDiscountRules)
  const [globalDiscountType, setGlobalDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [globalDiscountValue, setGlobalDiscountValue] = useState('');
  const [globalMaxDiscount, setGlobalMaxDiscount] = useState('');

  // Configuración de frontend
  const [frontendConfig, setFrontendConfig] = useState<FrontendConfig>({
    promoBanner: {
      messages: [{ icon: '🎉', text: 'Nueva campaña disponible' }],
    },
    hero: {
      title: 'Ofertas Especiales',
      subtitle: 'Descuentos increíbles en productos seleccionados',
      ctaText: 'Ver Ofertas',
    },
    dealsSection: {
      title: 'Productos en Oferta',
      subtitle: 'Aprovecha estos descuentos',
      badge: 'OFERTA',
    },
  });

  // Generar slug automáticamente desde el nombre
  const handleNameChange = (value: string) => {
    setName(value);
    // Generar slug: lowercase, sin espacios, sin caracteres especiales
    const generatedSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setSlug(generatedSlug);
  };

  // Validar fechas
  const validateDates = (): boolean => {
    if (!startDate || !endDate) {
      setError('Las fechas de inicio y fin son obligatorias');
      return false;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start >= end) {
      setError('La fecha de inicio debe ser anterior a la fecha de fin');
      return false;
    }

    if (start < now) {
      setError('La fecha de inicio no puede estar en el pasado');
      return false;
    }

    return true;
  };

  // Construir reglas de descuento
  const buildDiscountRules = (): DiscountRules => {
    const rules: DiscountRules = {};

    if (globalDiscountValue) {
      const rule: DiscountRule = {
        type: globalDiscountType,
        value: parseFloat(globalDiscountValue),
      };

      if (globalMaxDiscount) {
        rule.maxDiscount = parseFloat(globalMaxDiscount);
      }

      rules.global = rule;
    }

    return rules;
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar fechas
    if (!validateDates()) {
      return;
    }

    // Validar nombre
    if (!name.trim()) {
      setError('El nombre de la campaña es obligatorio');
      return;
    }

    // Validar reglas de descuento
    const rules = buildDiscountRules();
    if (!rules.global && !rules.categories && !rules.products) {
      setError('Debes definir al menos una regla de descuento');
      return;
    }

    try {
      setLoading(true);

      const campaign = {
        name: name.trim(),
        slug: slug.trim(),
        startDate,
        endDate,
        priority,
        discountRules: rules,
        frontendConfig,
      };

      await campaignService.createCampaign(campaign);
      router.push('/dashboard/admin/campaigns');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear la campaña. Por favor, intenta de nuevo.');
      console.error('Error creating campaign:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Nueva Campaña</h2>
        <p className="text-gray-600 mt-1">
          Crea una nueva campaña promocional con descuentos personalizados
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Información Básica
          </h3>

          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Campaña *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Black Friday 2024"
                required
              />
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                Slug (URL amigable) *
              </label>
              <input
                type="text"
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="black-friday-2024"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Se genera automáticamente desde el nombre, pero puedes editarlo
              </p>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Inicio *
                </label>
                <input
                  type="datetime-local"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Fin *
                </label>
                <input
                  type="datetime-local"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Prioridad */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Prioridad
              </label>
              <input
                type="number"
                id="priority"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value))}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Mayor número = mayor prioridad. Si hay múltiples campañas activas, se mostrará la de mayor prioridad.
              </p>
            </div>
          </div>
        </div>

        {/* Reglas de Descuento */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Reglas de Descuento
          </h3>

          {/* Descuento Global */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Descuento Global</h4>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="discountType" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  id="discountType"
                  value={globalDiscountType}
                  onChange={(e) => setGlobalDiscountType(e.target.value as 'percentage' | 'fixed')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="percentage">Porcentaje (%)</option>
                  <option value="fixed">Cantidad Fija (€)</option>
                </select>
              </div>

              <div>
                <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700 mb-1">
                  Valor *
                </label>
                <input
                  type="number"
                  id="discountValue"
                  value={globalDiscountValue}
                  onChange={(e) => setGlobalDiscountValue(e.target.value)}
                  min="0"
                  max={globalDiscountType === 'percentage' ? '99' : undefined}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={globalDiscountType === 'percentage' ? '20' : '10.00'}
                  required
                />
              </div>

              <div>
                <label htmlFor="maxDiscount" className="block text-sm font-medium text-gray-700 mb-1">
                  Descuento Máximo (€)
                </label>
                <input
                  type="number"
                  id="maxDiscount"
                  value={globalMaxDiscount}
                  onChange={(e) => setGlobalMaxDiscount(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="100.00"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500">
              El descuento global se aplica a todos los productos que no tengan un descuento específico o de categoría.
            </p>
          </div>

          {/* Nota sobre descuentos por categoría y producto */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Los descuentos por categoría y por producto específico se pueden configurar después de crear la campaña, editándola desde la lista de campañas.
            </p>
          </div>
        </div>

        {/* Configuración de Frontend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Configuración de Frontend
          </h3>

          <div className="space-y-4">
            {/* Banner Promocional */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Banner Promocional</h4>
              <input
                type="text"
                value={frontendConfig.promoBanner.messages[0]?.text || ''}
                onChange={(e) => setFrontendConfig({
                  ...frontendConfig,
                  promoBanner: {
                    ...frontendConfig.promoBanner,
                    messages: [{ icon: '🎉', text: e.target.value }],
                  },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: ¡Ofertas especiales por tiempo limitado!"
              />
            </div>

            {/* Hero Section */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Hero Section</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  value={frontendConfig.hero.title}
                  onChange={(e) => setFrontendConfig({
                    ...frontendConfig,
                    hero: { ...frontendConfig.hero, title: e.target.value },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Título principal"
                />
                <input
                  type="text"
                  value={frontendConfig.hero.subtitle}
                  onChange={(e) => setFrontendConfig({
                    ...frontendConfig,
                    hero: { ...frontendConfig.hero, subtitle: e.target.value },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Subtítulo"
                />
                <input
                  type="text"
                  value={frontendConfig.hero.ctaText}
                  onChange={(e) => setFrontendConfig({
                    ...frontendConfig,
                    hero: { ...frontendConfig.hero, ctaText: e.target.value },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Texto del botón"
                />
              </div>
            </div>

            {/* Sección de Ofertas */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Sección de Ofertas</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  value={frontendConfig.dealsSection.title}
                  onChange={(e) => setFrontendConfig({
                    ...frontendConfig,
                    dealsSection: { ...frontendConfig.dealsSection, title: e.target.value },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Título de la sección"
                />
                <input
                  type="text"
                  value={frontendConfig.dealsSection.subtitle}
                  onChange={(e) => setFrontendConfig({
                    ...frontendConfig,
                    dealsSection: { ...frontendConfig.dealsSection, subtitle: e.target.value },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Subtítulo"
                />
                <input
                  type="text"
                  value={frontendConfig.dealsSection.badge}
                  onChange={(e) => setFrontendConfig({
                    ...frontendConfig,
                    dealsSection: { ...frontendConfig.dealsSection, badge: e.target.value },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Texto del badge"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando...' : 'Crear Campaña'}
          </button>
        </div>
      </form>
    </div>
  );
}
