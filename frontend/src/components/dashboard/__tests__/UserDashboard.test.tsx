import React from 'react'
import { render, screen } from '@testing-library/react'
import { UserDashboard } from '../UserDashboard'

// Mock the hooks
jest.mock('@/hooks/useUser', () => ({
  useUser: () => ({
    user: {
      id: 1,
      email: 'test@example.com',
      first_name: 'Juan',
      last_name: 'Pérez',
      phone: '123456789',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    loading: false,
    error: null,
    refetch: jest.fn()
  })
}))

jest.mock('@/hooks/useOrders', () => ({
  useOrders: () => ({
    orders: [],
    loading: false,
    error: null,
    refetch: jest.fn()
  })
}))

jest.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
    refetch: jest.fn()
  })
}))

describe('UserDashboard', () => {
  it('renders welcome message with user name', () => {
    render(<UserDashboard />)
    
    expect(screen.getByText('Bienvenido, Juan')).toBeInTheDocument()
    expect(screen.getByText('Gestiona tus pedidos y configuración de cuenta')).toBeInTheDocument()
  })

  it('renders navigation tabs', () => {
    render(<UserDashboard />)
    
    expect(screen.getByText('Mis Pedidos')).toBeInTheDocument()
    expect(screen.getByText('Seguimiento')).toBeInTheDocument()
    expect(screen.getByText('Notificaciones')).toBeInTheDocument()
    expect(screen.getByText('Mi Perfil')).toBeInTheDocument()
  })

  it('renders dashboard content when user is authenticated', () => {
    render(<UserDashboard />)
    
    expect(screen.getByText('Historial de Pedidos')).toBeInTheDocument()
    expect(screen.getByText('0 pedidos en total')).toBeInTheDocument()
  })
})