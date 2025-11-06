'use client'

/**
 * Componente CartItem
 * 
 * Muestra un item individual del carrito de compras con:
 * - Imagen del producto (100x100px)
 * - Nombre con link a detalle
 * - SKU y marca
 * - Selector de cantidad (- [input] +)
 * - Precio unitario y subtotal
 * - Botón eliminar
 * - Animaciones al agregar/eliminar
 * 
 * Requisitos: 9.1, 9.2
 */

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Input } from '@/components/ui'
import { formatPrice } from '@/lib/utils'
import { CartItemNew } from '@/types'

interface CartItemProps {
  item: CartItemNew
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
  isRemoving?: boolean
}

export function CartItem({ 
  item, 
  onUpdateQuantity, 
  onRemove,
  isRemoving = false 
}: CartItemProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [localQuantity, setLocalQuantity] = useState(item.quantity)

  // Calcular subtotal del item
  const subtotal = item.price * item.quantity

  /**
   * Manejar cambio de cantidad desde el input
   */
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    // Permitir campo vacío temporalmente mientras el usuario escribe
    if (value === '') {
      setLocalQuantity(0)
      return
    }

    const newQuantity = parseInt(value)
    
    // Validar que sea un número válido
    if (isNaN(newQuantity) || newQuantity < 1) {
      return
    }

    // Limitar a la cantidad máxima disponible
    const maxQty = item.maxQuantity || 99
    const validQuantity = Math.min(newQuantity, maxQty)
    
    setLocalQuantity(validQuantity)
  }

  /**
   * Manejar blur del input (cuando el usuario sale del campo)
   */
  const handleQuantityBlur = () => {
    // Si el campo está vacío o es 0, restaurar a 1
    if (localQuantity === 0) {
      setLocalQuantity(1)
      updateQuantity(1)
      return
    }

    // Si la cantidad cambió, actualizar
    if (localQuantity !== item.quantity) {
      updateQuantity(localQuantity)
    }
  }

  /**
   * Actualizar cantidad en el carrito
   */
  const updateQuantity = async (newQuantity: number) => {
    if (newQuantity === item.quantity) return

    setIsUpdating(true)
    try {
      await onUpdateQuantity(item.productId, newQuantity)
    } catch (error) {
      console.error('Error al actualizar cantidad:', error)
      // Restaurar cantidad anterior en caso de error
      setLocalQuantity(item.quantity)
    } finally {
      setIsUpdating(false)
    }
  }

  /**
   * Incrementar cantidad
   */
  const handleIncrement = () => {
    const maxQty = item.maxQuantity || 99
    if (localQuantity >= maxQty) return

    const newQuantity = localQuantity + 1
    setLocalQuantity(newQuantity)
    updateQuantity(newQuantity)
  }

  /**
   * Decrementar cantidad
   */
  const handleDecrement = () => {
    if (localQuantity <= 1) return

    const newQuantity = localQuantity - 1
    setLocalQuantity(newQuantity)
    updateQuantity(newQuantity)
  }

  /**
   * Manejar eliminación del item
   */
  const handleRemove = async () => {
    try {
      await onRemove(item.productId)
    } catch (error) {
      console.error('Error al eliminar item:', error)
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100, height: 0 }}
        transition={{ duration: 0.3 }}
        className={`
          flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white rounded-lg border
          ${isRemoving ? 'opacity-50' : ''}
          ${!item.inStock ? 'bg-gray-50' : ''}
        `}
      >
        {/* Contenedor de imagen y info básica (móvil) */}
        <div className="flex gap-4 w-full sm:w-auto">
          {/* Imagen del producto - 100x100px */}
          <div className="flex-shrink-0 w-[100px] h-[100px] bg-gray-100 rounded-lg overflow-hidden relative">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              width={100}
              height={100}
              className="w-full h-full object-cover"
              priority={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg 
                className="w-10 h-10 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
            </div>
          )}
          
          {/* Badge de sin stock */}
          {!item.inStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white text-xs font-semibold px-2 py-1 bg-red-600 rounded">
                Sin Stock
              </span>
            </div>
          )}
          </div>

          {/* Información del producto */}
          <div className="flex-1 min-w-0">
          {/* Nombre con link a detalle */}
          <h3 className="text-base font-medium text-gray-900 mb-1">
            <Link 
              href={`/productos/${item.productId}`}
              className="hover:text-primary-600 transition-colors line-clamp-2"
            >
              {item.name}
            </Link>
          </h3>

          {/* SKU y Marca */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <span className="font-mono">SKU: {item.sku}</span>
            {item.brand && (
              <>
                <span className="text-gray-300">•</span>
                <span>{item.brand}</span>
              </>
            )}
          </div>

          {/* Precio unitario */}
          <div className="mt-2">
            <span className="text-sm text-gray-600">Precio unitario: </span>
            <span className="text-base font-semibold text-gray-900">
              {formatPrice(item.price)}
            </span>
          </div>
          </div>
        </div>

        {/* Contenedor de controles (cantidad, subtotal, eliminar) */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-4 sm:gap-4 ml-0 sm:ml-auto">
          {/* Selector de cantidad */}
          <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Cantidad</span>
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDecrement}
              disabled={localQuantity <= 1 || isUpdating || isRemoving || !item.inStock}
              className="w-8 h-8 p-0 flex items-center justify-center"
              aria-label="Disminuir cantidad"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </Button>

            <Input
              id={`quantity-${item.id}`}
              name={`quantity-${item.id}`}
              type="number"
              min="1"
              max={item.maxQuantity || 99}
              value={localQuantity}
              onChange={handleQuantityChange}
              onBlur={handleQuantityBlur}
              disabled={isUpdating || isRemoving || !item.inStock}
              className="w-16 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              aria-label={`Cantidad de ${item.name}`}
            />

            <Button
              variant="secondary"
              size="sm"
              onClick={handleIncrement}
              disabled={
                localQuantity >= (item.maxQuantity || 99) || 
                isUpdating || 
                isRemoving || 
                !item.inStock
              }
              className="w-8 h-8 p-0 flex items-center justify-center"
              aria-label="Aumentar cantidad"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>
          </div>

          {/* Indicador de actualización */}
          {isUpdating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-gray-500"
            >
              Actualizando...
            </motion.div>
          )}

          {/* Límite de cantidad */}
          {item.maxQuantity && localQuantity >= item.maxQuantity && (
            <span className="text-xs text-amber-600">
              Máx: {item.maxQuantity}
            </span>
          )}
          </div>

          {/* Subtotal */}
          <div className="text-right min-w-[80px] sm:min-w-[100px]">
          <div className="text-xs text-gray-500 mb-1">Subtotal</div>
          <motion.div
            key={subtotal}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="text-lg font-bold text-gray-900"
          >
            {formatPrice(subtotal)}
          </motion.div>
          </div>

          {/* Botón eliminar */}
          <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          disabled={isRemoving}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
          aria-label={`Eliminar ${item.name} del carrito`}
        >
          {isRemoving ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
            </motion.div>
          ) : (
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
              />
            </svg>
          )}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
