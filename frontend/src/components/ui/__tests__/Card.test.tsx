/**
 * Tests para el componente Card y sus subcomponentes
 * Verifica renderizado, variantes, estados y accesibilidad
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '../Card'

describe('Card Component', () => {
  // Tests de renderizado básico
  describe('Renderizado básico', () => {
    it('renderiza correctamente con contenido', () => {
      render(
        <Card>
          <div>Test Content</div>
        </Card>
      )
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('aplica padding md por defecto', () => {
      const { container } = render(<Card>Content</Card>)
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('p-4', 'sm:p-6')
    })

    it('aplica clases base correctamente', () => {
      const { container } = render(<Card>Content</Card>)
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('bg-white', 'rounded-lg', 'shadow-sm')
    })
  })

  // Tests de variantes de padding
  describe('Variantes de padding', () => {
    it('renderiza padding none correctamente', () => {
      const { container } = render(<Card padding="none">Content</Card>)
      const card = container.firstChild as HTMLElement
      expect(card).not.toHaveClass('p-3', 'p-4', 'p-6')
    })

    it('renderiza padding sm correctamente', () => {
      const { container } = render(<Card padding="sm">Content</Card>)
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('p-3')
    })

    it('renderiza padding md correctamente', () => {
      const { container } = render(<Card padding="md">Content</Card>)
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('p-4', 'sm:p-6')
    })

    it('renderiza padding lg correctamente', () => {
      const { container } = render(<Card padding="lg">Content</Card>)
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('p-6', 'sm:p-8')
    })
  })

  // Tests de estados
  describe('Estados', () => {
    it('aplica efecto hover cuando hoverable es true', () => {
      const { container } = render(<Card hoverable>Content</Card>)
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('hover:shadow-md')
    })

    it('no aplica efecto hover cuando hoverable es false', () => {
      const { container } = render(<Card hoverable={false}>Content</Card>)
      const card = container.firstChild as HTMLElement
      expect(card).not.toHaveClass('hover:shadow-md')
    })

    it('aplica borde cuando bordered es true', () => {
      const { container } = render(<Card bordered>Content</Card>)
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('border', 'border-gray-200')
    })

    it('aplica estilos clickeable cuando clickable es true', () => {
      const { container } = render(<Card clickable>Content</Card>)
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('cursor-pointer', 'active:scale-[0.98]')
    })
  })

  // Tests de interacción
  describe('Interacción', () => {
    it('ejecuta onClick cuando se hace clic en card clickeable', () => {
      const handleClick = jest.fn()
      const { container } = render(
        <Card clickable onClick={handleClick}>
          Content
        </Card>
      )
      const card = container.firstChild as HTMLElement
      fireEvent.click(card)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('ejecuta onClick incluso sin clickable prop', () => {
      const handleClick = jest.fn()
      const { container } = render(
        <Card onClick={handleClick}>Content</Card>
      )
      const card = container.firstChild as HTMLElement
      fireEvent.click(card)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  // Tests de clases personalizadas
  describe('Clases personalizadas', () => {
    it('acepta className personalizado', () => {
      const { container } = render(
        <Card className="custom-class">Content</Card>
      )
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('custom-class')
    })

    it('mantiene las clases base con className personalizado', () => {
      const { container } = render(
        <Card className="custom-class">Content</Card>
      )
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('bg-white', 'rounded-lg', 'shadow-sm')
    })
  })

  // Tests de ref
  describe('Ref forwarding', () => {
    it('reenvía correctamente la ref', () => {
      const ref = { current: null }
      render(<Card ref={ref as any}>Content</Card>)
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })
  })
})

describe('CardHeader Component', () => {
  it('renderiza correctamente con contenido', () => {
    render(<CardHeader>Header Content</CardHeader>)
    expect(screen.getByText('Header Content')).toBeInTheDocument()
  })

  it('aplica borde cuando bordered es true', () => {
    const { container } = render(<CardHeader bordered>Header</CardHeader>)
    const header = container.firstChild as HTMLElement
    expect(header).toHaveClass('border-b', 'border-gray-200')
  })

  it('no aplica borde cuando bordered es false', () => {
    const { container } = render(<CardHeader bordered={false}>Header</CardHeader>)
    const header = container.firstChild as HTMLElement
    expect(header).not.toHaveClass('border-b')
  })

  it('aplica clases de layout flex', () => {
    const { container } = render(<CardHeader>Header</CardHeader>)
    const header = container.firstChild as HTMLElement
    expect(header).toHaveClass('flex', 'items-center', 'justify-between')
  })
})

describe('CardTitle Component', () => {
  it('renderiza correctamente con texto', () => {
    render(<CardTitle>Test Title</CardTitle>)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('renderiza como h3 por defecto', () => {
    render(<CardTitle>Title</CardTitle>)
    const title = screen.getByText('Title')
    expect(title.tagName).toBe('H3')
  })

  it('renderiza con el nivel de heading especificado', () => {
    render(<CardTitle as="h2">Title</CardTitle>)
    const title = screen.getByText('Title')
    expect(title.tagName).toBe('H2')
  })

  it('aplica estilos de título correctamente', () => {
    render(<CardTitle>Title</CardTitle>)
    const title = screen.getByText('Title')
    expect(title).toHaveClass('text-lg', 'font-semibold', 'text-gray-900')
  })

  it('acepta className personalizado', () => {
    render(<CardTitle className="custom-title">Title</CardTitle>)
    const title = screen.getByText('Title')
    expect(title).toHaveClass('custom-title')
  })
})

describe('CardDescription Component', () => {
  it('renderiza correctamente con texto', () => {
    render(<CardDescription>Test Description</CardDescription>)
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('aplica estilos de descripción correctamente', () => {
    render(<CardDescription>Description</CardDescription>)
    const description = screen.getByText('Description')
    expect(description).toHaveClass('text-sm', 'text-gray-500')
  })

  it('acepta className personalizado', () => {
    render(<CardDescription className="custom-desc">Description</CardDescription>)
    const description = screen.getByText('Description')
    expect(description).toHaveClass('custom-desc')
  })
})

describe('CardContent Component', () => {
  it('renderiza correctamente con contenido', () => {
    render(<CardContent>Test Content</CardContent>)
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('aplica estilos de contenido correctamente', () => {
    const { container } = render(<CardContent>Content</CardContent>)
    const content = container.firstChild as HTMLElement
    expect(content).toHaveClass('text-gray-700')
  })

  it('acepta className personalizado', () => {
    const { container } = render(
      <CardContent className="custom-content">Content</CardContent>
    )
    const content = container.firstChild as HTMLElement
    expect(content).toHaveClass('custom-content')
  })
})

describe('CardFooter Component', () => {
  it('renderiza correctamente con contenido', () => {
    render(<CardFooter>Footer Content</CardFooter>)
    expect(screen.getByText('Footer Content')).toBeInTheDocument()
  })

  it('aplica borde cuando bordered es true', () => {
    const { container } = render(<CardFooter bordered>Footer</CardFooter>)
    const footer = container.firstChild as HTMLElement
    expect(footer).toHaveClass('border-t', 'border-gray-200')
  })

  it('no aplica borde cuando bordered es false', () => {
    const { container } = render(<CardFooter bordered={false}>Footer</CardFooter>)
    const footer = container.firstChild as HTMLElement
    expect(footer).not.toHaveClass('border-t')
  })

  it('aplica clases de layout flex', () => {
    const { container } = render(<CardFooter>Footer</CardFooter>)
    const footer = container.firstChild as HTMLElement
    expect(footer).toHaveClass('flex', 'items-center', 'gap-2')
  })
})

describe('Card - Composición completa', () => {
  it('renderiza card completo con todos los subcomponentes', () => {
    render(
      <Card>
        <CardHeader bordered>
          <div>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </div>
        </CardHeader>
        <CardContent>Test Content</CardContent>
        <CardFooter bordered>Test Footer</CardFooter>
      </Card>
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
    expect(screen.getByText('Test Footer')).toBeInTheDocument()
  })

  it('mantiene la estructura semántica correcta', () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle as="h2">Title</CardTitle>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>
    )

    const card = container.firstChild as HTMLElement
    expect(card.tagName).toBe('DIV')
    
    const title = screen.getByText('Title')
    expect(title.tagName).toBe('H2')
  })
})

describe('Card - Accesibilidad', () => {
  it('puede recibir atributos ARIA personalizados', () => {
    const { container } = render(
      <Card aria-label="Custom card label">Content</Card>
    )
    const card = container.firstChild as HTMLElement
    expect(card).toHaveAttribute('aria-label', 'Custom card label')
  })

  it('mantiene estructura semántica con headings', () => {
    render(
      <Card>
        <CardTitle as="h2">Main Title</CardTitle>
        <CardContent>Content</CardContent>
      </Card>
    )
    
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent('Main Title')
  })
})

describe('Card - Tema oscuro', () => {
  it('aplica clases de tema oscuro correctamente', () => {
    const { container } = render(<Card>Content</Card>)
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('dark:bg-dark-bg-secondary')
  })
})
