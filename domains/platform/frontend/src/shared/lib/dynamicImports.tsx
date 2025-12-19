import dynamic from 'next/dynamic'
import { ComponentType, ReactNode } from 'react'

interface DynamicOptions {
  loading?: () => ReactNode
  ssr?: boolean
}

const DefaultLoading = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
  </div>
)

export const SectionLoading = () => (
  <div className="animate-pulse space-y-4 p-8">
    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
  </div>
)

export const ModalLoading = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Cargando...</p>
    </div>
  </div>
)

export function createDynamicComponent<P = Record<string, unknown>>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: DynamicOptions = {}
) {
  return dynamic(importFn, {
    loading: options.loading || DefaultLoading,
    ssr: options.ssr !== false,
  })
}

export function createClientOnlyComponent<P = Record<string, unknown>>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  loading?: () => ReactNode
) {
  return dynamic(importFn, {
    loading: loading || DefaultLoading,
    ssr: false,
  })
}

export function preloadComponent(importFn: () => Promise<unknown>): void {
  importFn()
}

export function usePreloadOnHover(importFn: () => Promise<unknown>) {
  return {
    onMouseEnter: () => preloadComponent(importFn),
    onFocus: () => preloadComponent(importFn),
  }
}

export const LAZY_ROUTES = {
  admin: ['/dashboard/admin', '/admin'],
  user: ['/dashboard/usuario', '/pedidos', '/wishlist'],
  checkout: ['/checkout', '/carrito'],
  auth: ['/login', '/registro', '/recuperar-contrasena', '/restablecer-contrasena'],
} as const

export function shouldLazyLoad(
  pathname: string,
  category: keyof typeof LAZY_ROUTES
): boolean {
  return LAZY_ROUTES[category].some(route => pathname.startsWith(route))
}
