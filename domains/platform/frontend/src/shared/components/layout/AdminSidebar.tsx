/**
 * AdminSidebar Component
 * 
 * Sidebar con dos estados:
 * - Colapsado: solo iconos centrados (72px)
 * - Expandido: completo con iconos + texto (256px)
 * 
 * Requisitos: 15.5
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  X,
  LayoutDashboard,
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  Target,
  MessageSquare,
  Bot,
  Zap,
  Settings,
  Shield,
} from 'lucide-react';

// ============================================================================
// Tipos
// ============================================================================

export interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: 'red' | 'yellow' | 'green' | 'blue';
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// ============================================================================
// Configuración
// ============================================================================

const EXPANDED_WIDTH = 256;
const COLLAPSED_WIDTH = 72;

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'General',
    items: [
      { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
      { label: 'Analíticas', href: '/dashboard/admin/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Gestión',
    items: [
      { label: 'Productos', href: '/dashboard/admin/products', icon: Package },
      { label: 'Pedidos', href: '/dashboard/admin/orders', icon: ShoppingCart, badge: 12, badgeColor: 'blue' },
      { label: 'Clientes', href: '/dashboard/admin/customers', icon: Users },
      { label: 'Campañas', href: '/dashboard/admin/campaigns', icon: Target },
    ],
  },
  {
    title: 'Soporte',
    items: [
      { label: 'Tickets', href: '/dashboard/admin/tickets', icon: MessageSquare, badge: 5, badgeColor: 'red' },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { label: 'Servicios IA', href: '/dashboard/admin/ai-services', icon: Bot },
      { label: 'Automatización', href: '/dashboard/admin/automation', icon: Zap },
      { label: 'Configuración', href: '/dashboard/admin/settings', icon: Settings },
    ],
  },
];

// ============================================================================
// Componente AdminSidebar
// ============================================================================

export function AdminSidebar({ 
  isOpen = true, 
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isOpen || !isMobile) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isMobile, onClose]);

  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, isMobile]);

  const isActive = (href: string) => {
    if (href === '/dashboard/admin') return pathname === href;
    return pathname?.startsWith(href);
  };

  const getBadgeColor = (color?: string) => {
    const colors: Record<string, string> = {
      red: 'bg-red-500',
      yellow: 'bg-yellow-500',
      green: 'bg-green-500',
      blue: 'bg-blue-500',
    };
    return colors[color || 'blue'] || colors.blue;
  };

  // ============================================================================
  // Móvil: drawer
  // ============================================================================
  
  if (isMobile) {
    if (!isOpen) return null;
    
    return (
      <>
        <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
        <aside
          ref={sidebarRef}
          className="fixed top-0 left-0 h-screen bg-gray-900 text-white z-50 shadow-2xl"
          style={{ width: EXPANDED_WIDTH }}
          role="navigation"
        >
          <div className="h-full overflow-y-auto flex flex-col pt-[72px]">
            <div className="flex-shrink-0 h-16 px-3 flex items-center justify-between border-b border-gray-800">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="ml-3">
                  <h2 className="text-base font-bold text-white">Admin Panel</h2>
                  <p className="text-xs text-gray-400">TechNovaStore</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-2 space-y-4 overflow-y-auto">
              {NAV_SECTIONS.map((section) => (
                <div key={section.title}>
                  <div className="px-3 mb-1">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{section.title}</h3>
                  </div>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onClose}
                          className={`flex items-center h-10 px-3 rounded-lg ${active ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <span className="ml-3 text-sm font-medium">{item.label}</span>
                          {item.badge !== undefined && (
                            <span className={`ml-auto px-1.5 py-0.5 text-xs font-semibold rounded-full text-white ${getBadgeColor(item.badgeColor)}`}>
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </aside>
      </>
    );
  }

  // ============================================================================
  // Desktop
  // ============================================================================
  
  const expanded = !isCollapsed;
  const width = expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH;

  return (
    <aside
      ref={sidebarRef}
      className="fixed top-0 left-0 h-screen bg-gray-900 text-white z-50 shadow-xl"
      style={{ width }}
      role="navigation"
    >
      {/* Header del sidebar - alineado con el header principal (72px) */}
      <div className={`h-[72px] flex items-center border-b border-gray-800 ${expanded ? 'px-3' : 'justify-center'}`}>
        <button
          onClick={onToggleCollapse}
          className="w-10 h-10 bg-purple-600 hover:bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0"
          title={isCollapsed ? 'Expandir panel' : 'Colapsar panel'}
        >
          <Shield className="w-5 h-5 text-white" />
        </button>
        {expanded && (
          <div className="ml-3">
            <h2 className="text-base font-bold text-white whitespace-nowrap">Admin Panel</h2>
            <p className="text-xs text-gray-400 whitespace-nowrap">TechNovaStore</p>
          </div>
        )}
      </div>

      {/* Navegación - empieza después del header */}
      <div className="h-[calc(100vh-72px)] overflow-y-auto overflow-x-hidden">
        <nav className={`p-2 ${expanded ? 'space-y-4' : 'space-y-1'}`}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              {expanded && (
                <div className="px-3 mb-1">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{section.title}</h3>
                </div>
              )}
              <div className={expanded ? 'space-y-0.5' : 'space-y-1'}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  
                  if (expanded) {
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center h-10 px-3 rounded-lg ${active ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="ml-3 text-sm font-medium">{item.label}</span>
                        {item.badge !== undefined && (
                          <span className={`ml-auto px-1.5 py-0.5 text-xs font-semibold rounded-full text-white ${getBadgeColor(item.badgeColor)}`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  }
                  
                  // Colapsado: solo icono centrado
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-center h-10 w-12 mx-auto rounded-lg relative ${active ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                      title={item.label}
                    >
                      <Icon className="w-5 h-5" />
                      {item.badge !== undefined && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-gray-900" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export default AdminSidebar;
