import React from 'react'
import { render, screen } from '@testing-library/react'
import { ShoppingCart } from '@/commerce/components/cart/ShoppingCart'
import { Product } from '@/types'

// Mock de useCartStore
const mockUseCartStore = jest.fn()
jest.mock('@/commerce/store/cart.store', () => ({
  useCartStore: (selector?: (state: any) => any) => {
    const state = mockUseCartStore()
    return selector ? selector(state) : state
  },
}))

// Mock product for testing
const mockProduct: Product = {
  id: '1',
  sku: 'TEST-001',
  name: 'Test Product',
  description: 'A test product',
  category: 'Electronics',
  subcategory: 'Phones',
  brand: 'TestBrand',
  specifications: {},
  images: ['test-image.jpg'],
  providers: [],
  our_price: 99.99,
  markup_percentage: 20,
  is_active: true,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
}

describe('ShoppingCart', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should show empty cart message when no items', () => {
    mockUseCartStore.mockReturnValue({
      items: [],
      total: 0,
      itemCount: 0,
      addItem: jest.fn(),
      removeItem: jest.fn(),
      updateQuantity: jest.fn(),
      clearCart: jest.fn(),
      getTotalPrice: jest.fn(() => 0),
    })

    render(<ShoppingCart />)

    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument()
    expect(screen.getByText('Añade algunos productos para comenzar tu compra')).toBeInTheDocument()
    expect(screen.getByText('Explorar Productos')).toBeInTheDocument()
  })

  it('should show cart summary when showCheckoutButton is true', () => {
    mockUseCartStore.mockReturnValue({
      items: [],
      total: 0,
      itemCount: 0,
      addItem: jest.fn(),
      removeItem: jest.fn(),
      updateQuantity: jest.fn(),
      clearCart: jest.fn(),
      getTotalPrice: jest.fn(() => 0),
    })

    render(<ShoppingCart showCheckoutButton={true} />)

    expect(screen.getByText('Explorar Productos')).toBeInTheDocument()
  })

  it('should show cart summary when showCheckoutButton is false', () => {
    mockUseCartStore.mockReturnValue({
      items: [],
      total: 0,
      itemCount: 0,
      addItem: jest.fn(),
      removeItem: jest.fn(),
      updateQuantity: jest.fn(),
      clearCart: jest.fn(),
      getTotalPrice: jest.fn(() => 0),
    })

    render(<ShoppingCart showCheckoutButton={false} />)

    expect(screen.getByText('Explorar Productos')).toBeInTheDocument()
  })
})
