# Despliegue Local - TechNovaStore

Esta guía te ayudará a configurar y ejecutar TechNovaStore en tu entorno de desarrollo local.

## Prerrequisitos

### Software Requerido

- **Node.js**: v18.0.0 o superior
- **npm**: v8.0.0 o superior
- **Docker**: v20.0.0 o superior
- **Docker Compose**: v2.0.0 o superior
- **Git**: Para clonar el repositorio

### Verificar Instalaciones

```bash
# Verificar Node.js
node --version

# Verificar npm
npm --version

# Verificar Docker
docker --version

# Verificar Docker Compose
docker-compose --version

# Verificar Git
git --version
```

## Instalación Paso a Paso

### 1. Clonar el Repositorio

```bash
git clone https://github.com/technovastore/technovastore.git
cd technovastore
```

### 2. Configurar Variables de Entorno

```bash
# Copiar archivos de ejemplo
cp .env.example .env
cp api-gateway/.env.security.example api-gateway/.env.security
cp frontend/.env.local.example frontend/.env.local

# Editar variables según tu entorno
nano .env
```

#### Variables de Entorno Principales

```bash
# .env
NODE_ENV=development
API_URL=http://localhost:3000

# Base de datos
DATABASE_URL=postgresql://technovastore:password123@localhost:5432/technovastore
MONGODB_URI=mongodb://technovastore:password123@localhost:27017/technovastore
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=REDACTED_JWT_SECRET-for-development
JWT_REFRESH_SECRET=your-super-secret-refresh-key-for-development

# Logging
LOG_LEVEL=debug
ENABLE_SWAGGER=true

# Servicios externos (opcional para desarrollo)
AMAZON_API_KEY=your-amazon-api-key
ALIEXPRESS_API_KEY=your-aliexpress-api-key
```

### 3. Instalar Dependencias

#### Opción A: Script Automático (Recomendado)

```bash
# Windows
.\install-deps.bat

# Linux/macOS
chmod +x install-deps.sh
./install-deps.sh
```

#### Opción B: Instalación Manual

```bash
# Instalar dependencias del proyecto raíz
npm install

# Instalar dependencias de cada servicio
cd api-gateway && npm install && cd ..
cd services/product && npm install && cd ../..
cd services/user && npm install && cd ../..
cd services/order && npm install && cd ../..
cd services/payment && npm install && cd ../..
cd services/notification && npm install && cd ../..
cd frontend && npm install && cd ..

# Instalar dependencias de automatización
cd automation/sync-engine && npm install && cd ../..
cd automation/auto-purchase && npm install && cd ../..
cd automation/shipment-tracker && npm install && cd ../..
```

### 4. Configurar Bases de Datos

#### Iniciar Contenedores de Base de Datos

```bash
# Iniciar solo las bases de datos
docker-compose up -d mongodb postgresql redis
```

#### Configurar PostgreSQL

```bash
# Esperar a que PostgreSQL esté listo
sleep 10

# Conectar y configurar
docker exec -it technovastore-postgresql-1 psql -U postgres -c "
CREATE DATABASE technovastore;
CREATE USER technovastore WITH PASSWORD 'password123';
GRANT ALL PRIVILEGES ON DATABASE technovastore TO technovastore;
"
```

#### Configurar MongoDB

```bash
# Conectar y configurar
docker exec -it technovastore-mongodb-1 mongosh --eval "
use technovastore;
db.createUser({
  user: 'technovastore',
  pwd: 'password123',
  roles: ['readWrite']
});
"
```

#### Ejecutar Migraciones

```bash
# Migraciones de PostgreSQL
npm run migrate:postgres

# Seed data inicial (opcional)
npm run seed:dev
```

### 5. Iniciar Servicios

#### Opción A: Todos los Servicios con Docker

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f
```

#### Opción B: Desarrollo con Hot Reload

```bash
# Terminal 1: Bases de datos
docker-compose up -d mongodb postgresql redis

# Terminal 2: API Gateway
cd api-gateway
npm run dev

# Terminal 3: Product Service
cd services/product
npm run dev

# Terminal 4: User Service
cd services/user
npm run dev

# Terminal 5: Order Service
cd services/order
npm run dev

# Terminal 6: Frontend
cd frontend
npm run dev
```

#### Opción C: Script de Desarrollo

```bash
# Iniciar todos los servicios en modo desarrollo
npm run dev:all
```

### 6. Verificar Instalación

```bash
# Ejecutar script de verificación
# Windows
.\verify-installation.bat

# Linux/macOS
chmod +x verify-installation.sh
./verify-installation.sh
```

#### Verificación Manual

```bash
# Health check del API Gateway
curl http://localhost:3000/health

