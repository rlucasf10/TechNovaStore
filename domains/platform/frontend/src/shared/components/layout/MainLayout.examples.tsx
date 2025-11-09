/**
 * Ejemplos de Uso del MainLayout
 * 
 * Este archivo contiene ejemplos de cómo usar el MainLayout
 * en diferentes escenarios.
 */

import React from 'react'
import { MainLayout } from './MainLayout'
import { useToast } from '@/hooks/useToast'

// ============================================================================
// Ejemplo 1: Página Pública con Layout Completo
// ============================================================================

export function PublicPageExample() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Página Pública</h1>
        <p className="text-gray-600">
          Esta página tiene el header y footer completos.
        </p>
      </div>
    </MainLayout>
  )
}

// ============================================================================
// Ejemplo 2: Página de Autenticación (Minimal)
// ============================================================================

export function AuthPageExample() {
  return (
    <MainLayout minimal>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-6">Iniciar Sesión</h1>
          <p className="text-gray-600">
            Esta página no tiene header ni footer (modo minimal).
          </p>
        </div>
      </div>
    </MainLayout>
  )
}

// ============================================================================
// Ejemplo 3: Página con Notificaciones Toast
// ============================================================================

export function PageWithToastExample() {
  const toast = useToast()
  
  const handleSuccess = () => {
    toast.success('¡Operación exitosa!', 'Éxito')
  }
  
  const handleError = () => {
    toast.error('Ocurrió un error al procesar la solicitud', 'Error')
  }
  
  const handleWarning = () => {
    toast.warning('Esta acción no se puede deshacer', 'Advertencia')
  }
  
  const handleInfo = () => {
    toast.info('Nueva actualización disponible', 'Información')
  }
  
  const handleWithAction = () => {
    toast.show({
      type: 'success',
      title: 'Producto agregado',
      message: 'El producto se agregó al carrito',
      duration: 5000,
      action: {
        label: 'Ver carrito',
        onClick: () => {
          console.log('Ir al carrito')
        }
      }
    })
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Sistema de Notificaciones</h1>
        
        <div className="space-y-4">
          <button
            onClick={handleSuccess}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Mostrar Éxito
          </button>
          
          <button
            onClick={handleError}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Mostrar Error
          </button>
          
          <button
            onClick={handleWarning}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Mostrar Advertencia
          </button>
          
          <button
            onClick={handleInfo}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Mostrar Información
          </button>
          
          <button
            onClick={handleWithAction}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Notificación con Acción
          </button>
        </div>
      </div>
    </MainLayout>
  )
}

// ============================================================================
// Ejemplo 4: Página de Catálogo
// ============================================================================

export function CatalogPageExample() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Catálogo de Productos</h1>
          <p className="text-gray-600">
            Explora nuestra selección de productos tecnológicos
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Grid de productos */}
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
            >
              <div className="aspect-square bg-gray-200 rounded-lg mb-4" />
              <h3 className="font-semibold mb-2">Producto {i}</h3>
              <p className="text-gray-600 text-sm mb-2">Descripción breve</p>
              <p className="text-primary-600 font-bold">$999.99</p>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  )
}

// ============================================================================
// Ejemplo 5: Dashboard de Usuario
// ============================================================================

export function DashboardPageExample() {
  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Mi Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Tarjetas de dashboard */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">Pedidos Recientes</h3>
              <p className="text-3xl font-bold text-primary-600">12</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">Total Gastado</h3>
              <p className="text-3xl font-bold text-primary-600">$5,432</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">Lista de Deseos</h3>
              <p className="text-3xl font-bold text-primary-600">8</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

// ============================================================================
// Ejemplo 6: Página con Fondo Personalizado
// ============================================================================

export function CustomBackgroundExample() {
  return (
    <MainLayout>
      <div className="bg-gradient-to-b from-blue-50 to-white min-h-screen">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Bienvenido a TechNovaStore
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Tu tienda de tecnología de confianza
          </p>
          <button className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-lg font-semibold">
            Explorar Productos
          </button>
        </div>
      </div>
    </MainLayout>
  )
}

// ============================================================================
// Ejemplo 7: Página de Error 404
// ============================================================================

export function NotFoundPageExample() {
  return (
    <MainLayout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-9xl font-bold text-gray-200">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Página no encontrada
          </h2>
          <p className="text-gray-600 mb-8">
            La página que buscas no existe o ha sido movida.
          </p>
          <button className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            Volver al inicio
          </button>
        </div>
      </div>
    </MainLayout>
  )
}
