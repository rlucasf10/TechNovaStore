/**
 * Tests para el componente Input
 * Verifica todas las variantes, estados, labels flotantes, iconos y validación
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '../Input'

describe('Input Component', () => {
  // Tests de renderizado básico
  describe('Renderizado básico', () => {
    it('renderiza correctamente sin props', () => {
      render(<Input />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('renderiza con label', () => {
      render(<Input label="Nombre" />)
      expect(screen.getByLabelText('Nombre')).toBeInTheDocument()
    })

    it('renderiza con placeholder', () => {
      render(<Input placeholder="Ingresa tu nombre" />)
      expect(screen.getByPlaceholderText('Ingresa tu nombre')).toBeInTheDocument()
    })

    it('aplica la variante text por defecto', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'text')
    })
  })

  // Tests de variantes
  describe('Variantes', () => {
    it('renderiza variante text correctamente', () => {
      render(<Input variant="text" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'text')
    })

    it('renderiza variante email correctamente', () => {
      render(<Input variant="email" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'email')
    })

    it('renderiza variante password correctamente', () => {
      render(<Input variant="password" label="Contraseña" />)
      const input = screen.getByLabelText('Contraseña')
      expect(input).toHaveAttribute('type', 'password')
    })

    it('renderiza variante number correctamente', () => {
      render(<Input variant="number" />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('type', 'number')
    })
  })

  // Tests de estados
  describe('Estados', () => {
    it('muestra mensaje de error cuando error está presente', () => {
      render(<Input label="Email" error="Email inválido" />)
      expect(screen.getByText('Email inválido')).toBeInTheDocument()
    })

    it('aplica clases de error cuando error está presente', () => {
      render(<Input error="Error" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('border-error')
    })

    it('muestra helperText cuando no hay error', () => {
      render(<Input helperText="Texto de ayuda" />)
      expect(screen.getByText('Texto de ayuda')).toBeInTheDocument()
    })

    it('no muestra helperText cuando hay error', () => {
      render(<Input helperText="Texto de ayuda" error="Error" />)
      expect(screen.queryByText('Texto de ayuda')).not.toBeInTheDocument()
      expect(screen.getByText('Error')).toBeInTheDocument()
    })

    it('se deshabilita cuando disabled es true', () => {
      render(<Input disabled />)
      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
      expect(input).toHaveClass('cursor-not-allowed')
    })
  })

  // Tests de labels flotantes
  describe('Labels flotantes', () => {
    it('renderiza label flotante correctamente', () => {
      render(<Input label="Nombre" floatingLabel />)
      expect(screen.getByText('Nombre')).toBeInTheDocument()
    })

    it('label flotante se mueve al hacer focus', () => {
      render(<Input label="Nombre" floatingLabel />)
      const input = screen.getByRole('textbox')
      const label = screen.getByText('Nombre')
      
      // Antes del focus
      expect(label).toHaveClass('top-1/2')
      
      // Después del focus
      fireEvent.focus(input)
      expect(label).toHaveClass('top-2')
    })

    it('label flotante permanece arriba cuando hay valor', () => {
      render(<Input label="Nombre" floatingLabel value="Juan" onChange={() => {}} />)
      const label = screen.getByText('Nombre')
      expect(label).toHaveClass('top-2')
    })
  })

  // Tests de toggle de password
  describe('Toggle de password', () => {
    it('muestra botón de toggle en variante password', () => {
      render(<Input variant="password" label="Contraseña" />)
      const toggleButton = screen.getByLabelText(/mostrar contraseña/i)
      expect(toggleButton).toBeInTheDocument()
    })

    it('cambia el tipo de input al hacer clic en toggle', () => {
      const { container } = render(<Input variant="password" label="Contraseña" />)
      const getInput = () => container.querySelector('input') as HTMLInputElement
      
      // Inicialmente es password
      expect(getInput()).toHaveAttribute('type', 'password')
      
      // Primer clic: mostrar contraseña (password -> text)
      const showButton = screen.getByLabelText(/mostrar contraseña/i)
      fireEvent.click(showButton)
      expect(getInput()).toHaveAttribute('type', 'text')
      
      // Segundo clic: ocultar contraseña (text -> password)
      const hideButton = screen.getByLabelText(/ocultar contraseña/i)
      fireEvent.click(hideButton)
      expect(getInput()).toHaveAttribute('type', 'password')
    })

    it('no muestra botón de toggle en otras variantes', () => {
      render(<Input variant="text" />)
      expect(screen.queryByLabelText(/mostrar contraseña/i)).not.toBeInTheDocument()
    })
  })

  // Tests de validación inline
  describe('Validación inline', () => {
    it('muestra icono de validación cuando showValidation es true e isValid es true', () => {
      const { container } = render(
        <Input value="test" showValidation isValid onChange={() => {}} />
      )
      const successIcon = container.querySelector('svg.text-success')
      expect(successIcon).toBeInTheDocument()
    })

    it('muestra icono de error cuando showValidation es true y hay error', () => {
      const { container } = render(
        <Input value="test" showValidation error="Error" onChange={() => {}} />
      )
      const errorIcon = container.querySelector('svg.text-error')
      expect(errorIcon).toBeInTheDocument()
    })

    it('no muestra icono de validación cuando showValidation es false', () => {
      const { container } = render(
        <Input value="test" isValid onChange={() => {}} />
      )
      const successIcon = container.querySelector('svg.text-success')
      expect(successIcon).not.toBeInTheDocument()
    })
  })

  // Tests de iconos
  describe('Iconos', () => {
    it('renderiza icono izquierdo correctamente', () => {
      const LeftIcon = () => <span data-testid="left-icon">Icon</span>
      render(<Input iconLeft={<LeftIcon />} />)
      expect(screen.getByTestId('left-icon')).toBeInTheDocument()
    })

    it('renderiza icono derecho correctamente', () => {
      const RightIcon = () => <span data-testid="right-icon">Icon</span>
      render(<Input iconRight={<RightIcon />} />)
      expect(screen.getByTestId('right-icon')).toBeInTheDocument()
    })

    it('no renderiza icono izquierdo con floatingLabel', () => {
      const LeftIcon = () => <span data-testid="left-icon">Icon</span>
      render(<Input iconLeft={<LeftIcon />} floatingLabel label="Test" />)
      expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument()
    })
  })

  // Tests de interacción
  describe('Interacción', () => {
    it('ejecuta onChange cuando el valor cambia', () => {
      const handleChange = jest.fn()
      render(<Input onChange={handleChange} />)
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'test' } })
      expect(handleChange).toHaveBeenCalled()
    })

    it('ejecuta onFocus cuando recibe focus', () => {
      const handleFocus = jest.fn()
      render(<Input onFocus={handleFocus} />)
      const input = screen.getByRole('textbox')
      fireEvent.focus(input)
      expect(handleFocus).toHaveBeenCalled()
    })

    it('ejecuta onBlur cuando pierde focus', () => {
      const handleBlur = jest.fn()
      render(<Input onBlur={handleBlur} />)
      const input = screen.getByRole('textbox')
      fireEvent.blur(input)
      expect(handleBlur).toHaveBeenCalled()
    })

    it('no permite interacción cuando está disabled', () => {
      const handleChange = jest.fn()
      render(<Input disabled onChange={handleChange} />)
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'test' } })
      expect(input).toBeDisabled()
    })
  })

  // Tests de accesibilidad
  describe('Accesibilidad', () => {
    it('asocia label con input correctamente', () => {
      render(<Input label="Nombre" />)
      const input = screen.getByLabelText('Nombre')
      expect(input).toBeInTheDocument()
    })

    it('tiene aria-invalid cuando hay error', () => {
      render(<Input error="Error" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('tiene aria-describedby cuando hay error', () => {
      render(<Input error="Error" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-describedby')
    })

    it('tiene aria-describedby cuando hay helperText', () => {
      render(<Input helperText="Ayuda" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-describedby')
    })

    it('los iconos tienen aria-hidden', () => {
      const TestIcon = () => <span>Icon</span>
      const { container } = render(<Input iconLeft={<TestIcon />} />)
      const iconSpan = container.querySelector('span[aria-hidden="true"]')
      expect(iconSpan).toBeInTheDocument()
    })

    it('el botón de toggle tiene aria-label', () => {
      render(<Input variant="password" />)
      const toggleButton = screen.getByLabelText(/mostrar contraseña/i)
      expect(toggleButton).toHaveAttribute('aria-label')
    })
  })

  // Tests de clases personalizadas
  describe('Clases personalizadas', () => {
    it('acepta className personalizado', () => {
      render(<Input className="custom-class" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('custom-class')
    })

    it('mantiene las clases base con className personalizado', () => {
      render(<Input className="custom-class" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('block', 'w-full', 'rounded-md')
    })
  })

  // Tests de ref
  describe('Ref forwarding', () => {
    it('reenvía correctamente la ref', () => {
      const ref = { current: null }
      render(<Input ref={ref as any} />)
      expect(ref.current).toBeInstanceOf(HTMLInputElement)
    })
  })

  // Tests de props HTML estándar
  describe('Props HTML estándar', () => {
    it('acepta atributo required', () => {
      render(<Input required />)
      const input = screen.getByRole('textbox')
      expect(input).toBeRequired()
    })

    it('acepta atributo maxLength', () => {
      render(<Input maxLength={10} />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('maxLength', '10')
    })

    it('acepta atributo pattern', () => {
      render(<Input pattern="[0-9]*" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('pattern', '[0-9]*')
    })

    it('acepta atributo autoComplete', () => {
      render(<Input autoComplete="email" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('autoComplete', 'email')
    })
  })
})
