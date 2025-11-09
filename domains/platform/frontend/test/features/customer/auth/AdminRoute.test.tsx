/**
 * Tests para el componente AdminRoute
 * 
 * Verifica que el componente proteja correctamente las rutas de admin.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { AdminRoute } from '@/customer/components/auth/AdminRoute';
import { useAuth } from '@/customer/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';

// Jest automáticamente usa los mocks de __mocks__/

// Mock de next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock del componente LoadingPage
jest.mock('@/shared/components/ui/Loading', () => ({
  LoadingPage: () => <div data-testid="loading-page">Loading...</div>,
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('AdminRoute', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush } as any);
    mockUsePathname.mockReturnValue('/admin/dashboard');
  });

  it('muestra spinner mientras verifica autenticación', () => {
    (useAuth as jest.Mock).mockReturnValueOnce({
      isLoading: true,
      isAuthenticated: false,
      status: 'loading',
      user: null,
    });

    render(
      <AdminRoute>
        <div>Admin Content</div>
      </AdminRoute>
    );

    expect(screen.getByTestId('loading-page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('redirige a login si no está autenticado', async () => {
    (useAuth as jest.Mock).mockReturnValueOnce({
      isLoading: false,
      isAuthenticated: false,
      status: 'unauthenticated',
      user: null,
    });

    render(
      <AdminRoute>
        <div>Admin Content</div>
      </AdminRoute>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('/login')
      );
    });
  });

  it('incluye URL de retorno en redirección a login', async () => {
    (useAuth as jest.Mock).mockReturnValueOnce({
      isLoading: false,
      isAuthenticated: false,
      status: 'unauthenticated',
      user: null,
    });

    render(
      <AdminRoute>
        <div>Admin Content</div>
      </AdminRoute>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        '/login?from=%2Fadmin%2Fdashboard'
      );
    });
  });

  it('redirige a unauthorized si no es admin', async () => {
    (useAuth as jest.Mock).mockReturnValueOnce({
      isLoading: false,
      isAuthenticated: true,
      status: 'authenticated',
      user: {
        id: '1',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
      },
    });

    render(
      <AdminRoute>
        <div>Admin Content</div>
      </AdminRoute>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/unauthorized');
    });
  });

  it('muestra contenido si es admin', () => {
    (useAuth as jest.Mock).mockReturnValueOnce({
      isLoading: false,
      isAuthenticated: true,
      status: 'authenticated',
      user: {
        id: '1',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
      },
    });

    render(
      <AdminRoute>
        <div>Admin Content</div>
      </AdminRoute>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('usa redirección personalizada a login', async () => {
    (useAuth as jest.Mock).mockReturnValueOnce({
      isLoading: false,
      isAuthenticated: false,
      status: 'unauthenticated',
      user: null,
    });

    render(
      <AdminRoute loginRedirect="/custom-login">
        <div>Admin Content</div>
      </AdminRoute>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('/custom-login')
      );
    });
  });

  it('usa redirección personalizada a unauthorized', async () => {
    (useAuth as jest.Mock).mockReturnValueOnce({
      isLoading: false,
      isAuthenticated: true,
      status: 'authenticated',
      user: {
        id: '1',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
      },
    });

    render(
      <AdminRoute unauthorizedRedirect="/dashboard">
        <div>Admin Content</div>
      </AdminRoute>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('no incluye URL de retorno si includeReturnUrl es false', async () => {
    (useAuth as jest.Mock).mockReturnValueOnce({
      isLoading: false,
      isAuthenticated: false,
      status: 'unauthenticated',
      user: null,
    });

    render(
      <AdminRoute includeReturnUrl={false}>
        <div>Admin Content</div>
      </AdminRoute>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('muestra spinner mientras redirige si no está autenticado', () => {
    (useAuth as jest.Mock).mockReturnValueOnce({
      isLoading: false,
      isAuthenticated: false,
      status: 'unauthenticated',
      user: null,
    });

    render(
      <AdminRoute>
        <div>Admin Content</div>
      </AdminRoute>
    );

    // Debe mostrar spinner mientras redirige (evita flash de contenido)
    expect(screen.getByTestId('loading-page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('muestra spinner mientras redirige si no es admin', () => {
    (useAuth as jest.Mock).mockReturnValueOnce({
      isLoading: false,
      isAuthenticated: true,
      status: 'authenticated',
      user: {
        id: '1',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
      },
    });

    render(
      <AdminRoute>
        <div>Admin Content</div>
      </AdminRoute>
    );

    // Debe mostrar spinner mientras redirige (evita flash de contenido)
    expect(screen.getByTestId('loading-page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });
});
