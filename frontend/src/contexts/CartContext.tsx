'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { CartItem, Product } from '@/types'

interface CartState {
  items: CartItem[]
  total: number
  itemCount: number
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { productId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] }

interface CartContextType extends CartState {
  addItem: (_product: Product, _quantity?: number) => void
  removeItem: (_productId: string) => void
  updateQuantity: (_productId: string, _quantity: number) => void
  clearCart: () => void
  getItemQuantity: (_productId: string) => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity } = action.payload
      const existingItemIndex = state.items.findIndex(item => item.product.id === product.id)
      
      let newItems: CartItem[]
      if (existingItemIndex >= 0) {
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      } else {
        newItems = [...state.items, { product, quantity }]
      }
      
      const total = newItems.reduce((sum, item) => sum + (item.product.our_price * item.quantity), 0)
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0)
      
      return { items: newItems, total, itemCount }
    }
    
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.product.id !== action.payload.productId)
      const total = newItems.reduce((sum, item) => sum + (item.product.our_price * item.quantity), 0)
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0)
      
      return { items: newItems, total, itemCount }
    }
    
    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload
      
      if (quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: { productId } })
      }
      
      const newItems = state.items.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
      
      const total = newItems.reduce((sum, item) => sum + (item.product.our_price * item.quantity), 0)
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0)
      
      return { items: newItems, total, itemCount }
    }
    
    case 'CLEAR_CART':
      return { items: [], total: 0, itemCount: 0 }
    
    case 'LOAD_CART': {
      const items = action.payload
      const total = items.reduce((sum, item) => sum + (item.product.our_price * item.quantity), 0)
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
      
      return { items, total, itemCount }
    }
    
    default:
      return state
  }
}

const CART_STORAGE_KEY = 'technovastore_cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    itemCount: 0,
  })

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY)
        if (savedCart) {
          const cartItems = JSON.parse(savedCart) as CartItem[]
          dispatch({ type: 'LOAD_CART', payload: cartItems })
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items))
      } catch (error) {
        console.error('Error saving cart to localStorage:', error)
      }
    }
  }, [state.items])

  const addItem = (product: Product, quantity = 1) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity } })
  }

  const removeItem = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId } })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } })
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  const getItemQuantity = (productId: string) => {
    const item = state.items.find(item => item.product.id === productId)
    return item ? item.quantity : 0
  }

  const value: CartContextType = {
    ...state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemQuantity,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}