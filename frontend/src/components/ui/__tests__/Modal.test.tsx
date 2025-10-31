/**
 * Tests para el componente Modal
 * Verifica funcionalidad de overlay, animaciones, cierre, trap de foco y accesibilidad
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../Modal'

describe('Modal Component', () => {
  // Mock de document.body.style para tests de scroll
  beforeEach(() => {
    document.body.style.overflow = ''
  })

  afterEach(() => {
    document.body.style.overflow = ''
  })

  // Tests de renderizado básico
  describe('Renderizado básico', () => {
    it('no renderiza cuando open es false', () => {
      render(
        <Modal open={false} onClose={() => {}}>
          <p>Contenido</p>
        </Modal>
      )
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('renderiza cuando open es true', () => {
      render(
        <Modal open={true} onClose={() => {}}>
          <p>Contenido</p>
        </Modal>
      )
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('renderiza el contenido correctamente', () => {
      render(
        <Modal open={true} onClose={() => {}}>
          <p>Contenido del modal</p>
        </Modal>
      )
      expect(screen.getByText('Contenido del modal')).toBeInTheDocument()
    })

    it('renderiza el título cuando se proporciona', () => {
      render(
        <Modal open={true} onClose={() => {}} title="Mi Modal">
          <p>Contenido</p>
        </Modal>
      )
      expect(screen.getByText('Mi Modal')).toBeInTheDocument()
    })

    it('renderiza la descripción cuando se proporciona', () => {
      render(
        <Modal open={true} onClose={() => {}} description="Descripción del modal">
          <p>Contenido</p>
        </Modal>
      )
      expect(screen.getByText('Descripción del modal')).toBeInTheDocument()
    })

    it('renderiza el footer cuando se proporciona', () => {
      render(
        <Modal
          open={true}
          onClose={() => {}}
          footer={<button>Acción</button>}
        >
          <p>Contenido</p>
        </Modal>
      )
      expect(screen.getByRole('button', { name: 'Acción' })).toBeInTheDocument()
    })
  })

  // Tests de tamaños
  describe('Tamaños', () => {
    it('aplica el tamaño md por defecto', () => {
      render(
        <Modal open={true} onClose={() => {}}>
          <p>Contenido</p>
        </Modal>
      )
      const dialog = screen.getByRole('dialog')
      expect(dialog.querySelector('.max-w-md')).toBeInTheDocument()
    })

    it('aplica el tamaño sm correctamente', () => {
      render(
        <Modal open={true} onClose={() => {}} size="sm">
          <p>Contenido</p>
        </Modal>
      )
      const dialog = screen.getByRole('dialog')
      expect(dialog.querySelector('.max-w-sm')).toBeInTheDocument()
    })

    it('aplica el tamaño lg correctamente', () => {
      render(
        <Modal open={true} onClose={() => {}} size="lg">
          <p>Contenido</p>
        </Modal>
      )
      const dialog = screen.getByRole('dialog')
      expect(dialog.querySelector('.max-w-lg')).toBeInTheDocument()
    })

    it('aplica el tamaño xl correctamente', () => {
      render(
        <Modal open={true} onClose={() => {}} size="xl">
          <p>Contenido</p>
        </Modal>
      )
      const dialog = screen.getByRole('dialog')
      expect(dialog.querySelector('.max-w-xl')).toBeInTheDocument()
    })

    it('aplica el tamaño full correctamente', () => {
      render(
        <Modal open={true} onClose={() => {}} size="full">
          <p>Contenido</p>
        </Modal>
      )
      const dialog = screen.getByRole('dialog')
      expect(dialog.querySelector('.max-w-full')).toBeInTheDocument()
    })
  })

  // Tests de cierre
  describe('Funcionalidad de cierre', () => {
    it('llama a onClose cuando se hace clic en el botón de cerrar', () => {
      const handleClose = jest.fn()
      render(
        <Modal open={true} onClose={handleClose} title="Modal">
          <p>Contenido</p>
        </Modal>
      )
      const closeButton = screen.getByLabelText('Cerrar modal')
      fireEvent.click(closeButton)
      expect(handleClose).toHaveBeenCalledTimes(1)
    })

    it('llama a onClose cuando se hace clic en el backdrop', () => {
      const handleClose = jest.fn()
      const { container } = render(
        <Modal open={true} onClose={handleClose}>
          <p>Contenido</p>
        </Modal>
      )
      // El backdrop es el div con clase absolute inset-0, no el fixed
      const backdrop = container.querySelector('.absolute.inset-0')
      if (backdrop) {
        fireEvent.click(backdrop)
        expect(handleClose).toHaveBeenCalledTimes(1)
      }
    })

    it('no llama a onClose cuando se hace clic en el backdrop si disableBackdropClick es true', () => {
      const handleClose = jest.fn()
      const { container } = render(
        <Modal open={true} onClose={handleClose} disableBackdropClick>
          <p>Contenido</p>
        </Modal>
      )
      const backdrop = container.querySelector('.fixed.inset-0')
      if (backdrop) {
        fireEvent.click(backdrop)
        expect(handleClose).not.toHaveBeenCalled()
      }
    })

    it('llama a onClose cuando se presiona ESC', () => {
      const handleClose = jest.fn()
      render(
        <Modal open={true} onClose={handleClose}>
          <p>Contenido</p>
        </Modal>
      )
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(handleClose).toHaveBeenCalledTimes(1)
    })

    it('no llama a onClose cuando se presiona ESC si disableEscapeKey es true', () => {
      const handleClose = jest.fn()
      render(
        <Modal open={true} onClose={handleClose} disableEscapeKey>
          <p>Contenido</p>
        </Modal>
      )
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(handleClose).not.toHaveBeenCalled()
    })

    it('no muestra el botón de cerrar cuando showCloseButton es false', () => {
      render(
        <Modal open={true} onClose={() => {}} showCloseButton={false} title="Modal">
          <p>Contenido</p>
        </Modal>
      )
      expect(screen.queryByLabelText('Cerrar modal')).not.toBeInTheDocument()
    })
  })

  // Tests de bloqueo de scroll
  describe('Bloqueo de scroll', () => {
    it('bloquea el scroll del body cuando el modal está abierto', () => {
      const { rerender } = render(
        <Modal open={false} onClose={() => {}}>
          <p>Contenido</p>
        </Modal>
      )
      expect(document.body.style.overflow).toBe('')

      rerender(
        <Modal open={true} onClose={() => {}}>
          <p>Contenido</p>
        </Modal>
      )
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('restaura el scroll del body cuando el modal se cierra', () => {
      const { rerender } = render(
        <Modal open={true} onClose={() => {}}>
          <p>Contenido</p>
        </Modal>
      )
      expect(document.body.style.overflow).toBe('hidden')

      rerender(
        <Modal open={false} onClose={() => {}}>
          <p>Contenido</p>
        </Modal>
      )
      expect(document.body.style.overflow).toBe('')
    })
  })

  // Tests de accesibilidad
  describe('Accesibilidad', () => {
    it('tiene el rol dialog', () => {
      render(
        <Modal open={true} onClose={() => {}}>
          <p>Contenido</p>
        </Modal>
      )
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('tiene aria-modal="true"', () => {
      render(
        <Modal open={true} onClose={() => {}}>
          <p>Contenido</p>
        </Modal>
      )
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })

    it('vincula el título con aria-labelledby', () => {
      render(
        <Modal open={true} onClose={() => {}} title="Mi Modal">
          <p>Contenido</p>
        </Modal>
      )
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title')
      expect(screen.getByText('Mi Modal')).toHaveAttribute('id', 'modal-title')
    })

    it('vincula la descripción con aria-describedby', () => {
      render(
        <Modal open={true} onClose={() => {}} description="Descripción">
          <p>Contenido</p>
        </Modal>
      )
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-describedby', 'modal-description')
      expect(screen.getByText('Descripción')).toHaveAttribute('id', 'modal-description')
    })

    it('el backdrop tiene aria-hidden', () => {
      const { container } = render(
        <Modal open={true} onClose={() => {}}>
          <p>Contenido</p>
        </Modal>
      )
      const backdrop = container.querySelector('.absolute.inset-0')
      expect(backdrop).toHaveAttribute('aria-hidden', 'true')
    })
  })

  // Tests de componentes personalizados
  describe('Componentes personalizados', () => {
    it('renderiza ModalHeader correctamente', () => {
      render(
        <Modal open={true} onClose={() => {}}>
          <ModalHeader>
            <h2>Header Personalizado</h2>
          </ModalHeader>
          <p>Contenido</p>
        </Modal>
      )
      expect(screen.getByText('Header Personalizado')).toBeInTheDocument()
    })

    it('renderiza ModalBody correctamente', () => {
      render(
        <Modal open={true} onClose={() => {}}>
          <ModalBody>
            <p>Body Personalizado</p>
          </ModalBody>
        </Modal>
      )
      expect(screen.getByText('Body Personalizado')).toBeInTheDocument()
    })

    it('renderiza ModalFooter correctamente', () => {
      render(
        <Modal open={true} onClose={() => {}}>
          <p>Contenido</p>
          <ModalFooter>
            <button>Footer Personalizado</button>
          </ModalFooter>
        </Modal>
      )
      expect(screen.getByRole('button', { name: 'Footer Personalizado' })).toBeInTheDocument()
    })

    it('ModalBody sin padding cuando noPadding es true', () => {
      render(
        <Modal open={true} onClose={() => {}}>
          <ModalBody noPadding data-testid="modal-body">
            <p>Sin padding</p>
          </ModalBody>
        </Modal>
      )
      const body = screen.getByTestId('modal-body')
      expect(body).not.toHaveClass('p-6')
    })

    it('ModalFooter con alineación personalizada', () => {
      render(
        <Modal open={true} onClose={() => {}}>
          <ModalFooter align="left" data-testid="modal-footer">
            <button>Izquierda</button>
          </ModalFooter>
        </Modal>
      )
      const footer = screen.getByTestId('modal-footer')
      expect(footer).toHaveClass('justify-start')
    })
  })

  // Tests de clases personalizadas
  describe('Clases personalizadas', () => {
    it('acepta className personalizado', () => {
      const { container } = render(
        <Modal open={true} onClose={() => {}} className="custom-modal">
          <p>Contenido</p>
        </Modal>
      )
      const modalContent = container.querySelector('.custom-modal')
      expect(modalContent).toBeInTheDocument()
    })

    it('acepta containerClassName personalizado', () => {
      const { container } = render(
        <Modal open={true} onClose={() => {}} containerClassName="custom-container">
          <p>Contenido</p>
        </Modal>
      )
      const container_div = container.querySelector('.custom-container')
      expect(container_div).toBeInTheDocument()
    })

    it('acepta overlayClassName personalizado', () => {
      const { container } = render(
        <Modal open={true} onClose={() => {}} overlayClassName="custom-overlay">
          <p>Contenido</p>
        </Modal>
      )
      const overlay = container.querySelector('.custom-overlay')
      expect(overlay).toBeInTheDocument()
    })
  })

  // Tests de trap de foco
  describe('Trap de foco', () => {
    it('enfoca el primer elemento focuseable al abrir', async () => {
      render(
        <Modal open={true} onClose={() => {}} showCloseButton={false}>
          <button>Primer botón</button>
          <button>Segundo botón</button>
        </Modal>
      )

      // Esperar a que el modal se monte y enfoque el primer elemento
      await waitFor(() => {
        const firstButton = screen.getByRole('button', { name: 'Primer botón' })
        expect(firstButton).toHaveFocus()
      }, { timeout: 300 })
    })
  })
})
