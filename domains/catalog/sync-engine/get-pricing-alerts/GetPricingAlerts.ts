/**
 * Caso de Uso: Obtener Alertas de Precios
 * 
 * Obtiene alertas generadas por el sistema de comparación de precios:
 * - Cambios significativos de precios
 * - Productos fuera de rango competitivo
 * - Oportunidades de ajuste de precios
 * - Alertas de competidores
 */

import { PriceComparator } from '../shared/pricing/PriceComparator';
import { PricingAlert } from '../shared/types/pricing';

export class GetPricingAlerts {
  constructor(private priceComparator: PriceComparator) {}

  /**
   * Obtiene las alertas de precios activas
   * @returns Lista de alertas de precios
   */
  execute(): PricingAlert[] {
    console.log('Getting pricing alerts...');

    const alerts = this.priceComparator.getAlerts();

    console.log(`Found ${alerts.length} pricing alerts`);

    return alerts;
  }
}

// Re-export para conveniencia
export type { PricingAlert };
