/**
 * Índice de Modelos
 * 
 * Exporta todos los modelos con sus asociaciones configuradas.
 * SIEMPRE importar modelos desde este archivo, no directamente.
 */

// Importar modelos
import { Order } from './Order';
import { OrderItem } from './OrderItem';
import { Invoice } from './Invoice';

// Importar función de inicialización de asociaciones
import { initializeAssociations } from './associations';

// Inicializar asociaciones cuando se importe este módulo
// Esto se ejecuta una sola vez gracias al sistema de módulos de Node.js
initializeAssociations();

// Exportar modelos
export { Order, OrderItem, Invoice };

// Exportar tipos
export type { OrderAttributes, OrderCreationAttributes, OrderStatus, PaymentStatus, Address } from './Order';
export type { OrderItemAttributes, OrderItemCreationAttributes } from './OrderItem';
export type { InvoiceAttributes, InvoiceCreationAttributes } from './Invoice';
