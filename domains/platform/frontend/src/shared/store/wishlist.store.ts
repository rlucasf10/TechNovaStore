/**
 * Store de Zustand para gestionar la lista de deseos (wishlist)
 * Sincroniza con el backend para usuarios autenticados
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product } from '@/types'

interface WishlistState {
  items: Product[]
  isLoading: boolean
  lastSync: number
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  clearAll: () => void
  setItems: (items: Product[]) => void
  isInWishlist: (productId: string) => boolean
  setLoading: (loading: boolean) => void
  updateLastSync: () => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      lastSync: 0,

      addItem: (product) => {
        const { items } = get()
        
        // No agregar si ya está en la wishlist
        if (items.some(p => p.id === product.id)) {
          return
        }

        set({ items: [...items, product], lastSync: Date.now() })
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter(p => p.id !== productId),
          lastSync: Date.now()
        }))
      },

      clearAll: () => {
        set({ items: [], lastSync: Date.now() })
      },

      setItems: (items) => {
        set({ items, lastSync: Date.now() })
      },

      isInWishlist: (productId) => {
        return get().items.some(p => p.id === productId)
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      updateLastSync: () => {
        set({ lastSync: Date.now() })
      }
    }),
    {
      name: 'technovastore-wishlist',
      // Solo persistir items, no el estado de loading
      partialize: (state) => ({ items: state.items, lastSync: state.lastSync })
    }
  )
)
