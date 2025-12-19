/**
 * UserProfileDropdown Component
 * 
 * Componente de menú desplegable para el perfil de usuario.
 * Inspirado en Google y PCComponentes, adaptado al estilo de TechNovaStore.
 * 
 * Características:
 * - Avatar con foto de perfil o iniciales
 * - Menú desplegable con secciones organizadas
 * - Completamente responsivo (desktop y móvil)
 * - Accesible con navegación por teclado
 * 
 * Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Package, 
  User as UserIcon, 
  CreditCard, 
  HelpCircle, 
  ChevronDown,
  ChevronUp,
  MapPin,
  Bell,
  LogOut,
  Shield,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { useAuth } from '@/customer';
import { useTheme } from '@/shared';

// ============================================================================
// Tipos
// ============================================================================

interface UserProfileDropdownProps {
  /** Clase CSS adicional para el contenedor */
  className?: string;
  /** Callback para notificar cuando el dropdown se abre/cierra */
  onToggle?: (isOpen: boolean) => void;
}

interface CollapsibleSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}

interface MenuOptionProps {
  label: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

// ============================================================================
// Funciones de Utilidad
// ============================================================================

/**
 * Genera las iniciales del usuario a partir de su nombre
 * @param firstName - Nombre del usuario
 * @param lastName - Apellido del usuario
 * @returns Iniciales en mayúsculas (máximo 2 caracteres)
 */
function getUserInitials(firstName: string, lastName: string): string {
  const firstInitial = firstName?.charAt(0)?.toUpperCase() || '';
  const lastInitial = lastName?.charAt(0)?.toUpperCase() || '';
  return `${firstInitial}${lastInitial}`;
}

/**
 * Genera un color de fondo consistente basado en el nombre del usuario
 * @param name - Nombre completo del usuario
 * @returns Clase de Tailwind para el color de fondo
 */
function getAvatarColor(name: string): string {
  const colors = [
    'bg-primary-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-violet-500',
    'bg-cyan-500',
  ];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

// ============================================================================
// Componente AvatarImage - Con fallback a iniciales si la imagen falla
// ============================================================================

interface AvatarImageProps {
  src?: string;
  alt: string;
  initials: string;
  avatarColor: string;
  size: 'small' | 'large';
}

/**
 * Componente de avatar con fallback a iniciales si la imagen no carga
 * Soluciona el problema de URLs de avatar expiradas de Google/GitHub
 */
function AvatarImage({ src, alt, initials, avatarColor, size }: AvatarImageProps) {
  const [imageError, setImageError] = useState(false);

  // Resetear error si cambia la URL
  useEffect(() => {
    setImageError(false);
  }, [src]);

  const sizeClasses = size === 'large' 
    ? 'w-16 h-16 text-xl font-bold border-2 border-white shadow-md'
    : 'w-10 h-10 md:w-8 md:h-8 text-sm font-semibold border-2 border-transparent group-hover:border-primary-300 group-hover:shadow-lg group-hover:scale-105 group-active:scale-95 transition-all duration-200 ease-in-out';

  // Si hay URL de avatar y no ha fallado, mostrar imagen
  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={alt}
        className={`rounded-full object-cover ${sizeClasses}`}
        onError={() => setImageError(true)}
      />
    );
  }

  // Fallback a iniciales
  return (
    <div
      className={`rounded-full flex items-center justify-center ${avatarColor} text-white ${sizeClasses}`}
    >
      {initials}
    </div>
  );
}

// ============================================================================
// Componente CollapsibleSection
// ============================================================================

/**
 * Componente de sección colapsable (acordeón)
 * Requisitos: 3.1, 4.1, 5.1, 6.1, 10.4, 11.2, 11.3
 */
