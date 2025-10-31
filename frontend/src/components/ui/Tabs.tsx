'use client';

import { useState, useRef, useEffect, KeyboardEvent, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface TabItem {
    /** Identificador único del tab */
    id: string
    /** Etiqueta visible del tab */
    label: string
    /** Contenido del tab */
    content: ReactNode
    /** Indica si el tab está deshabilitado */
    disabled?: boolean
    /** Icono opcional a mostrar antes de la etiqueta */
    icon?: ReactNode
}

interface TabsProps {
    /** Lista de tabs a mostrar */
    tabs: TabItem[]
    /** ID del tab activo por defecto */
    defaultActiveTab?: string
    /** Callback cuando cambia el tab activo */
    onTabChange?: (tabId: string) => void
    /** Clase CSS adicional para el contenedor */
    className?: string
    /** Variante visual de los tabs */
    variant?: 'default' | 'pills' | 'underline'
    /** Alineación de los tabs */
    align?: 'start' | 'center' | 'end'
}

/**
 * Componente Tabs para navegación por pestañas
 * 
 * Características:
 * - Navegación por teclado (flechas izquierda/derecha, Home, End)
 * - Indicador visual del tab activo
 * - Soporte para tabs deshabilitados
 * - Múltiples variantes visuales
 * - Accesible (ARIA labels y roles)
 * 
 * @example
 * ```tsx
 * <Tabs
 *   tabs={[
 *     { id: 'desc', label: 'Descripción', content: <p>Contenido...</p> },
 *     { id: 'specs', label: 'Especificaciones', content: <Table /> },
 *     { id: 'reviews', label: 'Reviews', content: <Reviews /> }
 *   ]}
 *   defaultActiveTab="desc"
 * />
 * ```
 */
export function Tabs({
    tabs,
    defaultActiveTab,
    onTabChange,
    className,
    variant = 'default',
    align = 'start',
}: TabsProps) {
    // Estado del tab activo
    const [activeTab, setActiveTab] = useState<string>(
        defaultActiveTab || tabs[0]?.id || ''
    )

    // Referencias para gestionar el foco
    const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

    // Actualizar tab activo cuando cambia defaultActiveTab
    useEffect(() => {
        if (defaultActiveTab && defaultActiveTab !== activeTab) {
            setActiveTab(defaultActiveTab)
        }
    }, [defaultActiveTab])

    // Manejar cambio de tab
    const handleTabClick = (tabId: string) => {
        const tab = tabs.find(t => t.id === tabId)
        if (tab?.disabled) return

        setActiveTab(tabId)
        onTabChange?.(tabId)
    }

    // Navegación por teclado
    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
        const enabledTabs = tabs.filter(tab => !tab.disabled)
        const currentEnabledIndex = enabledTabs.findIndex(tab => tab.id === tabs[currentIndex].id)

        let nextIndex: number | null = null

        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault()
                // Ir al tab anterior (circular)
                nextIndex = currentEnabledIndex > 0
                    ? currentEnabledIndex - 1
                    : enabledTabs.length - 1
                break

            case 'ArrowRight':
                event.preventDefault()
                // Ir al siguiente tab (circular)
                nextIndex = currentEnabledIndex < enabledTabs.length - 1
                    ? currentEnabledIndex + 1
                    : 0
                break

            case 'Home':
                event.preventDefault()
                // Ir al primer tab
                nextIndex = 0
                break

            case 'End':
                event.preventDefault()
                // Ir al último tab
                nextIndex = enabledTabs.length - 1
                break

            default:
                return
        }

        if (nextIndex !== null) {
            const nextTab = enabledTabs[nextIndex]
            const nextButton = tabRefs.current.get(nextTab.id)

            if (nextButton) {
                nextButton.focus()
                handleTabClick(nextTab.id)
            }
        }
    }

    // Obtener el contenido del tab activo
    const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content

    // Clases base para el contenedor de tabs
    const tabListClasses = cn(
        'flex gap-1',
        {
            'justify-start': align === 'start',
            'justify-center': align === 'center',
            'justify-end': align === 'end',
        }
    )

    // Clases para cada variante
    const getTabClasses = (tab: TabItem, isActive: boolean) => {
        const baseClasses = 'inline-flex items-center gap-2 px-4 py-2.5 font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

        const variantClasses = {
            default: cn(
                'border-b-2 rounded-t-lg',
                isActive
                    ? 'border-primary-600 text-primary-600 bg-primary-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            ),
            pills: cn(
                'rounded-full',
                isActive
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            ),
            underline: cn(
                'border-b-2',
                isActive
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            ),
        }

        return cn(
            baseClasses,
            variantClasses[variant],
            tab.disabled && 'cursor-not-allowed opacity-50'
        )
    }

    return (
        <div className={cn('w-full', className)}>
            {/* Lista de tabs */}
            <div
                role="tablist"
                aria-label="Navegación por pestañas"
                className={cn(
                    tabListClasses,
                    variant === 'default' && 'border-b border-gray-200',
                    variant === 'underline' && 'border-b border-gray-200'
                )}
            >
                {tabs.map((tab, index) => {
                    const isActive = tab.id === activeTab

                    return (
                        <button
                            key={tab.id}
                            ref={(el) => {
                                if (el) {
                                    tabRefs.current.set(tab.id, el)
                                } else {
                                    tabRefs.current.delete(tab.id)
                                }
                            }}
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={`tabpanel-${tab.id}`}
                            aria-disabled={tab.disabled}
                            tabIndex={isActive ? 0 : -1}
                            disabled={tab.disabled}
                            className={getTabClasses(tab, isActive)}
                            onClick={() => handleTabClick(tab.id)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                        >
                            {/* Icono opcional */}
                            {tab.icon && (
                                <span className="inline-flex w-5 h-5" aria-hidden="true">
                                    {tab.icon}
                                </span>
                            )}

                            {/* Etiqueta del tab */}
                            <span>{tab.label}</span>

                            {/* Indicador visual para tab activo (solo en variante underline) */}
                            {variant === 'underline' && isActive && (
                                <span className="sr-only">(activo)</span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Contenido del tab activo */}
            <div
                role="tabpanel"
                id={`tabpanel-${activeTab}`}
                aria-labelledby={`tab-${activeTab}`}
                tabIndex={0}
                className="mt-4 focus:outline-none"
            >
                {activeTabContent}
            </div>
        </div>
    )
}

export type { TabsProps }
