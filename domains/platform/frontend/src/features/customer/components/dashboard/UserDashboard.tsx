'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { OrderHistory } from './OrderHistory'
import { VirtualizedOrderHistory } from './VirtualizedOrderHistory'
import { OrderTracking } from './OrderTracking'
import { NotificationCenter } from './NotificationCenter'
import { GdprDashboard } from './GdprDashboard'
import { WelcomeCard } from './WelcomeCard'
import { RecentOrdersCard } from './RecentOrdersCard'
import { StatisticsCard } from './StatisticsCard'
import { RecommendationsCard } from './RecommendationsCard'
import { NotificationsCard } from './NotificationsCard'
import { QuickActionsCard } from './QuickActionsCard'
import { ProfileInformation } from './ProfileInformation'
import { SecuritySettings } from './SecuritySettings'
import { PreferencesSettings } from './PreferencesSettings'
import { AuthMethodsManagement } from './AuthMethodsManagement'
import { AddressManagement } from './AddressManagement'
import { PaymentMethodManagement } from './PaymentMethodManagement'
import { WishlistView } from './WishlistView'
import { AvatarWithFallback } from '@/shared/components/ui/AvatarWithFallback'
import { Order } from '@/types'
import { useUser } from '@/customer'
import { useOrders } from '@/commerce'
import { useNotifications } from '@/customer'
import { 
  ShoppingBag, 
  Truck, 
  Bell, 
  User, 
  Shield, 
  Settings,
  Home,
  Heart,
  MapPin,
  CreditCard,
  HelpCircle,
  ChevronRight
} from 'lucide-react'

type DashboardTab = 'overview' | 'orders' | 'tracking' | 'notifications' | 'profile' | 'security' | 'wishlist' | 'addresses' | 'payment' | 'support'

interface NavItem {
  id: DashboardTab
  label: string
  icon: React.ReactNode
  count?: number
  badge?: string
}

// Lista de tabs válidas (whitelist para seguridad)
const VALID_TABS: DashboardTab[] = ['overview', 'orders', 'tracking', 'notifications', 'profile', 'security', 'wishlist', 'addresses', 'payment', 'support']

