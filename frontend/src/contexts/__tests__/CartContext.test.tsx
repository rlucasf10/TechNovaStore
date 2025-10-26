import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { CartProvider, useCart } from '../CartContext'
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

// Test component that uses the cart
function TestComponent() {
  const { items, itemCount, total, addItem, removeItem, updateQuantity, clearCart } = useCart()

  return (
    <div>
      <div data-testid="item-count">{itemCount}</div>
      <div data-testid="total">{total}</div>
      <div data-testid="items-length">{items.length}</div>
      
      <button onClick={() => addItem(mockProduct, 1)} data-testid="add-item">
        Add Item
      </button>
      
      <button onClick={() => updateQuantity(mockProduct.id, 2)} data-testid="update-quantity">
        Update Quantity
      </button>
      
      <button onClick={() => removeItem(mockProduct.id)} data-testid="remove-item">
        Remove Item
      </button>
      
      <button onClick={clearCart} data-testid="clear-cart">
        Clear Cart
      </button>
    </div>
  )
}

describe('CartContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  it('should start with empty cart', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    expect(screen.getByTestId('item-count')).toHaveTextContent('0')
    expect(screen.getByTestId('total')).toHaveTextContent('0')
    expect(screen.getByTestId('items-length')).toHaveTextContent('0')
  })

  it('should add items to cart', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    fireEvent.click(screen.getByTestId('add-item'))

    expect(screen.getByTestId('item-count')).toHaveTextContent('1')
    expect(screen.getByTestId('total')).toHaveTextContent('99.99')
    expect(screen.getByTestId('items-length')).toHaveTextContent('1')
  })

  it('should update item quantity', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    // Add item first
    fireEvent.click(screen.getByTestId('add-item'))
    expect(screen.getByTestId('item-count')).toHaveTextContent('1')

    // Update quantity
    fireEvent.click(screen.getByTestId('update-quantity'))
    expect(screen.getByTestId('item-count')).toHaveTextContent('2')
    expect(screen.getByTestId('total')).toHaveTextContent('199.98')
  })

  it('should remove items from cart', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    // Add item first
    fireEvent.click(screen.getByTestId('add-item'))
    expect(screen.getByTestId('item-count')).toHaveTextContent('1')

    // Remove item
    fireEvent.click(screen.getByTestId('remove-item'))
    expect(screen.getByTestId('item-count')).toHaveTextContent('0')
    expect(screen.getByTestId('total')).toHaveTextContent('0')
  })

  it('should clear entire cart', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    // Add multiple items
    fireEvent.click(screen.getByTestId('add-item'))
    fireEvent.click(screen.getByTestId('add-item'))
    expect(screen.getByTestId('item-count')).toHaveTextContent('2')

    // Clear cart
    fireEvent.click(screen.getByTestId('clear-cart'))
    expect(screen.getByTestId('item-count')).toHaveTextContent('0')
    expect(screen.getByTestId('total')).toHaveTextContent('0')
  })
})