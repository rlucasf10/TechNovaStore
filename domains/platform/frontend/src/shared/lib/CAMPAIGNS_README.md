# Sistema de Campañas Dinámicas

## ⚠️ ACTUALIZACIÓN IMPORTANTE

**Este documento describe el sistema antiguo de campañas hardcodeadas.**

El sistema ha sido **migrado al Campaign Manager Service** (microservicio dedicado).

**Nueva ubicación**: 
- Backend: `domains/commerce/campaign-manager-service/`
- Admin Panel: `http://localhost:3020/admin/campaigns`
- Documentación: `.kiro/specs/campaign-manager-service/`

## Descripción

Sistema automatizado que adapta la página de inicio según la fecha y eventos comerciales del año. Ahora gestionado completamente desde el Campaign Manager Service con base de datos PostgreSQL.

## Características

✅ **Completamente Automático**: No requiere intervención manual
✅ **Basado en Fechas**: Se activa automáticamente según el calendario
✅ **Prioridades**: Múltiples campañas pueden coexistir, se muestra la de mayor prioridad
✅ **Personalización Total**: Cada campaña puede personalizar:
  - Banner promocional superior
  - Hero section (título, subtítulo, CTA, badge)
  - Sección de ofertas (título, colores, badge)
  - Categorías destacadas

## Campañas Configuradas

### 1. Black Friday / Cyber Monday
- **Fechas**: 20 Nov - 2 Dic
- **Prioridad**: 100 (máxima)
- **Características**:
  - Colores oscuros (negro/gris)
  - Descuentos hasta 70%
  - Ofertas relámpago
  - Financiación especial

### 2. Navidad
- **Fechas**: 1 Dic - 26 Dic
- **Prioridad**: 90
- **Características**:
  - Temática navideña (🎄🎁)
  - Devoluciones extendidas hasta 15 enero
  - Envío garantizado antes del 24
  - Categorías: smartphones, tablets, consolas

### 3. Rebajas de Enero
- **Fechas**: 7 Ene - 31 Ene
- **Prioridad**: 85
- **Características**:
  - Descuentos hasta 60%
  - Últimas unidades
  - Devoluciones extendidas

### 4. Vuelta al Cole
- **Fechas**: 15 Ago - 30 Sep
- **Prioridad**: 80
- **Características**:
  - Equipamiento estudiantil
  - Portátiles desde 299€
  - Packs especiales estudiante
  - Categorías: portátiles, tablets, periféricos

### 5. San Valentín
- **Fechas**: 1 Feb - 14 Feb
- **Prioridad**: 75
- **Características**:
  - Regalos tecnológicos
  - Envoltorio especial gratis
  - Entrega garantizada antes del 14

### 6. Ofertas de Verano
- **Fechas**: 1 Jul - 31 Jul
- **Prioridad**: 70
- **Características**:
  - Tecnología para vacaciones
  - Descuentos hasta 50%
  - Categorías: smartphones, tablets, cámaras

### 7. Campaña por Defecto
- **Fechas**: Todo el año
- **Prioridad**: 1 (mínima)
- **Características**:
  - Mensajes estándar
  - Ofertas generales

## Cómo Funciona (Nuevo Sistema)

### 1. Detección Automática desde el Servicio

```typescript
import { campaignService } from '@/shared/services'

// Obtener campaña activa desde el Campaign Manager Service
const campaign = await campaignService.getActiveCampaign()
// Retorna la campaña activa de mayor prioridad desde la base de datos
```

### 2. Componentes Dinámicos

Todos estos componentes se adaptan automáticamente:

- **PromoBanner**: Mensajes del banner superior
- **HeroSection**: Título, subtítulo, CTA, badge
- **DealsSection**: Título, colores, categorías filtradas
- **CampaignCountdown**: Muestra countdown 7 días antes

### 3. Prioridades

Si múltiples campañas están activas (ej: Black Friday + Navidad), se muestra la de **mayor prioridad**.

