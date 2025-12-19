/**
 * Layout del Dashboard de Administración
 * 
 * Protege todas las rutas bajo /dashboard/admin con AdminRoute.
 * Solo los usuarios con rol de admin pueden acceder.
 * Incluye el Header principal de TechNovaStore para navegación global.
 * 
 * Características:
 * - Sidebar de navegación colapsable
 * - Responsive (sidebar como drawer en móvil)
 * - Header con información del admin
 * - Área de contenido principal con scroll independiente
 * 
 * Requisitos: 15.5
 */

'use client';

import { useState, useEffect } from 'react';
import { AdminRoute, useAuth } from '@/customer';
import { Header } from '@/shared/components/layout/Header';
import { AdminSidebar } from '@/shared/components/layout/AdminSidebar';
import { AdminSidebarProvider } from '@/shared/contexts/AdminSidebarContext';
import { Menu, Bell, Search } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  // Estado del sidebar - empieza expandido en desktop
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Información del usuario
  const { user } = useAuth();

  // ============================================================================
  // Efecto: Detectar si es móvil
  // ============================================================================

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // En móvil, el sidebar empieza cerrado
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleToggleSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  // ============================================================================
  // Calcular el margen del contenido principal
  // ============================================================================

  // Margen del contenido - sin transición para máxima velocidad
  const mainMarginLeft = isMobile ? 0 : (isSidebarCollapsed ? 72 : 256);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <AdminSidebarProvider>
      <AdminRoute>
        {/* Header Principal de TechNovaStore */}
        <Header sidebarCollapsed={isSidebarCollapsed} />
        
        <div className="flex min-h-screen bg-gray-100 pt-[72px]">
          {/* ============================================================ */}
          {/* Sidebar */}
          {/* ============================================================ */}
          
          <AdminSidebar
            isOpen={isMobile ? isSidebarOpen : true}
            onClose={handleCloseSidebar}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />

        {/* ============================================================ */}
        {/* Main Content */}
        {/* ============================================================ */}
        
        <main 
          className="flex-1" 
          style={{ 
            marginLeft: mainMarginLeft,
            transition: 'none'
          }}
        >
          {/* ============================================================ */}
          {/* Admin Header Bar */}
          {/* ============================================================ */}
          
          <header className="bg-white border-b border-gray-200 sticky top-[72px] z-20">
            <div className="px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                {/* Lado izquierdo: Botón menú (móvil) + Título */}
                <div className="flex items-center space-x-4">
                  {/* Botón hamburger solo en móvil */}
                  {isMobile && (
                    <button
                      onClick={handleToggleSidebar}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                      aria-label="Abrir menú"
                    >
                      <Menu className="w-6 h-6" />
                    </button>
                  )}
                  
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                      Panel de Administración
                    </h1>
                    <p className="text-sm text-gray-500 hidden sm:block">
                      Gestiona tu tienda TechNovaStore
                    </p>
                  </div>
                </div>

                {/* Lado derecho: Acciones rápidas */}
                <div className="flex items-center space-x-2 sm:space-x-4">
                  {/* Búsqueda rápida (solo desktop) */}
                  <div className="hidden md:flex items-center">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar..."
                        className="pl-10 pr-4 py-2 w-48 lg:w-64 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Notificaciones */}
                  <button
                    className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Ver notificaciones"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  </button>

                  {/* Badge de Admin */}
                  <span className="hidden sm:inline-flex px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                    Admin
                  </span>

                  {/* Avatar del usuario */}
                  {user && (
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </span>
                      </div>
                      <span className="hidden lg:block text-sm font-medium text-gray-700">
                        {user.firstName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* ============================================================ */}
          {/* Page Content */}
          {/* ============================================================ */}
          
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
      </AdminRoute>
    </AdminSidebarProvider>
  );
}
