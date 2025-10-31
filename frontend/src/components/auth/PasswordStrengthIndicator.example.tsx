/**
 * Ejemplo de uso del componente PasswordStrengthIndicator
 * Este archivo muestra cómo integrar el sistema de validación de contraseñas
 */

'use client';

import { useState } from 'react';
import { calculatePasswordStrength } from '@/lib/password-validation';

/**
 * Ejemplo 1: Indicador de fortaleza básico
 */
export function BasicPasswordStrengthExample() {
  const [password, setPassword] = useState('');
  const strength = calculatePasswordStrength(password);

  // Colores según el nivel de fortaleza
  const colors = {
    'very-weak': 'bg-red-500',
    'weak': 'bg-orange-500',
    'medium': 'bg-yellow-500',
    'strong': 'bg-blue-500',
    'very-strong': 'bg-green-500',
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contraseña
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          placeholder="Ingresa tu contraseña"
        />
      </div>

      {/* Barra de fortaleza */}
      {password && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Fortaleza:</span>
            <span className="font-medium capitalize">
              {strength.level.replace('-', ' ')}
            </span>
          </div>
          
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${colors[strength.level]}`}
              style={{ width: `${(strength.score / 4) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Ejemplo 2: Lista de requisitos con checkmarks
 */
export function PasswordRequirementsExample() {
  const [password, setPassword] = useState('');
  const strength = calculatePasswordStrength(password);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contraseña
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          placeholder="Ingresa tu contraseña"
        />
      </div>

      {/* Lista de requisitos */}
      {password && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Tu contraseña debe cumplir con:
          </p>
          <ul className="space-y-1">
            {strength.requirements.map((req) => (
              <li
                key={req.id}
                className={`text-sm flex items-center gap-2 ${
                  req.met ? 'text-green-600' : 'text-gray-500'
                }`}
              >
                <span className="text-lg">
                  {req.met ? '✓' : '○'}
                </span>
                {req.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Ejemplo 3: Feedback detallado
 */
export function PasswordFeedbackExample() {
  const [password, setPassword] = useState('');
  const strength = calculatePasswordStrength(password);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contraseña
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          placeholder="Ingresa tu contraseña"
        />
      </div>

      {/* Feedback */}
      {password && strength.feedback.length > 0 && (
        <div className={`rounded-lg p-4 ${
          strength.score >= 3 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-start gap-2">
            <span className="text-lg">
              {strength.score >= 3 ? '✓' : '⚠'}
            </span>
            <div className="flex-1">
              {strength.feedback.map((msg, i) => (
                <p key={i} className="text-sm text-gray-700">
                  {msg}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Ejemplo 4: Componente completo con validación de coincidencia
 */
export function CompletePasswordFormExample() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const strength = calculatePasswordStrength(password);
  const passwordsMatch = password === confirmPassword && confirmPassword !== '';

  const colors = {
    'very-weak': 'bg-red-500',
    'weak': 'bg-orange-500',
    'medium': 'bg-yellow-500',
    'strong': 'bg-blue-500',
    'very-strong': 'bg-green-500',
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Campo de contraseña */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Contraseña
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Ingresa tu contraseña"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>

        {/* Barra de fortaleza */}
        {password && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Fortaleza:</span>
              <span className="font-medium capitalize">
                {strength.level.replace('-', ' ')}
              </span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${colors[strength.level]}`}
                style={{ width: `${(strength.score / 4) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Requisitos */}
      {password && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-700 mb-2">
            Requisitos de contraseña:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {strength.requirements.map((req) => (
              <div
                key={req.id}
                className={`text-xs flex items-center gap-1 ${
                  req.met ? 'text-green-600' : 'text-gray-500'
                }`}
              >
                <span>{req.met ? '✓' : '○'}</span>
                <span className="truncate">{req.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campo de confirmar contraseña */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Confirmar contraseña
        </label>
        <input
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 ${
            confirmPassword && !passwordsMatch
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-300 focus:ring-primary-500'
          }`}
          placeholder="Confirma tu contraseña"
        />
        
        {/* Mensaje de coincidencia */}
        {confirmPassword && (
          <p className={`text-sm flex items-center gap-1 ${
            passwordsMatch ? 'text-green-600' : 'text-red-600'
          }`}>
            <span>{passwordsMatch ? '✓' : '✗'}</span>
            {passwordsMatch 
              ? 'Las contraseñas coinciden' 
              : 'Las contraseñas no coinciden'}
          </p>
        )}
      </div>

      {/* Botón de submit */}
      <button
        type="submit"
        disabled={!passwordsMatch || strength.score < 3}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
          passwordsMatch && strength.score >= 3
            ? 'bg-primary-500 text-white hover:bg-primary-600'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        Crear cuenta
      </button>
    </div>
  );
}

/**
 * Ejemplo 5: Uso con React Hook Form y Zod
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormData } from '@/lib/auth-schemas';

export function ReactHookFormExample() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');
  const strength = calculatePasswordStrength(password);

  const onSubmit = async (data: RegisterFormData) => {
    console.log('Formulario válido:', data);
    // Aquí iría la lógica de registro
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto space-y-4">
      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre
        </label>
        <input
          {...register('firstName')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="Juan"
        />
        {errors.firstName && (
          <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>
        )}
      </div>

      {/* Apellido */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Apellido
        </label>
        <input
          {...register('lastName')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="Pérez"
        />
        {errors.lastName && (
          <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          {...register('email')}
          type="email"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="juan@example.com"
        />
        {errors.email && (
          <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* Contraseña con indicador */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contraseña
        </label>
        <input
          {...register('password')}
          type="password"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="Ingresa tu contraseña"
        />
        
        {/* Indicador de fortaleza */}
        {password && (
          <div className="mt-2 space-y-2">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  strength.score >= 3 ? 'bg-green-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${(strength.score / 4) * 100}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {strength.requirements.map((req) => (
                <span
                  key={req.id}
                  className={req.met ? 'text-green-600' : 'text-gray-500'}
                >
                  {req.met ? '✓' : '○'} {req.label}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {errors.password && (
          <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
        )}
      </div>

      {/* Confirmar contraseña */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirmar contraseña
        </label>
        <input
          {...register('confirmPassword')}
          type="password"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="Confirma tu contraseña"
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-600 mt-1">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Términos */}
      <div className="flex items-start gap-2">
        <input
          {...register('acceptTerms')}
          type="checkbox"
          className="mt-1"
        />
        <label className="text-sm text-gray-700">
          Acepto los términos y condiciones
        </label>
      </div>
      {errors.acceptTerms && (
        <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2 px-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-300"
      >
        {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
      </button>
    </form>
  );
}
