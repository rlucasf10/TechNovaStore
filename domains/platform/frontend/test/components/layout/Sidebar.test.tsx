/**
 * Sidebar Component - Tests
 * 
 * Tests unitarios para el componente Sidebar
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Sidebar } from '@/layout/Sidebar';

// Mock de useAuth
const mockUseAuth = jest.fn();
jest.mock('@/customer/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock de next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
}));

describe('Sidebar Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Configurar mock por defecto de useAuth (usuario no autenticado)
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
    });
  });

  // ============================================================================
  // Tests de Renderizado
  // ============================================================================

  describe('Renderizado', () => {
    it('no debe renderizar nada cuando isOpen es false', () => {
      const { container } = render(
        <Sidebar isOpen={false} onClose={mockOnClose} />
      );
      
      expect(container.firstChild).toBeNull();
    });

    it('debe renderizar el sidebar cuando isOpen es true', () => {
      render(<Sidebar isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText('Menú de navegación')).toBeInTheDocument();
    });

    it('debe renderizar el overlay cuando está abierto', () => {
      const { container } = render(
        <Sidebar isOpen={true} onClose={mockOnClose} />
      );
      
      const overlay = container.querySelector('.bg-black.bg-opacity-50');
      expect(overlay).toBeInTheDocument();
    });

    it('debe renderizar el título "Menú"', () => {
      render(<Sidebar isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('Menú')).toBeInTheDocument();
    });

    it('debe renderizar el botón de cerrar', () => {
      render(<Sidebar isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByLabelText('Cerrar menú')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Tests de Interacción
  // ============================================================================

  describe('Interacción', () => {
    it('debe llamar onClose al hacer clic en el botón de cerrar', () => {
      render(<Sidebar isOpen={true} onClose={mockOnClose} />);
      
      const closeButton = screen.getByLabelText('Cerrar menú');
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('debe llamar onClose al hacer clic en el overlay', () => {
      const { container } = render(
        <Sidebar isOpen={true} onClose={mockOnClose} />
      );
      
      const overlay = container.querySelector('.bg-black.bg-opacity-50');
      if (overlay) {
        fireEvent.click(overlay);
      }
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('debe llamar onClose al presionar la tecla Escape', () => {
      render(<Sidebar isOpen={true} onClose={mockOnClose} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // Tests de Navegación
  // ============================================================================

  describe('Navegación', () => {
    it('debe renderizar los enlaces rápidos', () => {
      render(<Sidebar isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('Inicio')).toBeInTheDocument();
      expect(screen.getByText('Ofertas')).toBeInTheDocument();
      expect(screen.getByText('Soporte')).toBeInTheDocument();
    });

    it('debe renderizar las categorías por defecto', () => {
      render(<Sidebar isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('Laptops')).toBeInTheDocument();
      expect(screen.getByText('Smartphones')).toBeInTheDocument();
      expect(screen.getByText('Componentes')).toBeInTheDocument();
      expect(screen.getByText('Periféricos')).toBeInTheDocument();
      expect(screen.getByText('Audio')).toBeInTheDocument();
      expect(screen.getByText('Accesorios')).toBeInTheDocument();
    });

    it('debe renderizar categorías personalizadas cuando se proporcionan', () => {
      const customCategories = [
        { id: '1', name: 'Categoría Custom 1', slug: 'custom-1' },
        { id: '2', name: 'Categoría Custom 2', slug: 'custom-2' },
      ];

      render(
        <Sidebar
          isOpen={true}
          onClose={mockOnClose}
          categories={customCategories}
        />
      );
      
      expect(screen.getByText('Categoría Custom 1')).toBeInTheDocument();
      expect(screen.getByText('Categoría Custom 2')).toBeInTheDocument();
      expect(screen.queryByText('Laptops')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // Tests de Autenticación
  // ============================================================================

  describe('Estado de Autenticación', () => {
    it('debe mostrar botones de login cuando no está autenticado', () => {
      render(<Sidebar isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
      expect(screen.getByText('¿No tienes cuenta? Regístrate')).toBeInTheDocument();
    });

    it('debe mostrar información del usuario cuando está autenticado', () => {
      // Configurar mock para usuario autenticado
      mockUseAuth.mockReturnValue({
        user: {
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@example.com',
        },
        isAuthenticated: true,
        isLoading: false,
        logout: jest.fn(),
      });

      render(<Sidebar isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('Ver mi perfil')).toBeInTheDocument();
    });

    it('debe mostrar enlaces de cuenta cuando está autenticado', () => {
      mockUseAuth.mockReturnValue({
        user: {
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@example.com',
        },
        isAuthenticated: true,
        isLoading: false,
        logout: jest.fn(),
      });

      render(<Sidebar isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('Mi Perfil')).toBeInTheDocument();
      expect(screen.getByText('Mis Pedidos')).toBeInTheDocument();
      expect(screen.getByText('Lista de Deseos')).toBeInTheDocument();
      expect(screen.getByText('Configuración')).toBeInTheDocument();
    });

    it('debe mostrar botón de cerrar sesión cuando está autenticado', () => {
      mockUseAuth.mockReturnValue({
        user: {
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@example.com',
        },
        isAuthenticated: true,
        isLoading: false,
        logout: jest.fn(),
      });

      render(<Sidebar isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('Cerrar Sesión')).toBeInTheDocument();
    });

    it('debe llamar logout al hacer clic en cerrar sesión', async () => {
      const mockLogout = jest.fn().mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue({
        user: {
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@example.com',
        },
        isAuthenticated: true,
        isLoading: false,
        logout: mockLogout,
      });

      render(<Sidebar isOpen={true} onClose={mockOnClose} />);
      
      const logoutButton = screen.getByText('Cerrar Sesión');
      fireEvent.click(logoutButton);
      
      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ============================================================================
  // Tests de Accesibilidad
  // ============================================================================

  describe('Accesibilidad', () => {
    it('debe tener el rol dialog', () => {
      render(<Sidebar isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('debe tener aria-modal="true"', () => {
      render(<Sidebar isOpen={true} onClose={mockOnClose} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('debe tener aria-label descriptivo', () => {
      render(<Sidebar isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByLabelText('Menú de navegación')).toBeInTheDocument();
    });

    it('debe tener overlay con aria-hidden="true"', () => {
      const { container } = render(
        <Sidebar isOpen={true} onClose={mockOnClose} />
      );
      
      const overlay = container.querySelector('[aria-hidden="true"]');
      expect(overlay).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Tests de Prevención de Scroll
  // ============================================================================

  describe('Prevención de Scroll', () => {
    it('debe prevenir el scroll del body cuando está abierto', () => {
      const { rerender } = render(
        <Sidebar isOpen={false} onClose={mockOnClose} />
      );
      
      expect(document.body.style.overflow).toBe('');
      
      rerender(<Sidebar isOpen={true} onClose={mockOnClose} />);
      
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('debe restaurar el scroll del body cuando se cierra', () => {
      const { rerender } = render(
        <Sidebar isOpen={true} onClose={mockOnClose} />
      );
      
      expect(document.body.style.overflow).toBe('hidden');
      
      rerender(<Sidebar isOpen={false} onClose={mockOnClose} />);
      
      expect(document.body.style.overflow).toBe('');
    });
  });
});
