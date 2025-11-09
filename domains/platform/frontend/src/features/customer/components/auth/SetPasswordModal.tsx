'use client';

import React, { useState } from 'react';
import { Modal } from '@/ui/Modal';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { PasswordStrengthIndicator } from '@/customer';
import { authService } from '@/customer';
import { useNotificationStore } from '@/store/notification.store';
import { SetPasswordData } from '@/customer';
import { validatePassword } from '@/customer';

interface SetPasswordModalProps {
  /** Controla si el modal está abierto o cerrado */
  open: boolean;
  /** Callback cuando el modal se cierra */
  onClose: () => void;
  /** Callback cuando la contraseña se establece exitosamente */
  onSuccess?: () => void;
}

/**
 * Modal para establecer contraseña para usuarios OAuth
 * 
 * Permite a usuarios que se registraron con OAuth (Google, GitHub)
 * establecer una contraseña local para tener múltiples métodos de autenticación.
 * 
 * Características:
 * - Input de nueva contraseña con PasswordStrengthIndicator
 * - Input de confirmar contraseña con validación en tiempo real
 * - Validación de fortaleza de contraseña
 * - Validación de coincidencia de contraseñas
 * - Integración con POST /api/auth/set-password
 * - Confirmación de éxito con notificación
 * - Manejo de errores
 * 
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 * 
 * <SetPasswordModal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSuccess={() => {
 *     console.log('Contraseña establecida');
 *     setIsOpen(false);
 *   }}
 * />
 * ```
 * 
 * Requisitos: 24.6, 24.10
 */
export default function SetPasswordModal({
  open,
  onClose,
  onSuccess,
}: SetPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addNotification } = useNotificationStore();

  // Limpiar formulario al cerrar
  const handleClose = () => {
    setPassword('');
    setConfirmPassword('');
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  // Validar contraseña en tiempo real
  const validatePasswordField = (value: string): string | undefined => {
    if (!value) {
      return 'La contraseña es requerida';
    }

    const validation = validatePassword(value);
    if (!validation.valid) {
      return validation.errors[0] || 'La contraseña no cumple con los requisitos';
    }

    return undefined;
  };

  // Validar confirmación de contraseña
  const validateConfirmPasswordField = (value: string): string | undefined => {
    if (!value) {
      return 'Debes confirmar la contraseña';
    }

    if (value !== password) {
      return 'Las contraseñas no coinciden';
    }

    return undefined;
  };

  // Manejar cambio de contraseña
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);

    // Limpiar error si existe
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }

    // Revalidar confirmación si ya se ingresó
    if (confirmPassword) {
      const confirmError = value !== confirmPassword ? 'Las contraseñas no coinciden' : undefined;
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  // Manejar cambio de confirmación de contraseña
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);

    // Validar en tiempo real
    const error = validateConfirmPasswordField(value);
    setErrors((prev) => ({ ...prev, confirmPassword: error }));
  };

  // Validar formulario completo
  const validateForm = (): boolean => {
    const passwordError = validatePasswordField(password);
    const confirmPasswordError = validateConfirmPasswordField(confirmPassword);

    setErrors({
      password: passwordError,
      confirmPassword: confirmPasswordError,
    });

    return !passwordError && !confirmPasswordError;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar formulario
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const data: SetPasswordData = {
        password,
        confirmPassword,
      };

      await authService.setPassword(data);

      // Mostrar notificación de éxito
      addNotification({
        type: 'success',
        title: 'Contraseña establecida',
        message: 'Ahora puedes iniciar sesión con tu email y contraseña.',
      });

      // Llamar callback de éxito
      if (onSuccess) {
        onSuccess();
      }

      // Cerrar modal
      handleClose();
    } catch (error: any) {
      // Mostrar error
      const errorMessage = error.message || 'Error al establecer la contraseña. Intenta de nuevo.';
      
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage,
      });

      // Si el error es de validación, mostrarlo en el campo correspondiente
      if (error.field === 'password') {
        setErrors((prev) => ({ ...prev, password: errorMessage }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Establecer Contraseña"
      description="Establece una contraseña para poder iniciar sesión con tu email además de tus métodos OAuth."
      size="md"
      disableBackdropClick={isSubmitting}
      disableEscapeKey={isSubmitting}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Input de nueva contraseña */}
        <div>
          <Input
            id="password"
            label="Nueva Contraseña"
            variant="password"
            value={password}
            onChange={handlePasswordChange}
            error={errors.password}
            disabled={isSubmitting}
            placeholder="Ingresa tu nueva contraseña"
            autoComplete="new-password"
            required
          />

          {/* Indicador de fortaleza de contraseña */}
          {password && (
            <div className="mt-4">
              <PasswordStrengthIndicator password={password} />
            </div>
          )}
        </div>

        {/* Input de confirmar contraseña */}
        <div>
          <Input
            id="confirmPassword"
            label="Confirmar Contraseña"
            variant="password"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            error={errors.confirmPassword}
            disabled={isSubmitting}
            placeholder="Confirma tu nueva contraseña"
            autoComplete="new-password"
            required
            showValidation
            isValid={confirmPassword.length > 0 && !errors.confirmPassword}
          />
        </div>

        {/* Información adicional */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-blue-800 font-medium">
                ¿Por qué establecer una contraseña?
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Tener múltiples métodos de autenticación aumenta la seguridad de tu cuenta
                y te permite iniciar sesión incluso si uno de los métodos no está disponible.
              </p>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={isSubmitting || !password || !confirmPassword}
          >
            Establecer Contraseña
          </Button>
        </div>
      </form>
    </Modal>
  );
}
