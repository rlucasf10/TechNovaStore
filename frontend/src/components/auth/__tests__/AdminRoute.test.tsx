/**
 * Tests para el componente AdminRoute
 * 
 * Verifica que el componente proteja correctamente las rutas de admin.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { AdminRoute } from '../AdminRoute';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';

// Mock de los hooks
jest.mock('@/hooks/useAuth');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock del componente LoadingPage
jest.mock('@/components/ui/Loading', () => ({
  LoadingPage: () => <div data-testid="loading-page">Loading...</div>,
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
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
    mockUseAuth.mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
      status: 'loading',
      user: null,
    } as any);

    render(
      <AdminRoute>
        <div>Admin Content</div>
      </AdminRoute>
    );

    expect(screen.getByTestId('loading-page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('redirige a login si no está autenticado', async () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      status: 'unauthenticated',
      user: null,
    } as any);

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
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      status: 'unauthenticated',
      user: null,
    } as any);

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
    mockUseAuth.mockReturnValue({
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
    } as any);

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
    mockUseAuth.mockReturnValue({
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
    } as any);

    render(
      <AdminRoute>
        <div>Admin Content</div>
      </AdminRoute>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('usa redirección personalizada a login', async () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      status: 'unauthenticated',
      user: null,
    } as any);

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
    mockUseAuth.mockReturnValue({
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
    } as any);

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
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      status: 'unauthenticated',
      user: null,
    } as any);

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
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      status: 'unauthenticated',
      user: null,
    } as any);

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
    mockUseAuth.mockReturnValue({
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
    } as any);

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
