import React from 'react'
import { render, screen } from '@testing-library/react'
import { UserDashboard } from '@/customer/components/dashboard/UserDashboard'

// Jest automáticamente usa los mocks de __mocks__/
// Los hooks mockeados son: useUser, useOrders, useNotifications

describe('UserDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

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
