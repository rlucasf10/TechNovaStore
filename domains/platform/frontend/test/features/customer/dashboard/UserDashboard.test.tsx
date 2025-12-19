import React from 'react'
import { render, screen } from '@testing-library/react'
import { UserDashboard } from '@/customer/components/dashboard/UserDashboard'

// Mock de useUser desde @/customer
jest.mock('@/customer', () => ({
  useUser: () => ({
    user: {
      id: '1',
      first_name: 'Juan',
      last_name: 'García',
      email: 'juan@example.com',
      role: 'customer',
    },
    loading: false,
    error: null,
  }),
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  }),
}))

// Mock de useOrders desde @/commerce
jest.mock('@/commerce', () => ({
  useOrders: () => ({
    orders: [],
    loading: false,
    error: null,
    refetch: jest.fn(),
  }),
}))

describe('UserDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders welcome message with user name', () => {
    render(<UserDashboard />)
    
    // El componente muestra "Hola, Juan 👋" - el texto está dividido en elementos
    // Usamos una función para buscar el texto completo
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent(/Hola,/)
    expect(heading).toHaveTextContent(/Juan/)
  })

  it('renders navigation tabs', () => {
    render(<UserDashboard />)
    
    // Verificar que existen los elementos de navegación
    expect(screen.getByText('Mis Pedidos')).toBeInTheDocument()
    expect(screen.getByText('Seguimiento')).toBeInTheDocument()
    // Usar getAllByText porque "Notificaciones" aparece múltiples veces
    expect(screen.getAllByText('Notificaciones').length).toBeGreaterThan(0)
    expect(screen.getByText('Mi Perfil')).toBeInTheDocument()
  })

  it('renders dashboard content when user is authenticated', () => {
    render(<UserDashboard />)
    
    // El componente muestra "Resumen de tu cuenta" en la vista overview
    expect(screen.getByText('Resumen de tu cuenta')).toBeInTheDocument()
    // Verificar que muestra el contador de pedidos
    expect(screen.getByText('Total Pedidos')).toBeInTheDocument()
  })
})