## Agregar Nueva Campaña (Nuevo Sistema)

**Ahora se hace desde el Admin Panel:**

1. Ir a `http://localhost:3020/admin/campaigns`
2. Click en "Nueva Campaña"
3. Llenar el formulario:
   - Nombre y slug
   - Fechas de inicio y fin
   - Prioridad
   - Reglas de descuento
   - Configuración de frontend (banner, hero, ofertas)
4. Guardar

**O mediante API:**

```typescript
import { campaignService } from '@/shared/services'

await campaignService.createCampaign({
  name: 'Mi Campaña',
  slug: 'mi-campana',
  startDate: '2025-03-01T00:00:00Z',
  endDate: '2025-03-31T23:59:59Z',
  priority: 75,
  discountRules: {
    global: {
      type: 'percentage',
      value: 20,
      maxDiscount: 100
    }
  },
  frontendConfig: {
    promoBanner: {
      messages: [
        { icon: '🎉', text: 'Mensaje 1' },
        { icon: '🎁', text: 'Mensaje 2' },
      ]
    },
    hero: {
      title: 'Título del Hero',
      subtitle: 'Subtítulo',
      ctaText: 'Botón CTA',
      badge: 'NUEVO'
    },
    dealsSection: {
      title: 'Título de Ofertas',
      subtitle: 'Subtítulo',
      badge: 'OFERTA',
      backgroundColor: 'from-blue-500 to-purple-500'
    },
    categories: ['categoria1', 'categoria2']
  }
})
```

## API del Campaign Service

### campaignService.getActiveCampaign()
Retorna la campaña activa actual (mayor prioridad) desde la base de datos.

### campaignService.getCampaigns(filters)
Lista todas las campañas con filtros opcionales (estado, página, límite).

### campaignService.getCampaign(id)
Obtiene una campaña específica por ID.

### campaignService.createCampaign(data)
Crea una nueva campaña (requiere autenticación admin).

### campaignService.updateCampaign(id, data)
Actualiza una campaña existente (requiere autenticación admin).

### campaignService.deleteCampaign(id)
Elimina una campaña (requiere autenticación admin).

### campaignService.applyDiscounts(id)
Aplica descuentos de una campaña manualmente.

### campaignService.removeDiscounts(id)
Remueve descuentos de una campaña manualmente.

## Testing

Para probar una campaña específica, modifica temporalmente las fechas:

```typescript
// Cambiar año actual por año de prueba
startDate: new Date(2024, 10, 20), // Cambiar a fecha actual
endDate: new Date(2024, 11, 2),
```

## Mantenimiento

### Actualización Anual
Las fechas usan `new Date().getFullYear()` para actualizarse automáticamente cada año.

### Monitoreo
Revisar logs del frontend para verificar qué campaña está activa:

```typescript
console.log('Campaña activa:', getActiveCampaign().name)
```

## Beneficios

1. **Automatización Total**: No requiere despliegues para cambiar campañas
2. **Consistencia**: Todas las secciones se actualizan juntas
3. **Flexibilidad**: Fácil agregar nuevas campañas
4. **Escalabilidad**: Soporta múltiples campañas simultáneas
5. **Profesionalismo**: Experiencia similar a grandes e-commerce

## Funcionalidades Implementadas ✅

- ✅ Panel de administración para gestionar campañas
- ✅ Base de datos PostgreSQL para persistencia
- ✅ API REST completa con autenticación JWT
- ✅ Aplicación y remoción automática de descuentos
- ✅ Scheduler con cron jobs para automatización
- ✅ Métricas y analytics de campañas
- ✅ Integración con Product Service
- ✅ Health checks y monitoreo con Prometheus

## Próximas Mejoras

- [ ] Dashboard de analytics con gráficos (Tarea 33)
- [ ] Integración con Grafana (Tarea 35)
- [ ] A/B testing de campañas
- [ ] Campañas por segmento de usuario
- [ ] Campañas por geolocalización
