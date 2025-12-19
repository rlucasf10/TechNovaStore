/**
 * Componente de Ejemplo - Uso de Utilidades de Accesibilidad
 * 
 * Este componente demuestra el uso correcto de las utilidades de accesibilidad
 * para cumplir con WCAG 2.1 nivel AA
 * 
 * Requisito: 5.1 - Textos alternativos descriptivos para todas las imágenes
 * 
 * NOTA: Este es un componente de ejemplo para documentación.
 * NO debe estar en producción.
 */

'use client';

import Image from 'next/image';
import {
  getProductImageAlt,
  getProductThumbnailAlt,
  getUserAvatarAlt,
  getCategoryImageAlt,
  getBrandLogoAlt,
  getDecorativeImageAlt,
  getActionAriaLabel,
  getQuantityControlAriaLabel,
  getNavigationAriaLabel,
  getVideoCaption,
} from '@/lib/accessibility';

export function AccessibilityExample() {
  // Datos de ejemplo
  const product = {
    id: '1',
    name: 'Laptop Dell XPS 15',
    brand: 'Dell',
    category: 'Laptops',
    image: '/images/laptop-dell-xps-15.jpg',
    thumbnails: [
      '/images/laptop-dell-xps-15-1.jpg',
      '/images/laptop-dell-xps-15-2.jpg',
      '/images/laptop-dell-xps-15-3.jpg',
    ],
  };

  const user = {
    name: 'Juan Pérez',
    avatar: '/images/avatars/juan-perez.jpg',
  };

  const category = {
    name: 'Laptops',
    image: '/images/categories/laptops.jpg',
    productCount: 150,
  };

  const brand = {
    name: 'Dell',
    logo: '/images/brands/dell-logo.svg',
  };



  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Ejemplos de Accesibilidad
        </h1>
        <p className="text-gray-600">
          Demostraciones de uso correcto de textos alternativos y atributos ARIA
        </p>
      </div>

      {/* Ejemplo 1: Imagen de Producto */}
      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          1. Imagen de Producto
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Implementación</h3>
            <div className="bg-gray-100 rounded-lg p-4">
              <Image
                src={product.image}
                alt={getProductImageAlt(product.name, product.brand, product.category, 0)}
                width={400}
                height={400}
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Código</h3>
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm">
{`<Image
  src={product.image}
  alt={getProductImageAlt(
    product.name,
    product.brand,
    product.category,
    0
  )}
  width={400}
  height={400}
/>

// Alt text generado:
// "${getProductImageAlt(product.name, product.brand, product.category, 0)}"`}
            </pre>
          </div>
        </div>
      </section>

      {/* Ejemplo 2: Miniaturas de Producto */}
      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          2. Miniaturas de Producto
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Implementación</h3>
            <div className="flex gap-2">
              {product.thumbnails.map((thumb, index) => (
                <div key={index} className="bg-gray-100 rounded-lg p-2">
                  <Image
                    src={thumb}
                    alt={getProductThumbnailAlt(product.name, index)}
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Código</h3>
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm">
{`{thumbnails.map((thumb, index) => (
  <Image
    key={index}
    src={thumb}
    alt={getProductThumbnailAlt(
      product.name,
      index
    )}
    width={80}
    height={80}
  />
))}

// Alt text generado:
// "${getProductThumbnailAlt(product.name, 0)}"
// "${getProductThumbnailAlt(product.name, 1)}"
// "${getProductThumbnailAlt(product.name, 2)}"`}
            </pre>
          </div>
        </div>
      </section>

      {/* Ejemplo 3: Avatar de Usuario */}
      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          3. Avatar de Usuario
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Implementación</h3>
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 rounded-full p-2">
                <Image
                  src={user.avatar}
                  alt={getUserAvatarAlt(user.name, 'perfil')}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover"
                />
              </div>
              <div>
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500">Usuario verificado</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Código</h3>
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm">
{`<Image
  src={user.avatar}
  alt={getUserAvatarAlt(
    user.name,
    'perfil'
  )}
  width={64}
  height={64}
/>

// Alt text generado:
// "${getUserAvatarAlt(user.name, 'perfil')}"`}
            </pre>
          </div>
        </div>
      </section>

      {/* Ejemplo 4: Imagen de Categoría */}
      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          4. Imagen de Categoría
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Implementación</h3>
            <div className="bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={category.image}
                alt={getCategoryImageAlt(category.name, category.productCount)}
                width={300}
                height={200}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{category.name}</h3>
                <p className="text-sm text-gray-500">{category.productCount} productos</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Código</h3>
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm">
{`<Image
  src={category.image}
  alt={getCategoryImageAlt(
    category.name,
    category.productCount
  )}
  width={300}
  height={200}
/>

// Alt text generado:
// "${getCategoryImageAlt(category.name, category.productCount)}"`}
            </pre>
          </div>
        </div>
      </section>

      {/* Ejemplo 5: Logo de Marca */}
      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          5. Logo de Marca
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Implementación</h3>
            <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
              <Image
                src={brand.logo}
                alt={getBrandLogoAlt(brand.name)}
                width={120}
                height={40}
                className="h-10 w-auto"
              />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Código</h3>
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm">
{`<Image
  src={brand.logo}
  alt={getBrandLogoAlt(brand.name)}
  width={120}
  height={40}
/>

// Alt text generado:
// "${getBrandLogoAlt(brand.name)}"`}
            </pre>
          </div>
        </div>
      </section>

      {/* Ejemplo 6: Imagen Decorativa */}
      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          6. Imagen Decorativa
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Implementación</h3>
            <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-lg p-8 relative overflow-hidden">
              <Image
                src="/images/decorations/pattern.svg"
                alt={getDecorativeImageAlt()}
                role="presentation"
                width={400}
                height={200}
                className="absolute inset-0 w-full h-full opacity-10"
              />
              <div className="relative z-10 text-white">
                <h3 className="text-2xl font-bold mb-2">Oferta Especial</h3>
                <p>Hasta 50% de descuento en productos seleccionados</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Código</h3>
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm">
{`<Image
  src="/decorations/pattern.svg"
  alt={getDecorativeImageAlt()}
  role="presentation"
  width={400}
  height={200}
/>

// Alt text generado:
// "${getDecorativeImageAlt()}"
// (string vacío para imágenes decorativas)`}
            </pre>
          </div>
        </div>
      </section>

      {/* Ejemplo 7: Botones con aria-label */}
      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          7. Botones con aria-label
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Implementación</h3>
            <div className="flex gap-4">
              <button
                aria-label={getActionAriaLabel('agregar al carrito', product.name)}
                className="p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>
              <button
                aria-label={getQuantityControlAriaLabel('incrementar', product.name)}
                className="p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                aria-label={getNavigationAriaLabel('siguiente', 'imagen del producto')}
                className="p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Código</h3>
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm">
{`// Botón agregar al carrito
<button
  aria-label={getActionAriaLabel(
    'agregar al carrito',
    product.name
  )}
>
  <ShoppingCart />
</button>
// "${getActionAriaLabel('agregar al carrito', product.name)}"

// Botón incrementar cantidad
<button
  aria-label={getQuantityControlAriaLabel(
    'incrementar',
    product.name
  )}
>
  <Plus />
</button>
// "${getQuantityControlAriaLabel('incrementar', product.name)}"

// Botón navegación
<button
  aria-label={getNavigationAriaLabel(
    'siguiente',
    'imagen del producto'
  )}
>
  <ChevronRight />
</button>
// "${getNavigationAriaLabel('siguiente', 'imagen del producto')}"`}
            </pre>
          </div>
        </div>
      </section>

      {/* Ejemplo 8: Video con Captions */}
      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          8. Video con Captions
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Implementación</h3>
            <div className="bg-gray-100 rounded-lg overflow-hidden">
              <video controls className="w-full">
                <source src="/videos/tutorial.mp4" type="video/mp4" />
                <track
                  kind="captions"
                  src="/videos/tutorial-es.vtt"
                  srcLang="es"
                  label="Español"
                  default
                />
                <track
                  kind="captions"
                  src="/videos/tutorial-en.vtt"
                  srcLang="en"
                  label="English"
                />
                <p>{getVideoCaption('Tutorial de instalación', 180, 'es')}</p>
              </video>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Código</h3>
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm">
{`<video controls>
  <source src="/videos/tutorial.mp4" />
  <track
    kind="captions"
    src="/videos/tutorial-es.vtt"
    srclang="es"
    label="Español"
    default
  />
  <track
    kind="captions"
    src="/videos/tutorial-en.vtt"
    srclang="en"
    label="English"
  />
  <p>
    {getVideoCaption(
      'Tutorial de instalación',
      180,
      'es'
    )}
  </p>
</video>

// Caption generado:
// "${getVideoCaption('Tutorial de instalación', 180, 'es')}"`}
            </pre>
          </div>
        </div>
      </section>

      {/* Ejemplo 9: Validación de Alt Text */}
      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          9. Validación de Alt Text
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Alt Text Válido ✅</h3>
              <div className="space-y-2">
                {[
                  'Laptop Dell XPS 15',
                  'Foto de perfil de Juan Pérez',
                  'Categoría Laptops - 150 productos disponibles',
                ].map((alt, index) => (
                  <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-gray-900 font-mono">&quot;{alt}&quot;</p>
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Válido ({alt.length} caracteres)
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Alt Text Inválido ❌</h3>
              <div className="space-y-2">
                {[
                  'img',
                  'imagen',
                  'foto',
                ].map((alt, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-gray-900 font-mono">&quot;{alt}&quot;</p>
                    <p className="text-xs text-red-600 mt-1">
                      ✗ Inválido (demasiado genérico o corto)
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Código de Validación</h3>
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm">
{`import { isValidAltText } from '@/lib/accessibility';

const alt = 'Laptop Dell XPS 15';
if (!isValidAltText(alt)) {
  console.warn('Alt text no cumple con WCAG 2.1:', alt);
}

// Validación personalizada
if (!isValidAltText(alt, 10, 100)) {
  console.warn('Alt text fuera del rango 10-100 caracteres');
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* Footer con recursos */}
      <section className="bg-primary-50 rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Recursos Adicionales
        </h2>
        <ul className="space-y-2 text-gray-700">
          <li>
            📖 <a href="/docs/ACCESSIBILITY_GUIDE.md" className="text-primary-600 hover:underline">
              Guía Completa de Accesibilidad
            </a>
          </li>
          <li>
            🔧 <a href="/src/lib/accessibility.ts" className="text-primary-600 hover:underline">
              Código Fuente de Utilidades
            </a>
          </li>
          <li>
            🌐 <a href="https://www.w3.org/WAI/WCAG21/quickref/" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
              WCAG 2.1 Guidelines
            </a>
          </li>
          <li>
            🛠️ <a href="https://webaim.org/resources/contrastchecker/" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
              WebAIM Contrast Checker
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
