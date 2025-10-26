'use client'

import React, { useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { Button } from '@/components/ui/Button'
import { Product } from '@/types'

interface AddToCartButtonProps {
  product: Product
  quantity?: number
  variant?: 'primary' | 'secondary' | 'outline'
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
  const { addItem, getItemQuantity } = useCart()
  const [selectedQuantity, setSelectedQuantity] = useState(quantity)
  const [isAdding, setIsAdding] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const currentQuantity = getItemQuantity(product.id)

  const handleAddToCart = async () => {
    setIsAdding(true)
    
    try {
      addItem(product, selectedQuantity)
      
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
        variant="outline"
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