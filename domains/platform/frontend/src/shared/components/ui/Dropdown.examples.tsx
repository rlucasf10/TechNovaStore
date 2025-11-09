/**
 * Ejemplos de uso del componente Dropdown
 * 
 * Este archivo contiene ejemplos prácticos de cómo usar el componente Dropdown
 * en diferentes escenarios comunes de la aplicación.
 */

import { Dropdown, DropdownItem, DropdownDivider, DropdownLabel } from './Dropdown'
import { Button } from './Button'

// Iconos de ejemplo (reemplazar con iconos reales del proyecto)
const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

const EditIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const MoreVerticalIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
)

const GlobeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

/**
 * Ejemplo 1: Menú de Usuario
 * Uso típico en el header para mostrar opciones de cuenta
 */
export function UserMenuExample() {
  const handleLogout = () => {
    // eslint-disable-next-line no-console
    console.log('Cerrando sesión...')
  }

  return (
    <Dropdown
      trigger={
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="https://via.placeholder.com/32" 
            alt="Usuario" 
            className="w-8 h-8 rounded-full"
          />
          <span className="font-medium">Juan Pérez</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      }
      placement="bottom-end"
    >
      <DropdownLabel>Mi Cuenta</DropdownLabel>
      <DropdownItem icon={<UserIcon />}>
        Mi Perfil
      </DropdownItem>
      <DropdownItem icon={<SettingsIcon />}>
        Configuración
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem icon={<LogoutIcon />} variant="danger" onClick={handleLogout}>
        Cerrar Sesión
      </DropdownItem>
    </Dropdown>
  )
}

/**
 * Ejemplo 2: Menú de Acciones
 * Menú contextual para acciones sobre un elemento (editar, eliminar, etc.)
 */
export function ActionsMenuExample() {
  return (
    <Dropdown
      trigger={
        <Button variant="ghost" size="sm">
          <MoreVerticalIcon />
        </Button>
      }
      placement="bottom-end"
    >
      <DropdownItem icon={<EditIcon />}>
        Editar
      </DropdownItem>
      <DropdownItem icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>}>
        Duplicar
      </DropdownItem>
      <DropdownItem icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>}>
        Compartir
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem icon={<TrashIcon />} variant="danger">
        Eliminar
      </DropdownItem>
    </Dropdown>
  )
}

/**
 * Ejemplo 3: Selector de Idioma
 * Dropdown para cambiar el idioma de la aplicación
 */
export function LanguageSelectorExample() {
  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  ]

  const currentLanguage = 'es'

  return (
    <Dropdown
      trigger={
        <Button variant="ghost">
          <GlobeIcon />
          <span>Español</span>
        </Button>
      }
      placement="bottom-start"
    >
      <DropdownLabel>Idioma</DropdownLabel>
      {languages.map((lang) => (
        <DropdownItem
          key={lang.code}
          active={currentLanguage === lang.code}
          // eslint-disable-next-line no-console
          onClick={() => console.log(`Cambiar a ${lang.name}`)}
        >
          <span className="mr-2">{lang.flag}</span>
          {lang.name}
        </DropdownItem>
      ))}
    </Dropdown>
  )
}

/**
 * Ejemplo 4: Menú de Filtros
 * Dropdown con múltiples grupos de opciones
 */
export function FiltersMenuExample() {
  return (
    <Dropdown
      trigger={
        <Button variant="secondary">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtros
        </Button>
      }
    >
      <DropdownLabel>Ordenar por</DropdownLabel>
      <DropdownItem>Nombre (A-Z)</DropdownItem>
      <DropdownItem>Precio (Menor a Mayor)</DropdownItem>
      <DropdownItem>Precio (Mayor a Menor)</DropdownItem>
      <DropdownItem>Más Reciente</DropdownItem>
      
      <DropdownDivider />
      
      <DropdownLabel>Vista</DropdownLabel>
      <DropdownItem>
        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        Cuadrícula
      </DropdownItem>
      <DropdownItem>
        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        Lista
      </DropdownItem>
    </Dropdown>
  )
}

/**
 * Ejemplo 5: Menú de Notificaciones
 * Dropdown con contenido personalizado (no solo items)
 */
