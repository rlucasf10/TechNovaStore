/**
 * Exportaciones centralizadas de stores compartidos
 * 
 * NOTA: Los stores específicos de features están en sus respectivas carpetas:
 * - Auth: @/customer/store/auth.store
 * - Cart: @/commerce/store/cart.store
 * - Chat: @/support/store/chat.store
 */

export { useThemeStore } from './theme.store';
export type { Theme } from './theme.store';

export { useNotificationStore } from './notification.store';
export type { Notification, NotificationType } from './notification.store';

export { useComparisonStore } from './comparison.store';

export { useWishlistStore } from './wishlist.store';
