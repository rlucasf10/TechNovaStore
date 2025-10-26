# Guía de Testing - TechNovaStore Frontend

## Configuración Actual

### Jest + Testing Library
- ✅ Jest configurado con Next.js
- ✅ React Testing Library para componentes
- ✅ TypeScript support completo
- ✅ Mocks para Next.js router y localStorage

### Archivos de Configuración
- `jest.config.js` - Configuración principal de Jest
- `jest.setup.js` - Setup global para tests
- `src/types/global.d.ts` - Tipos TypeScript para matchers de jest-dom

## Errores Comunes y Soluciones

### 1. Error: `Property 'toBeInTheDocument' does not exist`

**Causa**: TypeScript no reconoce los matchers de `@testing-library/jest-dom`

**Solución**:
```bash
npm install --save-dev @testing-library/jest-dom @types/testing-library__jest-dom
```

Asegúrate de que `jest.setup.js` importe:
```javascript
import '@testing-library/jest-dom'
```

### 2. Error: Formateo de números inconsistente

**Causa**: `Intl.NumberFormat` se comporta diferente según:
- Sistema operativo
- Configuración regional del sistema
- Versión de Node.js

**Solución**: Usar tests más flexibles:
```javascript
// ❌ Frágil - puede fallar en diferentes sistemas
expect(formatPrice(1000)).toBe('1.000,00 €')

// ✅ Robusto - funciona en cualquier sistema
expect(formatPrice(1000)).toMatch(/1[.]?000[,.]00/)
expect(formatPrice(1000)).toContain('€')
```

### 3. Error: Diferencias de timezone en fechas

**Causa**: `Date` se comporta diferente según la zona horaria

**Solución**: Usar fechas específicas o mocks:
```javascript
// ✅ Usar fechas fijas
const date = new Date('2024-01-15T12:00:00Z')

// ✅ O mockear Date
jest.useFakeTimers().setSystemTime(new Date('2024-01-15'))
```

## Mejores Prácticas

### 1. Tests de Componentes
```javascript
// ✅ Siempre usar TestWrapper para contextos
function TestWrapper({ children }) {
  return (
    <CartProvider>
      {children}
    </CartProvider>
  )
}

// ✅ Limpiar estado entre tests
beforeEach(() => {
  localStorage.clear()
})
```

### 2. Tests de Utilidades
```javascript
// ✅ Usar regex para formateo flexible
expect(result).toMatch(/pattern/)

// ✅ Testear comportamiento, no implementación
expect(formatPrice(100)).toContain('€')
```

### 3. Tests Asíncronos
```javascript
// ✅ Usar waitFor para elementos que aparecen después
await waitFor(() => {
  expect(screen.getByText('¡Añadido!')).toBeInTheDocument()
})
```

## Scripts Disponibles

```bash
npm test              # Ejecutar todos los tests
npm run test:watch    # Ejecutar tests en modo watch
npm run test:coverage # Ejecutar tests con reporte de cobertura
```

## Estructura de Tests

```
src/
├── components/
│   └── cart/
│       ├── __tests__/
│       │   ├── ShoppingCart.test.tsx
│       │   └── AddToCartButton.test.tsx
│       ├── ShoppingCart.tsx
│       └── AddToCartButton.tsx
├── contexts/
│   └── __tests__/
│       └── CartContext.test.tsx
└── lib/
    └── __tests__/
        └── utils.test.ts
```

## Debugging Tests

### Ver output detallado:
```bash
npm test -- --verbose
```

### Ejecutar un test específico:
```bash
npm test -- --testNamePattern="should add items to cart"
```

### Debug en VS Code:
1. Añadir breakpoint en el test
2. Ejecutar "Debug Jest Tests" en VS Code
3. O usar `console.log()` en los tests

## Cobertura de Código

Objetivo: Mantener >80% de cobertura en:
- Funciones críticas (cart, checkout)
- Utilidades (formatters, validators)
- Contextos (state management)

Ver reporte: `npm run test:coverage`