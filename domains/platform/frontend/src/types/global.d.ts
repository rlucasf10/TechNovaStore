// Tipos globales para el proyecto
// Compatibilidad con React 19

declare namespace React {
  // Mantener compatibilidad con código que usa React.ReactNode
  export type ReactNode = import('react').ReactNode
  export type FC<P = object> = import('react').FC<P>
  export type ReactElement = import('react').ReactElement
}

export {}
