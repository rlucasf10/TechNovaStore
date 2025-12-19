/**
 * Header Component
 * 
 * Componente de encabezado principal de la aplicación.
 * 
 * Características:
 * - Logo SVG clickeable para abrir CategoriesDropdown
 * - Logo TechNovaStore con variantes para modo claro/oscuro/móvil
 * - Barra de búsqueda global
 * - Iconos: Notificaciones, Carrito (con contador), Perfil usuario
 * - Sticky header en scroll
 * - Responsive con menú móvil
 * - Exclusión mutua entre CategoriesDropdown y UserProfileDropdown
 * 
 * Requisitos: 1.1, 1.5, 10.1, 10.2, 10.3, 11.2, 11.3
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAuth } from '@/customer';
import { useCartStore } from '@/commerce';
import { NotificationDropdown } from './NotificationDropdown';
import { GlobalSearch } from './GlobalSearch';
import { CartDropdown } from '@/commerce';
import { UserProfileDropdown } from './UserProfileDropdown';
import { CategoriesDropdown } from './CategoriesDropdown';
import {
  ShoppingCart,
  User,
} from 'lucide-react';

// ============================================================================
// Componente LogoLink - Logo con variantes según tema y tamaño de pantalla
// ============================================================================

/**
 * Componente que muestra el logo de TechNovaStore
 * - Modo claro: technovastore_light.svg
 * - Modo oscuro: technovastore_dark.svg
 * - Pantallas pequeñas: technovastore_icon.svg
 */
function LogoLink() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evitar hydration mismatch esperando a que el componente esté montado
  useEffect(() => {
    setMounted(true);
  }, []);

  // Mientras no esté montado, mostrar placeholder vacío del mismo tamaño para evitar salto
  if (!mounted) {
    return (
      <Link href="/" className="flex items-center">
        {/* Placeholder invisible del mismo tamaño que el logo */}
        <div className="hidden sm:block h-14 w-[280px]" />
        <div className="sm:hidden h-8 w-8" />
      </Link>
    );
  }

  const logoSrc = resolvedTheme === 'dark' 
    ? '/images/technovastore_dark.svg' 
    : '/images/technovastore_light.svg';

  return (
    <Link href="/" className="flex items-center hover:opacity-90 transition-opacity flex-shrink min-w-0">
      {/* Logo completo para pantallas medianas y grandes */}
      <span className="hidden sm:block relative w-[200px] md:w-[240px] lg:w-[280px] h-[40px] md:h-[48px] lg:h-[56px]">
        <Image
          src={logoSrc}
          alt="TechNovaStore"
          fill
          className="object-contain object-left"
          priority
        />
      </span>
      {/* Icono para pantallas pequeñas (móvil) */}
      <span className="sm:hidden relative w-7 h-7 flex-shrink-0">
        <Image
          src="/images/technovastore_icon.svg"
          alt="TechNovaStore"
          fill
          className="object-contain"
          priority
        />
      </span>
    </Link>
  );
}

// ============================================================================
// Componente Header
// ============================================================================

interface HeaderProps {
  /** Estado del sidebar del admin (solo relevante en /dashboard/admin) */
  sidebarCollapsed?: boolean;
}

// Constantes del sidebar (deben coincidir con AdminSidebar)
const SIDEBAR_EXPANDED_WIDTH = 256;
const SIDEBAR_COLLAPSED_WIDTH = 72;