# Verificar productos
curl http://localhost:3000/api/products

# Verificar documentación Swagger
curl http://localhost:3000/api-docs
```

## Servicios Disponibles

Una vez iniciado correctamente, tendrás acceso a:

### Aplicación Principal
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:3000/api
- **Swagger Docs**: http://localhost:3000/api-docs

### Microservicios
- **Product Service**: http://localhost:3001
- **User Service**: http://localhost:3002
- **Order Service**: http://localhost:3003
- **Payment Service**: http://localhost:3004
- **Notification Service**: http://localhost:3005

### Bases de Datos
- **PostgreSQL**: localhost:5432
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

### Herramientas de Desarrollo
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Kibana**: http://localhost:5601

## Configuración de Desarrollo

### VS Code

#### Extensiones Recomendadas

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-jest",
    "ms-vscode-remote.remote-containers"
  ]
}
```

#### Configuración del Workspace

```json
{
  "folders": [
    { "path": "./api-gateway" },
    { "path": "./services/product" },
    { "path": "./services/user" },
    { "path": "./services/order" },
    { "path": "./frontend" }
  ],
  "settings": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "typescript.preferences.importModuleSpecifier": "relative"
  }
}
```

### Debugging

#### Debug API Gateway

```json
{
  "name": "Debug API Gateway",
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/api-gateway/src/index.ts",
  "runtimeArgs": ["-r", "ts-node/register"],
  "env": {
    "NODE_ENV": "development"
  }
}
```

## Datos de Prueba

### Crear Usuario de Prueba

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Crear Producto de Prueba

```bash
# Primero obtener token CSRF
CSRF_TOKEN=$(curl -s http://localhost:3000/api/csrf-token | jq -r '.csrfToken')

# Crear producto (requiere token de admin)
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -d '{
    "sku": "TEST-001",
    "name": "Producto de Prueba",
    "description": "Descripción del producto de prueba",
    "category": "electronics",
    "brand": "Test Brand",
    "price": 99.99,
    "stock": 10
  }'
```

## Troubleshooting

### Problemas Comunes

#### Puerto ya en uso

```bash
# Verificar qué proceso usa el puerto
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Linux/macOS

# Matar proceso
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                 # Linux/macOS
```

#### Docker no inicia

```bash
# Verificar estado de Docker
docker info

# Reiniciar Docker
# Windows: Reiniciar Docker Desktop
# Linux: sudo systemctl restart docker
```

#### Base de datos no conecta

```bash
# Verificar contenedores
docker-compose ps

# Ver logs de base de datos
docker-compose logs postgresql
docker-compose logs mongodb

# Reiniciar contenedores
docker-compose restart postgresql mongodb
```

#### Dependencias no se instalan

```bash
# Limpiar cache de npm
npm cache clean --force

# Eliminar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Logs de Desarrollo

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f api-gateway

# Ver logs en tiempo real
tail -f logs/combined.log
```

### Reset Completo

```bash
# Parar todos los servicios
docker-compose down

# Eliminar volúmenes (CUIDADO: elimina datos)
docker-compose down -v

# Limpiar sistema Docker
docker system prune -f

# Reiniciar desde cero
docker-compose up -d
```

## Scripts Útiles

### package.json Scripts

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:api\" \"npm run dev:services\" \"npm run dev:frontend\"",
    "dev:api": "cd api-gateway && npm run dev",
    "dev:services": "concurrently \"cd services/product && npm run dev\" \"cd services/user && npm run dev\"",
    "dev:frontend": "cd frontend && npm run dev",
    "build": "npm run build:api && npm run build:services && npm run build:frontend",
    "test": "npm run test:api && npm run test:services",
    "migrate": "npm run migrate:postgres",
    "seed": "npm run seed:dev"
  }
}
```

### Scripts de Utilidad

```bash
# scripts/dev-setup.sh
#!/bin/bash
echo "Setting up development environment..."

# Start databases
docker-compose up -d mongodb postgresql redis

# Wait for databases
sleep 10

# Run migrations
npm run migrate

# Start services
npm run dev
```

## Próximos Pasos

1. **Explorar la API**: Visita http://localhost:3000/api-docs
2. **Probar el Frontend**: Abre http://localhost:3000
3. **Revisar Logs**: Monitorea los logs para entender el flujo
4. **Hacer Cambios**: Modifica código y ve los cambios en tiempo real
5. **Ejecutar Tests**: `npm test` para verificar funcionalidad

## Soporte

Si encuentras problemas:

1. Revisa los [logs de troubleshooting](../maintenance/troubleshooting.md)
2. Consulta la [documentación completa](../README.md)
3. Abre un [issue en GitHub](https://github.com/technovastore/issues)