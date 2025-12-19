# ProvinceSelector Component

Componente React para seleccionar provincias españolas en el formulario de checkout.

## Características

- ✅ Carga automática de las 50 provincias de España desde LocationsService
- ✅ Provincias ordenadas alfabéticamente
- ✅ Estado de carga (loading) con mensaje informativo
- ✅ Manejo de errores con mensajes descriptivos
- ✅ Soporte para estado deshabilitado
- ✅ Validación visual con indicadores de error
- ✅ Accesibilidad completa (ARIA labels, roles)
- ✅ Diseño responsive con Tailwind CSS
- ✅ TypeScript con tipos completos

## Uso Básico

```tsx
import { ProvinceSelector } from '@/components/checkout/ProvinceSelector';

function CheckoutForm() {
  const [province, setProvince] = useState<string | null>(null);

  return (
    <ProvinceSelector
      value={province}
      onChange={(code) => setProvince(code)}
      placeholder="Selecciona tu provincia"
    />
  );
}
```

## Props

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `value` | `string \| null` | ✅ | Código de provincia seleccionado (ej: "28" para Madrid) |
| `onChange` | `(provinceCode: string) => void` | ✅ | Callback ejecutado cuando se selecciona una provincia |
| `error` | `string` | ❌ | Mensaje de error a mostrar |
| `disabled` | `boolean` | ❌ | Deshabilita el selector (default: `false`) |
| `placeholder` | `string` | ❌ | Texto placeholder (default: "Selecciona una provincia") |

## Ejemplos

### Con validación de errores

```tsx
<ProvinceSelector
  value={province}
  onChange={setProvince}
  error={errors.province}
/>
```

### Deshabilitado

```tsx
<ProvinceSelector
  value={province}
  onChange={setProvince}
  disabled={true}
/>
```

### Con React Hook Form

```tsx
import { Controller } from 'react-hook-form';

<Controller
  name="province"
  control={control}
  rules={{ required: 'La provincia es obligatoria' }}
  render={({ field, fieldState }) => (
    <ProvinceSelector
      value={field.value}
      onChange={field.onChange}
      error={fieldState.error?.message}
    />
  )}
/>
```

## Estados del Componente

### 1. Cargando
- Muestra "Cargando provincias..." en el placeholder
- Selector deshabilitado automáticamente
- Sin opciones disponibles

### 2. Error de Carga
- Muestra "Error al cargar provincias" en el placeholder
- Selector deshabilitado automáticamente
- Mensaje de error visible debajo del selector

### 3. Cargado
- Muestra las 50 provincias ordenadas alfabéticamente
- Selector habilitado (a menos que `disabled={true}`)
- Muestra contador "50 provincias disponibles"

### 4. Con Error de Validación
- Borde rojo en el selector
- Mensaje de error visible debajo
- Selector funcional (puede corregir el error)

## Accesibilidad

El componente implementa las mejores prácticas de accesibilidad:

- ✅ Label asociado con `htmlFor`
- ✅ `aria-label` para lectores de pantalla
- ✅ `aria-invalid` cuando hay error
- ✅ `aria-describedby` vinculado al mensaje de error
- ✅ `role="alert"` en mensajes de error
- ✅ Navegación por teclado completa

## Estilos

El componente usa Tailwind CSS con las siguientes características:

- Diseño responsive (ancho completo)
- Estados hover, focus y disabled
- Transiciones suaves
- Colores consistentes con el sistema de diseño
- Indicadores visuales claros para cada estado

## Testing

Para probar el componente, visita la página de prueba:

```
http://localhost:3011/test-province-selector
```

Esta página incluye:
- Visualización del componente
- Controles para probar diferentes estados
- Información de estado en tiempo real
- Instrucciones de prueba

## Integración con LocationsService

El componente se integra automáticamente con `LocationsService`:

1. Al montar, llama a `service.loadData()`
2. Obtiene provincias con `service.getProvinces()`
3. Las provincias ya vienen ordenadas alfabéticamente
4. Maneja errores de carga automáticamente

## Notas de Implementación

- **Lazy Loading**: Los datos se cargan solo cuando el componente se monta
- **Caché**: LocationsService cachea los datos después de la primera carga
- **Performance**: El ordenamiento se hace en el servicio (memoizado)
- **Error Handling**: Errores de carga no rompen la UI
- **TypeScript**: Tipos completos para todas las props y estados

## Requisitos Cumplidos

✅ **Requisito 1.1**: Mostrar dropdown con las 50 provincias ordenadas alfabéticamente

## Próximos Pasos

Después de implementar este componente, los siguientes pasos son:

1. Implementar `MunicipalitySelector` (tarea 9.1)
2. Implementar `PostalCodeInput` (tarea 10.1)
3. Integrar en el formulario de checkout real (tarea 13.1)
