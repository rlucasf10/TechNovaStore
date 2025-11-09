import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AddToCartButton } from '@/commerce/components/cart/AddToCartButton'
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

const inactiveProduct: Product = {
  ...mockProduct,
  id: '2',
  is_active: false,
}

describe('AddToCartButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render add to cart button', () => {
    const mockAddItem = jest.fn();
    (useCartStore as jest.Mock).mockReturnValueOnce({
      items: [],
      addItem: mockAddItem,
    })

    render(<AddToCartButton product={mockProduct} />)

    expect(screen.getByText('Añadir al Carrito')).toBeInTheDocument()
  })

  it('should show success message after adding to cart', async () => {
    render(<AddToCartButton product={mockProduct} />)

    const button = screen.getByText('Añadir al Carrito')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('¡Añadido!')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should show quantity selector when enabled', () => {
    const mockAddItem = jest.fn();
    (useCartStore as jest.Mock).mockReturnValueOnce({
      items: [],
      addItem: mockAddItem,
    })

    render(<AddToCartButton product={mockProduct} showQuantitySelector={true} />)

    expect(screen.getByText('1')).toBeInTheDocument() // Default quantity
    expect(screen.getByText('+')).toBeInTheDocument()
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('should be disabled for inactive products', () => {
    const mockAddItem = jest.fn();
    (useCartStore as jest.Mock).mockReturnValueOnce({
      items: [],
      addItem: mockAddItem,
    })

    render(<AddToCartButton product={inactiveProduct} />)

    expect(screen.getByText('No Disponible')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should update quantity with selector', () => {
    const mockAddItem = jest.fn();
    (useCartStore as jest.Mock).mockReturnValueOnce({
      items: [],
      addItem: mockAddItem,
    })

    render(<AddToCartButton product={mockProduct} showQuantitySelector={true} />)

    const plusButton = screen.getByText('+')
    fireEvent.click(plusButton)

    expect(screen.getByText('2')).toBeInTheDocument()
  })
})
