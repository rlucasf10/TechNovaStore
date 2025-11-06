'use client'

/**
 * Página de prueba para el componente ProductCard
 * Ruta: /test-product-card
 * 
 * Esta página es solo para desarrollo y testing.
 * NO debe estar en producción.
 */

import { ProductCard } from '@/components/products/ProductCard'
import { Product } from '@/types'

export default function TestProductCardPage() {
  // Productos de ejemplo para testing
  const products: Product[] = [
    {
      id: '1',
      sku: 'LAPTOP-001',
      name: 'Laptop HP Pavilion 15.6" Intel Core i7 16GB RAM 512GB SSD',
      description: 'Laptop potente para trabajo y entretenimiento',
      category: 'Laptops',
      subcategory: 'Laptops Gaming',
      brand: 'HP',
      specifications: {},
      images: ['https://via.placeholder.com/400x400?text=Laptop+HP'],
      providers: [
        {
          name: 'Amazon',
          price: 899.99,
          availability: true,
          shipping_cost: 0,
          delivery_time: 2,
          last_updated: '2025-11-02T10:00:00Z',
        },
      ],
      our_price: 849.99,
      original_price: 999.99,
      discount_percentage: 15,
      markup_percentage: 10,
      is_active: true,
      rating: 4.5,
      review_count: 127,
      created_at: '2025-10-01T00:00:00Z',
      updated_at: '2025-11-02T00:00:00Z',
    },
    {
      id: '2',
      sku: 'MOUSE-001',
      name: 'Mouse Logitech MX Master 3S Inalámbrico',
      description: 'Mouse ergonómico de alta precisión',
      category: 'Accesorios',
      subcategory: 'Ratones',
      brand: 'Logitech',
      specifications: {},
      images: ['https://via.placeholder.com/400x400?text=Mouse+Logitech'],
      providers: [
        {
          name: 'Amazon',
          price: 99.99,
          availability: true,
          shipping_cost: 0,
          delivery_time: 1,
          last_updated: '2025-11-02T10:00:00Z',
        },
      ],
      our_price: 89.99,
      markup_percentage: 10,
      is_active: true,
      rating: 4.8,
      review_count: 342,
      created_at: '2025-10-01T00:00:00Z',
      updated_at: '2025-11-02T00:00:00Z',
    },
    {
      id: '3',
      sku: 'GPU-001',
      name: 'NVIDIA GeForce RTX 4090 24GB GDDR6X',
      description: 'Tarjeta gráfica de última generación',
      category: 'Componentes',
      subcategory: 'Tarjetas Gráficas',
      brand: 'NVIDIA',
      specifications: {},
      images: ['https://via.placeholder.com/400x400?text=RTX+4090'],
      providers: [],
      our_price: 1899.99,
      markup_percentage: 10,
      is_active: false,
      rating: 4.9,
      review_count: 89,
      created_at: '2025-10-01T00:00:00Z',
      updated_at: '2025-11-02T00:00:00Z',
    },
    {
      id: '4',
      sku: 'KEYBOARD-001',
      name: 'Teclado Mecánico Keychron K8 Pro RGB',
      description: 'Teclado mecánico inalámbrico',
      category: 'Accesorios',
      subcategory: 'Teclados',
      brand: 'Keychron',
      specifications: {},
      images: ['https://via.placeholder.com/400x400?text=Keychron+K8'],
      providers: [
        {
          name: 'Amazon',
          price: 129.99,
          availability: true,
          shipping_cost: 0,
          delivery_time: 3,
          last_updated: '2025-11-02T10:00:00Z',
        },
      ],
      our_price: 119.99,
      original_price: 149.99,
      discount_percentage: 20,
      markup_percentage: 10,
      is_active: true,
      rating: 4.7,
      review_count: 215,
      created_at: '2025-10-01T00:00:00Z',
      updated_at: '2025-11-02T00:00:00Z',
    },
  ]

  const handleAddToCart = async (product: Product) => {
    console.log('Agregando al carrito:', product.name)
    alert(`${product.name} agregado al carrito`)
  }

  const handleQuickView = (product: Product) => {
    console.log('Vista rápida de:', product.name)
    alert(`Vista rápida de: ${product.name}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test: Componente ProductCard
          </h1>
          <p className="text-gray-600">
            Esta página muestra diferentes estados del componente ProductCard
          </p>
        </div>

        {/* Grid de productos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              onQuickView={handleQuickView}
            />
          ))}
        </div>

        {/* Leyenda */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Características implementadas:
          </h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Imagen con aspect ratio 1:1</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Badge de descuento si aplica (ver productos 1 y 4)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Nombre con 2 líneas max con ellipsis</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Rating con número de reviews</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Precio tachado si hay descuento + precio final</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Botón "Agregar al carrito"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Icono de "Quick View" en hover</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Animación de hover (escala de imagen, sombra, borde)</span>
            </li>
          </ul>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Estados de prueba:</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Producto 1: Con descuento del 15%</li>
              <li>• Producto 2: Sin descuento</li>
              <li>• Producto 3: Sin stock (botón deshabilitado)</li>
              <li>• Producto 4: Con descuento del 20%</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
