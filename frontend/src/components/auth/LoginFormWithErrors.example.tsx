/**
 * Ejemplo completo de formulario de login con manejo de errores
 * Demuestra la integración de todos los componentes del sistema de errores
 */

'use client'

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/lib/auth-schemas';
import { useAuthErrors } from '@/hooks/useAuthErrors';
import { Input, Button, AlertBox } from '@/components/ui';
import { authService } from '@/services/auth.service';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Ejemplo de formulario de login con manejo completo de errores
 * 
 * Características:
 * - Validación con Zod
 * - Manejo de errores de API
 * - Errores por campo y generales
 * - Mensajes amigables en español
 * - Acciones en errores (ej: "¿Olvidaste tu contraseña?")
 * - Loading states
 * - Accesibilidad completa
 */
export function LoginFormWithErrors() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Hook de manejo de errores
  const { 
    errors: apiErrors, 
    handleApiError, 
    clearErrors 
  } = useAuthErrors();
  
  // React Hook Form con validación Zod
  const {
    register,
    handleSubmit,
    formState: { errors: formErrors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur', // Validar al perder foco
  });

  /**
   * Maneja el envío del formulario
   */
  const onSubmit = async (data: LoginFormData) => {
    // Limpiar errores anteriores
    clearErrors();
    setIsSubmitting(true);

    try {
      // Intentar login
      await authService.login(data);
      
      // Redirigir al dashboard si es exitoso
      router.push('/dashboard');
    } catch (error) {
      // Manejar error de API
      // El hook automáticamente extrae el código de error y genera el mensaje
      handleApiError(error, '/api/auth/login');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Error general de API */}
        {apiErrors.general && (
          <AlertBox 
            message={apiErrors.general}
            variant="error"
            dismissible
            onDismiss={clearErrors}
            action={
              // Si el error es de credenciales inválidas, ofrecer recuperación
              apiErrors.code === 'invalid-credentials' ? {
                label: '¿Olvidaste tu contraseña?',
                onClick: () => router.push('/recuperar-contrasena')
              } : undefined
            }
          />
        )}

        {/* Campo de Email */}
        <div>
          <Input
            {...register('email')}
            id="login-email"
            label="Email"
            type="email"
            placeholder="tu@email.com"
            autoComplete="email"
            disabled={isSubmitting}
            // Mostrar error de API o error de validación
            error={apiErrors.fields.email || formErrors.email?.message}
            showValidation
            isValid={!formErrors.email && !apiErrors.fields.email}
          />
        </div>

        {/* Campo de Contraseña */}
        <div>
          <Input
            {...register('password')}
            id="login-password"
            label="Contraseña"
            variant="password"
            autoComplete="current-password"
            disabled={isSubmitting}
            error={apiErrors.fields.password || formErrors.password?.message}
          />
        </div>

        {/* Checkbox Recordarme */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              {...register('rememberMe')}
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              disabled={isSubmitting}
            />
            <span className="text-sm text-gray-700">Recordarme</span>
          </label>

          <a
            href="/recuperar-contrasena"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        {/* Botón de Submit */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Button>

        {/* Link a Registro */}
        <p className="text-center text-sm text-gray-600">
          ¿No tienes cuenta?{' '}
          <a
            href="/registro"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Regístrate
          </a>
        </p>
      </form>
    </div>
  );
}

/**
 * Ejemplo con manejo de diferentes tipos de errores
 */
export function LoginFormWithErrorScenarios() {
  const [scenario, setScenario] = useState<'none' | 'invalid-credentials' | 'rate-limit' | 'network'>('none');
  const { errors, setGeneralError, clearErrors } = useAuthErrors();

  const simulateError = (type: typeof scenario) => {
    clearErrors();
    
    switch (type) {
      case 'invalid-credentials':
        setGeneralError('Email o contraseña incorrectos');
        break;
      case 'rate-limit':
        setGeneralError('Demasiados intentos. Por favor, espera 15 minutos antes de intentar de nuevo');
        break;
      case 'network':
        setGeneralError('Error de conexión. Verifica tu internet e intenta de nuevo');
        break;
      case 'none':
        clearErrors();
        break;
    }
    
    setScenario(type);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Controles para simular errores */}
      <div className="p-4 bg-gray-100 rounded-lg space-y-2">
        <p className="text-sm font-medium text-gray-700 mb-2">Simular error:</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => simulateError('invalid-credentials')}
          >
            Credenciales inválidas
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => simulateError('rate-limit')}
          >
            Rate limit
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => simulateError('network')}
          >
            Error de red
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => simulateError('none')}
          >
            Limpiar
          </Button>
        </div>
      </div>

      {/* Formulario */}
      <form className="space-y-4">
        {/* Error general */}
        {errors.general && (
          <AlertBox 
            message={errors.general}
            variant="error"
            dismissible
            onDismiss={clearErrors}
          />
        )}

        <Input
          id="demo-email"
          label="Email"
          type="email"
          placeholder="tu@email.com"
        />

        <Input
          id="demo-password"
          label="Contraseña"
          variant="password"
        />

        <Button type="submit" variant="primary" className="w-full">
          Iniciar Sesión
        </Button>
      </form>
    </div>
  );
}

/**
 * Ejemplo con errores de campo específicos
 */
export function LoginFormWithFieldErrors() {
  const { errors, setFieldError, clearFieldError, clearErrors } = useAuthErrors();

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Controles */}
      <div className="p-4 bg-gray-100 rounded-lg space-y-2">
        <p className="text-sm font-medium text-gray-700 mb-2">Simular error de campo:</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFieldError('email', 'El email ingresado no está registrado')}
          >
            Email no registrado
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFieldError('password', 'La contraseña es incorrecta')}
          >
            Contraseña incorrecta
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={clearErrors}
          >
            Limpiar
          </Button>
        </div>
      </div>

      {/* Formulario */}
      <form className="space-y-4">
        <div>
          <Input
            id="field-email"
            label="Email"
            type="email"
            placeholder="tu@email.com"
            error={errors.fields.email}
            onChange={() => clearFieldError('email')}
          />
        </div>

        <div>
          <Input
            id="field-password"
            label="Contraseña"
            variant="password"
            error={errors.fields.password}
            onChange={() => clearFieldError('password')}
          />
        </div>

        <Button type="submit" variant="primary" className="w-full">
          Iniciar Sesión
        </Button>
      </form>
    </div>
  );
}
