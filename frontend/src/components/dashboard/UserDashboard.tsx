'use client'

import React, { useState } from 'react'
import { OrderHistory } from './OrderHistory'
import { OrderTracking } from './OrderTracking'
import { NotificationCenter } from './NotificationCenter'
import { ChangePassword } from './ChangePassword'
import { Order } from '@/types'
import { useUser } from '@/hooks/useUser'
import { useOrders } from '@/hooks/useOrders'
import { useNotifications } from '@/hooks/useNotifications'

type DashboardTab = 'orders' | 'tracking' | 'notifications' | 'profile' | 'security'

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
    { id: 'profile' as DashboardTab, label: 'Mi Perfil' },
    { id: 'security' as DashboardTab, label: 'Seguridad' }
  ]

  return (
    <div className="bg-gray-50">
      {/* Header del Dashboard */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center mb-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-blue-600 uppercase tracking-wide">
                Dashboard de Usuario
              </span>
            </div>
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

              {/* Botón para volver al Dashboard de Admin (solo para admins) */}
              {user.role === 'admin' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <a
                    href="/admin"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>Dashboard de Admin</span>
                  </a>
                </div>
              )}
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
              {activeTab === 'security' && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Configuración de Seguridad</h2>
                  <ChangePassword />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}