export function NotificationsMenuExample() {
  const notifications = [
    { id: 1, title: 'Nuevo pedido', message: 'Pedido #1234 confirmado', time: '5 min' },
    { id: 2, title: 'Envío en camino', message: 'Tu pedido está en camino', time: '1 hora' },
    { id: 3, title: 'Oferta especial', message: '20% de descuento en laptops', time: '2 horas' },
  ]

  return (
    <Dropdown
      trigger={
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
        </button>
      }
      placement="bottom-end"
      closeOnItemClick={false}
      contentClassName="min-w-[20rem]"
    >
      <div className="px-4 py-3 border-b border-gray-200 dark:border-dark-bg-tertiary">
        <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary">
          Notificaciones
        </h3>
        <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
          Tienes {notifications.length} notificaciones nuevas
        </p>
      </div>
      
      <div className="max-h-[300px] overflow-y-auto">
        {notifications.map((notif) => (
          <button
            key={notif.id}
            type="button"
            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors border-b border-gray-100 dark:border-dark-bg-tertiary last:border-0"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-900 dark:text-dark-text-primary">
                  {notif.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-dark-text-secondary mt-1">
                  {notif.message}
                </p>
              </div>
              <span className="text-xs text-gray-400 ml-2">{notif.time}</span>
            </div>
          </button>
        ))}
      </div>
      
      <div className="px-4 py-3 border-t border-gray-200 dark:border-dark-bg-tertiary">
        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          Ver todas las notificaciones
        </button>
      </div>
    </Dropdown>
  )
}

/**
 * Ejemplo 6: Diferentes Posiciones
 * Demostración de todas las posiciones disponibles
 */
export function PositionsExample() {
  return (
    <div className="flex flex-col gap-8 items-center justify-center min-h-[400px]">
      <div className="flex gap-4">
        <Dropdown trigger={<Button>Top Start</Button>} placement="top-start">
          <DropdownItem>Item 1</DropdownItem>
          <DropdownItem>Item 2</DropdownItem>
          <DropdownItem>Item 3</DropdownItem>
        </Dropdown>
        
        <Dropdown trigger={<Button>Top End</Button>} placement="top-end">
          <DropdownItem>Item 1</DropdownItem>
          <DropdownItem>Item 2</DropdownItem>
          <DropdownItem>Item 3</DropdownItem>
        </Dropdown>
      </div>
      
      <div className="flex gap-4">
        <Dropdown trigger={<Button>Left</Button>} placement="left">
          <DropdownItem>Item 1</DropdownItem>
          <DropdownItem>Item 2</DropdownItem>
          <DropdownItem>Item 3</DropdownItem>
        </Dropdown>
        
        <Dropdown trigger={<Button>Right</Button>} placement="right">
          <DropdownItem>Item 1</DropdownItem>
          <DropdownItem>Item 2</DropdownItem>
          <DropdownItem>Item 3</DropdownItem>
        </Dropdown>
      </div>
      
      <div className="flex gap-4">
        <Dropdown trigger={<Button>Bottom Start</Button>} placement="bottom-start">
          <DropdownItem>Item 1</DropdownItem>
          <DropdownItem>Item 2</DropdownItem>
          <DropdownItem>Item 3</DropdownItem>
        </Dropdown>
        
        <Dropdown trigger={<Button>Bottom End</Button>} placement="bottom-end">
          <DropdownItem>Item 1</DropdownItem>
          <DropdownItem>Item 2</DropdownItem>
          <DropdownItem>Item 3</DropdownItem>
        </Dropdown>
      </div>
    </div>
  )
}

/**
 * Ejemplo 7: Dropdown con Estado Activo
 * Muestra cómo usar el estado activo en items
 */
export function ActiveStateExample() {
  const sortOptions = ['Nombre', 'Precio', 'Fecha', 'Popularidad']
  const currentSort = 'Precio'

  return (
    <Dropdown
      trigger={
        <Button variant="secondary">
          Ordenar por: {currentSort}
        </Button>
      }
    >
      <DropdownLabel>Ordenar por</DropdownLabel>
      {sortOptions.map((option) => (
        <DropdownItem
          key={option}
          active={currentSort === option}
          onClick={() => {/* TODO: Implementar ordenamiento */}}
        >
          {option}
        </DropdownItem>
      ))}
    </Dropdown>
  )
}

/**
 * Ejemplo 8: Dropdown Deshabilitado
 * Muestra cómo deshabilitar el dropdown o items individuales
 */
export function DisabledExample() {
  return (
    <div className="flex gap-4">
      {/* Dropdown completamente deshabilitado */}
      <Dropdown
        trigger={<Button>Dropdown Deshabilitado</Button>}
        disabled={true}
      >
        <DropdownItem>Item 1</DropdownItem>
        <DropdownItem>Item 2</DropdownItem>
      </Dropdown>
      
      {/* Dropdown con items individuales deshabilitados */}
      <Dropdown trigger={<Button>Items Deshabilitados</Button>}>
        <DropdownItem>Item Habilitado</DropdownItem>
        <DropdownItem disabled>Item Deshabilitado</DropdownItem>
        <DropdownItem>Otro Item Habilitado</DropdownItem>
      </Dropdown>
    </div>
  )
}
