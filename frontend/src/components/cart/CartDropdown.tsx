/**
 * CartDropdown Component
 * 
 * Mini carrito desplegable que aparece al hacer clic en el icono del carrito.
 * Similar a PCComponentes.
 * 
 * Características:
 * - Lista de productos agregados
 * - Imagen, nombre, precio y cantidad de cada producto
 * - Total con IVA incluido
 * - Botón "Ver todos los artículos" que redirige a /carrito
 * - Completamente responsive
 * - Animación de entrada/salida
 */

'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '@/store/cart.store'
import { Button } from '@/components/ui'
import { formatPrice } from '@/lib/utils'
import { X, ShoppingCart } from 'lucide-react'

interface CartDropdownProps {
  isOpen: boolean
  onClose: () => void
}

export function CartDropdown({ isOpen, onClose }: CartDropdownProps) {
  const items = useCartStore((state) => state.items)
  const getTotalPrice = useCartStore((state) => state.getTotalPrice)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)

  const subtotal = getTotalPrice()
  const iva = subtotal * 0.21 // 21% IVA
  const total = subtotal + iva

  // Cerrar al hacer clic fuera
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - solo visible en móvil */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Dropdown */}
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="
              fixed md:absolute
              top-0 md:top-full right-0 md:right-0
              w-full md:w-96
              h-full md:h-auto
              md:max-h-[min(600px,calc(100vh-120px))]
              mt-0 md:mt-2
              bg-white
              shadow-2xl
              z-50
              flex flex-col
              md:rounded-lg
              overflow-hidden
            "
            role="dialog"
            aria-label="Carrito de compras"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Mi Cesta
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                aria-label="Cerrar carrito"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Contenido */}
            {items.length === 0 ? (
              // Carrito vacío
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <ShoppingCart className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Tu cesta está vacía
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Añade productos para comenzar tu compra
                </p>
                <Link href="/productos" onClick={onClose}>
                  <Button>Explorar Productos</Button>
                </Link>
              </div>
            ) : (
              <>
                {/* Contenedor con scroll - TODO el contenido */}
                <div className="flex-1 overflow-y-auto">
                  {/* Lista de productos */}
                  <div className="p-4 space-y-4">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-3 pb-4 border-b last:border-b-0"
                      >
                        {/* Imagen */}
                        <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg
                                className="w-6 h-6 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
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
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/productos/${item.productId}`}
                            onClick={onClose}
                            className="block"
                          >
                            <h3 className="text-sm font-medium text-gray-900 hover:text-primary-600 line-clamp-2 mb-1">
                              {item.name}
                            </h3>
                          </Link>
                          
                          <p className="text-lg font-bold text-gray-900 mb-2">
                            {formatPrice(item.price)}
                          </p>

                          {/* Selector de cantidad */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">Unidades:</span>
                            <div className="flex items-center border rounded">
                              <button
                                onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                                className="px-2 py-1 hover:bg-gray-100 transition-colors text-gray-600"
                                aria-label="Disminuir cantidad"
                              >
                                -
                              </button>
                              <span className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.productId, Math.min(item.maxQuantity || 99, item.quantity + 1))}
                                className="px-2 py-1 hover:bg-gray-100 transition-colors text-gray-600"
                                aria-label="Aumentar cantidad"
                              >
                                +
                              </button>
                            </div>
                            
                            {/* Botón eliminar */}
                            <button
                              onClick={() => removeItem(item.productId)}
                              className="ml-auto p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              aria-label={`Eliminar ${item.name}`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer con total y botón - DENTRO del scroll */}
                  <div className="border-t bg-gray-50 p-4 space-y-3">
                  {/* Desglose de precios */}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>IVA (21%)</span>
                      <span>{formatPrice(iva)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t">
                      <span>Total (IVA incluido)</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>

                    {/* Botón Ver todos los artículos */}
                    <Link href="/carrito" onClick={onClose} className="block">
                      <Button className="w-full" size="lg">
                        Ver Todos los Artículos
                      </Button>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
