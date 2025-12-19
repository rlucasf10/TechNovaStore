/**
 * Sidebar Navigation Component
 * 
 * Componente de navegación lateral para móvil con menú hamburger.
 * 
 * Características:
 * - Menú hamburger con animación slide-in
 * - Navegación por categorías
 * - Enlaces rápidos a cuenta y pedidos
 * - Overlay con cierre al hacer clic fuera
 * - Accesibilidad completa (ARIA, navegación por teclado)
 * 
 * Requisitos: 4.2, 4.4
 */

'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/customer';
import {
  X,
  User,
  Package,
  Heart,
  Settings,
  LogOut,
  ChevronRight,
  Home,
  Laptop,
  Smartphone,
  Headphones,
  Monitor,
  Keyboard,
  Mouse,
  Tag,
  HelpCircle,
} from 'lucide-react';

// ============================================================================
// Tipos
// ============================================================================

export interface SidebarProps {
  /** Controla si el sidebar está abierto */
  isOpen: boolean;
  /** Callback para cerrar el sidebar */
  onClose: () => void;
  /** Categorías disponibles (opcional, usa categorías por defecto si no se proporciona) */
  categories?: Category[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAuth?: boolean;
}

// ============================================================================
// Configuración de Categorías por Defecto
// ============================================================================

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Laptops', slug: 'laptops', icon: Laptop },
  { id: '2', name: 'Smartphones', slug: 'smartphones', icon: Smartphone },
  { id: '3', name: 'Componentes', slug: 'componentes', icon: Monitor },
  { id: '4', name: 'Periféricos', slug: 'perifericos', icon: Keyboard },
  { id: '5', name: 'Audio', slug: 'audio', icon: Headphones },
  { id: '6', name: 'Accesorios', slug: 'accesorios', icon: Mouse },
];

// ============================================================================
// Configuración de Enlaces Rápidos
// ============================================================================

const QUICK_LINKS: NavItem[] = [
  {
    label: 'Inicio',
    href: '/',
    icon: Home,
  },
  {
    label: 'Ofertas',
    href: '/ofertas',
    icon: Tag,
  },
  {
    label: 'Soporte',
    href: '/soporte',
    icon: HelpCircle,
  },
];

const USER_LINKS: NavItem[] = [
  {
    label: 'Mi Perfil',
    href: '/dashboard/usuario/perfil',
    icon: User,
    requiresAuth: true,
  },
  {
    label: 'Mis Pedidos',
    href: '/dashboard/usuario/pedidos',
    icon: Package,
    requiresAuth: true,
  },
  {
    label: 'Lista de Deseos',
    href: '/dashboard/usuario/wishlist',
    icon: Heart,
    requiresAuth: true,
  },
  {
    label: 'Configuración',
    href: '/dashboard/usuario/configuracion',
    icon: Settings,
    requiresAuth: true,
  },
];

// ============================================================================
// Componente Sidebar
// ============================================================================

export function Sidebar({ isOpen, onClose, categories = DEFAULT_CATEGORIES }: SidebarProps) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // ============================================================================
  // Efecto: Trap de foco para accesibilidad
  // ============================================================================

  useEffect(() => {
    if (!isOpen) return;

    // Enfocar el primer elemento cuando se abre
    firstFocusableRef.current?.focus();

    // Manejar tecla Escape
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Trap de foco dentro del sidebar
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = sidebarRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTab);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
    };
  }, [isOpen, onClose]);

  // ============================================================================
  // Efecto: Prevenir scroll del body cuando el sidebar está abierto
  // ============================================================================

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleLinkClick = () => {
    onClose();
  };

  // ============================================================================
  // Render: No renderizar nada si está cerrado
  // ============================================================================

  if (!isOpen) return null;

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      {/* ============================================================ */}
      {/* Overlay */}
      {/* ============================================================ */}
      
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ============================================================ */}
      {/* Sidebar */}
      {/* ============================================================ */}
      
      <div
        ref={sidebarRef}
        className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-slate-800 shadow-2xl z-50 animate-slide-in-right"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        <div className="flex flex-col h-full">
          
          {/* ============================================================ */}
          {/* Header del Sidebar */}
          {/* ============================================================ */}
          
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 bg-primary-50 dark:bg-slate-900">
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Menú</span>
            <button
              ref={firstFocusableRef}
              onClick={onClose}
              className="p-2 text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Cerrar menú"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* ============================================================ */}
          {/* Contenido del Sidebar (Scrollable) */}
          {/* ============================================================ */}
          
          <div className="flex-1 overflow-y-auto">
            
            {/* ============================================================ */}
            {/* Sección de Usuario */}
            {/* ============================================================ */}
            
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-primary-50 to-white dark:from-slate-900 dark:to-slate-800">
              {isAuthenticated && user ? (
                <Link
                  href="/dashboard/usuario"
                  onClick={handleLinkClick}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-12 h-12 rounded-full object-cover border-2 border-primary-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center border-2 border-primary-200">
                      <span className="text-white font-semibold text-lg">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Ver mi perfil</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    onClick={handleLinkClick}
                    className="flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm"
                  >
                    <User className="w-5 h-5" />
                    <span>Iniciar Sesión</span>
                  </Link>
                  <Link
                    href="/registro"
                    onClick={handleLinkClick}
                    className="flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    ¿No tienes cuenta? Regístrate
                  </Link>
                </div>
              )}
            </div>

            {/* ============================================================ */}
            {/* Enlaces Rápidos */}
            {/* ============================================================ */}
            
            <div className="p-4 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Navegación
              </h3>
              <nav className="space-y-1">
                {QUICK_LINKS.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={handleLinkClick}
                      className={`
                        flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                        ${
                          isActive
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shadow-sm'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span>{link.label}</span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 bg-primary-600 rounded-full" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* ============================================================ */}
            {/* Categorías */}
            {/* ============================================================ */}
            
            <div className="p-4 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Categorías
              </h3>
              <nav className="space-y-1">
                {categories.map((category) => {
                  const Icon = category.icon || Package;
                  const categoryPath = `/categorias/${category.slug}`;
                  const isActive = pathname === categoryPath;
                  
                  return (
                    <Link
                      key={category.id}
                      href={categoryPath}
                      onClick={handleLinkClick}
                      className={`
                        flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                        ${
                          isActive
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shadow-sm'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span>{category.name}</span>
                      <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* ============================================================ */}
            {/* Mi Cuenta (Solo si está autenticado) */}
            {/* ============================================================ */}
            
            {isAuthenticated && (
              <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Mi Cuenta
                </h3>
                <nav className="space-y-1">
                  {USER_LINKS.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={handleLinkClick}
                        className={`
                          flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                          ${
                            isActive
                              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shadow-sm'
                              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700'
                          }
                        `}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span>{link.label}</span>
                        {isActive && (
                          <div className="ml-auto w-1.5 h-1.5 bg-primary-600 rounded-full" />
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* Footer del Sidebar (Cerrar Sesión) */}
          {/* ============================================================ */}
          
          {isAuthenticated && (
            <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-error dark:text-red-400 hover:bg-error hover:bg-opacity-10 dark:hover:bg-red-900/20 transition-all"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Sidebar;
