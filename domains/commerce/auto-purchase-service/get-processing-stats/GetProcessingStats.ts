/**
 * Caso de Uso: Obtener Estadísticas de Procesamiento
 * 
 * Obtiene estadísticas actuales del sistema de auto-compra:
 * - Número de compras activas
 * - Máximo de compras concurrentes permitidas
 * - Estado de manejo de confirmaciones
 */

export interface ProcessingStats {
  activePurchases: number;
  maxConcurrent: number;
  enableConfirmationHandling: boolean;
}

export class GetProcessingStats {
  constructor(
    private activePurchases: Set<number>,
    private maxConcurrentPurchases: number,
    private enableConfirmationHandling: boolean
  ) {}

  /**
   * Obtiene las estadísticas actuales de procesamiento
   */
  execute(): ProcessingStats {
    return {
      activePurchases: this.activePurchases.size,
      maxConcurrent: this.maxConcurrentPurchases,
      enableConfirmationHandling: this.enableConfirmationHandling
    };
  }
}