export function UserDashboard() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { user, loading: userLoading } = useUser()

  // Función para cambiar de tab y actualizar la URL
  const handleTabChange = useCallback((tab: DashboardTab) => {
    // Validar que el tab sea válido (seguridad)
    if (!VALID_TABS.includes(tab)) return
    
    setActiveTab(tab)
    
    // Actualizar la URL con el parámetro tab
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'overview') {
      // Para overview, quitar el parámetro (URL limpia)
      params.delete('tab')
    } else {
      params.set('tab', tab)
    }
    
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.push(newUrl, { scroll: false })
  }, [searchParams, pathname, router])

  // Leer el parámetro 'tab' de la URL para establecer la sección inicial
  useEffect(() => {
    const tabParam = searchParams.get('tab') as DashboardTab | null
    if (tabParam && VALID_TABS.includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  const { orders, loading: ordersLoading, refetch: refetchOrders } = useOrders()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Acceso Requerido</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Debes iniciar sesión para acceder a tu dashboard</p>
            <a
              href="/login"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
            >
              Iniciar Sesión
            </a>
          </div>
        </div>
      </div>
    )
  }

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Resumen', icon: <Home className="w-5 h-5" /> },
    { id: 'orders', label: 'Mis Pedidos', icon: <ShoppingBag className="w-5 h-5" />, count: orders?.length },
    { id: 'tracking', label: 'Seguimiento', icon: <Truck className="w-5 h-5" />, count: orders?.filter((o: Order) => o.tracking_number).length },
    { id: 'wishlist', label: 'Lista de Deseos', icon: <Heart className="w-5 h-5" /> },
    { id: 'profile', label: 'Mi Perfil', icon: <User className="w-5 h-5" /> },
    { id: 'addresses', label: 'Direcciones', icon: <MapPin className="w-5 h-5" /> },
    { id: 'payment', label: 'Métodos de Pago', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'notifications', label: 'Notificaciones', icon: <Bell className="w-5 h-5" />, count: unreadCount },
    { id: 'security', label: 'Seguridad', icon: <Shield className="w-5 h-5" /> },
    { id: 'support', label: 'Soporte', icon: <HelpCircle className="w-5 h-5" /> }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header del Dashboard - Mejorado */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Botón hamburger para móvil */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-900 dark:text-gray-100"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Dashboard
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Hola, {user.firstName} 👋
                </h1>
              </div>
            </div>

            {/* Acciones rápidas */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTabChange('notifications')}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Notificaciones"
              >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              
              <button
                onClick={() => handleTabChange('profile')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Perfil"
              >
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation - Mejorado con diseño 20% */}
          <aside className={`
            lg:w-1/5 lg:block flex-shrink-0
            ${isSidebarOpen ? 'block' : 'hidden'}
            lg:sticky lg:top-24 lg:self-start
          `}>
            <nav className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
              {/* Perfil compacto en sidebar */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  {/* Avatar con fallback a iniciales si no hay imagen o falla */}
                  <AvatarWithFallback
                    src={user.avatar}
                    alt={`${user.firstName} ${user.lastName}`}
                    firstName={user.firstName}
                    lastName={user.lastName}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Navegación */}
              <ul className="p-2">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        handleTabChange(item.id)
                        setIsSidebarOpen(false)
                      }}
                      className={`
                        w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200
                        ${activeTab === item.id
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium shadow-sm'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <span className={activeTab === item.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}>
                          {item.icon}
                        </span>
                        <span className="text-sm">{item.label}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {item.count !== undefined && item.count > 0 && (
                          <span className={`
                            px-2 py-0.5 text-xs rounded-full font-medium
                            ${activeTab === item.id
                              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                              : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
                            }
                          `}>
                            {item.count}
                          </span>
                        )}
                        {activeTab === item.id && (
                          <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>

              {/* Botón para Dashboard de Admin (solo para admins) */}
              {user.role === 'admin' && (
                <div className="p-2 border-t border-gray-200">
                  <a
                    href="/dashboard/admin"
                    className="flex items-center justify-center gap-2 w-full px-3 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Panel Admin</span>
                  </a>
                </div>
              )}
            </nav>

            {/* Tarjeta de ayuda rápida */}
            <div className="mt-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">¿Necesitas ayuda?</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Nuestro equipo está aquí para ti</p>
                  <button
                    onClick={() => handleTabChange('support')}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    Contactar soporte →
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content - 80% */}
          <main className="flex-1 lg:w-4/5">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
              {activeTab === 'overview' && (
                <div className="p-6 space-y-6">
                  {/* Tarjeta de Bienvenida */}
                  <WelcomeCard user={user} />

                  {/* Grid de 2 columnas para tarjetas principales */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pedidos Recientes */}
                    <RecentOrdersCard
                      orders={orders || []}
                      loading={ordersLoading}
                      onViewAll={() => handleTabChange('orders')}
                    />

                    {/* Notificaciones */}
                    <NotificationsCard
                      notifications={notifications || []}
                      onViewAll={() => handleTabChange('notifications')}
                      onMarkAsRead={markAsRead}
                      onMarkAllAsRead={markAllAsRead}
                    />
                  </div>

                  {/* Tarjeta de Estadísticas - Full width */}
                  <StatisticsCard
                    orders={orders || []}
                  />

                  {/* Tarjeta de Recomendaciones - Full width */}
                  <RecommendationsCard
                    userId={String(user.id)}
                    onViewProduct={(productId) => {
                      window.location.href = `/productos/${String(productId)}`
                    }}
                  />

                  {/* Tarjeta de Acciones Rápidas - Full width */}
                  <QuickActionsCard
                    onTrackOrder={() => handleTabChange('tracking')}
                    onContactSupport={() => handleTabChange('support')}
                    onViewOffers={() => window.location.href = '/ofertas'}
                  />
                </div>
              )}

              {activeTab === 'orders' && (
                // Usar lista virtualizada si hay más de 10 pedidos
                (orders && orders.length > 10) ? (
                  <VirtualizedOrderHistory
                    orders={orders}
                    loading={ordersLoading}
                    onRefresh={refetchOrders}
                  />
                ) : (
                  <OrderHistory
                    orders={orders || []}
                    loading={ordersLoading}
                    onRefresh={refetchOrders}
                  />
                )
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
              
              {activeTab === 'wishlist' && (
                <WishlistView />
              )}
              
              {activeTab === 'profile' && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Mi Perfil</h2>
                  <div className="space-y-6">
                    {/* Información Personal */}
                    <ProfileInformation
                      user={{
                        id: String(user.id),
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        phone: user.phone,
                        avatar: user.avatar,
                      }}
                      onUpdate={async (data) => {
                        // TODO: Implementar actualización de perfil
                        console.log('Updating profile:', data)
                      }}
                    />

                    {/* Preferencias */}
                    <PreferencesSettings
                      onUpdate={async (preferences) => {
                        // TODO: Implementar actualización de preferencias
                        console.log('Updating preferences:', preferences)
                      }}
                    />

                    {/* Métodos de Autenticación */}
                    <AuthMethodsManagement
                      authMethods={user.authMethods || []}
                      onSetPassword={() => {
                        // TODO: Abrir modal de establecer contraseña
                        alert('Funcionalidad de establecer contraseña próximamente')
                      }}
                      onChangePassword={() => {
                        handleTabChange('security')
                      }}
                    />

                    {/* Sección de Privacidad y Datos (GDPR/LOPD) */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <Shield className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Privacidad y Datos</h3>
                            <p className="text-sm text-gray-600">Gestiona tus datos personales (GDPR/LOPD)</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        <GdprDashboard />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'addresses' && (
                <div className="p-6">
                  <AddressManagement />
                </div>
              )}

              {activeTab === 'payment' && (
                <div className="p-6">
                  <PaymentMethodManagement />
                </div>
              )}
              
              {activeTab === 'security' && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Configuración de Seguridad</h2>
                  <SecuritySettings
                    has2FA={false}
                    onChangePassword={async (_data) => {
                      // TODO: Implementar cambio de contraseña
                      // ✅ SEGURIDAD: NO loguear passwords
                      // console.log('Changing password:', data) // ❌ NUNCA loguear passwords
                    }}
                    onEnable2FA={async () => {
                      // TODO: Implementar activación de 2FA
                      console.log('Enabling 2FA')
                    }}
                    onDisable2FA={async () => {
                      // TODO: Implementar desactivación de 2FA
                      console.log('Disabling 2FA')
                    }}
                    onTerminateSession={async (sessionId) => {
                      // TODO: Implementar cierre de sesión
                      console.log('Terminating session:', sessionId)
                    }}
                  />
                </div>
              )}

              {activeTab === 'support' && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Centro de Soporte</h2>
                  <div className="max-w-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                        <HelpCircle className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Preguntas Frecuentes</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Encuentra respuestas rápidas</p>
                        <a href="/faq" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                          Ver FAQ →
                        </a>
                      </div>

                      <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-6 border border-green-200 dark:border-green-800">
                        <Bell className="w-8 h-8 text-green-600 dark:text-green-400 mb-3" />
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Chat en Vivo</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Habla con un agente</p>
                        <button className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium">
                          Iniciar Chat →
                        </button>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Contacto por Email</h3>
                      <form className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asunto</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                            placeholder="¿En qué podemos ayudarte?"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mensaje</label>
                          <textarea
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                            placeholder="Describe tu consulta..."
                          />
                        </div>
                        <button
                          type="submit"
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Enviar Mensaje
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Overlay para cerrar sidebar en móvil */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  )
}
