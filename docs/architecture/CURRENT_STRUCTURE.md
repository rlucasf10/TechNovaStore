# Estructura Actual del Proyecto - TechNovaStore

**Fecha**: 6/11/2025, 14:44:40

## Resumen Ejecutivo

- **Total de directorios**: 72
- **Total de archivos**: 184
- **Microservicios identificados**: 19
- **Archivos Dockerfile**: 14
- **Archivos package.json**: 18
- **Archivos en raíz**: 53

## Árbol de Estructura (Nivel Superior)

```
TechNovaStore/
├── .github/
│   ├── actions/
│   │   └── deploy/
│   └── workflows/
│       ├── automated-deployment.yml
│       ├── ci-cd.yml
│       ├── deploy-production.yml
│       ├── deploy-staging.yml
│       ├── docker-build.yml
│       └── security-audit.yml
├── .kiro/
│   ├── specs/
│   │   ├── container-fixes/
│   │   ├── frontend-redesign-spectacular/
│   │   ├── ollama-phi3-conversational-chatbot/
│   │   ├── project-audit-and-setup/
│   │   ├── project-refactor-screaming-architecture/
│   │   ├── technovastore-automated-ecommerce/
│   │   └── test-resource-cleanup/
│   └── steering/
│       └── project-guidelines.md
├── .vscode/
│   └── settings.json
├── domains/
│   ├── support/
│   │   ├── chatbot-service/
│   │   └── ticket-service/
│   └── catalog/
│       └── recommender-service/
├── api-gateway/
├── automation/
│   ├── auto-purchase/
│   ├── shipment-tracker/
│   └── sync-engine/
├── docker/
│   └── base/
│       └── Dockerfile.service-base
├── docs/
│   ├── api/
│   │   ├── openapi.yaml
│   │   ├── postman-collection.json
│   │   └── README.md
│   ├── deployment/
│   │   ├── local.md
│   │   └── README.md
│   ├── development/
│   │   ├── README.md
│   │   └── setup.md
│   ├── maintenance/
│   │   └── README.md
│   ├── CONFIGURACION-CONSOLIDADA.md
│   ├── docker-best-practices.md
│   ├── README.md
│   ├── TECHNOVA-ZERO-TRUST.md
│   └── TROUBLESHOOTING-AUTH.md
├── frontend/
├── infrastructure/
│   ├── alertmanager/
│   │   └── alertmanager.yml
│   ├── backup/
│   ├── cache/
│   │   ├── cache-manager.js
│   │   ├── Dockerfile.cache-manager
│   │   ├── redis-cluster.conf
│   │   ├── redis-cluster.yml
│   │   └── redis-sentinel.conf
│   ├── cdn/
│   │   ├── cdn-deployment.yml
│   │   ├── Dockerfile.content-sync
│   │   └── nginx-cdn.conf
│   ├── grafana/
│   │   └── provisioning/
│   ├── kibana/
│   │   └── config/
│   ├── logstash/
│   │   ├── config/
│   │   └── pipeline/
│   ├── mongodb/
│   │   └── init/
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── nginx.prod.conf
│   ├── ollama/
│   │   ├── init-ollama.sh
│   │   └── README.md
│   ├── postgresql/
│   │   └── init/
│   ├── prometheus/
│   │   ├── alert_rules.yml
│   │   ├── prometheus.prod.yml
│   │   └── prometheus.yml
│   └── scaling/
├── scripts/
│   ├── migration/
│   │   ├── analyze-duplications.js
│   │   ├── generate-structure-report.js
│   │   ├── git-backup-utility.js
│   │   ├── prepare-migration.js
│   │   └── README.md
│   ├── analyze-config-duplicates.js
│   ├── analyze-duplicates.js
│   ├── build-optimized.ps1
│   ├── build-optimized.sh
│   ├── cleanup-duplicates.js
│   ├── consolidate-configurations.js
│   ├── create-admin-user.ps1
│   ├── deploy-prod-enhanced.sh
│   ├── deploy-prod.ps1
│   ├── deploy-prod.sh
│   ├── deploy.ps1
│   ├── deploy.sh
│   ├── fix-async-returns.js
│   ├── fix-double-returns.js
│   ├── fix-invoice-controller.js
│   ├── fix-overrides.js
│   ├── health-check.js
│   ├── install-cdn-dependencies.ps1
│   ├── monitor-services.js
│   ├── populate-free-products.js
│   ├── README_POPULATE.md
│   ├── setup-cloudflare-cdn.js
│   ├── setup-logging.ps1
│   ├── setup-logging.sh
│   ├── start-monitoring.cmd
│   └── update-audit-logs.js
├── services/
│   ├── notification/
│   ├── order/
│   ├── payment/
│   ├── product/
│   ├── ticket/
│   ├── user/
│   └── Ciberseguridad.lnk
├── shared/
│   ├── config/
│   ├── middleware/
│   │   ├── errorHandler.d.ts
│   │   ├── errorHandler.d.ts.map
│   │   ├── errorHandler.js
│   │   ├── errorHandler.js.map
│   │   └── errorHandler.ts
│   ├── models/
│   ├── types/
│   └── utils/
├── e2e-tests/
│   ├── integration-tests/
│   │   ├── environment.ts
│   │   ├── jest-global-setup.ts
│   │   ├── jest-global-teardown.ts
│   │   └── jest-setup.ts
│   ├── performance-tests/
│   │   ├── reports/
│   │   ├── benchmark.yml
│   │   ├── artillery-config.js
│   │   ├── critical-apis.yml
│   │   ├── load-test.yml
│   │   ├── performance-monitor.js
│   │   ├── README.md
│   │   ├── run-performance-tests.js
│   │   ├── stress-test.yml
│   │   └── verify-artillery-setup.js
│   ├── migration-verification/
│   │   ├── README.md
│   │   ├── run-all-verifications.js
│   │   ├── verify-docker-services.test.js
│   │   ├── verify-existing-tests.test.js
│   │   └── verify-typescript-compilation.test.js
│   ├── ci-environment.ts
│   ├── jest-global-setup.ts
│   ├── jest-global-teardown.ts
│   ├── README.md
│   └── jest-setup.ts
├── .aiexclude
├── .dockerignore
├── .env.docker
├── .env.docker.example
├── .env.example
├── .env.logging.example
├── .env.prod.example
├── .env.staging.example
├── .eslintrc.js
├── .gitattributes
├── .gitignore
├── .npmrc
├── .prettierignore
├── .prettierrc
├── build-shared.bat
├── clean-git-history.ps1
├── CONTRIBUTING.md
├── DEPLOYMENT-NOTES.md
├── DEPLOYMENT.md
├── docker-compose.dev.yml
├── docker-compose.optimized.yml
├── docker-compose.prod.yml
├── docker-compose.staging.yml
├── docker-compose.yml
├── DONDE_ESTAN_LAS_CREDENCIALES.md
├── DUPLICATION_REPORT.md
├── fix-passwords.sh
├── GUIA_CONEXION_BASES_DATOS.md
├── install-all.ps1
├── install-deps.bat
├── install-deps.sh
├── jest.ci.config.js
├── jest.config.js
├── jest.integration.config.js
├── LOGGING.md
├── Makefile
├── MONITORING.md
├── OAUTH_CONFIGURACION_DOCKER.md
├── OAUTH_IMPLEMENTATION_COMPLETE.md
├── package-lock.json
├── package.json
├── PRODUCTION_DEPLOYMENT.md
├── README.md
├── restart-services.ps1
├── SECURITY_FIX_INSTRUCTIONS.md
├── SECURITY_SETUP.md
├── start-all-services.ps1
├── start-minimal.ps1
├── stop-all.ps1
├── tsconfig.json
├── USUARIO_ADMINISTRADOR.md
├── verify-installation.ps1
└── verify-services.ps1
```

