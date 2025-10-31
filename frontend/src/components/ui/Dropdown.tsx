'use client'

import React, {
    HTMLAttributes,
    forwardRef,
    ReactNode,
    useEffect,
    useRef,
    useState,
    useCallback,
    MouseEvent,
    Children,
    isValidElement,
    cloneElement,
} from 'react'
import { cn } from '@/lib/utils'

interface DropdownProps extends Omit<HTMLAttributes<HTMLDivElement>, 'content'> {
    /** Elemento que activa el dropdown (trigger) */
    trigger: ReactNode
    /** Contenido del dropdown */
    children: ReactNode
    /** Posición del dropdown relativa al trigger */
    placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | 'left' | 'right'
    /** Alineación del dropdown */
    align?: 'start' | 'center' | 'end'
    /** Offset en píxeles desde el trigger */
    offset?: number
    /** Deshabilitar el dropdown */
    disabled?: boolean
    /** Cerrar al hacer clic en un item */
    closeOnItemClick?: boolean
    /** Clase CSS personalizada para el contenedor del dropdown */
    containerClassName?: string
    /** Clase CSS personalizada para el contenido del dropdown */
    contentClassName?: string
    /** Callback cuando el dropdown se abre */
    onOpen?: () => void
    /** Callback cuando el dropdown se cierra */
    onClose?: () => void
}

/**
 * Componente Dropdown - Menú desplegable con posicionamiento inteligente
 * 
 * Características:
 * - Posicionamiento inteligente (ajusta si no hay espacio)
 * - Navegación por teclado (↑↓ Enter Escape)
 * - Cierre al hacer clic fuera
 * - Accesibilidad completa (ARIA, roles)
 * - Animaciones suaves
 * - Soporte para tema oscuro
 * 
 * @example
 * ```tsx
 * <Dropdown
 *   trigger={<Button>Abrir menú</Button>}
 *   placement="bottom-start"
 * >
 *   <DropdownItem onClick={() => console.log('Perfil')}>
 *     Mi Perfil
 *   </DropdownItem>
 *   <DropdownItem onClick={() => console.log('Configuración')}>
 *     Configuración
 *   </DropdownItem>
 *   <DropdownDivider />
 *   <DropdownItem variant="danger" onClick={() => console.log('Salir')}>
 *     Cerrar Sesión
 *   </DropdownItem>
 * </Dropdown>
 * ```
 * 
 * Requisitos: 5.2
 */
