/**
 * CategoriesDropdown Component
 * 
 * Componente de menú desplegable para categorías y ofertas.
 * Inspirado en PCComponentes, adaptado al estilo de TechNovaStore.
 * 
 * Características:
 * - Panel lateral con categorías principales
 * - Subcategorías expandibles en hover (desktop) o acordeón (móvil)
 * - Sección de ofertas destacadas
 * - Enlaces rápidos (Novedades, Más Vendidos, etc.)
 * - Completamente responsivo
 * - Accesible con navegación por teclado
 * 
 * Requisitos: 1.1, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Monitor,
  Cpu,
  Keyboard,
  Smartphone,
  Gamepad2,
  Wifi,
  Package,
  Cable,
  Tag,
  Sparkles,
  TrendingUp,
  RefreshCw,
  Percent,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';

// ============================================================================
// Tipos
// ============================================================================

interface CategoriesDropdownProps {
  /** Indica si el menú está abierto */
  isOpen: boolean;
  /** Callback para cerrar el menú */
  onClose: () => void;
  /** Callback para alternar el estado del menú */
  onToggle: () => void;
  /** Estado del sidebar del admin (para posicionamiento) */
  adminSidebarCollapsed?: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  href: string;
  subcategories?: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
  href: string;
}

interface QuickLink {
  id: string;
  name: string;
  href: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

// ============================================================================
// Configuración de Categorías
// Requisito: 3.1 - Categorías principales de tecnología
// ============================================================================

const CATEGORIES: Category[] = [
  {
    id: 'ordenadores',
    name: 'Ordenadores',
    icon: <Monitor size={20} />,
    href: '/categorias/ordenadores',
    subcategories: [
      { id: 'portatiles', name: 'Portátiles', href: '/categorias/ordenadores/portatiles' },
      { id: 'sobremesa', name: 'Sobremesa', href: '/categorias/ordenadores/sobremesa' },
      { id: 'workstations', name: 'Workstations', href: '/categorias/ordenadores/workstations' },
      { id: 'all-in-one', name: 'All-in-One', href: '/categorias/ordenadores/all-in-one' },
    ],
  },
  {
    id: 'componentes',
    name: 'Componentes',
    icon: <Cpu size={20} />,
    href: '/categorias/componentes',
    subcategories: [
      { id: 'procesadores', name: 'Procesadores', href: '/categorias/componentes/procesadores' },
      { id: 'tarjetas-graficas', name: 'Tarjetas Gráficas', href: '/categorias/componentes/tarjetas-graficas' },
      { id: 'memoria-ram', name: 'Memoria RAM', href: '/categorias/componentes/memoria-ram' },
      { id: 'almacenamiento', name: 'Almacenamiento', href: '/categorias/componentes/almacenamiento' },
      { id: 'placas-base', name: 'Placas Base', href: '/categorias/componentes/placas-base' },
      { id: 'fuentes-alimentacion', name: 'Fuentes de Alimentación', href: '/categorias/componentes/fuentes-alimentacion' },
      { id: 'cajas', name: 'Cajas/Torres', href: '/categorias/componentes/cajas' },
      { id: 'refrigeracion', name: 'Refrigeración', href: '/categorias/componentes/refrigeracion' },
    ],
  },
  {
    id: 'perifericos',
    name: 'Periféricos',
    icon: <Keyboard size={20} />,
    href: '/categorias/perifericos',
    subcategories: [
      { id: 'teclados', name: 'Teclados', href: '/categorias/perifericos/teclados' },
      { id: 'ratones', name: 'Ratones', href: '/categorias/perifericos/ratones' },
      { id: 'monitores', name: 'Monitores', href: '/categorias/perifericos/monitores' },
      { id: 'auriculares', name: 'Auriculares', href: '/categorias/perifericos/auriculares' },
      { id: 'webcams', name: 'Webcams', href: '/categorias/perifericos/webcams' },
      { id: 'altavoces', name: 'Altavoces', href: '/categorias/perifericos/altavoces' },
    ],
  },
  {
    id: 'smartphones-tablets',
    name: 'Smartphones y Tablets',
    icon: <Smartphone size={20} />,
    href: '/categorias/smartphones-tablets',
    subcategories: [
      { id: 'smartphones', name: 'Smartphones', href: '/categorias/smartphones-tablets/smartphones' },
      { id: 'tablets', name: 'Tablets', href: '/categorias/smartphones-tablets/tablets' },
      { id: 'accesorios-movil', name: 'Accesorios Móvil', href: '/categorias/smartphones-tablets/accesorios' },
      { id: 'smartwatches', name: 'Smartwatches', href: '/categorias/smartphones-tablets/smartwatches' },
    ],
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: <Gamepad2 size={20} />,
    href: '/categorias/gaming',
    subcategories: [
      { id: 'consolas', name: 'Consolas', href: '/categorias/gaming/consolas' },
      { id: 'videojuegos', name: 'Videojuegos', href: '/categorias/gaming/videojuegos' },
      { id: 'accesorios-gaming', name: 'Accesorios Gaming', href: '/categorias/gaming/accesorios' },
      { id: 'sillas-gaming', name: 'Sillas Gaming', href: '/categorias/gaming/sillas' },
      { id: 'streaming', name: 'Streaming', href: '/categorias/gaming/streaming' },
    ],
  },
  {
    id: 'redes',
    name: 'Redes y Conectividad',
    icon: <Wifi size={20} />,
    href: '/categorias/redes',
    subcategories: [
      { id: 'routers', name: 'Routers', href: '/categorias/redes/routers' },
      { id: 'switches', name: 'Switches', href: '/categorias/redes/switches' },
      { id: 'adaptadores', name: 'Adaptadores de Red', href: '/categorias/redes/adaptadores' },
      { id: 'cables-red', name: 'Cables de Red', href: '/categorias/redes/cables' },
    ],
  },
  {
    id: 'software',
    name: 'Software y Licencias',
    icon: <Package size={20} />,
    href: '/categorias/software',
    subcategories: [
      { id: 'sistemas-operativos', name: 'Sistemas Operativos', href: '/categorias/software/sistemas-operativos' },
      { id: 'antivirus', name: 'Antivirus', href: '/categorias/software/antivirus' },
      { id: 'ofimatica', name: 'Ofimática', href: '/categorias/software/ofimatica' },
    ],
  },
  {
    id: 'accesorios',
    name: 'Accesorios y Cables',
    icon: <Cable size={20} />,
    href: '/categorias/accesorios',
    subcategories: [
      { id: 'cables-hdmi', name: 'Cables HDMI', href: '/categorias/accesorios/cables-hdmi' },
      { id: 'cables-usb', name: 'Cables USB', href: '/categorias/accesorios/cables-usb' },
      { id: 'hubs', name: 'Hubs y Docks', href: '/categorias/accesorios/hubs' },
      { id: 'fundas-mochilas', name: 'Fundas y Mochilas', href: '/categorias/accesorios/fundas-mochilas' },
    ],
  },
];

// ============================================================================
// Configuración de Enlaces Rápidos
// Requisitos: 2.1, 2.2, 2.3, 2.4, 5.1, 5.2
// ============================================================================

const QUICK_LINKS: QuickLink[] = [
  { id: 'ofertas', name: 'Ofertas', href: '/ofertas', icon: <Tag size={20} />, highlight: true },
  { id: 'novedades', name: 'Novedades', href: '/novedades', icon: <Sparkles size={20} /> },
  { id: 'mas-vendidos', name: 'Más Vendidos', href: '/mas-vendidos', icon: <TrendingUp size={20} /> },
  { id: 'reacondicionados', name: 'Reacondicionados', href: '/reacondicionados', icon: <RefreshCw size={20} /> },
  { id: 'outlet', name: 'Outlet', href: '/outlet', icon: <Percent size={20} /> },
];

// ============================================================================
// Componente SubcategoryPanel
// Requisitos: 4.2, 4.3, 4.5
// Subtarea: 3.1
// ============================================================================

interface SubcategoryPanelProps {
  /** Categoría activa cuyas subcategorías se mostrarán */
  category: Category;
  /** Callback para mantener el panel abierto al hacer hover */
  onMouseEnter: () => void;
  /** Callback para cerrar el panel al salir el cursor */
  onMouseLeave: () => void;
  /** Callback para navegar a una subcategoría */
  onNavigate: (href: string) => void;
  /** Offset izquierdo adicional (para el sidebar del admin) */
  leftOffset?: number;
}

/**
 * Panel lateral que muestra las subcategorías de una categoría activa
 * 
 * Características:
 * - Muestra título de categoría padre en la parte superior
 * - Lista todas las subcategorías de la categoría activa
 * - Animación de deslizamiento desde la izquierda
 * - Se mantiene abierto mientras el cursor está sobre él
 * 
 * Requisitos: 4.2, 4.3, 4.5, 4.6
 */
function SubcategoryPanel({
  category,
  onMouseEnter,
  onMouseLeave,
  onNavigate,
  leftOffset = 0,
}: SubcategoryPanelProps) {
  // El panel de subcategorías se posiciona a la derecha del menú principal (320px)
  // más el offset del sidebar del admin si existe
  const panelLeft = 320 + leftOffset;
  
  return (
    <div
      className="
        fixed top-0 bottom-0 z-50
        w-64 bg-white dark:bg-slate-800 shadow-xl
        border-l border-gray-200 dark:border-slate-700
        overflow-y-auto
        animate-slide-in-right
        transition-all duration-200 ease-out
      "
      style={{ left: panelLeft }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="dialog"
      aria-modal="false"
      aria-labelledby={`subcategory-panel-title-${category.id}`}
    >
      {/* Título de la categoría padre - Requisito 4.5, 9.2 */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
        <h3 
          id={`subcategory-panel-title-${category.id}`}
          className="text-sm font-semibold text-gray-900 dark:text-gray-100"
        >
          {category.name}
        </h3>
      </div>

      {/* Lista de subcategorías - Requisito 4.3, 9.2 */}
      <nav className="py-2" role="navigation" aria-label={`Subcategorías de ${category.name}`}>
        {category.subcategories!.map((sub) => (
          <button
            key={sub.id}
            onClick={() => onNavigate(sub.href)}
            className="
              w-full px-4 py-3
              min-h-[44px]
              text-left text-sm text-gray-700 dark:text-gray-300
              hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 hover:translate-x-1
              active:bg-gray-100 dark:active:bg-slate-600
              transition-all duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset
            "
            aria-label={`Ir a ${sub.name}`}
          >
            {sub.name}
          </button>
        ))}
      </nav>

      {/* Enlace para ver toda la categoría */}
      <div className="p-4 border-t border-gray-200 dark:border-slate-700">
        <button
          onClick={() => onNavigate(category.href)}
          className="
            w-full px-4 py-2
            text-sm font-medium text-primary-600 dark:text-primary-400
            bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50 hover:shadow-md
            rounded-lg
            transition-all duration-200 ease-in-out
            transform hover:scale-105
            focus:outline-none focus:ring-2 focus:ring-primary-500
          "
          aria-label={`Ver todos los productos en ${category.name}`}
        >
          Ver todo en {category.name}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Componente CategoryItem
// Requisitos: 3.1, 4.1
// Subtarea: 2.1
// ============================================================================

interface CategoryItemProps {
  category: Category;
  isActive: boolean;
  isMobile: boolean;
  isExpanded: boolean;
  onHover: (categoryId: string | null) => void;
  onToggle: (categoryId: string) => void;
  onNavigate: (href: string) => void;
}

/**
 * Componente para renderizar un item de categoría individual
 * 
 * Características:
 * - Muestra icono, nombre y flecha ">" para categorías con subcategorías
 * - Implementa estados hover con cambio de color
 * - Transiciones suaves
 */
function CategoryItem({
  category,
  isActive,
  isMobile,
  isExpanded,
  onHover,
  onToggle,
  onNavigate,
}: CategoryItemProps) {
  const hasSubcategories = category.subcategories && category.subcategories.length > 0;

  const handleClick = () => {
    if (isMobile && hasSubcategories) {
      onToggle(category.id);
    } else {
      onNavigate(category.href);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Activar con Enter o Espacio - Requisito 9.1
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <div>
      {/* Categoría Principal */}
      <button
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => onHover(category.id)}
        onMouseLeave={() => onHover(null)}
        className={`
          w-full px-4 py-3
          min-h-[44px]
          flex items-center justify-between
          text-left text-sm text-gray-700 dark:text-gray-300
          hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400
          active:bg-gray-100 dark:active:bg-slate-600
          transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset
          ${isActive ? 'bg-gray-50 dark:bg-slate-700 text-primary-600 dark:text-primary-400' : ''}
        `}
        aria-label={`${category.name}${hasSubcategories ? (isMobile ? (isExpanded ? ', expandido' : ', contraído') : ', tiene subcategorías') : ''}`}
        aria-expanded={isMobile && hasSubcategories ? isExpanded : undefined}
        aria-haspopup={hasSubcategories ? 'menu' : undefined}
        aria-controls={hasSubcategories && isExpanded ? `subcategories-${category.id}` : undefined}
      >
        <div className="flex items-center space-x-3">
          <div 
            className={`
              transition-all duration-200 ease-in-out
              ${isActive ? 'text-primary-600 dark:text-primary-400 scale-110' : 'text-gray-500 dark:text-gray-400'}
            `}
            aria-hidden="true"
          >
            {category.icon}
          </div>
          <span className="font-medium transition-all duration-200 ease-in-out">
            {category.name}
          </span>
        </div>
        
        {/* Indicador de subcategorías - Requisito 4.1 */}
        {hasSubcategories && (
          <div 
            className={`
              transition-all duration-200 ease-in-out
              ${isActive ? 'text-primary-600 dark:text-primary-400 translate-x-1' : 'text-gray-400 dark:text-gray-500'}
            `}
            aria-hidden="true"
          >
            {isMobile ? (
              isExpanded ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )
            ) : (
              <ChevronRight size={20} />
            )}
          </div>
        )}
      </button>

      {/* Subcategorías en Acordeón (Móvil) - Requisitos: 8.4, 8.5, 9.2 */}
      {isMobile && hasSubcategories && (
        <div
          id={`subcategories-${category.id}`}
          role="region"
          aria-label={`Subcategorías de ${category.name}`}
          className={`
            overflow-hidden transition-all duration-300 ease-in-out
            ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          <div className="bg-gray-50 dark:bg-slate-900 py-1">
            {category.subcategories!.map((sub, index) => (
              <button
                key={sub.id}
                onClick={() => onNavigate(sub.href)}
                className="
                  w-full px-4 py-2.5 pl-12
                  min-h-[44px]
                  text-left text-sm text-gray-600 dark:text-gray-400
                  hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 hover:pl-14
                  transition-all duration-200 ease-in-out
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset
                "
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
                aria-label={`Ir a ${sub.name}`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Componente CategoriesDropdown
// ============================================================================

export function CategoriesDropdown({ isOpen, onClose, adminSidebarCollapsed = false }: CategoriesDropdownProps) {
  // Estado para la categoría activa (hover en desktop)
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  // Estado para categorías expandidas en móvil (acordeón)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  // Estado para detectar si es móvil
  const [isMobile, setIsMobile] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // ============================================================================
  // Efecto: Detectar viewport móvil (< 768px)
  // Requisito: 8.1
  // ============================================================================

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ============================================================================
  // Efecto: Cerrar menú al cambiar de ruta
  // Requisito: 6.3
  // ============================================================================

  useEffect(() => {
    if (isOpen) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // ============================================================================
  // Efecto: Cerrar al hacer clic fuera y manejar tecla Escape
  // Requisitos: 6.1, 6.2, 9.1
  // ============================================================================

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      // Cerrar con Escape - Requisito 6.2
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      // Navegación por teclado - Requisito 9.1
      const focusableElements = dropdownRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as HTMLElement);

      switch (event.key) {
        case 'Tab':
          // Implementar focus trap - Requisito 9.3
          event.preventDefault();
          if (event.shiftKey) {
            // Tab + Shift: ir al elemento anterior
            const prevIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
            focusableElements[prevIndex]?.focus();
          } else {
            // Tab: ir al siguiente elemento
            const nextIndex = currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
            focusableElements[nextIndex]?.focus();
          }
          break;

        case 'ArrowDown':
          // Flecha abajo: siguiente elemento
          event.preventDefault();
          const nextIndex = currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
          focusableElements[nextIndex]?.focus();
          break;

        case 'ArrowUp':
          // Flecha arriba: elemento anterior
          event.preventDefault();
          const prevIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
          focusableElements[prevIndex]?.focus();
          break;

        case 'Home':
          // Home: primer elemento
          event.preventDefault();
          focusableElements[0]?.focus();
          break;

        case 'End':
          // End: último elemento
          event.preventDefault();
          focusableElements[focusableElements.length - 1]?.focus();
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  // ============================================================================
  // Efecto: Prevenir scroll del body cuando el menú móvil está abierto
  // Requisito: 8.3
  // ============================================================================

  useEffect(() => {
    if (isOpen && isMobile) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen, isMobile]);

  // ============================================================================
  // Efecto: Gestionar foco al abrir/cerrar el menú
  // Requisitos: 9.3, 9.4
  // ============================================================================

  useEffect(() => {
    if (isOpen) {
      // Guardar el elemento que tenía el foco antes de abrir el menú
      const previouslyFocusedElement = document.activeElement as HTMLElement;

      // Enfocar el primer elemento enfocable del menú
      setTimeout(() => {
        const firstFocusable = dropdownRef.current?.querySelector<HTMLElement>(
          'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }, 100);

      // Al cerrar, devolver el foco al elemento anterior - Requisito 9.4
      return () => {
        if (previouslyFocusedElement && previouslyFocusedElement !== document.body) {
          setTimeout(() => {
            previouslyFocusedElement.focus();
          }, 100);
        }
      };
    }
  }, [isOpen]);

  // ============================================================================
  // Handlers
  // ============================================================================

  /**
   * Navegar a una ruta y cerrar el menú
   */
  const handleNavigate = useCallback((href: string) => {
    onClose();
    router.push(href);
  }, [onClose, router]);

  /**
   * Manejar hover en categoría (solo desktop)
   * Requisito: 3.2
   */
  const handleCategoryHover = useCallback((categoryId: string | null) => {
    if (!isMobile) {
      setActiveCategory(categoryId);
    }
  }, [isMobile]);

  /**
   * Alternar expansión de categoría en móvil (acordeón)
   * Requisito: 8.4
   */
  const handleToggleCategory = useCallback((categoryId: string) => {
    if (isMobile) {
      setExpandedCategories(prev => {
        const newSet = new Set(prev);
        if (newSet.has(categoryId)) {
          newSet.delete(categoryId);
        } else {
          newSet.add(categoryId);
        }
        return newSet;
      });
    }
  }, [isMobile]);

  // ============================================================================
  // Render: Si el menú no está abierto, no renderizar nada
  // ============================================================================

  if (!isOpen) {
    return null;
  }

  // Obtener la categoría activa para mostrar subcategorías
  const activeCategoryData = CATEGORIES.find(cat => cat.id === activeCategory);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      {/* ============================================================ */}
      {/* Overlay Oscuro */}
      {/* Requisito: 8.3 */}
      {/* Animación: Fade in/out - Requisito 6.4 */}
      {/* ============================================================ */}
      <div
        className={`
          fixed inset-0 bg-black z-40
          transition-opacity duration-300 ease-in-out
          ${isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ============================================================ */}
      {/* Panel Principal del Menú */}
      {/* Requisitos: 6.4, 6.5, 7.1, 7.2, 8.1, 8.2, 9.2 */}
      {/* Animación: Deslizamiento desde izquierda - Requisito 6.4 */}
      {/* ============================================================ */}
      <div
        ref={dropdownRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de categorías y ofertas"
        className={`
          fixed top-0 bottom-0 z-50
          bg-white dark:bg-slate-800 shadow-xl
          overflow-y-auto
          transition-all duration-300 ease-out
          ${isMobile ? 'w-full left-0' : 'w-80 max-w-[320px]'}
          ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}
        `}
        style={{
          // En admin desktop, desplazar a la derecha del sidebar (72px colapsado, 256px expandido)
          left: !isMobile && pathname?.startsWith('/dashboard/admin') 
            ? (adminSidebarCollapsed ? '72px' : '256px') 
            : '0px'
        }}
      >
        {/* ============================================================ */}
        {/* Header del Menú */}
        {/* Requisito: 9.2 - Atributos ARIA */}
        {/* ============================================================ */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-0 z-10">
          <h2 id="categories-menu-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Menú de Categorías
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="
              p-2 rounded-full
              text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
              hover:bg-gray-100 dark:hover:bg-slate-700 active:bg-gray-200 dark:active:bg-slate-600
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-primary-500
            "
            aria-label="Cerrar menú de categorías"
          >
            <X size={24} />
          </button>
        </div>

        {/* ============================================================ */}
        {/* Sección de Ofertas Destacadas */}
        {/* Requisitos: 2.1, 2.2, 2.3, 2.4, 9.2 */}
        {/* ============================================================ */}
        <div className="p-2 border-b border-gray-200 dark:border-slate-700" role="group" aria-label="Ofertas destacadas">
          <button
            ref={firstFocusableRef}
            onClick={() => handleNavigate('/ofertas')}
            className="
              w-full px-4 py-3
              flex items-center space-x-3
              bg-gradient-to-r from-primary-50 to-orange-50 dark:from-primary-900/30 dark:to-orange-900/30
              hover:from-primary-100 hover:to-orange-100 dark:hover:from-primary-900/50 dark:hover:to-orange-900/50
              hover:shadow-md
              rounded-lg
              transition-all duration-200 ease-in-out
              transform hover:scale-105
              focus:outline-none focus:ring-2 focus:ring-primary-500
            "
            aria-label="Ver todas las ofertas"
          >
            <div className="text-primary-600 dark:text-primary-400 transition-transform duration-200 hover:rotate-12" aria-hidden="true">
              <Tag size={24} />
            </div>
            <span className="text-base font-semibold text-primary-600 dark:text-primary-400">
              Ofertas
            </span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* Lista de Categorías */}
        {/* Requisitos: 3.1, 3.2, 4.1, 9.2 */}
        {/* Subtarea: 2.2 - Todas las categorías implementadas */}
        {/* ============================================================ */}
        <nav className="py-2" role="navigation" aria-label="Categorías principales">
          {CATEGORIES.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              isActive={activeCategory === category.id}
              isMobile={isMobile}
              isExpanded={expandedCategories.has(category.id)}
              onHover={handleCategoryHover}
              onToggle={handleToggleCategory}
              onNavigate={handleNavigate}
            />
          ))}
        </nav>

        {/* ============================================================ */}
        {/* Sección de Enlaces Rápidos / Trending */}
        {/* Requisitos: 5.1, 5.2, 5.3, 9.2 */}
        {/* ============================================================ */}
        <div className="border-t border-gray-200 dark:border-slate-700 py-2" role="group" aria-labelledby="quick-links-heading">
          <div className="px-4 py-2">
            <h3 id="quick-links-heading" className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Destacados
            </h3>
          </div>
          
          <nav role="navigation" aria-label="Enlaces rápidos">
            {QUICK_LINKS.filter(link => link.id !== 'ofertas').map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavigate(link.href)}
                className={`
                  w-full px-4 py-3
                  min-h-[44px]
                  flex items-center space-x-3
                  text-left text-sm
                  hover:bg-gray-50 dark:hover:bg-slate-700 hover:translate-x-1
                  active:bg-gray-100 dark:active:bg-slate-600
                  transition-all duration-200 ease-in-out
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset
                  ${link.highlight ? 'text-primary-600 dark:text-primary-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}
                `}
                aria-label={`Ir a ${link.name}`}
              >
                <div 
                  className={`
                    transition-all duration-200 ease-in-out
                    ${link.highlight ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}
                  `}
                  aria-hidden="true"
                >
                  {link.icon}
                </div>
                <span className="transition-colors duration-200">{link.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Panel de Subcategorías (Desktop) */}
      {/* Requisitos: 4.2, 4.3, 4.5, 4.6 */}
      {/* Subtarea: 3.1 - Usando componente SubcategoryPanel */}
      {/* ============================================================ */}
      {!isMobile && activeCategory && activeCategoryData?.subcategories?.length && (
        <SubcategoryPanel
          category={activeCategoryData}
          onMouseEnter={() => handleCategoryHover(activeCategory)}
          onMouseLeave={() => handleCategoryHover(null)}
          onNavigate={handleNavigate}
          leftOffset={pathname?.startsWith('/dashboard/admin') ? (adminSidebarCollapsed ? 72 : 256) : 0}
        />
      )}
    </>
  );
}

export default CategoriesDropdown;
