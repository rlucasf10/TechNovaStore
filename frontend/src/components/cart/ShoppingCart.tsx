'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatPrice } from '@/lib/utils'
import { CartItem } from '@/types'

interface ShoppingCartProps {
  showCheckoutButton?: boolean
}

export function ShoppingCart({ showCheckoutButton = true }: ShoppingCartProps) {
  const { items, total, updateQuantity, removeItem } = useCart()

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0h15M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Tu carrito está vacío</h3>
        <p className="text-gray-500 mb-6">Añade algunos productos para comenzar tu compra</p>
        <Link href="/productos">
          <Button>Explorar Productos</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cart Items */}
      <div className="space-y-4">
        {items.map((item) => (
          <CartItemRow
            key={item.product.id}
            item={item}
            onUpdateQuantity={updateQuantity}
            onRemove={removeItem}
          />
        ))}
      </div>

      {/* Cart Summary */}
      <div className="border-t pt-6">
        <CartSummary total={total} showCheckoutButton={showCheckoutButton} />
      </div>
    </div>
  )
}

interface CartItemRowProps {
  item: CartItem
  onUpdateQuantity: (_productId: string, _quantity: number) => void
  onRemove: (_productId: string) => void
}

function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const { product, quantity } = item
  const itemTotal = product.our_price * quantity

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(e.target.value) || 1
    onUpdateQuantity(product.id, newQuantity)
  }

  return (
    <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border">
      {/* Product Image */}
      <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            width={80}
            height={80}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 truncate">
          <Link href={`/productos/${product.id}`} className="hover:text-primary-600">
            {product.name}
          </Link>
        </h3>
        <p className="text-sm text-gray-500 mt-1">SKU: {product.sku}</p>
        <p className="text-sm font-medium text-gray-900 mt-1">
          {formatPrice(product.our_price)}
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center space-x-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onUpdateQuantity(product.id, Math.max(1, quantity - 1))}
          className="w-8 h-8 p-0"
        >
          -
        </Button>
        <Input
          id={`quantity-${product.id}`}
          name={`quantity-${product.id}`}
          type="number"
          min="1"
          max="99"
          value={quantity}
          onChange={handleQuantityChange}
          className="w-16 text-center"
          aria-label={`Cantidad de ${product.name}`}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onUpdateQuantity(product.id, Math.min(99, quantity + 1))}
          className="w-8 h-8 p-0"
        >
          +
        </Button>
      </div>

      {/* Item Total */}
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">
          {formatPrice(itemTotal)}
        </p>
      </div>

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(product.id)}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </Button>
    </div>
  )
}

interface CartSummaryProps {
  total: number
  showCheckoutButton: boolean
}

function CartSummary({ total, showCheckoutButton }: CartSummaryProps) {
  const shippingCost = total > 50 ? 0 : 5.99 // Free shipping over €50
  const tax = total * 0.21 // 21% IVA in Spain
  const finalTotal = total + shippingCost + tax

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen del Pedido</h3>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-gray-900">{formatPrice(total)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Envío</span>
          <span className="text-gray-900">
            {shippingCost === 0 ? (
              <span className="text-green-600">Gratis</span>
            ) : (
              formatPrice(shippingCost)
            )}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">IVA (21%)</span>
          <span className="text-gray-900">{formatPrice(tax)}</span>
        </div>
        
        {total < 50 && (
          <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
            Añade {formatPrice(50 - total)} más para envío gratuito
          </div>
        )}
        
        <div className="border-t pt-2">
          <div className="flex justify-between text-base font-medium">
            <span className="text-gray-900">Total</span>
            <span className="text-gray-900">{formatPrice(finalTotal)}</span>
          </div>
        </div>
      </div>

      {showCheckoutButton && (
        <div className="mt-6">
          <Link href="/checkout" className="block">
            <Button className="w-full" size="lg">
              Proceder al Checkout
            </Button>
          </Link>
          <Link href="/productos" className="block mt-3">
            <Button variant="secondary" className="w-full">
              Continuar Comprando
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}