const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
    ({
        trigger,
        children,
        placement = 'bottom-start',
        align: _align = 'start', // Reserved for future use
        offset = 8,
        disabled = false,
        closeOnItemClick = true,
        className: _className, // Reserved for future use
        containerClassName,
        contentClassName,
        onOpen,
        onClose,
        ...props
    }, ref) => {
        const [isOpen, setIsOpen] = useState(false)
        const [position, setPosition] = useState({ top: 0, left: 0 })
        const [actualPlacement, setActualPlacement] = useState(placement)

        const triggerRef = useRef<HTMLDivElement>(null)
        const contentRef = useRef<HTMLDivElement>(null)
        const focusedIndexRef = useRef<number>(-1)

        // Obtener elementos focuseables (items del dropdown)
        const getFocusableItems = useCallback(() => {
            if (!contentRef.current) return []

            const items = Array.from(
                contentRef.current.querySelectorAll<HTMLElement>(
                    '[role="menuitem"]:not([disabled])'
                )
            )
            return items
        }, [])

        // Calcular posición del dropdown con posicionamiento inteligente
        const calculatePosition = useCallback(() => {
            if (!triggerRef.current || !contentRef.current) return

            const triggerRect = triggerRef.current.getBoundingClientRect()
            const contentRect = contentRef.current.getBoundingClientRect()
            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight

            let top = 0
            let left = 0
            let finalPlacement = placement

            // Calcular posición según placement
            switch (placement) {
                case 'bottom-start':
                    top = triggerRect.bottom + offset
                    left = triggerRect.left

                    // Verificar si hay espacio abajo, si no, colocar arriba
                    if (top + contentRect.height > viewportHeight) {
                        top = triggerRect.top - contentRect.height - offset
                        finalPlacement = 'top-start'
                    }

                    // Verificar si hay espacio a la derecha
                    if (left + contentRect.width > viewportWidth) {
                        left = triggerRect.right - contentRect.width
                        finalPlacement = finalPlacement.replace('start', 'end') as typeof placement
                    }
                    break

                case 'bottom-end':
                    top = triggerRect.bottom + offset
                    left = triggerRect.right - contentRect.width

                    // Verificar si hay espacio abajo
                    if (top + contentRect.height > viewportHeight) {
                        top = triggerRect.top - contentRect.height - offset
                        finalPlacement = 'top-end'
                    }

                    // Verificar si hay espacio a la izquierda
                    if (left < 0) {
                        left = triggerRect.left
                        finalPlacement = finalPlacement.replace('end', 'start') as typeof placement
                    }
                    break

                case 'top-start':
                    top = triggerRect.top - contentRect.height - offset
                    left = triggerRect.left

                    // Verificar si hay espacio arriba
                    if (top < 0) {
                        top = triggerRect.bottom + offset
                        finalPlacement = 'bottom-start'
                    }

                    // Verificar si hay espacio a la derecha
                    if (left + contentRect.width > viewportWidth) {
                        left = triggerRect.right - contentRect.width
                        finalPlacement = finalPlacement.replace('start', 'end') as typeof placement
                    }
                    break

                case 'top-end':
                    top = triggerRect.top - contentRect.height - offset
                    left = triggerRect.right - contentRect.width

                    // Verificar si hay espacio arriba
                    if (top < 0) {
                        top = triggerRect.bottom + offset
                        finalPlacement = 'bottom-end'
                    }

                    // Verificar si hay espacio a la izquierda
                    if (left < 0) {
                        left = triggerRect.left
                        finalPlacement = finalPlacement.replace('end', 'start') as typeof placement
                    }
                    break

                case 'left':
                    top = triggerRect.top + (triggerRect.height - contentRect.height) / 2
                    left = triggerRect.left - contentRect.width - offset

                    // Verificar si hay espacio a la izquierda
                    if (left < 0) {
                        left = triggerRect.right + offset
                        finalPlacement = 'right'
                    }
                    break

                case 'right':
                    top = triggerRect.top + (triggerRect.height - contentRect.height) / 2
                    left = triggerRect.right + offset

                    // Verificar si hay espacio a la derecha
                    if (left + contentRect.width > viewportWidth) {
                        left = triggerRect.left - contentRect.width - offset
                        finalPlacement = 'left'
                    }
                    break
            }

            // Asegurar que el dropdown no se salga de la pantalla verticalmente
            if (top < 0) top = offset
            if (top + contentRect.height > viewportHeight) {
                top = viewportHeight - contentRect.height - offset
            }

            // Asegurar que el dropdown no se salga de la pantalla horizontalmente
            if (left < 0) left = offset
            if (left + contentRect.width > viewportWidth) {
                left = viewportWidth - contentRect.width - offset
            }

            setPosition({ top, left })
            setActualPlacement(finalPlacement)
        }, [placement, offset])

        // Abrir dropdown
        const openDropdown = useCallback(() => {
            if (disabled) return
            setIsOpen(true)
            onOpen?.()
        }, [disabled, onOpen])

        // Cerrar dropdown
        const closeDropdown = useCallback(() => {
            setIsOpen(false)
            focusedIndexRef.current = -1
            onClose?.()

            // Devolver foco al trigger
            if (triggerRef.current) {
                const button = triggerRef.current.querySelector('button')
                button?.focus()
            }
        }, [onClose])

        // Toggle dropdown
        const toggleDropdown = useCallback(() => {
            if (isOpen) {
                closeDropdown()
            } else {
                openDropdown()
            }
        }, [isOpen, openDropdown, closeDropdown])

        // Manejar click en el trigger
        const handleTriggerClick = useCallback((e: MouseEvent) => {
            e.stopPropagation()
            toggleDropdown()
        }, [toggleDropdown])

        // Manejar click fuera del dropdown
        const handleClickOutside = useCallback((event: globalThis.MouseEvent) => {
            if (
                triggerRef.current &&
                contentRef.current &&
                !triggerRef.current.contains(event.target as Node) &&
                !contentRef.current.contains(event.target as Node)
            ) {
                closeDropdown()
            }
        }, [closeDropdown])

        // Manejar navegación por teclado
        const handleKeyDown = useCallback((event: globalThis.KeyboardEvent) => {
            if (!isOpen) return

            const items = getFocusableItems()
            if (items.length === 0) return

            switch (event.key) {
                case 'Escape':
                    event.preventDefault()
                    closeDropdown()
                    break

                case 'ArrowDown':
                    event.preventDefault()
                    focusedIndexRef.current = (focusedIndexRef.current + 1) % items.length
                    items[focusedIndexRef.current].focus()
                    break

                case 'ArrowUp':
                    event.preventDefault()
                    focusedIndexRef.current =
                        focusedIndexRef.current <= 0
                            ? items.length - 1
                            : focusedIndexRef.current - 1
                    items[focusedIndexRef.current].focus()
                    break

                case 'Home':
                    event.preventDefault()
                    focusedIndexRef.current = 0
                    items[0].focus()
                    break

                case 'End':
                    event.preventDefault()
                    focusedIndexRef.current = items.length - 1
                    items[items.length - 1].focus()
                    break

                case 'Enter':
                case ' ': {
                    event.preventDefault()
                    const focusedItem = items[focusedIndexRef.current]
                    if (focusedItem) {
                        focusedItem.click()
                    }
                    break
                }
            }
        }, [isOpen, getFocusableItems, closeDropdown])

        // Efectos
        useEffect(() => {
            if (isOpen) {
                // Calcular posición
                calculatePosition()

                // Agregar event listeners
                document.addEventListener('mousedown', handleClickOutside)
                document.addEventListener('keydown', handleKeyDown)

                // Enfocar primer item después de un pequeño delay
                setTimeout(() => {
                    const items = getFocusableItems()
                    if (items.length > 0) {
                        focusedIndexRef.current = 0
                        items[0].focus()
                    }
                }, 100)

                // Recalcular posición en resize y scroll
                window.addEventListener('resize', calculatePosition)
                window.addEventListener('scroll', calculatePosition, true)
            } else {
                document.removeEventListener('mousedown', handleClickOutside)
                document.removeEventListener('keydown', handleKeyDown)
                window.removeEventListener('resize', calculatePosition)
                window.removeEventListener('scroll', calculatePosition, true)
            }

            return () => {
                document.removeEventListener('mousedown', handleClickOutside)
                document.removeEventListener('keydown', handleKeyDown)
                window.removeEventListener('resize', calculatePosition)
                window.removeEventListener('scroll', calculatePosition, true)
            }
        }, [isOpen, handleClickOutside, handleKeyDown, calculatePosition, getFocusableItems])

        // Clonar children para agregar prop de cierre
        const childrenWithProps = Children.map(children, (child) => {
            if (isValidElement(child) && closeOnItemClick) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return cloneElement(child as React.ReactElement<any>, {
                    onClick: (e: MouseEvent) => {
                        child.props.onClick?.(e)
                        if (!e.defaultPrevented) {
                            closeDropdown()
                        }
                    },
                })
            }
            return child
        })

        return (
            <div
                ref={ref}
                className={cn('relative inline-block', containerClassName)}
                {...props}
            >
                {/* Trigger */}
                <div
                    ref={triggerRef}
                    onClick={handleTriggerClick}
                    className={cn(disabled && 'opacity-50 cursor-not-allowed')}
                >
                    {trigger}
                </div>

                {/* Dropdown Content */}
                {isOpen && (
                    <div
                        ref={contentRef}
                        className={cn(
                            'fixed z-50 min-w-[12rem] overflow-hidden',
                            'bg-white dark:bg-dark-bg-secondary',
                            'border border-gray-200 dark:border-dark-bg-tertiary',
                            'rounded-lg shadow-lg',
                            'animate-in fade-in-0 zoom-in-95 duration-100',
                            actualPlacement.includes('top') && 'slide-in-from-bottom-2',
                            actualPlacement.includes('bottom') && 'slide-in-from-top-2',
                            actualPlacement === 'left' && 'slide-in-from-right-2',
                            actualPlacement === 'right' && 'slide-in-from-left-2',
                            contentClassName
                        )}
                        style={{
                            top: `${position.top}px`,
                            left: `${position.left}px`,
                        }}
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="dropdown-trigger"
                    >
                        <div className="py-1">
                            {childrenWithProps}
                        </div>
                    </div>
                )}
            </div>
        )
    }
)

