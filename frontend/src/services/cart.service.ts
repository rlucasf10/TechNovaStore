/**
 * Servicio de Carrito de Compras
 * 
 * Proporciona métodos para gestionar el carrito de compras:
 * - Obtener carrito actual
 * - Agregar items
 * - Actualizar cantidades
 * - Eliminar items
 * - Limpiar carrito
 * 
 * Integración con backend y persistencia en localStorage
 */

import { axiosInstance } from '@/lib/axios';
import { ApiResponse } from '@/types';

/**
 * Tipos del servicio de carrito
 */
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  sku: string;
  brand?: string;
  maxQuantity?: number;
  inStock: boolean;
  addedAt: Date;
}

export interface Cart {
  id: string;
  userId?: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  taxes: number;
  discount: number;
  total: number;
  itemCount: number;
  updatedAt: Date;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  productId: string;
  quantity: number;
}

/**
 * Clave para almacenamiento en localStorage
 */
const CART_STORAGE_KEY = 'technovastore_cart';

/**
 * Servicio de Carrito
 */
class CartService {
  /**
   * Obtener el carrito actual
   * Intenta obtener del backend si el usuario está autenticado,
   * de lo contrario usa localStorage
   */
  async getCart(): Promise<Cart> {
    try {
      // Intentar obtener del backend
      const response = await axiosInstance.get<ApiResponse<Cart>>('/api/cart');
      
      if (response.data.success && response.data.data) {
        // Sincronizar con localStorage
        this.saveToLocalStorage(response.data.data);
        return response.data.data;
      }
    } catch (error) {
      console.warn('No se pudo obtener el carrito del backend, usando localStorage:', error);
    }

    // Fallback a localStorage
    return this.getFromLocalStorage();
  }

  /**
   * Agregar un item al carrito
   */
  async addItem(request: AddToCartRequest): Promise<Cart> {
    try {
      // Intentar agregar en el backend
      const response = await axiosInstance.post<ApiResponse<Cart>>(
        '/api/cart/items',
        request
      );

      if (response.data.success && response.data.data) {
        // Sincronizar con localStorage
        this.saveToLocalStorage(response.data.data);
        return response.data.data;
      }
    } catch (error) {
      console.warn('No se pudo agregar al carrito en el backend, usando localStorage:', error);
    }

    // Fallback a localStorage
    return this.addItemToLocalStorage(request);
  }

  /**
   * Actualizar la cantidad de un item
   */
  async updateQuantity(request: UpdateCartItemRequest): Promise<Cart> {
    try {
      // Intentar actualizar en el backend
      const response = await axiosInstance.put<ApiResponse<Cart>>(
        `/api/cart/items/${request.productId}`,
        { quantity: request.quantity }
      );

      if (response.data.success && response.data.data) {
        // Sincronizar con localStorage
        this.saveToLocalStorage(response.data.data);
        return response.data.data;
      }
    } catch (error) {
      console.warn('No se pudo actualizar el carrito en el backend, usando localStorage:', error);
    }

    // Fallback a localStorage
    return this.updateQuantityInLocalStorage(request);
  }

  /**
   * Eliminar un item del carrito
   */
  async removeItem(productId: string): Promise<Cart> {
    try {
      // Intentar eliminar en el backend
      const response = await axiosInstance.delete<ApiResponse<Cart>>(
        `/api/cart/items/${productId}`
      );

      if (response.data.success && response.data.data) {
        // Sincronizar con localStorage
        this.saveToLocalStorage(response.data.data);
        return response.data.data;
      }
    } catch (error) {
      console.warn('No se pudo eliminar del carrito en el backend, usando localStorage:', error);
    }

    // Fallback a localStorage
    return this.removeItemFromLocalStorage(productId);
  }

  /**
   * Limpiar todo el carrito
   */
  async clearCart(): Promise<Cart> {
    try {
      // Intentar limpiar en el backend
      const response = await axiosInstance.delete<ApiResponse<Cart>>('/api/cart');

      if (response.data.success && response.data.data) {
        // Sincronizar con localStorage
        this.saveToLocalStorage(response.data.data);
        return response.data.data;
      }
    } catch (error) {
      console.warn('No se pudo limpiar el carrito en el backend, usando localStorage:', error);
    }

    // Fallback a localStorage
    return this.clearLocalStorage();
  }

