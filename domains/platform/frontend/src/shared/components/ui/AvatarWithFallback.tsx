/**
 * AvatarWithFallback Component
 * 
 * Componente de avatar reutilizable que muestra la imagen del usuario
 * (ej: avatar de Google/GitHub) y si falla o no existe, muestra las
 * iniciales del usuario como fallback.
 * 
 * Características:
 * - Prioriza la imagen de avatar (Google, GitHub, etc.)
 * - Fallback automático a iniciales si la imagen falla
 * - Colores de fondo consistentes basados en el nombre
 * - Múltiples tamaños disponibles
 */

'use client';

import { useState, useEffect } from 'react';

// ============================================================================
// Tipos
// ============================================================================

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface AvatarWithFallbackProps {
  /** URL de la imagen del avatar (puede ser de Google, GitHub, etc.) */
  src?: string;
  /** Texto alternativo para la imagen */
  alt?: string;
  /** Nombre del usuario (para generar iniciales) */
  firstName?: string;
  /** Apellido del usuario (para generar iniciales) */
  lastName?: string;
  /** Tamaño del avatar */
  size?: AvatarSize;
  /** Clases CSS adicionales */
  className?: string;
}

// ============================================================================
// Funciones de Utilidad
// ============================================================================

/**
 * Genera las iniciales del usuario a partir de su nombre
 * @param firstName - Nombre del usuario
 * @param lastName - Apellido del usuario
 * @returns Iniciales en mayúsculas (máximo 2 caracteres)
 */
function getUserInitials(firstName?: string, lastName?: string): string {
  const firstInitial = firstName?.charAt(0)?.toUpperCase() || '';
  const lastInitial = lastName?.charAt(0)?.toUpperCase() || '';
  return `${firstInitial}${lastInitial}` || 'U';
}

/**
 * Genera un color de fondo consistente basado en el nombre del usuario
 * @param name - Nombre completo del usuario
 * @returns Clase de Tailwind para el gradiente de fondo
 */
function getAvatarGradient(name: string): string {
  const gradients = [
    'from-blue-600 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-violet-500 to-purple-600',
    'from-cyan-500 to-blue-600',
  ];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
}

// ============================================================================
// Configuración de Tamaños
// ============================================================================

const sizeConfig: Record<AvatarSize, { container: string; text: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-xs' },
  sm: { container: 'w-8 h-8', text: 'text-sm' },
  md: { container: 'w-10 h-10', text: 'text-sm' },
  lg: { container: 'w-12 h-12', text: 'text-lg' },
  xl: { container: 'w-16 h-16', text: 'text-xl' },
  '2xl': { container: 'w-20 h-20', text: 'text-2xl' },
};

// ============================================================================
// Componente AvatarWithFallback
// ============================================================================

export function AvatarWithFallback({
  src,
  alt = 'Avatar del usuario',
  firstName,
  lastName,
  size = 'md',
  className = '',
}: AvatarWithFallbackProps) {
  const [imageError, setImageError] = useState(false);

  // Resetear error si cambia la URL del avatar
  useEffect(() => {
    setImageError(false);
  }, [src]);

  const initials = getUserInitials(firstName, lastName);
  const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'User';
  const gradient = getAvatarGradient(fullName);
  const { container, text } = sizeConfig[size];

  // Si hay URL de avatar y no ha fallado, mostrar imagen
  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${container} rounded-full object-cover shadow-md ${className}`}
        onError={() => setImageError(true)}
      />
    );
  }

  // Fallback a iniciales con gradiente
  return (
    <div
      className={`${container} bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center text-white font-bold ${text} shadow-md ${className}`}
      title={fullName}
    >
      {initials}
    </div>
  );
}

export default AvatarWithFallback;