export function Header({ sidebarCollapsed = false }: HeaderProps) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const cartItemCount = useCartStore((state) => state.getTotalItems());
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detectar si estamos en el panel de administración
  const isAdminPanel = pathname?.startsWith('/dashboard/admin');

  // ============================================================================
  // Efecto: Detectar si el componente está montado (evitar hydration mismatch)
  // ============================================================================

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ============================================================================
  // Efecto: Detectar si es móvil (para ajustar el header en admin)
  // ============================================================================

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
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
    setIsCartOpen(false);
    setIsCategoriesOpen(false);
    setIsUserProfileOpen(false);
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

  /**
   * Toggle del menú de categorías
   * Requisito: 1.1, 1.3 - Abrir/cerrar al hacer clic en el logo
   */
  const toggleCategoriesMenu = () => {
    const newState = !isCategoriesOpen;
    setIsCategoriesOpen(newState);
    
    // Exclusión mutua: cerrar UserProfileDropdown si está abierto
    // Requisito: 11.2
    if (newState && isUserProfileOpen) {
      setIsUserProfileOpen(false);
    }
  };

  /**
   * Cerrar el menú de categorías
   */
  const closeCategoriesMenu = () => {
    setIsCategoriesOpen(false);
  };

  /**
   * Handler para cuando se abre/cierra el UserProfileDropdown
   * Implementa exclusión mutua con CategoriesDropdown
   * Requisito: 11.3
   */
  const handleUserProfileToggle = (isOpen: boolean) => {
    setIsUserProfileOpen(isOpen);
    
    // Exclusión mutua: cerrar CategoriesDropdown si está abierto
    if (isOpen && isCategoriesOpen) {
      setIsCategoriesOpen(false);
    }
  };

  // ============================================================================
  // Calcular el margen izquierdo del header cuando está en admin panel
  // En desktop (>=1024px), el header debe ajustarse al sidebar
  // En móvil (<1024px), el header ocupa todo el ancho
  // ============================================================================

  const headerLeftOffset = isAdminPanel && !isMobile 
    ? (sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH) 
    : 0;

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      <header
        id="main-navigation"
        role="banner"
        className={`
          fixed top-0 right-0 z-40 bg-white dark:bg-slate-900 transition-shadow duration-300
          ${isScrolled ? 'shadow-md' : 'shadow-sm'}
        `}
        style={{
          left: headerLeftOffset,
        }}
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-[72px] gap-2 sm:gap-3">
            
            {/* ============================================================ */}
            {/* Logo y Menú de Categorías */}
            {/* Requisitos: 1.1, 1.5, 10.2 */}
            {/* ============================================================ */}
            
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {/* Logo SVG clickeable para abrir CategoriesDropdown - Requisito 1.1 */}
              <button
                onClick={toggleCategoriesMenu}
                className="
                  p-1 sm:p-1.5 text-primary-600 hover:text-primary-700 
                  hover:bg-primary-50 rounded-lg
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-primary-500
                  flex-shrink-0
                "
                aria-label={isCategoriesOpen ? 'Cerrar menú de categorías' : 'Abrir menú de categorías'}
                aria-expanded={isCategoriesOpen}
              >
                <svg
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
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
              </button>

              {/* Logo TechNovaStore como enlace a inicio - Requisito 1.5 */}
              {/* Usa variantes según el tema (claro/oscuro) y tamaño de pantalla */}
              <LogoLink />
            </div>

            {/* ============================================================ */}
            {/* Barra de Búsqueda (Desktop) - Centro */}
            {/* Requisito: 10.2 */}
            {/* ============================================================ */}
            
            <div className="hidden md:flex flex-1 max-w-2xl mx-4 lg:mx-8">
              <GlobalSearch id="global-search-desktop" className="w-full" />
            </div>

            {/* ============================================================ */}
            {/* Iconos de Acción (Desktop) - Derecha */}
            {/* Requisito: 10.2, 10.3 */}
            {/* ============================================================ */}
            
            <div className="hidden md:flex items-center space-x-4" role="navigation" aria-label="Acciones principales">
              
              {/* Notificaciones - Dropdown en desktop (solo si está autenticado) */}
              {isAuthenticated && <NotificationDropdown />}

              {/* Carrito */}
              <div className="relative">
                <button
                  onClick={() => setIsCartOpen(!isCartOpen)}
                  className="relative p-2 text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
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

              {/* Usuario - Con exclusión mutua */}
              {isAuthenticated ? (
                <UserProfileDropdown 
                  onToggle={handleUserProfileToggle}
                />
              ) : (
                <Link
                  href="/login"
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                  aria-label="Iniciar sesión en tu cuenta"
                >
                  <User className="w-5 h-5" aria-hidden="true" />
                  <span>Iniciar Sesión</span>
                </Link>
              )}
            </div>

            {/* ============================================================ */}
            {/* Iconos de Acción (Mobile) - Solo en pantallas < 768px */}
            {/* ============================================================ */}
            
            <div className="md:hidden flex items-center gap-1 flex-shrink-0" role="navigation" aria-label="Acciones principales móvil">
              
              {/* Notificaciones (Mobile) - Solo si está autenticado */}
              {isAuthenticated && <NotificationDropdown />}
              
              {/* Carrito (Mobile) */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setIsCartOpen(!isCartOpen)}
                  className="relative p-1.5 text-gray-700 dark:text-gray-200"
                  aria-label={`Carrito (${isMounted ? cartItemCount : 0} items)`}
                  aria-expanded={isCartOpen}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {isMounted && cartItemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
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

              {/* Usuario - UserProfileDropdown en móvil también */}
              {isAuthenticated ? (
                <UserProfileDropdown 
                  onToggle={handleUserProfileToggle}
                />
              ) : (
                <Link
                  href="/login"
                  className="flex items-center p-1.5 text-gray-700 dark:text-gray-200"
                  aria-label="Iniciar sesión"
                >
                  <User className="w-5 h-5" aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* Barra de Búsqueda (Mobile) */}
          {/* ============================================================ */}
          
          <div className="md:hidden pb-2 sm:pb-3">
            <GlobalSearch id="global-search-mobile" placeholder="Buscar productos..." />
          </div>
        </div>
      </header>



      {/* ============================================================ */}
      {/* CategoriesDropdown - Menú de Categorías y Ofertas */}
      {/* Requisitos: 1.1, 11.2, 11.3 */}
      {/* ============================================================ */}
      <CategoriesDropdown
        isOpen={isCategoriesOpen}
        onClose={closeCategoriesMenu}
        onToggle={toggleCategoriesMenu}
        adminSidebarCollapsed={sidebarCollapsed}
      />

      {/* Spacer para compensar el header fixed - mínimo necesario */}
      <div className="h-8 sm:h-8" />
    </>
  );
}

export default Header;
