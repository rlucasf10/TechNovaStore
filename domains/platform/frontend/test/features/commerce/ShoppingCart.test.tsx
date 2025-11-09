import React from 'react'
import { render, screen } from '@testing-library/react'
import { ShoppingCart } from '@/commerce/components/cart/ShoppingCart'
import { useCartStore } from '@/commerce/store/cart.store'
import { Product } from '@/types'

// Jest automáticamente usa los mocks de __mocks__/

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
    const mockState = {
      items: [],
      total: 0,
      itemCount: 0,
      addItem: jest.fn(),
      removeItem: jest.fn(),
      updateQuantity: jest.fn(),
      clearCart: jest.fn(),
      getTotalPrice: jest.fn(() => 0),
    };

    (useCartStore as jest.Mock).mockImplementation((selector?: any) => {
      if (selector) {
        return selector(mockState)
      }
      return mockState
    })

    render(<ShoppingCart />)

    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument()
    expect(screen.getByText('Añade algunos productos para comenzar tu compra')).toBeInTheDocument()
    expect(screen.getByText('Explorar Productos')).toBeInTheDocument()
  })

  it('should show cart summary when showCheckoutButton is true', () => {
    const mockState = {
      items: [],
      total: 0,
      itemCount: 0,
      addItem: jest.fn(),
      removeItem: jest.fn(),
      updateQuantity: jest.fn(),
      clearCart: jest.fn(),
      getTotalPrice: jest.fn(() => 0),
    };

    (useCartStore as jest.Mock).mockImplementation((selector?: any) => {
      if (selector) {
        return selector(mockState)
      }
      return mockState
    })

    render(<ShoppingCart showCheckoutButton={true} />)

    expect(screen.getByText('Explorar Productos')).toBeInTheDocument()
  })

  it('should show cart summary when showCheckoutButton is false', () => {
    const mockState = {
      items: [],
      total: 0,
      itemCount: 0,
      addItem: jest.fn(),
      removeItem: jest.fn(),
      updateQuantity: jest.fn(),
      clearCart: jest.fn(),
      getTotalPrice: jest.fn(() => 0),
    };

    (useCartStore as jest.Mock).mockImplementation((selector?: any) => {
      if (selector) {
        return selector(mockState)
      }
      return mockState
    })

    render(<ShoppingCart showCheckoutButton={false} />)

    expect(screen.getByText('Explorar Productos')).toBeInTheDocument()
  })
})
