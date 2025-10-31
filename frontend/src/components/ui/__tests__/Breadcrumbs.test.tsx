/**
 * Tests para el componente Breadcrumbs
 * Verifica navegación jerárquica, separadores, truncado y responsive
 */

import { render, screen } from '@testing-library/react'
import { Breadcrumbs, ChevronSeparator, HomeIcon, type BreadcrumbItem } from '../Breadcrumbs'

// Mock de Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: any) => {
    return <a href={href}>{children}</a>
  }
})

describe('Breadcrumbs Component', () => {
  // Datos de prueba
  const basicItems: BreadcrumbItem[] = [
    { label: 'Inicio', href: '/' },
    { label: 'Productos', href: '/productos' },
    { label: 'Laptops', href: '/productos/laptops' },
    { label: 'MacBook Pro 16"' },
  ]

  const itemsWithIcon: BreadcrumbItem[] = [
    { label: 'Inicio', href: '/', icon: <HomeIcon /> },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Pedidos' },
  ]

  // Tests de renderizado básico
  describe('Renderizado básico', () => {
    it('renderiza correctamente con items básicos', () => {
      render(<Breadcrumbs items={basicItems} />)
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      expect(screen.getByText('Inicio')).toBeInTheDocument()
      expect(screen.getByText('Productos')).toBeInTheDocument()
      expect(screen.getByText('Laptops')).toBeInTheDocument()
      expect(screen.getByText('MacBook Pro 16"')).toBeInTheDocument()
    })

    it('no renderiza nada si items está vacío', () => {
      const { container } = render(<Breadcrumbs items={[]} />)
      expect(container.firstChild).toBeNull()
    })

    it('tiene el aria-label correcto', () => {
      render(<Breadcrumbs items={basicItems} />)
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Breadcrumb')
    })

    it('usa una lista ordenada (ol)', () => {
      const { container } = render(<Breadcrumbs items={basicItems} />)
      expect(container.querySelector('ol')).toBeInTheDocument()
    })
  })

  // Tests de links
  describe('Links', () => {
    it('renderiza links para elementos con href', () => {
      render(<Breadcrumbs items={basicItems} />)
      const inicioLink = screen.getByRole('link', { name: /navegar a inicio/i })
      expect(inicioLink).toHaveAttribute('href', '/')
    })

    it('no renderiza link para el último elemento', () => {
      render(<Breadcrumbs items={basicItems} />)
      const lastItem = screen.getByText('MacBook Pro 16"')
      expect(lastItem.tagName).toBe('SPAN')
    })

    it('el último elemento tiene aria-current="page"', () => {
      render(<Breadcrumbs items={basicItems} />)
      const lastItem = screen.getByText('MacBook Pro 16"')
      expect(lastItem).toHaveAttribute('aria-current', 'page')
    })

    it('los elementos intermedios no tienen aria-current', () => {
      render(<Breadcrumbs items={basicItems} />)
      const productosLink = screen.getByRole('link', { name: /navegar a productos/i })
      expect(productosLink).not.toHaveAttribute('aria-current')
    })
  })

  // Tests de separadores
  describe('Separadores', () => {
    it('usa separador por defecto "/"', () => {
      const { container } = render(<Breadcrumbs items={basicItems} />)
      const separators = container.querySelectorAll('li[aria-hidden="true"]')
      expect(separators.length).toBe(3) // 4 items = 3 separadores
      expect(separators[0].textContent).toBe('/')
    })

    it('usa separador personalizado de texto', () => {
      const { container } = render(<Breadcrumbs items={basicItems} separator="›" />)
      const separators = container.querySelectorAll('li[aria-hidden="true"]')
      expect(separators[0].textContent).toBe('›')
    })

    it('usa separador personalizado de componente', () => {
      const { container } = render(
        <Breadcrumbs items={basicItems} separator={<ChevronSeparator />} />
      )
      const separators = container.querySelectorAll('li[aria-hidden="true"]')
      expect(separators.length).toBe(3)
      expect(separators[0].querySelector('svg')).toBeInTheDocument()
    })

    it('no muestra separador después del último elemento', () => {
      const { container } = render(<Breadcrumbs items={basicItems} />)
      const listItems = container.querySelectorAll('li')
      // Último li debe ser el elemento, no un separador
      const lastLi = listItems[listItems.length - 1]
      expect(lastLi.getAttribute('aria-hidden')).not.toBe('true')
    })
  })

  // Tests de iconos
  describe('Iconos', () => {
    it('renderiza iconos cuando se proporcionan', () => {
      const { container } = render(<Breadcrumbs items={itemsWithIcon} />)
      const icons = container.querySelectorAll('span[aria-hidden="true"] svg')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('los iconos tienen aria-hidden="true"', () => {
      const { container } = render(<Breadcrumbs items={itemsWithIcon} />)
      const iconSpans = container.querySelectorAll('span.w-4.h-4')
      iconSpans.forEach((span) => {
        expect(span).toHaveAttribute('aria-hidden', 'true')
      })
    })
  })

  // Tests de truncado
  describe('Truncado de texto', () => {
    const longTextItems: BreadcrumbItem[] = [
      { label: 'Inicio', href: '/' },
      { label: 'Este es un texto muy largo que debería ser truncado', href: '/largo' },
      { label: 'Página actual' },
    ]

    it('trunca texto largo según maxLength', () => {
      render(<Breadcrumbs items={longTextItems} maxLength={20} />)
      const truncatedText = screen.getByText(/Este es un texto muy/)
      expect(truncatedText.textContent).toContain('...')
      expect(truncatedText.textContent?.length).toBeLessThanOrEqual(23) // 20 + "..."
    })

    it('no trunca texto corto', () => {
      const shortItems: BreadcrumbItem[] = [
        { label: 'Inicio', href: '/' },
        { label: 'Corto' },
      ]
      render(<Breadcrumbs items={shortItems} maxLength={20} />)
      expect(screen.getByText('Corto')).toBeInTheDocument()
      expect(screen.getByText('Corto').textContent).not.toContain('...')
    })
  })

  // Tests de responsive
  describe('Comportamiento responsive', () => {
    it('oculta elementos intermedios en móvil por defecto', () => {
      const { container } = render(<Breadcrumbs items={basicItems} />)
      const listItems = container.querySelectorAll('li')
      
      // Verificar que algunos elementos tienen clase hidden sm:flex
      const hiddenItems = Array.from(listItems).filter((li) =>
        li.className.includes('hidden') && li.className.includes('sm:flex')
      )
      expect(hiddenItems.length).toBeGreaterThan(0)
    })

    it('muestra todos los elementos cuando mobileLastOnly es false', () => {
      const { container } = render(<Breadcrumbs items={basicItems} mobileLastOnly={false} />)
      const listItems = container.querySelectorAll('li')
      
      // Verificar que ningún elemento de contenido tiene clase hidden
      const contentItems = Array.from(listItems).filter(
        (li) => !li.getAttribute('aria-hidden')
      )
      contentItems.forEach((li) => {
        expect(li.className).not.toContain('hidden')
      })
    })

    it('siempre muestra el primer elemento en móvil', () => {
      const { container } = render(<Breadcrumbs items={basicItems} mobileLastOnly={true} />)
      const firstContentItem = container.querySelector('li:not([aria-hidden="true"])')
      expect(firstContentItem?.className).not.toContain('hidden')
    })

    it('siempre muestra el último elemento en móvil', () => {
      const { container } = render(<Breadcrumbs items={basicItems} mobileLastOnly={true} />)
      const allContentItems = container.querySelectorAll('li:not([aria-hidden="true"])')
      const lastContentItem = allContentItems[allContentItems.length - 1]
      expect(lastContentItem.className).not.toContain('hidden')
    })
  })

  // Tests de estilos
  describe('Estilos', () => {
    it('aplica clases base correctamente', () => {
      const { container } = render(<Breadcrumbs items={basicItems} />)
      const nav = container.querySelector('nav')
      expect(nav).toHaveClass('flex', 'items-center')
    })

    it('acepta className personalizado', () => {
      const { container } = render(
        <Breadcrumbs items={basicItems} className="custom-class" />
      )
      const nav = container.querySelector('nav')
      expect(nav).toHaveClass('custom-class')
    })

    it('los links tienen estilos de hover', () => {
      render(<Breadcrumbs items={basicItems} />)
      const link = screen.getByRole('link', { name: /navegar a inicio/i })
      expect(link).toHaveClass('hover:text-primary-600')
    })

    it('el último elemento tiene color diferente', () => {
      render(<Breadcrumbs items={basicItems} />)
      const lastItem = screen.getByText('MacBook Pro 16"')
      expect(lastItem).toHaveClass('text-gray-900')
    })
  })

  // Tests de accesibilidad
  describe('Accesibilidad', () => {
    it('tiene estructura semántica correcta', () => {
      const { container } = render(<Breadcrumbs items={basicItems} />)
      expect(container.querySelector('nav')).toBeInTheDocument()
      expect(container.querySelector('ol')).toBeInTheDocument()
    })

    it('los links tienen aria-label descriptivos', () => {
      render(<Breadcrumbs items={basicItems} />)
      expect(screen.getByRole('link', { name: /navegar a inicio/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /navegar a productos/i })).toBeInTheDocument()
    })

    it('los separadores tienen aria-hidden', () => {
      const { container } = render(<Breadcrumbs items={basicItems} />)
      const separators = container.querySelectorAll('li[aria-hidden="true"]')
      separators.forEach((separator) => {
        expect(separator).toHaveAttribute('aria-hidden', 'true')
      })
    })

    it('los links tienen focus visible', () => {
      render(<Breadcrumbs items={basicItems} />)
      const link = screen.getByRole('link', { name: /navegar a inicio/i })
      expect(link).toHaveClass('focus:outline-none', 'focus:ring-2')
    })
  })

  // Tests de casos especiales
  describe('Casos especiales', () => {
    it('maneja un solo item correctamente', () => {
      const singleItem: BreadcrumbItem[] = [{ label: 'Único' }]
      render(<Breadcrumbs items={singleItem} />)
      expect(screen.getByText('Único')).toBeInTheDocument()
      // No debe haber separadores
      const { container } = render(<Breadcrumbs items={singleItem} />)
      const separators = container.querySelectorAll('li[aria-hidden="true"]')
      expect(separators.length).toBe(0)
    })

    it('maneja dos items correctamente', () => {
      const twoItems: BreadcrumbItem[] = [
        { label: 'Inicio', href: '/' },
        { label: 'Actual' },
      ]
      render(<Breadcrumbs items={twoItems} />)
      expect(screen.getByText('Inicio')).toBeInTheDocument()
      expect(screen.getByText('Actual')).toBeInTheDocument()
      // Debe haber un separador
      const { container } = render(<Breadcrumbs items={twoItems} />)
      const separators = container.querySelectorAll('li[aria-hidden="true"]')
      expect(separators.length).toBe(1)
    })

    it('maneja items sin href correctamente', () => {
      const noHrefItems: BreadcrumbItem[] = [
        { label: 'Primero' },
        { label: 'Segundo' },
        { label: 'Tercero' },
      ]
      render(<Breadcrumbs items={noHrefItems} />)
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
      expect(screen.getByText('Primero')).toBeInTheDocument()
      expect(screen.getByText('Segundo')).toBeInTheDocument()
      expect(screen.getByText('Tercero')).toBeInTheDocument()
    })
  })

  // Tests de componentes auxiliares
  describe('Componentes auxiliares', () => {
    it('ChevronSeparator renderiza un SVG', () => {
      const { container } = render(<ChevronSeparator />)
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('HomeIcon renderiza un SVG', () => {
      const { container } = render(<HomeIcon />)
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('ChevronSeparator tiene aria-hidden', () => {
      const { container } = render(<ChevronSeparator />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    })

    it('HomeIcon tiene aria-hidden', () => {
      const { container } = render(<HomeIcon />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    })
  })
})
