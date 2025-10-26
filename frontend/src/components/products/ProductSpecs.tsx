'use client'

interface ProductSpecsProps {
  specifications: Record<string, any>
}

export function ProductSpecs({ specifications }: ProductSpecsProps) {
  const formatSpecValue = (value: any): string => {
    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No'
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value)
    }
    return String(value)
  }

  const formatSpecKey = (key: string): string => {
    // Convert camelCase or snake_case to readable format
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim()
  }

  const specEntries = Object.entries(specifications || {})

  if (specEntries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Especificaciones
        </h3>
        <p className="text-gray-500 text-sm">
          No hay especificaciones disponibles para este producto.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Especificaciones Técnicas
      </h3>
      
      <div className="space-y-3">
        {specEntries.map(([key, value], index) => (
          <div
            key={key}
            className={`flex justify-between py-2 ${
              index !== specEntries.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            <dt className="text-sm font-medium text-gray-600 flex-1">
              {formatSpecKey(key)}
            </dt>
            <dd className="text-sm text-gray-900 flex-1 text-right">
              {formatSpecValue(value)}
            </dd>
          </div>
        ))}
      </div>

      {/* Additional Info */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Las especificaciones pueden variar según el lote de fabricación. 
          Consulta con nuestro equipo de soporte para información específica.
        </p>
      </div>
    </div>
  )
}