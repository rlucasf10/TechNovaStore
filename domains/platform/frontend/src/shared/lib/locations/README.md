# Servicios de Localidades

Esta carpeta contiene los servicios y utilidades para gestionar localidades españolas (provincias, municipios y códigos postales).

## Servicios

- `LocationsService.ts` - Servicio principal para acceder a datos de localidades
- `DeliveryEstimator.ts` - Servicio para calcular estimaciones de entrega
- `types.ts` - Definiciones de tipos TypeScript

## Uso

```typescript
import { LocationsService } from '@/lib/locations/LocationsService';

const service = LocationsService.getInstance();
await service.loadData();

const provinces = service.getProvinces();
const municipalities = service.getMunicipalitiesByProvince('28');
```