## Microservicios Identificados (19)

### Backend Services (6)

| Servicio | Ruta | Package.json | Dockerfile | Src | Tests |
|----------|------|--------------|------------|-----|-------|
| notification | `services\notification` | ✅ | ✅ | ✅ | ❌ |
| order | `services\order` | ✅ | ✅ | ✅ | ❌ |
| payment | `services\payment` | ✅ | ✅ | ✅ | ❌ |
| product | `services\product` | ✅ | ✅ | ✅ | ❌ |
| ticket | `services\ticket` | ✅ | ✅ | ✅ | ❌ |
| user | `services\user` | ✅ | ✅ | ✅ | ❌ |

### AI Services (2)

| Servicio | Ruta | Package.json | Dockerfile | Src | Tests |
|----------|------|--------------|------------|-----|-------|
| chatbot | `domains\support\chatbot-service` | ✅ | ✅ | ✅ | ❌ |
| recommender | `domains\catalog\recommender-service` | ✅ | ✅ | ✅ | ✅ |

### Automation Services (3)

| Servicio | Ruta | Package.json | Dockerfile | Src | Tests |
|----------|------|--------------|------------|-----|-------|
| auto-purchase | `automation\auto-purchase` | ✅ | ✅ | ✅ | ❌ |
| shipment-tracker | `automation\shipment-tracker` | ✅ | ✅ | ✅ | ❌ |
| sync-engine | `automation\sync-engine` | ✅ | ✅ | ✅ | ❌ |

