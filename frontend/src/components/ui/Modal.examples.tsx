'use client'

import React, { useState } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal'
import { Button } from './Button'

/**
 * Ejemplos de uso del componente Modal
 * 
 * Este archivo contiene ejemplos prácticos de cómo usar el componente Modal
 * en diferentes escenarios comunes.
 */

// Ejemplo 1: Modal básico con título y descripción
export function BasicModalExample() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>
        Abrir Modal Básico
      </Button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Modal Básico"
        description="Este es un ejemplo de modal básico con título y descripción."
      >
        <p className="text-gray-700">
          Este es el contenido del modal. Puedes agregar cualquier contenido aquí.
        </p>
      </Modal>
    </div>
  )
}

// Ejemplo 2: Modal de confirmación con footer
export function ConfirmationModalExample() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    // Simular operación asíncrona
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsLoading(false)
    setIsOpen(false)
    alert('¡Acción confirmada!')
  }

  return (
    <div>
      <Button onClick={() => setIsOpen(true)} variant="danger">
        Eliminar Cuenta
      </Button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirmar eliminación"
        description="Esta acción no se puede deshacer."
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirm}
              loading={isLoading}
            >
              Eliminar
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-gray-700">
            ¿Estás seguro de que deseas eliminar tu cuenta?
          </p>
          <p className="text-sm text-gray-500">
            Se eliminarán todos tus datos, pedidos e información personal de forma permanente.
          </p>
        </div>
      </Modal>
    </div>
  )
}

// Ejemplo 3: Modal con formulario
export function FormModalExample() {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Procesar formulario
    setIsOpen(false)
    setFormData({ name: '', email: '' })
  }

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>
        Agregar Usuario
      </Button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Nuevo Usuario"
        description="Completa el formulario para agregar un nuevo usuario."
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="user-form"
            >
              Guardar
            </Button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}

// Ejemplo 4: Modal de tamaño completo
export function FullSizeModalExample() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>
        Abrir Modal Grande
      </Button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Términos y Condiciones"
        size="xl"
      >
        <div className="prose max-w-none">
          <h3>1. Aceptación de los términos</h3>
          <p>
            Al acceder y utilizar este sitio web, aceptas estar sujeto a estos términos
            y condiciones de uso, todas las leyes y regulaciones aplicables.
          </p>
          
          <h3>2. Uso de la licencia</h3>
          <p>
            Se concede permiso para descargar temporalmente una copia de los materiales
            en el sitio web de TechNovaStore solo para visualización transitoria personal
            y no comercial.
          </p>

          <h3>3. Descargo de responsabilidad</h3>
          <p>
            Los materiales en el sitio web de TechNovaStore se proporcionan &quot;tal cual&quot;.
            TechNovaStore no ofrece garantías, expresas o implícitas, y por este medio
            renuncia y niega todas las demás garantías.
          </p>

          <h3>4. Limitaciones</h3>
          <p>
            En ningún caso TechNovaStore o sus proveedores serán responsables de ningún
            daño (incluidos, entre otros, daños por pérdida de datos o ganancias, o debido
            a la interrupción del negocio).
          </p>
        </div>
      </Modal>
    </div>
  )
}

// Ejemplo 5: Modal sin cierre automático (requiere acción del usuario)
export function NoBackdropCloseModalExample() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>
        Abrir Modal Crítico
      </Button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Acción Requerida"
        description="Debes completar esta acción antes de continuar."
        size="sm"
        disableBackdropClick
        disableEscapeKey
        showCloseButton={false}
        footer={
          <Button onClick={() => setIsOpen(false)}>
            Entendido
          </Button>
        }
      >
        <div className="space-y-3">
          <p className="text-gray-700">
            Tu sesión está por expirar. Por favor, guarda tu trabajo.
          </p>
          <div className="bg-warning/10 border border-warning/20 rounded-md p-3">
            <p className="text-sm text-warning-dark">
              ⚠️ Esta ventana no se puede cerrar haciendo clic fuera o presionando ESC.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// Ejemplo 6: Modal con componentes personalizados (ModalHeader, ModalBody, ModalFooter)
export function CustomModalExample() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>
        Abrir Modal Personalizado
      </Button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        size="lg"
        showCloseButton={false}
      >
        <ModalHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Información Importante
              </h2>
              <p className="text-sm text-gray-500">
                Lee cuidadosamente antes de continuar
              </p>
            </div>
          </div>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            <p className="text-gray-700">
              Este es un ejemplo de modal con componentes personalizados que te da
              control total sobre el diseño del header, body y footer.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Puedes agregar iconos personalizados</li>
              <li>Controlar el padding y espaciado</li>
              <li>Agregar múltiples secciones</li>
              <li>Personalizar completamente el diseño</li>
            </ul>
          </div>
        </ModalBody>

        <ModalFooter align="right">
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => setIsOpen(false)}>
            Aceptar
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

// Ejemplo 7: Modal con contenido largo y scroll
export function ScrollableModalExample() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>
        Abrir Modal con Scroll
      </Button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Política de Privacidad"
        description="Última actualización: Octubre 2025"
        size="lg"
        footer={
          <Button onClick={() => setIsOpen(false)}>
            Cerrar
          </Button>
        }
      >
        <div className="space-y-4 text-gray-700">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i}>
              <h4 className="font-semibold mb-2">Sección {i + 1}</h4>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
                tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
                quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}

// Componente que muestra todos los ejemplos
export function AllModalExamples() {
  return (
    <div className="space-y-4 p-8">
      <h1 className="text-3xl font-bold mb-6">Ejemplos de Modal</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Modal Básico</h3>
          <BasicModalExample />
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Modal de Confirmación</h3>
          <ConfirmationModalExample />
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Modal con Formulario</h3>
          <FormModalExample />
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Modal Grande</h3>
          <FullSizeModalExample />
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Modal Crítico</h3>
          <NoBackdropCloseModalExample />
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Modal Personalizado</h3>
          <CustomModalExample />
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Modal con Scroll</h3>
          <ScrollableModalExample />
        </div>
      </div>
    </div>
  )
}
