/**
 * Services - Servicios de API
 * 
 * Capa de abstracción para comunicación con el backend
 * 
 * NOTA: Los servicios específicos de features están en sus respectivas carpetas:
 * - Auth: @/customer/services/auth.service
 * - Products: @/catalog/services/product.service
 * - Cart: @/commerce/services/cart.service
 * - Search: @/catalog/services/search.service
 * - Orders: @/services/orderService (servicio compartido)
 */

// Servicios compartidos
export { orderService } from './orderService'
export { chatService } from './chatService'
export { recommenderService } from './recommenderService'
export { campaignService } from './campaignService'
export { shipmentService } from './shipmentService'
export { wishlistService } from './wishlistService'
export { reviewService } from './reviewService'

// Este archivo exporta servicios compartidos
// Para importar servicios de features, usa los exports de cada feature:
// import { authService } from '@/customer'
// import { productService } from '@/catalog'
// import { cartService } from '@/commerce'
