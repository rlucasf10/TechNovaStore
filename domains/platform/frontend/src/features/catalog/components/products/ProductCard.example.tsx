/**
 * Ejemplo de uso del componente ProductCard
 * 
 * Este archivo muestra cómo usar el componente ProductCard en diferentes escenarios.
 * NO es parte del código de producción, solo documentación.
 */

import { ProductCard } from './ProductCard'
import { Product } from '@/types'

// Ejemplo 1: Producto con descuento y rating
const productWithDiscount: Product = {
  id: '1',
  sku: 'LAPTOP-001',
  name: 'Laptop HP Pavilion 15.6" Intel Core i7 16GB RAM 512GB SSD',
  description: 'Laptop potente para trabajo y entretenimiento',
  category: 'Laptops',
  subcategory: 'Laptops Gaming',
  brand: 'HP',
  specifications: {
    processor: 'Intel Core i7-12700H',
    ram: '16GB DDR4',
    storage: '512GB NVMe SSD',
    screen: '15.6" Full HD IPS',
  },
  images: ['/products/laptop-hp-pavilion.jpg'],
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
}

// Ejemplo 2: Producto sin descuento
const productWithoutDiscount: Product = {
  id: '2',
  sku: 'MOUSE-001',
  name: 'Mouse Logitech MX Master 3S Inalámbrico',
  description: 'Mouse ergonómico de alta precisión',
  category: 'Accesorios',
  subcategory: 'Ratones',
  brand: 'Logitech',
  specifications: {
    connectivity: 'Bluetooth + USB-C',
    dpi: '8000 DPI',
    battery: 'Hasta 70 días',
  },
  images: ['/products/mouse-logitech-mx-master.jpg'],
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
}

// Ejemplo 3: Producto sin stock
const productOutOfStock: Product = {
  id: '3',
  sku: 'GPU-001',
  name: 'NVIDIA GeForce RTX 4090 24GB GDDR6X',
  description: 'Tarjeta gráfica de última generación',
  category: 'Componentes',
  subcategory: 'Tarjetas Gráficas',
  brand: 'NVIDIA',
  specifications: {
    memory: '24GB GDDR6X',
    cuda_cores: '16384',
    boost_clock: '2.52 GHz',
  },
  images: ['/products/nvidia-rtx-4090.jpg'],
  providers: [],
  our_price: 1899.99,
  markup_percentage: 10,
  is_active: false,
  rating: 4.9,
  review_count: 89,
  created_at: '2025-10-01T00:00:00Z',
  updated_at: '2025-11-02T00:00:00Z',
}

// Ejemplo de uso en un grid de productos
export function ProductGridExample() {
  const handleAddToCart = async (product: Product) => {
    console.log('Agregando al carrito:', product.name)
    // Aquí iría la lógica real de agregar al carrito
    // Por ejemplo: await cartService.addItem(product.id, 1)
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Mostrar notificación de éxito
    alert(`${product.name} agregado al carrito`)
  }

  const handleQuickView = (product: Product) => {
    console.log('Vista rápida de:', product.name)
    // Aquí iría la lógica de abrir un modal con vista rápida
    // Por ejemplo: openQuickViewModal(product)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Productos Destacados</h2>
      
      {/* Grid responsivo de productos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <ProductCard 
          product={productWithDiscount} 
          onAddToCart={handleAddToCart}
          onQuickView={handleQuickView}
        />
        
        <ProductCard 
          product={productWithoutDiscount} 
          onAddToCart={handleAddToCart}
          onQuickView={handleQuickView}
        />
        
        <ProductCard 
          product={productOutOfStock} 
          onAddToCart={handleAddToCart}
          onQuickView={handleQuickView}
        />
      </div>
    </div>
  )
}

// Ejemplo de uso sin callbacks (solo visualización)
export function ProductCardReadOnlyExample() {
  return (
    <div className="max-w-sm">
      <ProductCard product={productWithDiscount} />
    </div>
  )
}

// Notas de implementación:
// 
// 1. El componente ProductCard es completamente responsivo
// 2. Funciona con o sin callbacks (onAddToCart y onQuickView son opcionales)
// 3. Maneja automáticamente estados de carga al agregar al carrito
// 4. Muestra badge de descuento solo si hay discount_percentage > 0
// 5. Muestra rating solo si existe y es > 0
// 6. El botón de agregar al carrito se deshabilita si no hay stock
// 7. La animación de hover es suave y profesional
// 8. Cumple con accesibilidad (aria-labels, roles semánticos)
