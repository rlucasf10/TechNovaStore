/**
 * Sidebar Component - Ejemplos de Uso
 * 
 * Este archivo contiene ejemplos de cómo usar el componente Sidebar
 * en diferentes escenarios.
 */

'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Button } from '@/ui/Button';
import { Menu, Laptop, Smartphone, Monitor, Headphones, Keyboard, Mouse } from 'lucide-react';

// ============================================================================
// Ejemplo 1: Uso Básico
// ============================================================================

export function BasicSidebarExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Ejemplo 1: Uso Básico</h2>
      <p className="text-gray-600 mb-4">
        Sidebar con configuración por defecto. Incluye categorías predefinidas.
      </p>
      
      <Button
        onClick={() => setIsOpen(true)}
        variant="primary"
        iconLeft={<Menu className="w-5 h-5" />}
      >
        Abrir Menú
      </Button>

      <Sidebar
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
}

// ============================================================================
// Ejemplo 2: Con Categorías Personalizadas
// ============================================================================

export function CustomCategoriesSidebarExample() {
  const [isOpen, setIsOpen] = useState(false);

  const customCategories = [
    { id: '1', name: 'Laptops Gaming', slug: 'laptops-gaming', icon: Laptop },
    { id: '2', name: 'Smartphones 5G', slug: 'smartphones-5g', icon: Smartphone },
    { id: '3', name: 'Monitores 4K', slug: 'monitores-4k', icon: Monitor },
    { id: '4', name: 'Audio Premium', slug: 'audio-premium', icon: Headphones },
    { id: '5', name: 'Teclados Mecánicos', slug: 'teclados-mecanicos', icon: Keyboard },
    { id: '6', name: 'Ratones Gaming', slug: 'ratones-gaming', icon: Mouse },
  ];

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Ejemplo 2: Categorías Personalizadas</h2>
      <p className="text-gray-600 mb-4">
        Sidebar con categorías personalizadas específicas para gaming.
      </p>
      
      <Button
        onClick={() => setIsOpen(true)}
        variant="primary"
        iconLeft={<Menu className="w-5 h-5" />}
      >
        Abrir Menú Gaming
      </Button>

      <Sidebar
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        categories={customCategories}
      />
    </div>
  );
}

// ============================================================================
// Ejemplo 3: Integración con Header
// ============================================================================

export function HeaderIntegrationExample() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Simulado */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="text-xl font-bold text-primary-600">
            TechNovaStore
          </div>
          
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-700 hover:text-primary-600 transition-colors md:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Spacer para el header fixed */}
      <div className="h-16" />

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-4">Ejemplo 3: Integración con Header</h2>
        <p className="text-gray-600 mb-4">
          El sidebar se integra perfectamente con el header. Haz clic en el icono de menú
          en la esquina superior derecha (visible solo en móvil).
        </p>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <p className="text-gray-700">
            Este es el contenido principal de la página. El sidebar se superpone
            cuando se abre y no afecta el layout del contenido.
          </p>
        </div>
      </main>

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </div>
  );
}

// ============================================================================
// Ejemplo 4: Control Programático
// ============================================================================

export function ProgrammaticControlExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(null);

  const handleOpenWithAutoClose = () => {
    setIsOpen(true);
    
    // Auto-cerrar después de 5 segundos
    const timer = setTimeout(() => {
      setIsOpen(false);
    }, 5000);
    
    setAutoCloseTimer(timer);
  };

  const handleClose = () => {
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
      setAutoCloseTimer(null);
    }
    setIsOpen(false);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Ejemplo 4: Control Programático</h2>
      <p className="text-gray-600 mb-4">
        El sidebar se puede controlar programáticamente. Este ejemplo lo abre
        y lo cierra automáticamente después de 5 segundos.
      </p>
      
      <div className="space-x-2">
        <Button
          onClick={handleOpenWithAutoClose}
          variant="primary"
        >
          Abrir (Auto-cierra en 5s)
        </Button>
        
        <Button
          onClick={() => setIsOpen(true)}
          variant="secondary"
        >
          Abrir (Manual)
        </Button>
      </div>

      <Sidebar
        isOpen={isOpen}
        onClose={handleClose}
      />
    </div>
  );
}

// ============================================================================
// Ejemplo 5: Múltiples Estados
// ============================================================================

export function MultipleStatesExample() {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Ejemplo 5: Múltiples Sidebars</h2>
      <p className="text-gray-600 mb-4">
        Puedes tener múltiples instancias del sidebar con diferentes estados.
        (Nota: En producción, solo deberías tener uno abierto a la vez)
      </p>
      
      <div className="space-x-2">
        <Button
          onClick={() => setLeftSidebarOpen(true)}
          variant="primary"
        >
          Abrir Sidebar 1
        </Button>
        
        <Button
          onClick={() => setRightSidebarOpen(true)}
          variant="secondary"
        >
          Abrir Sidebar 2
        </Button>
      </div>

      <Sidebar
        isOpen={leftSidebarOpen}
        onClose={() => setLeftSidebarOpen(false)}
      />

      <Sidebar
        isOpen={rightSidebarOpen}
        onClose={() => setRightSidebarOpen(false)}
        categories={[
          { id: '1', name: 'Categoría A', slug: 'categoria-a' },
          { id: '2', name: 'Categoría B', slug: 'categoria-b' },
        ]}
      />
    </div>
  );
}

// ============================================================================
// Ejemplo 6: Con Callback de Navegación
// ============================================================================

export function NavigationCallbackExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [lastNavigation, setLastNavigation] = useState<string>('');

  const handleClose = () => {
    setIsOpen(false);
    // Aquí podrías ejecutar lógica adicional al cerrar
    console.log('Sidebar cerrado');
    
    // Simular que se navegó a algún lugar
    if (isOpen) {
      setLastNavigation('/dashboard/usuario');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Ejemplo 6: Con Callback de Navegación</h2>
      <p className="text-gray-600 mb-4">
        Puedes ejecutar lógica personalizada cuando el sidebar se cierra o
        cuando el usuario navega.
      </p>
      
      <Button
        onClick={() => setIsOpen(true)}
        variant="primary"
      >
        Abrir Menú
      </Button>

      {lastNavigation && (
        <div className="mt-4 p-4 bg-primary-50 rounded-lg">
          <p className="text-sm text-primary-700">
            Última navegación: <strong>{lastNavigation}</strong>
          </p>
        </div>
      )}

      <Sidebar
        isOpen={isOpen}
        onClose={handleClose}
      />
    </div>
  );
}

// ============================================================================
// Componente de Demostración Principal
// ============================================================================

export function SidebarExamplesShowcase() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold mb-2">Sidebar Component - Ejemplos</h1>
          <p className="text-gray-600">
            Explora diferentes formas de usar el componente Sidebar en tu aplicación.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <BasicSidebarExample />
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <CustomCategoriesSidebarExample />
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <ProgrammaticControlExample />
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <NavigationCallbackExample />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SidebarExamplesShowcase;
