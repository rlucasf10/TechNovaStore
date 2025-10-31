'use client'

/**
 * Ejemplos de uso del componente Rating
 * 
 * Este archivo muestra diferentes casos de uso del componente Rating
 * para facilitar su implementación en diferentes contextos.
 */

import { useState } from 'react'
import { Rating } from './Rating'

export function RatingExamples() {
  const [interactiveRating, setInteractiveRating] = useState(3.5)
  const [precisionRating, setPrecisionRating] = useState(4)

  return (
    <div className="space-y-8 p-8">
      <h1 className="text-3xl font-bold mb-8">Ejemplos de Rating</h1>

      {/* Ejemplo 1: Rating de solo lectura */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">1. Rating de Solo Lectura</h2>
        <p className="text-gray-600">Usado para mostrar ratings existentes sin permitir interacción</p>
        
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <span className="w-32 text-sm text-gray-600">Rating: 4.5</span>
            <Rating value={4.5} readOnly />
          </div>
          <div className="flex items-center gap-4">
            <span className="w-32 text-sm text-gray-600">Rating: 3.0</span>
            <Rating value={3.0} readOnly />
          </div>
          <div className="flex items-center gap-4">
            <span className="w-32 text-sm text-gray-600">Rating: 2.7</span>
            <Rating value={2.7} readOnly />
          </div>
        </div>
      </section>

      {/* Ejemplo 2: Rating con valor numérico */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">2. Rating con Valor Numérico</h2>
        <p className="text-gray-600">Muestra el valor numérico junto a las estrellas</p>
        
        <div className="space-y-2">
          <Rating value={4.5} readOnly showValue />
          <Rating value={3.8} readOnly showValue />
          <Rating value={2.3} readOnly showValue />
        </div>
      </section>

      {/* Ejemplo 3: Rating con contador de reviews */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">3. Rating con Contador de Reviews</h2>
        <p className="text-gray-600">Muestra el número de reviews junto al rating</p>
        
        <div className="space-y-2">
          <Rating value={4.5} readOnly showValue reviewCount={1234} />
          <Rating value={3.8} readOnly showValue reviewCount={89} />
          <Rating value={5.0} readOnly showValue reviewCount={1} />
        </div>
      </section>

      {/* Ejemplo 4: Diferentes tamaños */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">4. Diferentes Tamaños</h2>
        <p className="text-gray-600">El componente soporta tres tamaños: sm, md, lg</p>
        
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <span className="w-32 text-sm text-gray-600">Pequeño (sm)</span>
            <Rating value={4.5} readOnly showValue size="sm" reviewCount={123} />
          </div>
          <div className="flex items-center gap-4">
            <span className="w-32 text-sm text-gray-600">Mediano (md)</span>
            <Rating value={4.5} readOnly showValue size="md" reviewCount={123} />
          </div>
          <div className="flex items-center gap-4">
            <span className="w-32 text-sm text-gray-600">Grande (lg)</span>
            <Rating value={4.5} readOnly showValue size="lg" reviewCount={123} />
          </div>
        </div>
      </section>

      {/* Ejemplo 5: Rating interactivo */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">5. Rating Interactivo</h2>
        <p className="text-gray-600">Permite al usuario seleccionar un rating (con medias estrellas)</p>
        
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Rating actual: <strong>{interactiveRating.toFixed(1)}</strong>
          </p>
          <Rating 
            value={interactiveRating} 
            onChange={setInteractiveRating}
            size="lg"
          />
          <p className="text-xs text-gray-500">
            Haz clic en las estrellas para cambiar el rating. Puedes hacer clic en la mitad izquierda para media estrella.
          </p>
        </div>
      </section>

      {/* Ejemplo 6: Rating con precisión de enteros */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">6. Rating con Precisión de Enteros</h2>
        <p className="text-gray-600">Solo permite valores enteros (1, 2, 3, 4, 5)</p>
        
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Rating actual: <strong>{precisionRating}</strong>
          </p>
          <Rating 
            value={precisionRating} 
            onChange={setPrecisionRating}
            precision={1}
            size="lg"
          />
          <p className="text-xs text-gray-500">
            Este rating solo acepta valores enteros.
          </p>
        </div>
      </section>

      {/* Ejemplo 7: Rating en ProductCard */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">7. Uso en ProductCard</h2>
        <p className="text-gray-600">Ejemplo de cómo se vería en una tarjeta de producto</p>
        
        <div className="max-w-sm border rounded-lg p-4 space-y-3">
          <div className="aspect-square bg-gray-200 rounded-md"></div>
          <h3 className="font-semibold text-lg">Laptop Gaming XYZ</h3>
          <Rating value={4.3} readOnly showValue reviewCount={456} size="sm" />
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary-600">€1,299</span>
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              Agregar al carrito
            </button>
          </div>
        </div>
      </section>

      {/* Ejemplo 8: Rating en ProductDetail */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">8. Uso en ProductDetail</h2>
        <p className="text-gray-600">Ejemplo de cómo se vería en la página de detalle de producto</p>
        
        <div className="border rounded-lg p-6 space-y-4">
          <h3 className="text-2xl font-bold">Monitor 4K Ultra HD 32"</h3>
          <div className="flex items-center gap-4">
            <Rating value={4.7} readOnly showValue reviewCount={1234} size="md" />
            <span className="text-sm text-gray-500">|</span>
            <a href="#reviews" className="text-sm text-primary-600 hover:underline">
              Ver todas las reviews
            </a>
          </div>
          <div className="text-3xl font-bold text-primary-600">€599.99</div>
        </div>
      </section>

      {/* Ejemplo 9: Formulario de review */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">9. Formulario de Review</h2>
        <p className="text-gray-600">Permite al usuario dejar su propia review</p>
        
        <div className="border rounded-lg p-6 space-y-4 max-w-md">
          <h3 className="font-semibold">Escribe tu review</h3>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Tu calificación
            </label>
            <Rating 
              value={interactiveRating} 
              onChange={setInteractiveRating}
              size="lg"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Tu comentario
            </label>
            <textarea 
              className="w-full border rounded-lg p-3 min-h-[100px]"
              placeholder="Cuéntanos tu experiencia con este producto..."
            />
          </div>
          <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            Publicar Review
          </button>
        </div>
      </section>

      {/* Ejemplo 10: Estados especiales */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">10. Estados Especiales</h2>
        <p className="text-gray-600">Diferentes estados del rating</p>
        
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <span className="w-32 text-sm text-gray-600">Sin rating (0)</span>
            <Rating value={0} readOnly showValue />
          </div>
          <div className="flex items-center gap-4">
            <span className="w-32 text-sm text-gray-600">Rating perfecto</span>
            <Rating value={5} readOnly showValue reviewCount={42} />
          </div>
          <div className="flex items-center gap-4">
            <span className="w-32 text-sm text-gray-600">Media estrella</span>
            <Rating value={0.5} readOnly showValue />
          </div>
        </div>
      </section>
    </div>
  )
}

export default RatingExamples
