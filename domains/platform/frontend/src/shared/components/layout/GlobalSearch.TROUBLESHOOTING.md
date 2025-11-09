# GlobalSearch - Troubleshooting

## Errores Comunes y Soluciones

### ✅ Error de Hydration (RESUELTO)

**Error:**
```
Uncaught Error: Hydration failed because the server rendered HTML didn't match the client.
```

**Causa:**
El componente GlobalSearch usa hooks y efectos del lado del cliente (event listeners, refs) que no están disponibles durante el Server-Side Rendering (SSR) de Next.js.

**Solución Implementada:**
1. Agregado estado `isMounted` para detectar cuando el componente está en el cliente
2. Los efectos que usan `document` solo se ejecutan después de que `isMounted` es `true`
3. Esto previene diferencias entre el HTML renderizado en el servidor y el cliente

```typescript
const [isMounted, setIsMounted] = useState(false);

useEffect(() => {
  setIsMounted(true);
}, []);

// Los efectos ahora verifican isMounted
useEffect(() => {
  if (!isMounted) return;
  // ... código que usa document
}, [isMounted]);
```

### ✅ Error 401 de Autenticación (NORMAL)

**Error:**
```
GET http://localhost:3000/api/auth/me 401 (Unauthorized)
```

**Causa:**
El hook `useAuth` intenta obtener información del usuario actual, pero el usuario no está autenticado.

**¿Es un problema?**
**NO**. Este es el comportamiento esperado cuando:
- El usuario no ha iniciado sesión
- La sesión ha expirado
- Las cookies de autenticación no están presentes

**Comportamiento correcto:**
1. El frontend intenta obtener el usuario actual
2. El backend responde con 401 (no autorizado)
3. El frontend muestra la UI para usuarios no autenticados (botón "Iniciar Sesión")
4. El componente GlobalSearch funciona correctamente sin autenticación

**No requiere acción** a menos que:
- El usuario SÍ debería estar autenticado pero no lo está
- El error persiste después de iniciar sesión correctamente

## Verificación de Funcionamiento

### ✅ Checklist de Funcionamiento Correcto

- [x] El componente se renderiza sin errores de hydration
- [x] El input de búsqueda es visible y funcional
- [x] No hay errores de TypeScript
- [x] El error 401 es esperado para usuarios no autenticados
- [x] El componente tiene la directiva 'use client'
- [x] Los efectos verifican `isMounted` antes de usar `document`

### Probar el Componente

1. **Abrir la aplicación en el navegador**
   ```
   http://localhost:3011
   ```

2. **Verificar que no hay errores de hydration en la consola**
   - Abrir DevTools (F12)
   - Ir a la pestaña Console
   - No debería haber errores rojos de "Hydration failed"

3. **Probar el shortcut Ctrl+K**
   - Presionar `Ctrl+K` (Windows/Linux) o `Cmd+K` (Mac)
   - El input de búsqueda debería recibir el foco

4. **Probar la búsqueda**
   - Escribir al menos 2 caracteres
   - Esperar 300ms (debounce)
   - Debería aparecer el dropdown (vacío si el backend no está implementado)

5. **Probar navegación por teclado**
   - Escribir una búsqueda
   - Usar flechas ↑↓ para navegar
   - Presionar Enter para seleccionar
   - Presionar Escape para cerrar

## Errores que SÍ Requieren Atención

### ✅ Error: "Cannot read properties of undefined (reading 'slice')" (RESUELTO)

**Error:**
```
TypeError: Cannot read properties of undefined (reading 'slice')
at GlobalSearch (GlobalSearch.tsx:52:29)
```

**Causa:** El objeto `results` del backend puede tener `products`, `categories` o `brands` como `undefined` en lugar de arrays vacíos.

**Solución Implementada:**
Agregadas validaciones defensivas usando el operador de coalescencia nula:

