'use client';

import React, { useState } from 'react';

/**
 * ChatFloatingButton Component
 * 
 * Botón flotante circular para abrir el ChatWidget.
 * Posicionado en la esquina inferior derecha de la pantalla.
 * 
 * Características:
 * - Botón circular con icono de chat
 * - Posición fixed bottom-right (20px desde bordes)
 * - Badge de notificación para mensajes nuevos
 * - Animación de pulso sutil
 * - Responsive (se adapta a móvil)
 * 
 * @example
 * ```tsx
 * <ChatFloatingButton 
 *   unreadCount={3}
 *   onClick={() => console.log('Chat opened')}
 * />
 * ```
 */

interface ChatFloatingButtonProps {
  /** Número de mensajes no leídos (muestra badge si > 0) */
  unreadCount?: number;
  /** Callback cuando se hace clic en el botón */
  onClick?: () => void;
  /** Clase CSS adicional */
  className?: string;
}

export const ChatFloatingButton: React.FC<ChatFloatingButtonProps> = ({
  unreadCount = 0,
  onClick,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        fixed bottom-5 right-5 z-50
        w-14 h-14 md:w-16 md:h-16
        bg-primary-600 hover:bg-primary-700
        text-white
        rounded-full
        shadow-lg hover:shadow-xl
        transition-all duration-300
        flex items-center justify-center
        focus:outline-none focus:ring-4 focus:ring-primary-300
        ${unreadCount > 0 ? 'animate-pulse-subtle' : ''}
        ${className}
      `}
      aria-label={`Abrir chat${unreadCount > 0 ? ` (${unreadCount} mensajes nuevos)` : ''}`}
      title="Asistente TechNova"
    >
      {/* Icono de chat (SVG) */}
      <svg
        className={`w-6 h-6 md:w-7 md:h-7 transition-transform duration-300 ${
          isHovered ? 'scale-110' : 'scale-100'
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>

      {/* Badge de notificación */}
      {unreadCount > 0 && (
        <span
          className="
            absolute -top-1 -right-1
            min-w-[20px] h-5
            px-1.5
            bg-error text-white
            text-xs font-semibold
            rounded-full
            flex items-center justify-center
            shadow-md
            animate-bounce-subtle
          "
          aria-label={`${unreadCount} mensajes nuevos`}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      {/* Anillo de pulso (solo visible cuando hay notificaciones) */}
      {unreadCount > 0 && (
        <span
          className="
            absolute inset-0
            rounded-full
            bg-primary-600
            opacity-75
            animate-ping-slow
          "
          aria-hidden="true"
        />
      )}
    </button>
  );
};

// Exportar como default también para facilitar imports
export default ChatFloatingButton;
