/**
 * Barrel export para el módulo de Commerce
 */

// Tipos
export * from './types/checkout.types';
export type { CartItem } from './store/cart.store';
export type { Cart, AddToCartRequest, UpdateCartItemRequest, CartItem as CartItemService } from './services/cart.service';

// Servicios
export { checkoutService } from './services/checkout.service';
export { paymentService } from './services/payment.service';
export { cartService } from './services/cart.service';

// Store
export { useCartStore } from './store/cart.store';

// Hooks
export { useCart, useAddToCart } from './hooks/useCart';
export { useOrders } from './hooks/useOrders';

// Componentes - Checkout
export * from './components/checkout';

// Componentes - Cart
export * from './components/cart';
