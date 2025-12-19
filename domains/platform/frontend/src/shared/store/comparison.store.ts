/**
 * Store de Zustand para gestionar la comparación de productos
 * Permite comparar hasta 5 productos simultáneamente
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product } from '@/types'

interface ComparisonState {
  products: Product[]
  isOpen: boolean
  lastInteraction: number
  addProduct: (product: Product) => void
  removeProduct: (productId: string) => void
  clearAll: () => void
  toggleModal: () => void
  openModal: () => void
  closeModal: () => void
  canAddMore: () => boolean
  notifyInteraction: () => void
}

const MAX_PRODUCTS = 5

export const useComparisonStore = create<ComparisonState>()(
  persist(
    (set, get) => ({
      products: [],
      isOpen: false,
      lastInteraction: 0,

      addProduct: (product) => {
        const { products } = get()
        
        // No agregar si ya está en la comparación
        if (products.some(p => p.id === product.id)) {
          return
        }

        // No agregar si ya hay 5 productos
        if (products.length >= MAX_PRODUCTS) {
          return
        }

        set({ products: [...products, product], lastInteraction: Date.now() })
      },

      removeProduct: (productId) => {
        set((state) => ({
          products: state.products.filter(p => p.id !== productId),
          lastInteraction: Date.now()
        }))
      },

      clearAll: () => {
        set({ products: [], isOpen: false, lastInteraction: Date.now() })
      },

      toggleModal: () => {
        set((state) => ({ isOpen: !state.isOpen, lastInteraction: Date.now() }))
      },

      openModal: () => {
        set({ isOpen: true, lastInteraction: Date.now() })
      },

      closeModal: () => {
        set({ isOpen: false })
      },

      canAddMore: () => {
        return get().products.length < MAX_PRODUCTS
      },

      notifyInteraction: () => {
        set({ lastInteraction: Date.now() })
      }
    }),
    {
      name: 'technovastore-comparison'
    }
  )
)
