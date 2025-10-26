'use client'

import React, { useState } from 'react'
import { OrderHistory } from './OrderHistory'
import { OrderTracking } from './OrderTracking'
import { NotificationCenter } from './NotificationCenter'
import { Order } from '@/types'
import { useUser } from '@/hooks/useUser'
import { useOrders } from '@/hooks/useOrders'
import { useNotifications } from '@/hooks/useNotifications'

type DashboardTab = 'orders' | 'tracking' | 'notifications' | 'profile'

export function UserDashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('orders')
  const { user, loading: userLoading } = useUser()
  const { orders, loading: ordersLoading, refetch: refetchOrders } = useOrders()
  const { notifications, unreadCount } = useNotifications()

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso Requerido</h2>
          <p className="text-gray-600 mb-6">Debes iniciar sesión para acceder a tu dashboard</p>
          <a
            href="/login"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Iniciar Sesión
          </a>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'orders' as DashboardTab, label: 'Mis Pedidos', count: orders?.length },
    { id: 'tracking' as DashboardTab, label: 'Seguimiento', count: orders?.filter((o: Order) => o.tracking_number).length },
    { id: 'notifications' as DashboardTab, label: 'Notificaciones', count: unreadCount },
    { id: 'profile' as DashboardTab, label: 'Mi Perfil' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Bienvenido, {user.first_name}
            </h1>
            <p className="text-gray-600 mt-2">
              Gestiona tus pedidos y configuración de cuenta
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-sm p-4">
              <ul className="space-y-2">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between ${activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <span className="font-medium">{tab.label}</span>
                      {tab.count !== undefined && tab.count > 0 && (
                        <span className={`px-2 py-1 text-xs rounded-full ${activeTab === tab.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                          }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm">
              {activeTab === 'orders' && (
                <OrderHistory
                  orders={orders || []}
                  loading={ordersLoading}
                  onRefresh={refetchOrders}
                />
              )}
              {activeTab === 'tracking' && (
                <OrderTracking
                  orders={orders?.filter((o: Order) => o.tracking_number) || []}
                  loading={ordersLoading}
                />
              )}
              {activeTab === 'notifications' && (
                <NotificationCenter notifications={notifications} />
              )}
              {activeTab === 'profile' && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Mi Perfil</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-gray-900">{user.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nombre</label>
                      <p className="mt-1 text-gray-900">{user.first_name} {user.last_name}</p>
                    </div>
                    {user.phone && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                        <p className="mt-1 text-gray-900">{user.phone}</p>
                      </div>
                    )}
                    <div className="pt-4">
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Editar Perfil
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}