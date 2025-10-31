/**
 * Tests para el componente Button
 * Verifica todas las variantes, tamaños, estados y funcionalidad de iconos
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button Component', () => {
  // Tests de renderizado básico
  describe('Renderizado básico', () => {
    it('renderiza correctamente con texto', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
    })

    it('aplica la variante primary por defecto', () => {
      render(<Button>Primary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-primary-600')
    })

    it('aplica el tamaño md por defecto', () => {
      render(<Button>Medium</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-4', 'py-2')
    })
  })

  // Tests de variantes
  describe('Variantes', () => {
    it('renderiza variante primary correctamente', () => {
      render(<Button variant="primary">Primary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-primary-600')
    })

    it('renderiza variante secondary correctamente', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border-2', 'border-primary-600')
    })

    it('renderiza variante ghost correctamente', () => {
      render(<Button variant="ghost">Ghost</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-transparent')
    })

    it('renderiza variante danger correctamente', () => {
      render(<Button variant="danger">Danger</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-error')
    })
  })

  // Tests de tamaños
  describe('Tamaños', () => {
    it('renderiza tamaño sm correctamente', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm')
    })

    it('renderiza tamaño md correctamente', () => {
      render(<Button size="md">Medium</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-4', 'py-2', 'text-base')
    })

    it('renderiza tamaño lg correctamente', () => {
      render(<Button size="lg">Large</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-6', 'py-3', 'text-lg')
    })
  })

  // Tests de estados
  describe('Estados', () => {
    it('se deshabilita cuando disabled es true', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed')
    })

    it('muestra spinner cuando loading es true', () => {
      render(<Button loading>Loading</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button.querySelector('svg.animate-spin')).toBeInTheDocument()
    })

    it('no muestra iconos cuando está en estado loading', () => {
      const TestIcon = () => <span data-testid="test-icon">Icon</span>
      render(
        <Button loading iconLeft={<TestIcon />}>
          Loading
        </Button>
      )
      expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument()
    })
  })

  // Tests de iconos
  describe('Iconos', () => {
    it('renderiza icono izquierdo correctamente', () => {
      const LeftIcon = () => <span data-testid="left-icon">Left</span>
      render(<Button iconLeft={<LeftIcon />}>With Icon</Button>)
      expect(screen.getByTestId('left-icon')).toBeInTheDocument()
    })

    it('renderiza icono derecho correctamente', () => {
      const RightIcon = () => <span data-testid="right-icon">Right</span>
      render(<Button iconRight={<RightIcon />}>With Icon</Button>)
      expect(screen.getByTestId('right-icon')).toBeInTheDocument()
    })

    it('renderiza ambos iconos correctamente', () => {
      const LeftIcon = () => <span data-testid="left-icon">Left</span>
      const RightIcon = () => <span data-testid="right-icon">Right</span>
      render(
        <Button iconLeft={<LeftIcon />} iconRight={<RightIcon />}>
          With Icons
        </Button>
      )
      expect(screen.getByTestId('left-icon')).toBeInTheDocument()
      expect(screen.getByTestId('right-icon')).toBeInTheDocument()
    })
  })

  // Tests de interacción
  describe('Interacción', () => {
    it('ejecuta onClick cuando se hace clic', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('no ejecuta onClick cuando está disabled', () => {
      const handleClick = jest.fn()
      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      )
      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('no ejecuta onClick cuando está loading', () => {
      const handleClick = jest.fn()
      render(
        <Button onClick={handleClick} loading>
          Loading
        </Button>
      )
      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  // Tests de accesibilidad
  describe('Accesibilidad', () => {
    it('tiene el rol button', () => {
      render(<Button>Accessible</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('puede recibir atributos ARIA personalizados', () => {
      render(<Button aria-label="Custom label">Button</Button>)
      expect(screen.getByLabelText('Custom label')).toBeInTheDocument()
    })

    it('los iconos tienen aria-hidden', () => {
      const TestIcon = () => <span>Icon</span>
      const { container } = render(<Button iconLeft={<TestIcon />}>With Icon</Button>)
      const iconSpan = container.querySelector('span[aria-hidden="true"]')
      expect(iconSpan).toBeInTheDocument()
    })
  })

  // Tests de clases personalizadas
  describe('Clases personalizadas', () => {
    it('acepta className personalizado', () => {
      render(<Button className="custom-class">Custom</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('mantiene las clases base con className personalizado', () => {
      render(<Button className="custom-class">Custom</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center')
    })
  })

  // Tests de ref
  describe('Ref forwarding', () => {
    it('reenvía correctamente la ref', () => {
      const ref = { current: null }
      render(<Button ref={ref as any}>With Ref</Button>)
      expect(ref.current).toBeInstanceOf(HTMLButtonElement)
    })
  })
})
