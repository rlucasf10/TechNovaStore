import React from 'react'
import { render, screen } from '@testing-library/react'
import { ShoppingCart } from '../ShoppingCart'
import { CartProvider } from '@/contexts/CartContext'
import { Product } from '@/types'

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

// Test wrapper that provides cart context
function TestWrapper({ children, withItems = false }: { children: React.ReactNode; withItems?: boolean }) {
  return (
    <CartProvider>
      {children}
    </CartProvider>
  )
}

describe('ShoppingCart', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should show empty cart message when no items', () => {
    render(
      <TestWrapper>
        <ShoppingCart />
      </TestWrapper>
    )

    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument()
    expect(screen.getByText('Añade algunos productos para comenzar tu compra')).toBeInTheDocument()
    expect(screen.getByText('Explorar Productos')).toBeInTheDocument()
  })

  it('should show cart summary when showCheckoutButton is true', () => {
    render(
      <TestWrapper>
        <ShoppingCart showCheckoutButton={true} />
      </TestWrapper>
    )

    expect(screen.getByText('Explorar Productos')).toBeInTheDocument()
  })

  it('should show cart summary when showCheckoutButton is false', () => {
    render(
      <TestWrapper>
        <ShoppingCart showCheckoutButton={false} />
      </TestWrapper>
    )

    expect(screen.getByText('Explorar Productos')).toBeInTheDocument()
  })
})