'use client'

import React, { useState } from 'react'
import { useCartStore } from '@/store/cart.store'
import { Button } from '@/components/ui'
import { Product } from '@/types'

interface AddToCartButtonProps {
  product: Product
  quantity?: number
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showQuantitySelector?: boolean
}

export function AddToCartButton({ 
  product, 
  quantity = 1, 
  variant = 'primary',
  size = 'md',
  className,
  showQuantitySelector = false
}: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem)
  const getItem = useCartStore((state) => state.getItem)
  const [selectedQuantity, setSelectedQuantity] = useState(quantity)
  const [isAdding, setIsAdding] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const currentItem = getItem(product.id)
  const currentQuantity = currentItem?.quantity || 0

  const handleAddToCart = async () => {
    setIsAdding(true)
    
    try {
      // Convertir Product a CartItem format
      addItem({
        id: `cart-${product.id}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: product.our_price,
        image: product.images?.[0] || '/placeholder-product.svg',
        sku: product.sku,
        brand: product.brand,
        maxQuantity: 99,
      }, selectedQuantity)
      
      // Show success feedback
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setIsAdding(false)
    }
  }

  if (showSuccess) {
    return (
      <Button
        variant="secondary"
        size={size}
        className={`${className} text-green-600 border-green-600`}
        disabled
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        ¡Añadido!
      </Button>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      {showQuantitySelector && (
        <div className="flex items-center border rounded-md">
          <button
            onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
            className="px-2 py-1 text-gray-600 hover:text-gray-800"
            disabled={selectedQuantity <= 1}
          >
            -
          </button>
          <span className="px-3 py-1 text-sm font-medium">{selectedQuantity}</span>
          <button
            onClick={() => setSelectedQuantity(Math.min(99, selectedQuantity + 1))}
            className="px-2 py-1 text-gray-600 hover:text-gray-800"
            disabled={selectedQuantity >= 99}
          >
            +
          </button>
        </div>
      )}
      
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleAddToCart}
        loading={isAdding}
        disabled={!product.is_active}
      >
        {!product.is_active ? (
          'No Disponible'
        ) : currentQuantity > 0 ? (
          `Añadir Más (${currentQuantity} en carrito)`
        ) : (
          'Añadir al Carrito'
        )}
      </Button>
    </div>
  )
}