/**
 * Tests para SetPasswordModal
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SetPasswordModal from '@/customer/components/auth/SetPasswordModal';

// Mock de authService
const mockSetPassword = jest.fn();
jest.mock('@/customer/services/auth.service', () => ({
  authService: {
    setPassword: (data: { password: string; confirmPassword: string }) => mockSetPassword(data),
  },
}));

// Mock de useNotificationStore
const mockAddNotification = jest.fn();
jest.mock('@/shared/store/notification.store', () => ({
  useNotificationStore: () => ({
    addNotification: mockAddNotification,
  }),
}));

describe('SetPasswordModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetPassword.mockReset();
    mockAddNotification.mockReset();
  });

  describe('Renderizado', () => {
    it('debe renderizar el modal cuando open es true', () => {
      render(
        <SetPasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByRole('heading', { name: 'Establecer Contraseña' })).toBeInTheDocument();
      expect(screen.getByLabelText('Nueva Contraseña')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirmar Contraseña')).toBeInTheDocument();
    });

    it('no debe renderizar el modal cuando open es false', () => {
      render(
        <SetPasswordModal
          open={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.queryByText('Establecer Contraseña')).not.toBeInTheDocument();
    });

    it('debe mostrar la descripción del modal', () => {
      render(
        <SetPasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(
        screen.getByText(/Establece una contraseña para poder iniciar sesión/i)
      ).toBeInTheDocument();
    });

    it('debe mostrar información sobre los beneficios de múltiples métodos', () => {
      render(
        <SetPasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(
        screen.getByText(/Tener múltiples métodos de autenticación aumenta la seguridad/i)
      ).toBeInTheDocument();
    });
  });

  describe('Envío del formulario', () => {
    it('debe enviar el formulario con datos válidos', async () => {
      mockSetPassword.mockResolvedValueOnce({});

      render(
        <SetPasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const passwordInput = screen.getByLabelText('Nueva Contraseña') as HTMLInputElement;
      const confirmInput = screen.getByLabelText('Confirmar Contraseña') as HTMLInputElement;
      const form = passwordInput.closest('form')!;

      // Establecer valores directamente
      fireEvent.change(passwordInput, { target: { value: 'MySecureP@ssw0rd' } });
      fireEvent.change(confirmInput, { target: { value: 'MySecureP@ssw0rd' } });

      // Enviar el formulario
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockSetPassword).toHaveBeenCalledWith({
          password: 'MySecureP@ssw0rd',
          confirmPassword: 'MySecureP@ssw0rd',
        });
      }, { timeout: 3000 });
    });
  });
});
