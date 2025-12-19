/**
 * Componente de Tabla de Productos Más Vendidos
 * 
 * Muestra una tabla con los productos más vendidos durante la campaña,
 * incluyendo nombre, unidades vendidas e ingresos.
 * 
 * Requirements: 15.4
 */

'use client';

import { useState, useMemo } from 'react';
import type { TopProduct } from '@/shared/types';

interface TopProductsTableProps {
  products: TopProduct[];
}

// Formatear moneda en euros
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Formatear número con separadores de miles
const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('es-ES').format(value);
};

// Número de productos por página
const ITEMS_PER_PAGE = 10;

export function TopProductsTable({ products }: TopProductsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'unitsSold' | 'revenue'>('unitsSold');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Ordenar productos
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      return sortDirection === 'desc' ? bValue - aValue : aValue - bValue;
    });
  }, [products, sortField, sortDirection]);

  // Paginar productos
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedProducts, currentPage]);

  // Calcular número total de páginas
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);

  // Manejar cambio de ordenamiento
  const handleSort = (field: 'unitsSold' | 'revenue') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  // Obtener icono de ordenamiento
  const getSortIcon = (field: 'unitsSold' | 'revenue') => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'desc' ? '↓' : '↑';
  };

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🏆 Productos Más Vendidos
        </h3>
        <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No hay datos de productos disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          🏆 Productos Más Vendidos
        </h3>
        <span className="text-sm text-gray-500">
          {products.length} productos en total
        </span>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                #
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Producto
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Categoría
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Descuento
              </th>
              <th
                className="text-right py-3 px-4 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('unitsSold')}
              >
                <span className="flex items-center justify-end space-x-1">
                  <span>Unidades</span>
                  <span>{getSortIcon('unitsSold')}</span>
                </span>
              </th>
              <th
                className="text-right py-3 px-4 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('revenue')}
              >
                <span className="flex items-center justify-end space-x-1">
                  <span>Ingresos</span>
                  <span>{getSortIcon('revenue')}</span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((product, index) => {
              const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
              const isTopThree = globalIndex <= 3 && sortField === 'unitsSold' && sortDirection === 'desc';
              
              return (
                <tr
                  key={product.productId}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    isTopThree ? 'bg-yellow-50' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <span className={`text-sm font-medium ${
                      isTopThree ? 'text-yellow-600' : 'text-gray-500'
                    }`}>
                      {globalIndex === 1 && '🥇'}
                      {globalIndex === 2 && '🥈'}
                      {globalIndex === 3 && '🥉'}
                      {globalIndex > 3 && globalIndex}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-xs" title={product.productName}>
                        {product.productName}
                      </p>
                      <p className="text-xs text-gray-500">
                        ID: {product.productId.substring(0, 8)}...
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">
                      {product.category || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      -{product.discountPercentage}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm font-medium text-gray-900">
                      {formatNumber(product.unitsSold)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(product.revenue)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, products.length)} de{' '}
            {products.length} productos
          </p>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            
            {/* Números de página */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm rounded ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Resumen */}
      <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {formatNumber(products.reduce((sum, p) => sum + p.unitsSold, 0))}
          </p>
          <p className="text-sm text-gray-500">Total Unidades</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(products.reduce((sum, p) => sum + p.revenue, 0))}
          </p>
          <p className="text-sm text-gray-500">Total Ingresos</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">
            {(products.reduce((sum, p) => sum + p.discountPercentage, 0) / products.length).toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500">Descuento Promedio</p>
        </div>
      </div>
    </div>
  );
}