  /**
   * Métodos privados para gestión de localStorage
   */

  private getFromLocalStorage(): Cart {
    if (typeof window === 'undefined') {
      return this.createEmptyCart();
    }

    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (!stored) {
        return this.createEmptyCart();
      }

      const cart = JSON.parse(stored) as Cart;
      
      // Convertir fechas de string a Date
      cart.updatedAt = new Date(cart.updatedAt);
      cart.items = cart.items.map(item => ({
        ...item,
        addedAt: new Date(item.addedAt),
      }));

      return cart;
    } catch (error) {
      console.error('Error al leer el carrito de localStorage:', error);
      return this.createEmptyCart();
    }
  }

  private saveToLocalStorage(cart: Cart): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('Error al guardar el carrito en localStorage:', error);
    }
  }

  private addItemToLocalStorage(request: AddToCartRequest): Cart {
    const cart = this.getFromLocalStorage();
    const existingItemIndex = cart.items.findIndex(
      item => item.productId === request.productId
    );

    if (existingItemIndex >= 0) {
      // Actualizar cantidad del item existente
      const existingItem = cart.items[existingItemIndex];
      const newQuantity = Math.min(
        existingItem.quantity + request.quantity,
        existingItem.maxQuantity || 99
      );
      cart.items[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
      };
    } else {
      // Agregar nuevo item (en producción, esto debería obtener los datos del producto)
      // Por ahora, creamos un item básico
      const newItem: CartItem = {
        id: `cart-item-${Date.now()}`,
        productId: request.productId,
        name: 'Producto', // Debería obtenerse del servicio de productos
        price: 0, // Debería obtenerse del servicio de productos
        quantity: request.quantity,
        image: '', // Debería obtenerse del servicio de productos
        sku: '', // Debería obtenerse del servicio de productos
        inStock: true,
        addedAt: new Date(),
      };
      cart.items.push(newItem);
    }

    // Recalcular totales
    this.recalculateTotals(cart);
    cart.updatedAt = new Date();

    // Guardar en localStorage
    this.saveToLocalStorage(cart);

    return cart;
  }

  private updateQuantityInLocalStorage(request: UpdateCartItemRequest): Cart {
    const cart = this.getFromLocalStorage();
    const itemIndex = cart.items.findIndex(
      item => item.productId === request.productId
    );

    if (itemIndex >= 0) {
      if (request.quantity <= 0) {
        // Eliminar item si la cantidad es 0 o negativa
        cart.items.splice(itemIndex, 1);
      } else {
        // Actualizar cantidad
        const item = cart.items[itemIndex];
        cart.items[itemIndex] = {
          ...item,
          quantity: Math.min(request.quantity, item.maxQuantity || 99),
        };
      }

      // Recalcular totales
      this.recalculateTotals(cart);
      cart.updatedAt = new Date();

      // Guardar en localStorage
      this.saveToLocalStorage(cart);
    }

    return cart;
  }

  private removeItemFromLocalStorage(productId: string): Cart {
    const cart = this.getFromLocalStorage();
    cart.items = cart.items.filter(item => item.productId !== productId);

    // Recalcular totales
    this.recalculateTotals(cart);
    cart.updatedAt = new Date();

    // Guardar en localStorage
    this.saveToLocalStorage(cart);

    return cart;
  }

  private clearLocalStorage(): Cart {
    const emptyCart = this.createEmptyCart();
    this.saveToLocalStorage(emptyCart);
    return emptyCart;
  }

  private createEmptyCart(): Cart {
    return {
      id: `cart-${Date.now()}`,
      items: [],
      subtotal: 0,
      shipping: 0,
      taxes: 0,
      discount: 0,
      total: 0,
      itemCount: 0,
      updatedAt: new Date(),
    };
  }

  private recalculateTotals(cart: Cart): void {
    // Calcular subtotal
    cart.subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Calcular número de items
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    // Calcular envío (lógica simplificada, debería venir del backend)
    cart.shipping = cart.subtotal > 0 ? (cart.subtotal >= 50 ? 0 : 5) : 0;

    // Calcular impuestos (21% IVA en España, debería venir del backend)
    cart.taxes = cart.subtotal * 0.21;

    // Calcular total
    cart.total = cart.subtotal + cart.shipping + cart.taxes - cart.discount;
  }
}

// Exportar instancia única del servicio
export const cartService = new CartService();
