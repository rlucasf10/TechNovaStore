# Campaign Manager Service - Spec

## Estado del Spec

### ✅ Completado

- **requirements.md**: Documento de requisitos completo
  - 16 requisitos principales
  - 117 acceptance criteria
  - Siguiendo EARS (Easy Approach to Requirements Syntax)
  - Siguiendo INCOSE (semantic quality rules)
  - Integración completa con proyecto actual

### 🚧 Pendiente

- **design.md**: Documento de diseño técnico
  - Arquitectura detallada
  - Correctness Properties (Property-Based Testing)
  - Modelos de datos
  - Diagramas de componentes
  - Estrategia de testing

- **tasks.md**: Plan de implementación
  - Tareas organizadas por fase
  - Screaming Architecture
  - Orden de implementación
  - Referencias a requisitos

## Resumen del Sistema

### Objetivo

Crear un sistema automatizado de gestión de campañas promocionales que:
- Aplique descuentos automáticamente según fechas y reglas
- Se integre con Product Service para modificar precios
- Provea panel de administración en el frontend
- Incluya analytics y monitoreo
- Todo completamente automático sin intervención manual

### Componentes Principales

1. **Backend: Campaign Manager Service**
   - Microservicio en `domains/commerce/campaign-manager-service/`
   - Arquitectura: Screaming Architecture
   - Base de datos: PostgreSQL (compartida)
   - Puerto: 3011
   - Cron jobs para activación/desactivación automática

2. **Frontend: Admin Panel**
   - Integrado en AdminDashboard existente
   - Gestión visual de campañas
   - Analytics dashboard
   - Gráficos en tiempo real

3. **Integración con Monitoreo**
   - Métricas en Prometheus
   - Dashboards en Grafana
   - Logs en ELK Stack
   - Alertas en Alertmanager

### Arquitectura Screaming Architecture

```
campaign-manager-service/
├── create-campaign/              # Caso de uso: Crear campaña
│   ├── CreateCampaign.ts
│   └── CreateCampaign.test.ts
├── update-campaign/              # Caso de uso: Actualizar campaña
├── delete-campaign/              # Caso de uso: Eliminar campaña
├── get-campaign/                 # Caso de uso: Obtener campaña
├── list-campaigns/               # Caso de uso: Listar campañas
├── get-active-campaign/          # Caso de uso: Obtener campaña activa
├── apply-campaign-discounts/     # Caso de uso: Aplicar descuentos
├── remove-campaign-discounts/    # Caso de uso: Remover descuentos
├── calculate-discount/           # Caso de uso: Calcular descuento
├── get-campaign-analytics/       # Caso de uso: Obtener analytics
├── generate-campaign-report/     # Caso de uso: Generar reporte
├── check-activate-campaigns/     # Caso de uso: Verificar activación (Cron)
├── check-deactivate-campaigns/   # Caso de uso: Verificar desactivación (Cron)
├── shared/                       # Infraestructura compartida
│   ├── models/                   # Modelos de datos
│   │   ├── Campaign.ts
│   │   ├── CampaignProduct.ts
│   │   └── CampaignAnalytics.ts
│   ├── repositories/             # Repositorios
│   │   ├── CampaignRepository.ts
│   │   ├── CampaignProductRepository.ts
│   │   └── CampaignAnalyticsRepository.ts
│   ├── clients/                  # Clientes externos
│   │   └── ProductServiceClient.ts
│   ├── utils/                    # Utilidades
│   │   ├── logger.ts
│   │   ├── validators.ts
│   │   └── discount-calculator.ts
│   └── types/                    # Tipos compartidos
│       └── index.ts
├── api/                          # Capa de presentación HTTP
│   ├── CampaignController.ts
│   └── routes.ts
├── config/                       # Configuración
│   └── index.ts
├── cron/                         # Tareas programadas
│   └── campaign-scheduler.ts
├── index.ts                      # Entry point
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

### Flujo Automático

**Ejemplo: Black Friday**

1. **Configuración (Manual - Una vez)**
   ```
   Admin crea campaña "Black Friday 2025"
   - Fechas: 20 Nov - 2 Dic
   - Reglas: 40% portátiles, 50% componentes, 20% resto
   ```

2. **20 Noviembre 00:00 (Automático)**
   ```
   ✅ Cron detecta inicio
   ✅ Aplica descuentos a productos
   ✅ Actualiza precios en BD
   ✅ Frontend muestra descuentos reales
   ✅ Notifica al equipo
   ```

3. **Durante la Campaña**
   ```
   ✅ Productos con precios reales con descuento
   ✅ Analytics en tiempo real
   ✅ Monitoreo en Grafana
   ```

4. **2 Diciembre 23:59 (Automático)**
   ```
   ✅ Cron detecta fin
   ✅ Restaura precios originales
   ✅ Genera reporte final
   ✅ Archiva datos
   ```

### Integración con Proyecto Actual

#### Base de Datos (PostgreSQL compartida)
- Usa la misma instancia de PostgreSQL que otros servicios
- Tablas: `campaigns`, `campaign_products`, `campaign_analytics`
- Migraciones versionadas

#### Product Service
- Agrega campos al modelo Product:
  - `in_campaign: boolean`
  - `campaign_id: string`
  - `campaign_price: number`
  - `original_price: number`
  - `discount_percentage: number`

#### Frontend
- Nueva sección en AdminDashboard: `/admin/campaigns`
- Componentes reutilizables del sistema de diseño existente
- Integración con sistema de autenticación actual

#### Monitoreo
- Métricas en Prometheus existente
- Dashboard en Grafana existente
- Logs en ELK Stack existente
- Alertas en Alertmanager existente

### Tecnologías

- **Backend**: Node.js + TypeScript + Express
- **Base de Datos**: PostgreSQL 15
- **ORM**: TypeORM o Prisma
- **Cron**: node-cron
- **Testing**: Jest + Property-Based Testing
- **Monitoreo**: Prometheus + Grafana
- **Logs**: Winston + ELK Stack
- **Containerización**: Docker

### Próximos Pasos

1. **Crear design.md**
   - Arquitectura detallada
   - Correctness Properties
   - Modelos de datos
   - Diagramas

2. **Crear tasks.md**
   - Plan de implementación
   - Tareas organizadas
   - Referencias a requisitos

3. **Implementar Backend**
   - Crear microservicio
   - Implementar casos de uso
   - Tests completos

4. **Implementar Frontend**
   - Panel de admin
   - Analytics dashboard
   - Integración

5. **Configurar Monitoreo**
   - Dashboards Grafana
   - Alertas
   - Logs

## Referencias

- **Frontend Campaigns**: `domains/platform/frontend/src/shared/lib/campaigns.ts`
- **Campaign Design**: `domains/platform/frontend/src/shared/lib/CAMPAIGN_BACKEND_DESIGN.md`
- **Campaign README**: `domains/platform/frontend/src/shared/lib/CAMPAIGNS_README.md`
- **Project Guidelines**: `.kiro/project-guidelines.md`
- **Screaming Architecture Spec**: `.kiro/specs/project-refactor-screaming-architecture/`

## Notas Importantes

- ✅ El frontend ya está preparado con el sistema de campañas dinámico
- ✅ Los componentes visuales ya están implementados y funcionando
- ✅ El AdminDashboard existe y está funcionando
- 🚧 Falta implementar el backend que aplique los descuentos reales
- 🚧 Falta agregar sección de "Campañas" al AdminDashboard existente (nueva página integrada)
- 🚧 Falta integrar con monitoreo

## Contacto

Para continuar con este spec, revisar los requisitos en `requirements.md` y proceder a crear el diseño y las tareas.
