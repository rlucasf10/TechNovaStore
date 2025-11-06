/**
 * Tests para SetPasswordModal
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SetPasswordModal from '../SetPasswordModal';
import { authService } from '@/services/auth.service';
import { useNotificationStore } from '@/store/notification.store';

// Mock de servicios
jest.mock('@/services/auth.service');
jest.mock('@/store/notification.store');

describe('SetPasswordModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockAddNotification = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useNotificationStore as unknown as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });
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

      expect(screen.getByText('Establecer Contraseña')).toBeInTheDocument();
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

  describe('Validación de contraseña', () => {
    it('debe mostrar el indicador de fortaleza cuando se ingresa una contraseña', async () => {
      const user = userEvent.setup();
      render(
        <SetPasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const passwordInput = screen.getByLabelText('Nueva Contraseña');
      await user.type(passwordInput, 'weak');

      await waitFor(() => {
        expect(screen.getByText(/Fortaleza de la contraseña/i)).toBeInTheDocument();
      });
    });

    it('debe validar que la contraseña cumpla con los requisitos', async () => {
      const user = userEvent.setup();
      render(
        <SetPasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const passwordInput = screen.getByLabelText('Nueva Contraseña');
      const submitButton = screen.getByRole('button', { name: /Establecer Contraseña/i });

      // Intentar enviar con contraseña débil
      await user.type(passwordInput, 'weak');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/La contraseña no cumple con los requisitos/i)).toBeInTheDocument();
      });

      expect(authService.setPassword).not.toHaveBeenCalled();
    });
  });

  describe('Validación de confirmación de contraseña', () => {
    it('debe validar que las contraseñas coincidan', async () => {
      const user = userEvent.setup();
      render(
        <SetPasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const passwordInput = screen.getByLabelText('Nueva Contraseña');
      const confirmInput = screen.getByLabelText('Confirmar Contraseña');

      await user.type(passwordInput, 'MySecureP@ssw0rd');
      await user.type(confirmInput, 'Different123!');

      await waitFor(() => {
        expect(screen.getByText(/Las contraseñas no coinciden/i)).toBeInTheDocument();
      });
    });

    it('debe mostrar checkmark cuando las contraseñas coinciden', async () => {
      const user = userEvent.setup();
      render(
        <SetPasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const passwordInput = screen.getByLabelText('Nueva Contraseña');
      const confirmInput = screen.getByLabelText('Confirmar Contraseña');

      await user.type(passwordInput, 'MySecureP@ssw0rd');
      await user.type(confirmInput, 'MySecureP@ssw0rd');

      await waitFor(() => {
        expect(screen.queryByText(/Las contraseñas no coinciden/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Envío del formulario', () => {
    it('debe enviar el formulario con datos válidos', async () => {
      const user = userEvent.setup();
      (authService.setPassword as jest.Mock).mockResolvedValue({});

      render(
        <SetPasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const passwordInput = screen.getByLabelText('Nueva Contraseña');
      const confirmInput = screen.getByLabelText('Confirmar Contraseña');
      const submitButton = screen.getByRole('button', { name: /Establecer Contraseña/i });

      await user.type(passwordInput, 'MySecureP@ssw0rd');
      await user.type(confirmInput, 'MySecureP@ssw0rd');
      await user.click(submitButton);

      await waitFor(() => {
        expect(authService.setPassword).toHaveBeenCalledWith({
          password: 'MySecureP@ssw0rd',
          confirmPassword: 'MySecureP@ssw0rd',
        });
      });
    });

    it('debe mostrar notificación de éxito después de enviar', async () => {
      const user = userEvent.setup();
      (authService.setPassword as jest.Mock).mockResolvedValue({});

      render(
        <SetPasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const passwordInput = screen.getByLabelText('Nueva Contraseña');
      const confirmInput = screen.getByLabelText('Confirmar Contraseña');
      const submitButton = screen.getByRole('button', { name: /Establecer Contraseña/i });

      await user.type(passwordInput, 'MySecureP@ssw0rd');
      await user.type(confirmInput, 'MySecureP@ssw0rd');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith({
          type: 'success',
          title: 'Contraseña establecida',
          message: 'Ahora puedes iniciar sesión con tu email y contraseña.',
        });
      });
    });

    it('debe llamar onSuccess después de enviar exitosamente', async () => {
      const user = userEvent.setup();
      (authService.setPassword as jest.Mock).mockResolvedValue({});

      render(
        <SetPasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const passwordInput = screen.getByLabelText('Nueva Contraseña');
      const confirmInput = screen.getByLabelText('Confirmar Contraseña');
      const submitButton = screen.getByRole('button', { name: /Establecer Contraseña/i });

      await user.type(passwordInput, 'MySecureP@ssw0rd');
      await user.type(confirmInput, 'MySecureP@ssw0rd');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('debe cerrar el modal después de enviar exitosamente', async () => {
      const user = userEvent.setup();
      (authService.setPassword as jest.Mock).mockResolvedValue({});

      render(
        <SetPasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const passwordInput = screen.getByLabelText('Nueva Contraseña');
      const confirmInput = screen.getByLabelText('Confirmar Contraseña');
      const submitButton = screen.getByRole('button', { name: /Establecer Contraseña/i });

      await user.type(passwordInput, 'MySecureP@ssw0rd');
      await user.type(confirmInput, 'MySecureP@ssw0rd');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Manejo de errores', () => {
    it('debe mostrar notificación de error cuando falla el envío', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Error al establecer la contraseña';
      (authService.setPassword as jest.Mock).mockRejectedValue(new Error(errorMessage));

      render(
        <SetPasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const passwordInput = screen.getByLabelText('Nueva Contraseña');
      const confirmInput = screen.getByLabelText('Confirmar Contraseña');
      const submitButton = screen.getByRole('button', { name: /Establecer Contraseña/i });

      await user.type(passwordInput, 'MySecureP@ssw0rd');
      await user.type(confirmInput, 'MySecureP@ssw0rd');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith({
          type: 'error',
          title: 'Error',
          message: errorMessage,
        });
      });
    });

    it('no debe cerrar el modal cuando hay un error', async () => {
      const user = userEvent.setup();
      (authService.setPassword as jest.Mock).mockRejectedValue(new Error('Error'));

      render(
        <SetPasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const passwordInput = screen.getByLabelText('Nueva Contraseña');
      const confirmInput = screen.getByLabelText('Confirmar Contraseña');
      const submitButton = screen.getByRole('button', { name: /Establecer Contraseña/i });

      await user.type(passwordInput, 'MySecureP@ssw0rd');
      await user.type(confirmInput, 'MySecureP@ssw0rd');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalled();
      });

      expect(mockOnClose).not.toHaveBeenCalled();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Estados de carga', () => {
    it('debe deshabilitar los inputs durante el envío', async () => {
      const user = userEvent.setup();
      (authService.setPassword as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(
        <SetPasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const passwordInput = screen.getByLabelText('Nueva Contraseña');
      const confirmInput = screen.getByLabelText('Confirmar Contraseña');
      const submitButton = screen.getByRole('button', { name: /Establecer Contraseña/i });

      await user.type(passwordInput, 'MySecureP@ssw0rd');
      await user.type(confirmInput, 'MySecureP@ssw0rd');
      await user.click(submitButton);

      expect(passwordInput).toBeDisabled();
      expect(confirmInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });

    it('debe mostrar loading en el botón durante el envío', async () => {
      const user = userEvent.setup();
      (authService.setPassword as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(
        <SetPasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const passwordInput = screen.getByLabelText('Nueva Contraseña');
      const confirmInput = screen.getByLabelText('Confirmar Contraseña');
      const submitButton = screen.getByRole('button', { name: /Establecer Contraseña/i });

      await user.type(passwordInput, 'MySecureP@ssw0rd');
      await user.type(confirmInput, 'MySecureP@ssw0rd');
      await user.click(submitButton);

      // El botón debe tener el atributo disabled cuando está en loading
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Cierre del modal', () => {
    it('debe limpiar el formulario al cerrar', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <SetPasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const passwordInput = screen.getByLabelText('Nueva Contraseña');
      const confirmInput = screen.getByLabelText('Confirmar Contraseña');

      await user.type(passwordInput, 'MySecureP@ssw0rd');
      await user.type(confirmInput, 'MySecureP@ssw0rd');

      // Cerrar el modal
      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();

      // Reabrir el modal
      rerender(
        <SetPasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Los campos deben estar vacíos
      const newPasswordInput = screen.getByLabelText('Nueva Contraseña');
      const newConfirmInput = screen.getByLabelText('Confirmar Contraseña');

      expect(newPasswordInput).toHaveValue('');
      expect(newConfirmInput).toHaveValue('');
    });

    it('debe llamar onClose al hacer clic en Cancelar', async () => {
      const user = userEvent.setup();
      render(
        <SetPasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Accesibilidad', () => {
    it('debe tener labels asociados a los inputs', () => {
      render(
        <SetPasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const passwordInput = screen.getByLabelText('Nueva Contraseña');
      const confirmInput = screen.getByLabelText('Confirmar Contraseña');

      expect(passwordInput).toBeInTheDocument();
      expect(confirmInput).toBeInTheDocument();
    });

    it('debe tener el atributo required en los inputs', () => {
      render(
        <SetPasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const passwordInput = screen.getByLabelText('Nueva Contraseña');
      const confirmInput = screen.getByLabelText('Confirmar Contraseña');

      expect(passwordInput).toBeRequired();
      expect(confirmInput).toBeRequired();
    });

    it('debe tener role="dialog" en el modal', () => {
      render(
        <SetPasswordModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });
  });
});