function CollapsibleSection({ 
  id, 
  title, 
  icon, 
  isExpanded, 
  onToggle, 
  children 
}: CollapsibleSectionProps) {
  return (
    <div className="border-b border-gray-100 dark:border-slate-700 last:border-b-0">
      {/* Botón de la sección - Tamaño táctil mínimo 44px */}
      <button
        onClick={() => onToggle(id)}
        className="
          w-full px-4 py-3 md:py-3
          min-h-[44px]
          flex items-center justify-between
          hover:bg-gray-50 dark:hover:bg-slate-700 active:bg-gray-100 dark:active:bg-slate-600
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset
        "
        aria-expanded={isExpanded}
        aria-controls={`section-${id}`}
        role="button"
        aria-label={`${isExpanded ? 'Contraer' : 'Expandir'} sección ${title}`}
      >
        <div className="flex items-center space-x-3">
          <div className="text-gray-600">
            {icon}
          </div>
          <span className="text-sm md:text-sm font-medium text-gray-900 dark:text-gray-100">
            {title}
          </span>
        </div>
        
        {/* Flecha indicadora */}
        <div className="text-gray-400 transition-transform duration-200">
          {isExpanded ? (
            <ChevronUp size={20} />
          ) : (
            <ChevronDown size={20} />
          )}
        </div>
      </button>

      {/* Contenido colapsable con animación */}
      <div
        id={`section-${id}`}
        className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
        `}
        role="region"
        aria-labelledby={`section-button-${id}`}
        aria-hidden={!isExpanded}
      >
        <div className="py-2">
          {children}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Componente MenuOption
// ============================================================================

/**
 * Componente de opción individual del menú
 * Requisito: 10.4 - Tamaño táctil mínimo 44px
 * Requisito: 11.1, 11.2, 11.3 - Atributos ARIA y navegación por teclado
 */
function MenuOption({ label, onClick, className = '' }: MenuOptionProps) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    // Activar con Enter o Espacio
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <button
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`
        w-full px-4 py-3 md:py-2.5
        min-h-[44px]
        text-left text-sm text-gray-700 dark:text-gray-200
        hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400
        active:bg-gray-100 dark:active:bg-slate-600
        transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset
        ${className}
      `}
      role="menuitem"
      tabIndex={0}
    >
      {label}
    </button>
  );
}

// ============================================================================
// Componente UserProfileDropdown
// ============================================================================

export function UserProfileDropdown({ className = '', onToggle }: UserProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['orders']) // "Pedidos y Devoluciones" expandida por defecto
  );
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  
  // Si no hay usuario, no renderizar nada (el Header mostrará el botón de login)
  if (!user) {
    return null;
  }

  // Generar nombre completo para el color del avatar
  // Los datos ya vienen transformados a camelCase desde el servicio de auth
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = getUserInitials(firstName || 'U', lastName || 'S');
  const avatarColor = getAvatarColor(fullName || 'User');

  // ============================================================================
  // Efecto: Detectar viewport móvil (< 768px)
  // Requisito: 10.1
  // ============================================================================

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Verificar al montar
    checkMobile();

    // Escuchar cambios de tamaño
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ============================================================================
  // Efecto: Cerrar dropdown al hacer clic fuera y manejar tecla Escape
  // Requisitos: 9.2, 9.3, 11.1
  // ============================================================================

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onToggle?.(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        setIsOpen(false);
        onToggle?.(false);
        // Devolver foco al avatar al cerrar con Escape
        // Requisito: 11.5
        avatarButtonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isOpen, onToggle]);

  // ============================================================================
  // Efecto: Prevenir scroll del body cuando el menú móvil está abierto
  // Requisito: 10.3
  // ============================================================================

  useEffect(() => {
    if (isOpen && isMobile) {
      // Guardar el scroll actual
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        // Restaurar el scroll
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen, isMobile]);

  // ============================================================================
  // Efecto: Focus trap - Mantener el foco dentro del menú mientras está abierto
  // Requisitos: 11.4, 11.5
  // ============================================================================

  useEffect(() => {
    if (!isOpen || !dropdownRef.current) return;

    // Obtener todos los elementos focuseables dentro del dropdown
    const getFocusableElements = (): HTMLElement[] => {
      if (!dropdownRef.current) return [];
      
      const focusableSelectors = [
        'button:not([disabled])',
        'a[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      return Array.from(
        dropdownRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
      );
    };

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      // Si presiona Shift+Tab en el primer elemento, ir al último
      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
      // Si presiona Tab en el último elemento, ir al primero
      else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    // Enfocar el primer elemento focuseable al abrir el menú
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      // Pequeño delay para asegurar que el menú esté renderizado
      setTimeout(() => {
        focusableElements[0]?.focus();
      }, 50);
    }

    document.addEventListener('keydown', handleTabKey);
    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const toggleDropdown = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    // Notificar al componente padre (Header) sobre el cambio de estado
    // Requisito: 11.2, 11.3 - Exclusión mutua con CategoriesDropdown
    onToggle?.(newIsOpen);
    
    // Si se está cerrando el menú, devolver el foco al avatar
    // Requisito: 11.5
    if (!newIsOpen) {
      setTimeout(() => {
        avatarButtonRef.current?.focus();
      }, 100);
    }
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    onToggle?.(false);
    router.push('/dashboard/usuario?tab=profile');
  };

  const handleToggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    onToggle?.(false);
    router.push(path);
  };

  /**
   * Handler para cerrar sesión
   * Requisitos: 8.1, 8.2, 8.3, 8.4, 8.5
   * 
   * Después de cerrar sesión:
   * - Si la página actual requiere autenticación (dashboard, checkout, etc.), redirige a home
   * - Si la página es pública, se queda en la misma página
   */
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setIsOpen(false);
      onToggle?.(false);

      // Páginas que requieren autenticación
      const protectedRoutes = [
        '/dashboard',
        '/checkout',
        '/pedidos',
        '/perfil',
        '/configuracion',
      ];

      // Verificar si la ruta actual requiere autenticación
      const requiresAuth = protectedRoutes.some(route => pathname.startsWith(route));

      // Guardar la ruta actual si NO requiere autenticación
      if (!requiresAuth) {
        sessionStorage.setItem('currentPageBeforeLogout', pathname);
      }

      // Ejecutar logout (esto limpiará el estado y redirigirá a /login por defecto)
      await logout();

      // Si la página NO requiere autenticación, redirigir de vuelta
      if (!requiresAuth) {
        const savedPath = sessionStorage.getItem('currentPageBeforeLogout');
        if (savedPath) {
          sessionStorage.removeItem('currentPageBeforeLogout');
          router.push(savedPath);
        }
      } else {
        // Si requiere autenticación, redirigir a home
        router.push('/');
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // En caso de error, redirigir a home
      router.push('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* ============================================================ */}
      {/* Avatar Clickeable */}
      {/* Requisitos: 11.1, 11.2, 11.3, 11.5 */}
      {/* ============================================================ */}
      
      <button
        ref={avatarButtonRef}
        onClick={toggleDropdown}
        className="flex items-center space-x-2 p-1 text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-full"
        aria-label="Menú de perfil de usuario"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {/* Avatar con foto o iniciales */}
        <AvatarImage
          src={user.avatar}
          alt={`${firstName} ${lastName}`}
          initials={initials}
          avatarColor={avatarColor}
          size="small"
        />

        {/* Nombre del usuario (solo en desktop XL) */}
        <span className="text-sm font-medium hidden xl:inline group-hover:text-primary-600 transition-colors">
          {firstName}
        </span>
      </button>

      {/* ============================================================ */}
      {/* Overlay Oscuro (solo móvil) */}
      {/* Requisito: 10.5 */}
      {/* ============================================================ */}
      
      {isOpen && isMobile && (
        <div
          className="
            fixed inset-0 
            bg-black bg-opacity-50 
            z-40
            transition-opacity duration-300
          "
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ============================================================ */}
      {/* Menú Desplegable con Animaciones */}
      {/* Desktop: Dropdown debajo del avatar */}
      {/* Móvil: Panel deslizante desde la derecha */}
      {/* Requisitos: 10.1, 10.2, 10.3, 10.4 */}
      {/* ============================================================ */}
      
      {isOpen && (
        <div
          role="menu"
          className={`
            bg-white dark:bg-slate-800
            shadow-xl border border-gray-200 dark:border-slate-700
            z-50
            overflow-y-auto scrollbar-thin
            ${isMobile 
              ? `
                fixed top-0 right-0 bottom-0
                w-[calc(100%-2rem)] max-w-sm
                animate-slide-in-right
                rounded-l-2xl
                pb-safe
              `
              : `
                absolute right-0 mt-2 
                w-80 max-w-[320px]
                max-h-[calc(100vh-100px)]
                rounded-lg
                animate-fade-in-down
                origin-top-right
              `
            }
          `}
          style={!isMobile ? {
            animation: 'fadeInDown 0.2s ease-out forwards'
          } : undefined}
        >
          {/* ============================================================ */}
          {/* Botón de Cierre (solo móvil) */}
          {/* Requisitos: 11.1, 11.2, 11.3 */}
          {/* ============================================================ */}
          
          {isMobile && (
            <div className="flex justify-end p-4 border-b border-gray-200 dark:border-slate-700">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onToggle?.(false);
                  // Devolver foco al avatar al cerrar
                  setTimeout(() => {
                    avatarButtonRef.current?.focus();
                  }, 100);
                }}
                className="
                  p-2 rounded-full
                  text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
                  hover:bg-gray-100 dark:hover:bg-slate-700 active:bg-gray-200 dark:active:bg-slate-600
                  transition-colors duration-150
                  focus:outline-none focus:ring-2 focus:ring-primary-500
                "
                aria-label="Cerrar menú"
                tabIndex={0}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          )}

          {/* ============================================================ */}
          {/* Cabecera del Perfil */}
          {/* Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5, 11.2, 11.3 */}
          {/* ============================================================ */}
          
          <button
            onClick={handleProfileClick}
            className="
              w-full p-6 
              bg-gradient-to-br from-primary-50 to-primary-100
              hover:from-primary-100 hover:to-primary-150
              dark:from-slate-700 dark:to-slate-800 dark:hover:from-slate-600 dark:hover:to-slate-700
              transition-all duration-200
              border-b border-gray-200 dark:border-slate-700
              text-left
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset
            "
            role="menuitem"
            tabIndex={0}
            aria-label={`Ver perfil de ${firstName} ${lastName}`}
          >
            <div className="flex flex-col items-center space-y-3">
              {/* Avatar Grande (64x64px) */}
              <AvatarImage
                src={user.avatar}
                alt={`${firstName} ${lastName}`}
                initials={initials}
                avatarColor={avatarColor}
                size="large"
              />

              {/* Nombre Completo */}
              <div className="text-center">
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {firstName} {lastName}
                </p>
                
                {/* Email */}
                <p className="text-sm text-gray-600 mt-1">
                  {user.email}
                </p>
              </div>

              {/* Indicador de "Ver perfil" */}
              <p className="text-xs text-primary-600 font-medium">
                Ver mi perfil →
              </p>
            </div>
          </button>

          {/* ============================================================ */}
          {/* Secciones del Menú */}
          {/* Requisito: 10.3 - Espaciado adicional en móvil */}
          {/* ============================================================ */}
          
          <div className="py-2 md:py-2">
            {/* ============================================================ */}
            {/* Sección: Pedidos y Devoluciones */}
            {/* Requisitos: 3.1, 3.2 */}
            {/* ============================================================ */}
            <CollapsibleSection
              id="orders"
              title="Pedidos y Devoluciones"
              icon={<Package size={20} />}
              isExpanded={expandedSections.has('orders')}
              onToggle={handleToggleSection}
            >
              <MenuOption
                label="Pedidos, devoluciones y facturas"
                onClick={() => handleNavigate('/dashboard/usuario/pedidos')}
              />
              <MenuOption
                label="Pedidos cancelados"
                onClick={() => handleNavigate('/dashboard/usuario/pedidos?estado=cancelado')}
              />
              <MenuOption
                label="Historial de devoluciones"
                onClick={() => handleNavigate('/dashboard/usuario/devoluciones')}
              />
            </CollapsibleSection>

            {/* ============================================================ */}
            {/* Sección: Mi Cuenta */}
            {/* Requisitos: 4.1, 4.2 */}
            {/* ============================================================ */}
            <CollapsibleSection
              id="account"
              title="Mi Cuenta"
              icon={<UserIcon size={20} />}
              isExpanded={expandedSections.has('account')}
              onToggle={handleToggleSection}
            >
              <MenuOption
                label="Mis datos"
                onClick={() => handleNavigate('/dashboard/usuario/perfil')}
              />
              <MenuOption
                label="Mis direcciones"
                onClick={() => handleNavigate('/dashboard/usuario/direcciones')}
              />
              <MenuOption
                label="Mis suscripciones"
                onClick={() => handleNavigate('/dashboard/usuario/suscripciones')}
              />
              <MenuOption
                label="Mis documentos"
                onClick={() => handleNavigate('/dashboard/usuario/documentos')}
              />
              <MenuOption
                label="Lista de deseos"
                onClick={() => handleNavigate('/dashboard/usuario/lista-deseos')}
              />
              <MenuOption
                label="Mis configuraciones"
                onClick={() => handleNavigate('/dashboard/usuario/configuracion')}
              />
              <MenuOption
                label="Mensajes"
                onClick={() => handleNavigate('/dashboard/usuario/mensajes')}
              />
              <MenuOption
                label="Opiniones"
                onClick={() => handleNavigate('/dashboard/usuario/opiniones')}
              />
            </CollapsibleSection>

            {/* ============================================================ */}
            {/* Sección: Pago */}
            {/* Requisitos: 5.1, 5.2 */}
            {/* ============================================================ */}
            <CollapsibleSection
              id="payment"
              title="Pago"
              icon={<CreditCard size={20} />}
              isExpanded={expandedSections.has('payment')}
              onToggle={handleToggleSection}
            >
              <MenuOption
                label="Métodos de pago"
                onClick={() => handleNavigate('/dashboard/usuario/metodos-pago')}
              />
              <MenuOption
                label="Historial de pagos"
                onClick={() => handleNavigate('/dashboard/usuario/historial-pagos')}
              />
            </CollapsibleSection>

            {/* ============================================================ */}
            {/* Sección: ¿Necesitas ayuda? */}
            {/* Requisitos: 6.1, 6.2, 6.3 */}
            {/* ============================================================ */}
            <CollapsibleSection
              id="help"
              title="¿Necesitas ayuda?"
              icon={<HelpCircle size={20} />}
              isExpanded={expandedSections.has('help')}
              onToggle={handleToggleSection}
            >
              <MenuOption
                label="Centro de ayuda"
                onClick={() => handleNavigate('/soporte')}
              />
              <MenuOption
                label="Mis tickets"
                onClick={() => handleNavigate('/dashboard/usuario/tickets')}
              />
              <MenuOption
                label="Contactar soporte"
                onClick={() => {
                  setIsOpen(false);
                  // TODO: Implementar apertura del ChatWidget
                  // Por ahora, navegar a la página de soporte
                  router.push('/soporte');
                }}
              />
              <MenuOption
                label="Preguntas frecuentes"
                onClick={() => handleNavigate('/faq')}
              />
            </CollapsibleSection>
          </div>

          {/* ============================================================ */}
          {/* Sección: Acciones Rápidas */}
          {/* Requisitos: 7.1, 7.2, 10.4, 11.2, 11.3 */}
          {/* ============================================================ */}
          <div className="border-t border-gray-200 dark:border-slate-700 py-2">
            {/* Rastrear pedido */}
            <button
              onClick={() => handleNavigate('/seguimiento')}
              className="
                w-full px-4 py-3 md:py-2.5
                min-h-[44px]
                flex items-center space-x-3
                text-left text-sm text-gray-700 dark:text-gray-200
                hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400
                active:bg-gray-100 dark:active:bg-slate-600
                transition-colors duration-150
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset
              "
              role="menuitem"
              tabIndex={0}
            >
              <MapPin size={20} className="text-gray-500" />
              <span>Rastrear pedido</span>
            </button>

            {/* Notificaciones con badge */}
            <button
              onClick={() => handleNavigate('/notificaciones')}
              className="
                w-full px-4 py-3 md:py-2.5
                min-h-[44px]
                flex items-center justify-between
                text-left text-sm text-gray-700 dark:text-gray-200
                hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400
                active:bg-gray-100 dark:active:bg-slate-600
                transition-colors duration-150
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset
              "
              role="menuitem"
              tabIndex={0}
              aria-label="Notificaciones (3 sin leer)"
            >
              <div className="flex items-center space-x-3">
                <Bell size={20} className="text-gray-500" />
                <span>Notificaciones</span>
              </div>
              
              {/* Badge de contador dinámico */}
              {/* TODO: Conectar con el estado real de notificaciones no leídas */}
              <span 
                className="
                  inline-flex items-center justify-center
                  min-w-[20px] h-5 px-1.5
                  bg-red-500 text-white
                  text-xs font-semibold
                  rounded-full
                "
                aria-label="3 notificaciones sin leer"
              >
                3
              </span>
            </button>
          </div>

          {/* ============================================================ */}
          {/* Botón de Dashboard (dinámico según ruta actual) */}
          {/* Para admins: muestra "Dashboard de Usuario" si está en admin, o "Panel de Administración" si está en usuario */}
          {/* Para usuarios normales: siempre muestra "Dashboard de Usuario" */}
          {/* ============================================================ */}
          {user.role === 'admin' && pathname?.startsWith('/dashboard/admin') ? (
            <div className="border-t border-gray-200 dark:border-slate-700 py-2">
              <button
                onClick={() => handleNavigate('/dashboard/usuario')}
                className="
                  w-full px-4 py-3 md:py-2.5
                  min-h-[44px]
                  flex items-center space-x-3
                  text-left text-sm font-medium
                  text-primary-600 bg-primary-50
                  hover:bg-primary-100
                  active:bg-primary-200
                  transition-colors duration-150
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset
                "
                role="menuitem"
                tabIndex={0}
              >
                <UserIcon size={20} className="text-primary-600" />
                <span>Dashboard de Usuario</span>
              </button>
            </div>
          ) : user.role === 'admin' ? (
            <div className="border-t border-gray-200 dark:border-slate-700 py-2">
              <button
                onClick={() => handleNavigate('/dashboard/admin')}
                className="
                  w-full px-4 py-3 md:py-2.5
                  min-h-[44px]
                  flex items-center space-x-3
                  text-left text-sm font-medium
                  text-primary-600 bg-primary-50
                  hover:bg-primary-100
                  active:bg-primary-200
                  transition-colors duration-150
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset
                "
                role="menuitem"
                tabIndex={0}
              >
                <Shield size={20} className="text-primary-600" />
                <span>Panel de Administración</span>
              </button>
            </div>
          ) : (
            <div className="border-t border-gray-200 dark:border-slate-700 py-2">
              <button
                onClick={() => handleNavigate('/dashboard/usuario')}
                className="
                  w-full px-4 py-3 md:py-2.5
                  min-h-[44px]
                  flex items-center space-x-3
                  text-left text-sm font-medium
                  text-primary-600 bg-primary-50
                  hover:bg-primary-100
                  active:bg-primary-200
                  transition-colors duration-150
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset
                "
                role="menuitem"
                tabIndex={0}
              >
                <UserIcon size={20} className="text-primary-600" />
                <span>Dashboard de Usuario</span>
              </button>
            </div>
          )}

          {/* ============================================================ */}
          {/* Selector de Tema */}
          {/* Requisito: 21.4 */}
          {/* ============================================================ */}
          <div className="border-t border-gray-200 dark:border-slate-700 py-2">
            <div className="px-4 py-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Apariencia
              </p>
              <div className="flex gap-2">
                {/* Botón Claro */}
                <button
                  onClick={() => setTheme('light')}
                  className={`
                    flex-1 px-3 py-2.5
                    min-h-[44px]
                    flex flex-col items-center justify-center gap-1
                    rounded-lg border-2 transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                    ${theme === 'light' 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                      : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300'
                    }
                  `}
                  role="menuitemradio"
                  aria-checked={theme === 'light'}
                  tabIndex={0}
                  aria-label="Tema claro"
                >
                  <Sun size={20} />
                  <span className="text-xs font-medium">Claro</span>
                </button>

                {/* Botón Oscuro */}
                <button
                  onClick={() => setTheme('dark')}
                  className={`
                    flex-1 px-3 py-2.5
                    min-h-[44px]
                    flex flex-col items-center justify-center gap-1
                    rounded-lg border-2 transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                    ${theme === 'dark' 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                      : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300'
                    }
                  `}
                  role="menuitemradio"
                  aria-checked={theme === 'dark'}
                  tabIndex={0}
                  aria-label="Tema oscuro"
                >
                  <Moon size={20} />
                  <span className="text-xs font-medium">Oscuro</span>
                </button>

                {/* Botón Sistema */}
                <button
                  onClick={() => setTheme('system')}
                  className={`
                    flex-1 px-3 py-2.5
                    min-h-[44px]
                    flex flex-col items-center justify-center gap-1
                    rounded-lg border-2 transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                    ${theme === 'system' 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                      : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300'
                    }
                  `}
                  role="menuitemradio"
                  aria-checked={theme === 'system'}
                  tabIndex={0}
                  aria-label="Tema del sistema"
                >
                  <Monitor size={20} />
                  <span className="text-xs font-medium">Sistema</span>
                </button>
              </div>
              {theme === 'system' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  Usando tema {resolvedTheme === 'dark' ? 'oscuro' : 'claro'} del sistema
                </p>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* Botón de Cerrar Sesión */}
          {/* Requisitos: 8.1, 8.2, 8.3, 8.4, 8.5, 10.4, 11.2, 11.3 */}
          {/* ============================================================ */}
          <div className="border-t border-gray-200 dark:border-slate-700 pt-2 pb-2">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="
                w-full px-4 py-3
                min-h-[44px]
                flex items-center space-x-3
                text-left text-sm font-medium
                text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300
                hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30
                transition-colors duration-150
                focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-inset
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              role="menuitem"
              tabIndex={0}
              aria-label={isLoggingOut ? 'Cerrando sesión' : 'Cerrar sesión'}
            >
              <LogOut size={20} />
              <span>{isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfileDropdown;
