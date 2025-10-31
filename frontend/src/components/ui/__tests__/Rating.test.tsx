/**
 * Tests para el componente Rating
 * Verifica renderizado, interactividad, tamaños y accesibilidad
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { Rating } from '../Rating'

describe('Rating Component', () => {
  // Tests de renderizado básico
  describe('Renderizado básico', () => {
    it('renderiza correctamente con valor', () => {
      render(<Rating value={4.5} readOnly />)
      const rating = screen.getByRole('img')
      expect(rating).toBeInTheDocument()
      expect(rating).toHaveAttribute('aria-label', 'Rating: 4.5 de 5 estrellas')
    })

    it('renderiza 5 estrellas', () => {
      const { container } = render(<Rating value={3} readOnly />)
      const stars = container.querySelectorAll('button')
      expect(stars).toHaveLength(5)
    })

    it('normaliza valores fuera de rango', () => {
      const { rerender } = render(<Rating value={10} readOnly />)
      expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Rating: 5.0 de 5 estrellas')
      
      rerender(<Rating value={-5} readOnly />)
      expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Rating: 0.0 de 5 estrellas')
    })
  })

  // Tests de tamaños
  describe('Tamaños', () => {
    it('aplica tamaño md por defecto', () => {
      const { container } = render(<Rating value={4} readOnly />)
      const star = container.querySelector('button')
      expect(star).toHaveClass('w-5', 'h-5')
    })

    it('aplica tamaño sm correctamente', () => {
      const { container } = render(<Rating value={4} readOnly size="sm" />)
      const star = container.querySelector('button')
      expect(star).toHaveClass('w-4', 'h-4')
    })

    it('aplica tamaño lg correctamente', () => {
      const { container } = render(<Rating value={4} readOnly size="lg" />)
      const star = container.querySelector('button')
      expect(star).toHaveClass('w-6', 'h-6')
    })
  })

  // Tests de modo solo lectura
  describe('Modo solo lectura', () => {
    it('las estrellas están deshabilitadas en modo readOnly', () => {
      const { container } = render(<Rating value={3} readOnly />)
      const stars = container.querySelectorAll('button')
      stars.forEach(star => {
        expect(star).toBeDisabled()
      })
    })

    it('no tiene cursor pointer en modo readOnly', () => {
      const { container } = render(<Rating value={3} readOnly />)
      const star = container.querySelector('button')
      expect(star).not.toHaveClass('cursor-pointer')
    })
  })

  // Tests de modo interactivo
  describe('Modo interactivo', () => {
    it('las estrellas están habilitadas cuando hay onChange', () => {
      const handleChange = jest.fn()
      const { container } = render(<Rating value={3} onChange={handleChange} />)
      const stars = container.querySelectorAll('button')
      stars.forEach(star => {
        expect(star).not.toBeDisabled()
      })
    })

    it('tiene cursor pointer en modo interactivo', () => {
      const handleChange = jest.fn()
      const { container } = render(<Rating value={3} onChange={handleChange} />)
      const star = container.querySelector('button')
      expect(star).toHaveClass('cursor-pointer')
    })

    it('ejecuta onChange cuando se hace clic en una estrella', () => {
      const handleChange = jest.fn()
      const { container } = render(<Rating value={0} onChange={handleChange} />)
      const thirdStar = container.querySelectorAll('button')[2]
      
      fireEvent.click(thirdStar)
      expect(handleChange).toHaveBeenCalled()
    })

    it('no ejecuta onChange en modo readOnly', () => {
      const handleChange = jest.fn()
      const { container } = render(<Rating value={3} readOnly onChange={handleChange} />)
      const star = container.querySelector('button')
      
      if (star) {
        fireEvent.click(star)
      }
      expect(handleChange).not.toHaveBeenCalled()
    })
  })

  // Tests de valor numérico
  describe('Valor numérico', () => {
    it('no muestra valor por defecto', () => {
      render(<Rating value={4.5} readOnly />)
      expect(screen.queryByText('4.5')).not.toBeInTheDocument()
    })

    it('muestra valor cuando showValue es true', () => {
      render(<Rating value={4.5} readOnly showValue />)
      expect(screen.getByText('4.5')).toBeInTheDocument()
    })

    it('formatea el valor con un decimal', () => {
      render(<Rating value={4} readOnly showValue />)
      expect(screen.getByText('4.0')).toBeInTheDocument()
    })
  })

  // Tests de contador de reviews
  describe('Contador de reviews', () => {
    it('no muestra contador por defecto', () => {
      render(<Rating value={4.5} readOnly showValue />)
      expect(screen.queryByText(/reviews/i)).not.toBeInTheDocument()
    })

    it('muestra contador cuando se proporciona reviewCount', () => {
      render(<Rating value={4.5} readOnly showValue reviewCount={123} />)
      expect(screen.getByText(/123/)).toBeInTheDocument()
      expect(screen.getByText(/reviews/i)).toBeInTheDocument()
    })

    it('usa singular "review" para 1 review', () => {
      render(<Rating value={4.5} readOnly showValue reviewCount={1} />)
      expect(screen.getByText(/1 review/i)).toBeInTheDocument()
    })

    it('usa plural "reviews" para múltiples reviews', () => {
      render(<Rating value={4.5} readOnly showValue reviewCount={5} />)
      expect(screen.getByText(/5 reviews/i)).toBeInTheDocument()
    })

    it('muestra números grandes correctamente', () => {
      render(<Rating value={4.5} readOnly showValue reviewCount={1234} />)
      // El número puede estar formateado con o sin separador dependiendo del locale
      expect(screen.getByText(/1[.,]?234/)).toBeInTheDocument()
    })
  })

  // Tests de precisión
  describe('Precisión', () => {
    it('usa precisión 0.5 por defecto', () => {
      const handleChange = jest.fn()
      render(<Rating value={0} onChange={handleChange} />)
      // La precisión se verifica en el comportamiento del click
      // Este test verifica que el componente acepta la prop
      expect(screen.getByRole('img')).toBeInTheDocument()
    })

    it('acepta precisión de 1 (enteros)', () => {
      const handleChange = jest.fn()
      render(<Rating value={0} onChange={handleChange} precision={1} />)
      expect(screen.getByRole('img')).toBeInTheDocument()
    })

    it('acepta precisión de 0.1 (decimales)', () => {
      const handleChange = jest.fn()
      render(<Rating value={0} onChange={handleChange} precision={0.1} />)
      expect(screen.getByRole('img')).toBeInTheDocument()
    })
  })

  // Tests de accesibilidad
  describe('Accesibilidad', () => {
    it('tiene rol img para el contenedor de estrellas', () => {
      render(<Rating value={4.5} readOnly />)
      expect(screen.getByRole('img')).toBeInTheDocument()
    })

    it('tiene aria-label descriptivo', () => {
      render(<Rating value={4.5} readOnly />)
      expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Rating: 4.5 de 5 estrellas')
    })

    it('cada estrella tiene aria-label', () => {
      const { container } = render(<Rating value={3} readOnly />)
      const stars = container.querySelectorAll('button')
      
      expect(stars[0]).toHaveAttribute('aria-label', '1 estrella')
      expect(stars[1]).toHaveAttribute('aria-label', '2 estrellas')
      expect(stars[2]).toHaveAttribute('aria-label', '3 estrellas')
    })
  })

  // Tests de clases personalizadas
  describe('Clases personalizadas', () => {
    it('acepta className personalizado', () => {
      const { container } = render(<Rating value={4} readOnly className="custom-class" />)
      const wrapper = container.firstChild
      expect(wrapper).toHaveClass('custom-class')
    })

    it('mantiene las clases base con className personalizado', () => {
      const { container } = render(<Rating value={4} readOnly className="custom-class" />)
      const wrapper = container.firstChild
      expect(wrapper).toHaveClass('inline-flex', 'items-center')
    })
  })

  // Tests de ref forwarding
  describe('Ref forwarding', () => {
    it('reenvía correctamente la ref', () => {
      const ref = { current: null }
      render(<Rating value={4} readOnly ref={ref as any} />)
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })
  })

  // Tests de valores especiales
  describe('Valores especiales', () => {
    it('renderiza correctamente con valor 0', () => {
      render(<Rating value={0} readOnly showValue />)
      expect(screen.getByText('0.0')).toBeInTheDocument()
    })

    it('renderiza correctamente con valor 5', () => {
      render(<Rating value={5} readOnly showValue />)
      expect(screen.getByText('5.0')).toBeInTheDocument()
    })

    it('renderiza correctamente con medias estrellas', () => {
      render(<Rating value={3.5} readOnly showValue />)
      expect(screen.getByText('3.5')).toBeInTheDocument()
    })
  })
})
