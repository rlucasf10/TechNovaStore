/**
 * Store del Carrito de Compras con Zustand
 * 
 * Maneja el estado del carrito:
 * - Items del carrito
 * - Cantidades
 * - Totales
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
}

interface CartState {
  // Estado
  items: CartItem[];
  
  // Acciones
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Getters computados
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItem: (productId: string) => CartItem | undefined;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      items: [],
      
      // Acciones
      addItem: (item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
        const items = get().items;
        const existingItem = items.find((i: CartItem) => i.productId === item.productId);
        
        if (existingItem) {
          // Si ya existe, incrementar cantidad
          set({
            items: items.map((i: CartItem) =>
              i.productId === item.productId
                ? { ...i, quantity: Math.min(i.quantity + quantity, i.maxQuantity || 99) }
                : i
            ),
          });
        } else {
          // Si no existe, agregar nuevo item
          set({
            items: [...items, { ...item, quantity }],
          });
        }
      },
      
      removeItem: (productId: string) => {
        set({
          items: get().items.filter((i: CartItem) => i.productId !== productId),
        });
      },
      
      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        
        set({
          items: get().items.map((i: CartItem) =>
            i.productId === productId
              ? { ...i, quantity: Math.min(quantity, i.maxQuantity || 99) }
              : i
          ),
        });
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      // Getters
      getTotalItems: () => {
        return get().items.reduce((total: number, item: CartItem) => total + item.quantity, 0);
      },
      
      getTotalPrice: () => {
        return get().items.reduce((total: number, item: CartItem) => total + (item.price * item.quantity), 0);
      },
      
      getItem: (productId: string) => {
        return get().items.find((i: CartItem) => i.productId === productId);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
