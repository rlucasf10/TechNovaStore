/**
 * Ejemplos de Uso del Sistema de Diseño
 * 
 * Este archivo contiene ejemplos de cómo usar el sistema de diseño
 * en componentes React con Tailwind CSS.
 * 
 * Requisitos: 21.1, 21.2, 21.3, 21.4
 */

import React from 'react';

/**
 * Ejemplo 1: Botones con diferentes variantes
 */
export const ButtonExamples = () => {
  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
        Botones
      </h2>
      
      {/* Botón Primario */}
      <button className="bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
        Botón Primario
      </button>

      {/* Botón Secundario */}
      <button className="border-2 border-primary-600 text-primary-600 hover:bg-primary-50 font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
        Botón Secundario
      </button>

      {/* Botón Ghost */}
      <button className="text-primary-600 hover:bg-primary-50 font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
        Botón Ghost
      </button>

      {/* Botón Danger */}
      <button className="bg-error hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
        Botón Danger
      </button>

      {/* Botón Deshabilitado */}
      <button 
        disabled 
        className="bg-gray-300 text-gray-500 font-medium py-2 px-4 rounded-lg cursor-not-allowed opacity-60"
      >
        Botón Deshabilitado
      </button>

      {/* Botón con Loading */}
      <button className="bg-primary-600 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2">
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Cargando...
      </button>
    </div>
  );
};

/**
 * Ejemplo 2: Cards con diferentes estilos
 */
export const CardExamples = () => {
  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
        Cards
      </h2>

      {/* Card Simple */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-bg-tertiary p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-2">
          Card Simple
        </h3>
        <p className="text-gray-600 dark:text-dark-text-secondary">
          Este es un card básico con sombra sutil y bordes redondeados.
        </p>
      </div>

      {/* Card con Hover */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm hover:shadow-md border border-gray-200 dark:border-dark-bg-tertiary p-6 transition-shadow duration-200 cursor-pointer">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-2">
          Card con Hover
        </h3>
        <p className="text-gray-600 dark:text-dark-text-secondary">
          Este card tiene una elevación al hacer hover.
        </p>
      </div>

      {/* Card con Imagen */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-dark-bg-tertiary">
        <div className="h-48 bg-gradient-to-r from-primary-500 to-accent-500" />
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-2">
            Card con Imagen
          </h3>
          <p className="text-gray-600 dark:text-dark-text-secondary">
            Card con imagen de cabecera y contenido.
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Ejemplo 3: Inputs y Formularios
 */
export const InputExamples = () => {
  return (
    <div className="space-y-4 p-6 max-w-md">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
        Inputs
      </h2>

      {/* Input Normal */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Email
        </label>
        <input
          type="email"
          placeholder="tu@email.com"
          className="block w-full rounded-md border-gray-300 dark:border-dark-bg-tertiary dark:bg-dark-bg-tertiary dark:text-dark-text-primary shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
      </div>

      {/* Input con Error */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Contraseña
        </label>
        <input
          type="password"
          className="block w-full rounded-md border-error shadow-sm focus:border-error focus:ring-error sm:text-sm dark:bg-dark-bg-tertiary dark:text-dark-text-primary"
        />
        <p className="mt-1 text-sm text-error">La contraseña es requerida</p>
      </div>

      {/* Input con Éxito */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Nombre de usuario
        </label>
        <input
          type="text"
          value="usuario123"
          className="block w-full rounded-md border-success shadow-sm focus:border-success focus:ring-success sm:text-sm dark:bg-dark-bg-tertiary dark:text-dark-text-primary"
          readOnly
        />
        <p className="mt-1 text-sm text-success">✓ Nombre de usuario disponible</p>
      </div>

      {/* Textarea */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          Mensaje
        </label>
        <textarea
          rows={4}
          placeholder="Escribe tu mensaje aquí..."
          className="block w-full rounded-md border-gray-300 dark:border-dark-bg-tertiary dark:bg-dark-bg-tertiary dark:text-dark-text-primary shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
      </div>
    </div>
  );
};

/**
 * Ejemplo 4: Badges y Tags
 */
export const BadgeExamples = () => {
  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
        Badges
      </h2>

      <div className="flex flex-wrap gap-2">
        {/* Badge Success */}
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Éxito
        </span>

        {/* Badge Warning */}
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          Advertencia
        </span>

        {/* Badge Error */}
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          Error
        </span>

        {/* Badge Info */}
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          Información
        </span>

        {/* Badge con Contador */}
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
          Notificaciones
          <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary-600 rounded-full">
            5
          </span>
        </span>
      </div>
    </div>
  );
};

/**
 * Ejemplo 5: Skeleton Loaders
 */
export const SkeletonExamples = () => {
  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
        Skeleton Loaders
      </h2>

      {/* Skeleton Card */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-bg-tertiary p-6 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-dark-bg-tertiary rounded w-3/4 mb-4" />
        <div className="h-4 bg-gray-200 dark:bg-dark-bg-tertiary rounded w-full mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-dark-bg-tertiary rounded w-5/6" />
      </div>

      {/* Skeleton con Shimmer */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-bg-tertiary p-6">
        <div className="skeleton h-4 rounded w-3/4 mb-4" />
        <div className="skeleton h-4 rounded w-full mb-2" />
        <div className="skeleton h-4 rounded w-5/6" />
      </div>
    </div>
  );
};

/**
 * Ejemplo 6: Diseño Responsivo
 */
export const ResponsiveExample = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mb-4">
        Diseño Responsivo
      </h2>

      {/* Grid Responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
          <div
            key={item}
            className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-bg-tertiary p-6"
          >
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">
                {item}
              </div>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                Item {item}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Texto Responsivo */}
      <div className="mt-8">
        <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
          Este texto cambia de tamaño según el breakpoint
        </h3>
        <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-dark-text-secondary mt-2">
          El sistema de diseño está optimizado para Mobile-First.
        </p>
      </div>
    </div>
  );
};

/**
 * Ejemplo 7: Tema Oscuro
 */
export const DarkModeExample = () => {
  const [isDark, setIsDark] = React.useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
          Tema Oscuro
        </h2>
        <button
          onClick={toggleTheme}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          {isDark ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
        </button>
      </div>

      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-gray-200 dark:border-dark-bg-tertiary p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-2">
          Contenido Adaptable
        </h3>
        <p className="text-gray-600 dark:text-dark-text-secondary">
          Este contenido se adapta automáticamente al tema seleccionado.
          Los colores, fondos y bordes cambian para mantener la legibilidad
          y el contraste adecuado en ambos temas.
        </p>
      </div>
    </div>
  );
};

/**
 * Componente principal que muestra todos los ejemplos
 */
export const DesignSystemExamples = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary">
      <div className="max-w-7xl mx-auto py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-dark-text-primary mb-8 px-6">
          Sistema de Diseño - TechNovaStore
        </h1>
        
        <div className="space-y-12">
          <ButtonExamples />
          <CardExamples />
          <InputExamples />
          <BadgeExamples />
          <SkeletonExamples />
          <ResponsiveExample />
          <DarkModeExample />
        </div>
      </div>
    </div>
  );
};

export default DesignSystemExamples;
