/**
 * Página de prueba para el componente CartItem
 * Ruta: /test-cart-item
 * 
 * Esta página es solo para desarrollo y testing.
 * NO debe estar en producción.
 */

'use client'

import React, { useState } from 'react'
import { CartItem } from '@/components/cart'
import { CartItemNew } from '@/types'

export default function TestCartItemPage() {
  const [items, setItems] = useState<CartItemNew[]>([
    {
      id: 'cart-item-1',
      productId: 'prod-1',
      name: 'Laptop Dell XPS 15 - Intel Core i7, 16GB RAM, 512GB SSD',
      price: 1299.99,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400',
      sku: 'DELL-XPS15-001',
      brand: 'Dell',
      maxQuantity: 5,
      inStock: true,
      addedAt: new Date(),
    },
    {
      id: 'cart-item-2',
      productId: 'prod-2',
      name: 'Mouse Logitech MX Master 3S - Inalámbrico, Ergonómico',
      price: 89.99,
      quantity: 2,
      image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
      sku: 'LOG-MX3S-BLK',
      brand: 'Logitech',
      maxQuantity: 10,
      inStock: true,
      addedAt: new Date(),
    },
    {
      id: 'cart-item-3',
      productId: 'prod-3',
      name: 'Teclado Mecánico Keychron K8 Pro - RGB, Hot-Swappable',
      price: 149.99,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400',
      sku: 'KEY-K8PRO-RGB',
      brand: 'Keychron',
      maxQuantity: 3,
      inStock: false,
      addedAt: new Date(),
    },
    {
      id: 'cart-item-4',
      productId: 'prod-4',
      name: 'Monitor LG UltraWide 34" 5K2K - IPS, 160Hz',
      price: 899.99,
      quantity: 1,
      image: '', // Sin imagen para probar placeholder
      sku: 'LG-UW34-5K2K',
      brand: 'LG',
      maxQuantity: 2,
      inStock: true,
      addedAt: new Date(),
    },
  ])

  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set())

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 500))
    
    setItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      )
    )
  }

  const handleRemove = async (productId: string) => {
    // Marcar como eliminando
    setRemovingItems(prev => new Set(prev).add(productId))
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Eliminar item
    setItems(prevItems => prevItems.filter(item => item.productId !== productId))
    
    // Limpiar estado de eliminando
    setRemovingItems(prev => {
      const newSet = new Set(prev)
      newSet.delete(productId)
      return newSet
    })
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test: Componente CartItem
          </h1>
          <p className="text-gray-600">
            Prueba del componente CartItem con diferentes estados y animaciones
          </p>
        </div>

        {/* Resumen */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Carrito de Compras
              </h2>
              <p className="text-sm text-gray-600">
                {items.length} {items.length === 1 ? 'producto' : 'productos'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">
                €{calculateTotal().toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Lista de items */}
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg 
                  className="w-8 h-8 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0h15M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" 
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Carrito vacío
              </h3>
              <p className="text-gray-600">
                Todos los items han sido eliminados
              </p>
            </div>
          ) : (
            items.map(item => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemove}
                isRemoving={removingItems.has(item.productId)}
              />
            ))
          )}
        </div>

        {/* Características probadas */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            ✅ Características Implementadas
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Imagen del producto (100x100px) con placeholder si no hay imagen</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Nombre con link a detalle del producto</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>SKU y marca mostrados claramente</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Selector de cantidad con botones - y + e input editable</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Precio unitario y subtotal calculado dinámicamente</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Botón eliminar con icono de papelera</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Animaciones al agregar/eliminar con Framer Motion</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Diseño responsive (móvil y desktop)</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Estados: loading, sin stock, límite de cantidad</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Validación de cantidad (mínimo 1, máximo según disponibilidad)</span>
            </li>
          </ul>
        </div>

        {/* Instrucciones */}
        <div className="mt-6 bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🧪 Pruebas Sugeridas
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="mr-2">1.</span>
              <span>Cambiar cantidades usando los botones + y -</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">2.</span>
              <span>Editar cantidad directamente en el input</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">3.</span>
              <span>Intentar exceder el límite máximo de cantidad</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">4.</span>
              <span>Eliminar items y observar la animación</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">5.</span>
              <span>Observar el estado "Sin Stock" en el tercer item</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">6.</span>
              <span>Hacer clic en el nombre del producto (debería navegar)</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">7.</span>
              <span>Redimensionar la ventana para ver el diseño responsive</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