```typescript
// Antes (causaba error)
const allResults = results ? [
  ...results.products.slice(0, 3),
  ...results.categories.slice(0, 3),
  ...results.brands.slice(0, 4),
] : [];

// Después (seguro)
const allResults = results ? [
  ...(results.products || []).slice(0, 3),
  ...(results.categories || []).slice(0, 3),
  ...(results.brands || []).slice(0, 4),
] : [];
```

**Nota para el backend:** El endpoint debe retornar siempre arrays vacíos en lugar de `undefined`:

```json
{
  "products": [],
  "categories": [],
  "brands": [],
  "total": 0
}
```

### ❌ Error: "Cannot read property 'focus' of null"

**Causa:** El ref `inputRef` no está asignado correctamente.

**Solución:** Verificar que el input tenga `ref={inputRef}`.

### ❌ Error: "search is not a function"

**Causa:** El hook `useSearch` no está exportado o importado correctamente.

**Solución:** Verificar imports en `@/hooks/useSearch`.

### ❌ Error: "SearchResult is not defined"

**Causa:** Los tipos no están exportados correctamente.

**Solución:** Verificar que `SearchResult` esté exportado en `@/types/index.ts`.

### ❌ Error: Network error al buscar

**Causa:** El backend no está corriendo o el endpoint no existe.

**Solución:** 
1. Verificar que el API Gateway esté corriendo
2. Implementar el endpoint `/api/products/search` según la especificación
3. Verificar la variable de entorno `NEXT_PUBLIC_API_URL`

## Debugging

### Ver logs del componente

Agregar logs temporales para debugging:

```typescript
// En GlobalSearch.tsx
useEffect(() => {
  console.log('🔍 Search results:', results);
  console.log('⏳ Is loading:', isLoading);
  console.log('📝 Input value:', inputValue);
}, [results, isLoading, inputValue]);
```

### Ver requests de red

1. Abrir DevTools (F12)
2. Ir a la pestaña Network
3. Filtrar por "search"
4. Escribir en el input de búsqueda
5. Verificar que se haga el request después de 300ms

### Ver estado de React

Usar React DevTools:
1. Instalar React DevTools extension
2. Abrir DevTools
3. Ir a la pestaña "Components"
4. Buscar "GlobalSearch"
5. Ver el estado actual (isOpen, inputValue, selectedIndex, etc.)

## Performance

### Verificar debounce

El componente debe esperar 300ms después de que el usuario deja de escribir antes de hacer el request.

**Cómo verificar:**
1. Abrir Network tab en DevTools
2. Escribir rápidamente "laptop"
3. Debería haber solo 1 request, no 6 (uno por cada letra)

### Verificar caché

React Query cachea los resultados automáticamente.

**Cómo verificar:**
1. Buscar "laptop"
2. Limpiar el input
3. Buscar "laptop" de nuevo
4. El segundo request debería ser instantáneo (desde caché)

## Notas Adicionales

### SSR vs CSR

- **SSR (Server-Side Rendering)**: Next.js renderiza el HTML en el servidor
- **CSR (Client-Side Rendering)**: React renderiza en el navegador

El componente GlobalSearch es CSR porque:
- Usa hooks de estado (`useState`)
- Usa efectos (`useEffect`)
- Usa refs (`useRef`)
- Interactúa con `document` y `window`

La directiva `'use client'` le dice a Next.js que este componente debe renderizarse solo en el cliente.

### Hydration

Hydration es el proceso donde React "hidrata" el HTML estático del servidor con interactividad del cliente.

**Problema:** Si el HTML del servidor no coincide con el del cliente, React lanza un error.

**Solución:** Usar `isMounted` para asegurar que el código que depende del cliente solo se ejecute después de la hidratación.

## Recursos

- [Next.js Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [React Hydration](https://react.dev/reference/react-dom/client/hydrateRoot)
- [React DevTools](https://react.dev/learn/react-developer-tools)