Dropdown.displayName = 'Dropdown'

/**
 * DropdownItem - Item individual del dropdown
 */
interface DropdownItemProps extends HTMLAttributes<HTMLButtonElement> {
    /** Variante visual del item */
    variant?: 'default' | 'danger'
    /** Icono a mostrar antes del texto */
    icon?: ReactNode
    /** Deshabilitar el item */
    disabled?: boolean
    /** Mostrar como activo/seleccionado */
    active?: boolean
}

const DropdownItem = forwardRef<HTMLButtonElement, DropdownItemProps>(
    ({ className, variant = 'default', icon, disabled, active, children, ...props }, ref) => {
        const variants = {
            default: cn(
                'text-gray-700 dark:text-dark-text-primary',
                'hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary',
                active && 'bg-gray-100 dark:bg-dark-bg-tertiary'
            ),
            danger: cn(
                'text-error',
                'hover:bg-red-50 dark:hover:bg-red-900/20',
                active && 'bg-red-50 dark:bg-red-900/20'
            ),
        }

        return (
            <button
                ref={ref}
                type="button"
                role="menuitem"
                disabled={disabled}
                className={cn(
                    'w-full flex items-center gap-3 px-4 py-2 text-sm text-left',
                    'transition-colors duration-150',
                    'focus:outline-none focus:bg-gray-100 dark:focus:bg-dark-bg-tertiary',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    variants[variant],
                    className
                )}
                {...props}
            >
                {icon && (
                    <span className="flex-shrink-0 w-5 h-5" aria-hidden="true">
                        {icon}
                    </span>
                )}
                <span className="flex-1">{children}</span>
            </button>
        )
    }
)

DropdownItem.displayName = 'DropdownItem'

/**
 * DropdownDivider - Separador visual entre items
 */
interface DropdownDividerProps extends HTMLAttributes<HTMLDivElement> { }

const DropdownDivider = forwardRef<HTMLDivElement, DropdownDividerProps>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                role="separator"
                className={cn(
                    'my-1 h-px bg-gray-200 dark:bg-dark-bg-tertiary',
                    className
                )}
                {...props}
            />
        )
    }
)

DropdownDivider.displayName = 'DropdownDivider'

/**
 * DropdownLabel - Etiqueta para agrupar items
 */
interface DropdownLabelProps extends HTMLAttributes<HTMLDivElement> { }

const DropdownLabel = forwardRef<HTMLDivElement, DropdownLabelProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'px-4 py-2 text-xs font-semibold text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider',
                    className
                )}
                {...props}
            >
                {children}
            </div>
        )
    }
)

DropdownLabel.displayName = 'DropdownLabel'

export { Dropdown, DropdownItem, DropdownDivider, DropdownLabel }
export type { DropdownProps, DropdownItemProps, DropdownDividerProps, DropdownLabelProps }
