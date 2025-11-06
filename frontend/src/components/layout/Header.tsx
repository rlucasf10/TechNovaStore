/**
 * Header Component
 * 
 * Componente de encabezado principal de la aplicación.
 * 
 * Características:
 * - Logo con link a home
 * - Barra de búsqueda global (placeholder)
 * - Navegación principal: Categorías, Ofertas, Soporte
 * - Iconos: Usuario, Carrito (con contador), Notificaciones
 * - Sticky header en scroll
 * - Responsive con hamburger menu en móvil
 * 
 * Requisitos: 4.1, 17.1
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCartStore } from '@/store/cart.store';
import { NotificationDropdown } from './NotificationDropdown';
import { GlobalSearch } from './GlobalSearch';
import { CartDropdown } from '@/components/cart';
import {
  ShoppingCart,
  Bell,
  User,
  Menu,
  X,
  Package,
} from 'lucide-react';

// ============================================================================
// Tipos
// ============================================================================

interface NavLink {
  label: string;
  href: string;
}

// ============================================================================
// Configuración de Navegación
// ============================================================================

const NAV_LINKS: NavLink[] = [
  { label: 'Categorías', href: '/categorias' },
  { label: 'Ofertas', href: '/ofertas' },
  { label: 'Soporte', href: '/soporte' },
];

// ============================================================================
// Componente Header
// ============================================================================

export function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const cartItemCount = useCartStore((state) => state.getTotalItems());
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // ============================================================================
  // Efecto: Detectar si el componente está montado (evitar hydration mismatch)
  // ============================================================================

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ============================================================================
  // Efecto: Detectar scroll para sticky header
  // ============================================================================

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ============================================================================
  // Efecto: Cerrar menú móvil al cambiar de ruta
  // ============================================================================

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsCartOpen(false);
  }, [pathname]);

  // ============================================================================
  // Efecto: Cerrar dropdown al hacer clic fuera
  // ============================================================================

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isCartOpen && !target.closest('[aria-label*="Carrito"]') && !target.closest('[role="dialog"]')) {
        setIsCartOpen(false);
      }
    };

    if (isCartOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isCartOpen]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-300
          ${isScrolled ? 'shadow-md' : 'shadow-sm'}
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* ============================================================ */}
            {/* Logo */}
            {/* ============================================================ */}
            
            <div className="flex items-center">
              <Link
                href="/"
                className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors"
              >
                <svg
                  className="w-8 h-8"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="32" height="32" rx="6" fill="currentColor" />
                  <path
                    d="M8 12h16M8 16h16M8 20h10"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-xl font-bold hidden sm:inline">
                  TechNovaStore
                </span>
                <span className="text-xl font-bold sm:hidden">
                  TNS
                </span>
              </Link>
            </div>

            {/* ============================================================ */}
            {/* Barra de Búsqueda (Desktop) */}
            {/* ============================================================ */}
            
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <GlobalSearch className="w-full" />
            </div>

            {/* ============================================================ */}
            {/* Navegación Principal (Desktop) */}
            {/* ============================================================ */}
            
            <nav className="hidden lg:flex items-center space-x-6">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    text-sm font-medium transition-colors
                    ${
                      pathname === link.href
                        ? 'text-primary-600'
                        : 'text-gray-700 hover:text-primary-600'
                    }
                  `}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* ============================================================ */}
            {/* Iconos de Acción (Desktop) */}
            {/* ============================================================ */}
            
            <div className="hidden md:flex items-center space-x-4">
              
              {/* Notificaciones - Dropdown en desktop (solo si está autenticado) */}
              {isAuthenticated && <NotificationDropdown />}

              {/* Carrito */}
              <div className="relative">
                <button
                  onClick={() => setIsCartOpen(!isCartOpen)}
                  className="relative p-2 text-gray-700 hover:text-primary-600 transition-colors"
                  aria-label={`Carrito (${isMounted ? cartItemCount : 0} items)`}
                  aria-expanded={isCartOpen}
                >
                  <ShoppingCart className="w-6 h-6" />
                  {isMounted && cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {cartItemCount > 9 ? '9+' : cartItemCount}
                    </span>
                  )}
                </button>
                
                {/* Cart Dropdown */}
                <CartDropdown 
                  isOpen={isCartOpen} 
                  onClose={() => setIsCartOpen(false)} 
                />
              </div>

              {/* Usuario */}
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 p-2 text-gray-700 hover:text-primary-600 transition-colors"
                  aria-label="Mi cuenta"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-semibold text-sm">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium hidden xl:inline">
                    {user?.firstName}
                  </span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span>Iniciar Sesión</span>
                </Link>
              )}
            </div>

            {/* ============================================================ */}
            {/* Botón Hamburger (Mobile) */}
            {/* ============================================================ */}
            
            <div className="flex md:hidden items-center space-x-2">
              
              {/* Carrito (Mobile) */}
              <div className="relative">
                <button
                  onClick={() => setIsCartOpen(!isCartOpen)}
                  className="relative p-2 text-gray-700"
                  aria-label={`Carrito (${isMounted ? cartItemCount : 0} items)`}
                  aria-expanded={isCartOpen}
                >
                  <ShoppingCart className="w-6 h-6" />
                  {isMounted && cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {cartItemCount > 9 ? '9+' : cartItemCount}
                    </span>
                  )}
                </button>
                
                {/* Cart Dropdown - Mobile */}
                <CartDropdown 
                  isOpen={isCartOpen} 
                  onClose={() => setIsCartOpen(false)} 
                />
              </div>

              {/* Hamburger Menu */}
              <button
                onClick={toggleMobileMenu}
                className="p-2 text-gray-700 hover:text-primary-600 transition-colors"
                aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* ============================================================ */}
          {/* Barra de Búsqueda (Mobile) */}
          {/* ============================================================ */}
          
          <div className="md:hidden pb-3">
            <GlobalSearch placeholder="Buscar productos..." />
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* Menú Mobile (Sidebar) */}
      {/* ============================================================ */}
      
      {isMobileMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={toggleMobileMenu}
            aria-hidden="true"
          />

          {/* Sidebar */}
          <div
            className="fixed top-0 right-0 bottom-0 w-64 bg-white shadow-xl z-50 md:hidden animate-slide-in-right"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
          >
            <div className="flex flex-col h-full">
              
              {/* Header del Sidebar */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <span className="text-lg font-semibold text-gray-900">Menú</span>
                <button
                  onClick={toggleMobileMenu}
                  className="p-2 text-gray-700 hover:text-primary-600 transition-colors"
                  aria-label="Cerrar menú"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Contenido del Sidebar */}
              <div className="flex-1 overflow-y-auto">
                
                {/* Usuario */}
                <div className="p-4 border-b border-gray-200">
                  {isAuthenticated ? (
                    <Link
                      href="/dashboard"
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={`${user.firstName} ${user.lastName}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-semibold">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">Ver perfil</p>
                      </div>
                    </Link>
                  ) : (
                    <Link
                      href="/login"
                      className="flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                    >
                      <User className="w-5 h-5" />
                      <span>Iniciar Sesión</span>
                    </Link>
                  )}
                </div>

                {/* Navegación */}
                <nav className="p-4 space-y-2">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`
                        block px-4 py-3 rounded-lg text-sm font-medium transition-colors
                        ${
                          pathname === link.href
                            ? 'bg-primary-50 text-primary-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>

                {/* Acciones Rápidas */}
                <div className="p-4 border-t border-gray-200 space-y-2">
                  <Link
                    href="/notificaciones"
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    <span>Notificaciones</span>
                    <span className="ml-auto w-2 h-2 bg-error rounded-full" />
                  </Link>
                  
                  {isAuthenticated && (
                    <>
                      <Link
                        href="/dashboard/pedidos"
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Package className="w-5 h-5" />
                        <span>Mis Pedidos</span>
                      </Link>
                      
                      <Link
                        href="/dashboard/perfil"
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="w-5 h-5" />
                        <span>Mi Perfil</span>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Spacer para compensar el header fixed */}
      <div className="h-16" />
    </>
  );
}

export default Header;