### Platform Services

| Servicio | Ruta | Package.json | Dockerfile | Src | Tests |
|----------|------|--------------|------------|-----|-------|
| api-gateway | `api-gateway` | ✅ | ✅ | ✅ | ❌ |
| frontend | `frontend` | ✅ | ✅ | ✅ | ❌ |

## Archivos en Raíz del Proyecto (53)

### Archivos de Configuración (22)

- `.aiexclude`
- `.dockerignore`
- `.env.docker`
- `.env.docker.example`
- `.env.example`
- `.env.logging.example`
- `.env.prod.example`
- `.env.staging.example`
- `.eslintrc.js`
- `.gitattributes`
- `.gitignore`
- `.npmrc`
- `.prettierignore`
- `.prettierrc`
- `docker-compose.dev.yml`
- `docker-compose.optimized.yml`
- `docker-compose.prod.yml`
- `docker-compose.staging.yml`
- `docker-compose.yml`
- `package-lock.json`
- `package.json`
- `tsconfig.json`

### Documentación (15)

- `CONTRIBUTING.md`
- `DEPLOYMENT-NOTES.md`
- `DEPLOYMENT.md`
- `DONDE_ESTAN_LAS_CREDENCIALES.md`
- `DUPLICATION_REPORT.md`
- `GUIA_CONEXION_BASES_DATOS.md`
- `LOGGING.md`
- `MONITORING.md`
- `OAUTH_CONFIGURACION_DOCKER.md`
- `OAUTH_IMPLEMENTATION_COMPLETE.md`
- `PRODUCTION_DEPLOYMENT.md`
- `README.md`
- `SECURITY_FIX_INSTRUCTIONS.md`
- `SECURITY_SETUP.md`
- `USUARIO_ADMINISTRADOR.md`

### Scripts (12)

- `build-shared.bat`
- `clean-git-history.ps1`
- `fix-passwords.sh`
- `install-all.ps1`
- `install-deps.bat`
- `install-deps.sh`
- `restart-services.ps1`
- `start-all-services.ps1`
- `start-minimal.ps1`
- `stop-all.ps1`
- `verify-installation.ps1`
- `verify-services.ps1`

### Otros (4)

- `jest.ci.config.js`
- `jest.config.js`
- `jest.integration.config.js`
- `Makefile`

## Análisis de Organización Actual

### Estructura Tecnología-Céntrica

La estructura actual está organizada por **tecnología** en lugar de **dominio de negocio**:

- ❌ `services/` - Agrupa por tipo técnico (microservicio)
- ❌ `ai-services/` - Separación artificial por tecnología (IA)
- ❌ `automation/` - Separación artificial por tipo de proceso
- ❌ Archivos dispersos en raíz (53 archivos)

### Problemas Identificados

1. **No es Screaming Architecture**: La estructura no comunica el dominio del negocio
2. **Archivos en raíz**: 53 archivos (objetivo: ≤5)
3. **Organización técnica**: Servicios agrupados por tecnología, no por dominio
4. **Difícil navegación**: No es claro qué hace el sistema al ver la estructura

### Recomendaciones

1. Reorganizar a estructura basada en dominios de negocio
2. Reducir archivos en raíz a máximo 5 archivos esenciales
3. Consolidar servicios por dominio (catalog, commerce, customer, support, platform)
4. Estandarizar estructura interna de microservicios

