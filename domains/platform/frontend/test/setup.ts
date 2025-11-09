/**
 * Configuración global para tests del frontend
 * 
 * Este archivo se ejecuta antes de todos los tests y configura:
 * - Testing Library
 * - Mocks globales de Next.js
 * - Mocks de localStorage y sessionStorage
 * - Configuración de variables de entorno para tests
 */

import '@testing-library/jest-dom'

// Mock de Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
  useParams() {
    return {}
  },
  redirect: jest.fn(),
  notFound: jest.fn(),
}))

// Mock de Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: jest.fn((props) => props),
}))

// Mock de Next.js Link
jest.mock('next/link', () => ({
  __esModule: true,
  default: jest.fn(({ children }) => children),
}))

// Mock de localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
}
global.localStorage = localStorageMock as any

// Mock de sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
}
global.sessionStorage = sessionStorageMock as any

// Mock de window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock de IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
} as any

// Mock de ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any

// Mock de EventSource para tests de notificaciones en tiempo real
global.EventSource = class EventSource {
  url: string
  onmessage: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null
  onopen: ((event: any) => void) | null = null
  readyState: number = 0
  CONNECTING = 0
  OPEN = 1
  CLOSED = 2

  constructor(url: string) {
    this.url = url
  }

  close() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {
    return true
  }
} as any

// Habilitar mocks automáticos de Jest para hooks y stores
// Los mocks están en los directorios __mocks__ junto a los archivos originales
// Jest los cargará automáticamente cuando se llame a jest.mock()

// Activar mocks automáticos para los módulos que tienen __mocks__
// Usar rutas relativas desde src/
jest.mock('../src/features/customer/hooks/useAuth')
jest.mock('../src/features/customer/hooks/useUser')
jest.mock('../src/features/customer/hooks/useNotifications')
jest.mock('../src/features/commerce/hooks/useOrders')
jest.mock('../src/features/commerce/store/cart.store')
jest.mock('../src/shared/store/notification.store')
jest.mock('../src/features/customer/services/auth.service')

// Configurar variables de entorno para tests
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000'
process.env.NEXT_PUBLIC_CHATBOT_URL = 'http://localhost:3009'
process.env.NEXT_PUBLIC_SOCKET_URL = 'http://localhost:3009'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3011'

// Limpiar mocks después de cada test
afterEach(() => {
  jest.clearAllMocks()
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()
  sessionStorageMock.getItem.mockClear()
  sessionStorageMock.setItem.mockClear()
  sessionStorageMock.removeItem.mockClear()
  sessionStorageMock.clear.mockClear()
})
