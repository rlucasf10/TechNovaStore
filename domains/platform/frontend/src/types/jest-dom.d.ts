// Extensión de tipos para @testing-library/jest-dom
// Necesario para compatibilidad con React 19 y versiones recientes de jest-dom
import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R> {
      // Extender toHaveClass para aceptar múltiples argumentos
      toHaveClass(...classNames: string[]): R
    }
  }
}

export {}
