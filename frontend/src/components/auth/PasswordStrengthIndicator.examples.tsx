'use client';

import React, { useState } from 'react';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import { Input } from '@/components/ui';

/**
 * Ejemplos de uso del componente PasswordStrengthIndicator
 * Este archivo muestra diferentes casos de uso y configuraciones
 */

export function BasicExample() {
  const [password, setPassword] = useState('');

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Ejemplo Básico</h3>
      <Input
        type="password"
        label="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Ingresa tu contraseña"
      />
      <PasswordStrengthIndicator password={password} />
    </div>
  );
}

export function WeakPasswordExample() {
  const [password] = useState('abc');

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Contraseña Débil (0-2 requisitos)
      </h3>
      <Input
        type="password"
        label="Contraseña"
        value={password}
        readOnly
        placeholder="abc"
      />
      <PasswordStrengthIndicator password={password} />
      <p className="text-sm text-gray-600">
        Solo cumple 1 requisito (minúscula). Barra roja al 20%.
      </p>
    </div>
  );
}

export function MediumPasswordExample() {
  const [password] = useState('Abc123');

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Contraseña Media (3-4 requisitos)
      </h3>
      <Input
        type="password"
        label="Contraseña"
        value={password}
        readOnly
        placeholder="Abc123"
      />
      <PasswordStrengthIndicator password={password} />
      <p className="text-sm text-gray-600">
        Cumple 3 requisitos (mayúscula, minúscula, número). Barra amarilla al 60%.
      </p>
    </div>
  );
}

export function StrongPasswordExample() {
  const [password] = useState('Abc123!@#');

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Contraseña Fuerte (5 requisitos)
      </h3>
      <Input
        type="password"
        label="Contraseña"
        value={password}
        readOnly
        placeholder="Abc123!@#"
      />
      <PasswordStrengthIndicator password={password} />
      <p className="text-sm text-gray-600">
        Cumple todos los requisitos. Barra verde al 100%.
      </p>
    </div>
  );
}

export function InteractiveExample() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const passwordsMatch = password === confirmPassword && password.length > 0;

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Ejemplo Interactivo con Confirmación
      </h3>
      
      <div className="space-y-2">
        <Input
          type="password"
          label="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Ingresa tu contraseña"
        />
        <PasswordStrengthIndicator password={password} />
      </div>

      <div className="space-y-2">
        <Input
          type="password"
          label="Confirmar contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirma tu contraseña"
          error={
            confirmPassword.length > 0 && !passwordsMatch
              ? 'Las contraseñas no coinciden'
              : undefined
          }
        />
        {passwordsMatch && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>Las contraseñas coinciden</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProgressionExample() {
  const examples = [
    { password: '', label: 'Sin contraseña' },
    { password: 'a', label: '1 carácter' },
    { password: 'abc', label: '3 caracteres (débil)' },
    { password: 'Abc', label: 'Con mayúscula' },
    { password: 'Abc1', label: 'Con número' },
    { password: 'Abc123', label: '6 caracteres' },
    { password: 'Abc12345', label: '8+ caracteres' },
    { password: 'Abc123!@', label: 'Con especial (fuerte)' },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Progresión de Fortaleza
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {examples.map((example, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-2">
            <p className="text-sm font-medium text-gray-700">{example.label}</p>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
              {example.password || '(vacío)'}
            </code>
            <PasswordStrengthIndicator password={example.password} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AllExamples() {
  return (
    <div className="space-y-12 py-8">
      <BasicExample />
      <hr className="border-gray-200" />
      <WeakPasswordExample />
      <hr className="border-gray-200" />
      <MediumPasswordExample />
      <hr className="border-gray-200" />
      <StrongPasswordExample />
      <hr className="border-gray-200" />
      <InteractiveExample />
      <hr className="border-gray-200" />
      <ProgressionExample />
    </div>
  );
}

export default AllExamples;
