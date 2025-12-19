# Componentes de Checkout

Esta carpeta contiene los componentes React para el formulario de checkout, específicamente para la selección de localidades.

## Componentes

- `ProvinceSelector.tsx` - Dropdown para seleccionar provincia
- `MunicipalitySelector.tsx` - Dropdown para seleccionar municipio (dependiente de provincia)
- `PostalCodeInput.tsx` - Input de código postal con validación
- `DeliveryEstimateDisplay.tsx` - Muestra estimación de tiempo de entrega

## Uso

```tsx
import { ProvinceSelector, MunicipalitySelector, PostalCodeInput } from '@/components/checkout';

<ProvinceSelector 
  value={province} 
  onChange={setProvince} 
/>
```
