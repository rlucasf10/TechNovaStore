export interface OrderForDelayCheck {
  orderId: string;
  customerEmail: string;
  estimatedDelivery: Date;
  currentStatus: string;
  lastStatusUpdate: Date;
}

export class DelayDetector {
  private static readonly DELAY_THRESHOLD_HOURS = 24; // Consider delayed after 24 hours past estimated delivery
  private static readonly EXCLUDED_STATUSES = ['delivered', 'cancelled', 'refunded'];

  static isOrderDelayed(order: OrderForDelayCheck): boolean {
    const now = new Date();
    const estimatedDelivery = new Date(order.estimatedDelivery);
    
    // Check if order is past estimated delivery date
    const hoursPastDelivery = (now.getTime() - estimatedDelivery.getTime()) / (1000 * 60 * 60);
    
    return (
      hoursPastDelivery > this.DELAY_THRESHOLD_HOURS &&
      !this.EXCLUDED_STATUSES.includes(order.currentStatus.toLowerCase())
    );
  }

  static getDelayedOrders(orders: OrderForDelayCheck[]): OrderForDelayCheck[] {
    return orders.filter(order => this.isOrderDelayed(order));
  }

  static calculateNewEstimatedDelivery(originalDelivery: Date, delayReason?: string): Date {
    const newDelivery = new Date(originalDelivery);
    
    // Add different delays based on reason
    switch (delayReason?.toLowerCase()) {
      case 'weather':
        newDelivery.setDate(newDelivery.getDate() + 2);
        break;
      case 'customs':
        newDelivery.setDate(newDelivery.getDate() + 5);
        break;
      case 'provider_delay':
        newDelivery.setDate(newDelivery.getDate() + 3);
        break;
      case 'shipping_issue':
        newDelivery.setDate(newDelivery.getDate() + 4);
        break;
      default:
        newDelivery.setDate(newDelivery.getDate() + 3); // Default 3 days
    }
    
    return newDelivery;
  }

  static getDelayReasonMessage(reason?: string): string {
    const reasonMessages = {
      'weather': 'Condiciones meteorológicas adversas',
      'customs': 'Retraso en el procesamiento aduanero',
      'provider_delay': 'Retraso en el procesamiento del proveedor',
      'shipping_issue': 'Incidencia en el transporte',
      'high_demand': 'Alta demanda del producto',
      'inventory_issue': 'Problema de inventario del proveedor'
    };

    return reasonMessages[reason?.toLowerCase() as keyof typeof reasonMessages] || 
           'Retraso en el procesamiento del pedido';
  }
}