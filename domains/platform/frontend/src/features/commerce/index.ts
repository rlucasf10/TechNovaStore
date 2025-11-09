// Commerce Feature - Exports

// Components - Cart
export { ShoppingCart } from './components/cart/ShoppingCart'
export { CartItem } from './components/cart/CartItem'
export { CartDropdown } from './components/cart/CartDropdown'
export { AddToCartButton } from './components/cart/AddToCartButton'

// Components - Checkout
export { CheckoutSteps } from './components/checkout/CheckoutSteps'
export * from './components/checkout/OrderSummary'
export * from './components/checkout/ShippingForm'
export * from './components/checkout/PaymentForm'
export * from './components/checkout/OrderConfirmation'

// Hooks
export * from './hooks/useCart'
export * from './hooks/useOrders'

// Services (with explicit type exports to avoid conflicts)
export { 
  cartService,
  type CartItem as CartItemService,
  type Cart,
  type AddToCartRequest,
  type UpdateCartItemRequest
} from './services/cart.service'

// Store (with explicit type exports to avoid conflicts)
export { 
  useCartStore,
  type CartItem as CartItemStore
} from './store/cart.store'
