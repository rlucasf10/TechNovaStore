import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AddToCartButton } from '../AddToCartButton'
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

const inactiveProduct: Product = {
  ...mockProduct,
  id: '2',
  is_active: false,
}

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
    </CartProvider>
  )
}

describe('AddToCartButton', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should render add to cart button', () => {
    render(
      <TestWrapper>
        <AddToCartButton product={mockProduct} />
      </TestWrapper>
    )

    expect(screen.getByText('Añadir al Carrito')).toBeInTheDocument()
  })

  it('should show success message after adding to cart', async () => {
    render(
      <TestWrapper>
        <AddToCartButton product={mockProduct} />
      </TestWrapper>
    )

    const button = screen.getByText('Añadir al Carrito')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('¡Añadido!')).toBeInTheDocument()
    })
  })

  it('should show quantity selector when enabled', () => {
    render(
      <TestWrapper>
        <AddToCartButton product={mockProduct} showQuantitySelector={true} />
      </TestWrapper>
    )

    expect(screen.getByText('1')).toBeInTheDocument() // Default quantity
    expect(screen.getByText('+')).toBeInTheDocument()
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('should be disabled for inactive products', () => {
    render(
      <TestWrapper>
        <AddToCartButton product={inactiveProduct} />
      </TestWrapper>
    )

    expect(screen.getByText('No Disponible')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should update quantity with selector', () => {
    render(
      <TestWrapper>
        <AddToCartButton product={mockProduct} showQuantitySelector={true} />
      </TestWrapper>
    )

    const plusButton = screen.getByText('+')
    fireEvent.click(plusButton)

    expect(screen.getByText('2')).toBeInTheDocument()
  })
})