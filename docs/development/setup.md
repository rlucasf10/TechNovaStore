# Configuración del Entorno de Desarrollo - TechNovaStore

Esta guía te ayudará a configurar un entorno de desarrollo completo para TechNovaStore, optimizado para productividad y debugging.

## Prerrequisitos del Sistema

### Software Base

- **Node.js**: v18.0.0 o superior (recomendado v18.17.0)
- **npm**: v8.0.0 o superior
- **Git**: v2.30.0 o superior
- **Docker**: v20.0.0 o superior
- **Docker Compose**: v2.0.0 o superior

### Herramientas Recomendadas

- **VS Code**: Editor principal recomendado
- **Postman**: Para testing de APIs
- **MongoDB Compass**: GUI para MongoDB
- **pgAdmin**: GUI para PostgreSQL
- **Redis Commander**: GUI para Redis

## Configuración del Editor

### Visual Studio Code

#### Extensiones Esenciales

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-jest",
    "ms-vscode-remote.remote-containers",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode.vscode-docker",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-thunder-client"
  ]
}
```

#### Configuración del Workspace

```json
{
  "folders": [
    {
      "name": "🚪 API Gateway",
      "path": "./api-gateway"
    },
    {
      "name": "📦 Product Service",
      "path": "./services/product"
    },
    {
      "name": "👤 User Service",
      "path": "./domains/customer/user-service"
    },
    {
      "name": "🛒 Order Service",
      "path": "./domains/commerce/order-service"
    },
    {
      "name": "💳 Payment Service",
      "path": "./services/payment"
    },
    {
      "name": "📧 Notification Service",
      "path": "./domains/customer/notification-service"
    },
    {
      "name": "🎨 Frontend",
      "path": "./frontend"
    },
    {
      "name": "🤖 Automation",
      "path": "./automation"
    },
    {
      "name": "📚 Documentation",
      "path": "./docs"
    }
  ],
  "settings": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true,
      "source.organizeImports": true
    },
    "typescript.preferences.importModuleSpecifier": "relative",
    "typescript.suggest.autoImports": true,
    "javascript.suggest.autoImports": true,
    "eslint.workingDirectories": [
      "api-gateway",
      "services/product",
      "domains/customer/user-service",
      "domains/commerce/order-service",
      "services/payment",
      "domains/customer/notification-service",
      "frontend",
      "domains/catalog/sync-engine",
      "domains/commerce/auto-purchase-service",
      "domains/support/shipment-tracker"
    ],
    "files.exclude": {
      "**/node_modules": true,
      "**/dist": true,
      "**/.next": true,
      "**/coverage": true
    },
    "search.exclude": {
      "**/node_modules": true,
      "**/dist": true,
      "**/.next": true,
      "**/coverage": true,
      "**/logs": true
    },
    "typescript.preferences.includePackageJsonAutoImports": "auto",
    "emmet.includeLanguages": {
      "typescript": "html",
      "javascript": "html"
    }
  },
  "extensions": {
    "recommendations": [
      "ms-vscode.vscode-typescript-next",
      "esbenp.prettier-vscode",
      "ms-vscode.vscode-eslint",
      "bradlc.vscode-tailwindcss",
      "ms-vscode.vscode-jest"
    ]
  }
}
```

#### Configuración de Debug

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "🚪 Debug API Gateway",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/api-gateway/src/index.ts",
      "outFiles": ["${workspaceFolder}/api-gateway/dist/**/*.js"],
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development",
        "LOG_LEVEL": "debug"
      },
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "sourceMaps": true,
      "restart": true,
      "protocol": "inspector"
    },
    {
      "name": "📦 Debug Product Service",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/services/product/src/index.ts",
      "outFiles": ["${workspaceFolder}/services/product/dist/**/*.js"],
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development",
        "PORT": "3001",
        "LOG_LEVEL": "debug"
      },
      "console": "integratedTerminal"
    },
    {
      "name": "👤 Debug User Service",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/domains/customer/user-service/src/index.ts",
      "outFiles": ["${workspaceFolder}/domains/customer/user-service/dist/**/*.js"],
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development",
        "PORT": "3002",
        "LOG_LEVEL": "debug"
      },
      "console": "integratedTerminal"
    },
    {
      "name": "🛒 Debug Order Service",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/domains/commerce/order-service/src/index.ts",
      "outFiles": ["${workspaceFolder}/domains/commerce/order-service/dist/**/*.js"],
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development",
        "PORT": "3003",
        "LOG_LEVEL": "debug"
      },
      "console": "integratedTerminal"
    },
    {
      "name": "🎨 Debug Next.js Frontend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/frontend/node_modules/.bin/next",
      "args": ["dev"],
      "cwd": "${workspaceFolder}/frontend",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal"
    },
    {
      "name": "🧪 Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache", "--no-coverage"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ],
  "compounds": [
    {
      "name": "🚀 Debug All Services",
      "configurations": [
        "🚪 Debug API Gateway",
        "📦 Debug Product Service",
        "👤 Debug User Service",
        "🛒 Debug Order Service"
      ]
    }
  ]
}
```

#### Snippets Personalizados

```json
{
  "Express Route Handler": {
    "prefix": "route",
    "body": [
      "export const ${1:handlerName} = async (",
      "  req: Request,",
      "  res: Response,",
      "  next: NextFunction",
      "): Promise<void> => {",
      "  try {",
      "    ${2:// Implementation}",
      "    ",
      "    res.json({",
      "      success: true,",
      "      data: ${3:result}",
      "    });",
      "  } catch (error) {",
      "    next(error);",
      "  }",
      "};"
    ],
    "description": "Express route handler with error handling"
  },
  "Service Method": {
    "prefix": "service",
    "body": [
      "public async ${1:methodName}(${2:params}): Promise<${3:ReturnType}> {",
      "  this.logger.info('${1:methodName} called', { ${4:logData} });",
      "  ",
      "  try {",
      "    ${5:// Implementation}",
      "    ",
      "    this.logger.info('${1:methodName} completed successfully');",
      "    return ${6:result};",
      "  } catch (error) {",
      "    this.logger.error('${1:methodName} failed', { error: error.message });",
      "    throw error;",
      "  }",
      "}"
    ],
    "description": "Service method with logging"
  },
  "Jest Test Suite": {
    "prefix": "describe",
    "body": [
      "describe('${1:TestSuite}', () => {",
      "  let ${2:service}: ${3:ServiceType};",
      "  let ${4:mockDependency}: jest.Mocked<${5:DependencyType}>;",
      "  ",
      "  beforeEach(() => {",
      "    ${4:mockDependency} = {",
      "      ${6:method}: jest.fn(),",
      "    };",
      "    ",
      "    ${2:service} = new ${3:ServiceType}(${4:mockDependency});",
      "  });",
      "  ",
      "  describe('${7:methodName}', () => {",
      "    it('should ${8:expectedBehavior}', async () => {",
      "      // Arrange",
      "      ${9:// Setup}",
      "      ",
      "      // Act",
      "      ${10:// Execute}",
      "      ",
      "      // Assert",
      "      ${11:// Verify}",
      "    });",
      "  });",
      "});"
    ],
    "description": "Jest test suite template"
  }
}
```

### Configuración de Git

#### .gitconfig Global

```ini
[user]
    name = Tu Nombre
    email = tu.email@example.com

[core]
    editor = code --wait
    autocrlf = input
    ignorecase = false

[push]
    default = current

[pull]
    rebase = true

[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    ca = commit -a
    cm = commit -m
    cam = commit -am
    unstage = reset HEAD --
    last = log -1 HEAD
    visual = !gitk
    tree = log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit
    
[diff]
    tool = vscode

[difftool "vscode"]
    cmd = code --wait --diff $LOCAL $REMOTE

[merge]
    tool = vscode

[mergetool "vscode"]
    cmd = code --wait $MERGED
```

#### Hooks de Git

```bash
#!/bin/sh
# .git/hooks/pre-commit

echo "Running pre-commit checks..."

# Run linting
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ Linting failed. Please fix the issues before committing."
  exit 1
fi

# Run type checking
npm run type-check
if [ $? -ne 0 ]; then
  echo "❌ Type checking failed. Please fix the issues before committing."
  exit 1
fi

# Run tests
npm run test:quick
if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Please fix the issues before committing."
  exit 1
fi

echo "✅ All pre-commit checks passed!"
```

## Configuración de Base de Datos

### PostgreSQL para Desarrollo

#### Configuración Local

```sql
-- Crear usuario y base de datos para desarrollo
CREATE USER technovastore_dev WITH PASSWORD 'dev_password_123';
CREATE DATABASE technovastore_dev OWNER technovastore_dev;

-- Otorgar permisos
GRANT ALL PRIVILEGES ON DATABASE technovastore_dev TO technovastore_dev;

-- Configurar extensiones útiles
\c technovastore_dev
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

#### pgAdmin Configuration

```json
{
  "Servers": {
    "1": {
      "Name": "TechNovaStore Dev",
      "Group": "Development",
      "Host": "localhost",
      "Port": 5432,
      "MaintenanceDB": "postgres",
      "Username": "technovastore_dev",
      "Password": "dev_password_123"
    }
  }
}
```

### MongoDB para Desarrollo

#### Configuración Local

```javascript
// Conectar a MongoDB
use technovastore_dev;

// Crear usuario
db.createUser({
  user: "technovastore_dev",
  pwd: "dev_password_123",
  roles: [
    { role: "readWrite", db: "technovastore_dev" },
    { role: "dbAdmin", db: "technovastore_dev" }
  ]
});

// Crear índices útiles para desarrollo
db.products.createIndex({ "name": "text", "description": "text" });
db.products.createIndex({ "category": 1, "price": 1 });
db.products.createIndex({ "sku": 1 }, { unique: true });
```

#### MongoDB Compass

```json
{
  "connectionString": "mongodb://technovastore_dev:dev_password_123@localhost:27017/technovastore_dev"
}
```

## Variables de Entorno de Desarrollo

### .env.development

```bash
# Entorno
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_SWAGGER=true

# URLs de servicios
API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Base de datos
DATABASE_URL=postgresql://technovastore_dev:dev_password_123@localhost:5432/technovastore_dev
MONGODB_URI=mongodb://technovastore_dev:dev_password_123@localhost:27017/technovastore_dev
REDIS_URL=redis://localhost:6379/0

# JWT (usar claves diferentes en producción)
JWT_SECRET=dev-jwt-secret-key-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-key-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Seguridad (relajada para desarrollo)
BCRYPT_ROUNDS=4
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000

# APIs externas (usar keys de desarrollo/sandbox)
AMAZON_API_KEY=dev-amazon-key
AMAZON_API_SECRET=dev-amazon-secret
ALIEXPRESS_API_KEY=dev-aliexpress-key
EBAY_API_KEY=dev-ebay-key

# Email (usar servicio de desarrollo como Mailtrap)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASS=your-mailtrap-pass
FROM_EMAIL=noreply@technovastore.local

# Monitoreo
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true
ELASTICSEARCH_URL=http://localhost:9200

# Desarrollo específico
HOT_RELOAD=true
WATCH_FILES=true
DEBUG_SQL=true
DEBUG_MONGODB=true
```

## Scripts de Desarrollo

### package.json Scripts

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:db\" \"npm run dev:services\" \"npm run dev:frontend\"",
    "dev:db": "docker-compose up -d mongodb postgresql redis",
    "dev:services": "concurrently \"npm run dev:api\" \"npm run dev:product\" \"npm run dev:user\" \"npm run dev:order\"",
    "dev:api": "cd api-gateway && npm run dev",
    "dev:product": "cd domains/catalog/product-service && npm run dev",
    "dev:user": "cd domains/customer/user-service && npm run dev",
    "dev:order": "cd domains/commerce/order-service && npm run dev",
    "dev:payment": "cd services/payment && npm run dev",
    "dev:notification": "cd domains/customer/notification-service && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:automation": "concurrently \"npm run dev:sync\" \"npm run dev:purchase\" \"npm run dev:tracker\"",
    "dev:sync": "cd domains/catalog/sync-engine && npm run dev",
    "dev:purchase": "cd domains/commerce/auto-purchase-service && npm run dev",
    "dev:tracker": "cd domains/support/shipment-tracker && npm run dev",
    
    "build": "npm run build:shared && npm run build:services && npm run build:frontend",
    "build:shared": "cd shared && npm run build",
    "build:services": "concurrently \"npm run build:api\" \"npm run build:product\" \"npm run build:user\" \"npm run build:order\"",
    "build:api": "cd api-gateway && npm run build",
    "build:product": "cd domains/catalog/product-service && npm run build",
    "build:user": "cd domains/customer/user-service && npm run build",
    "build:order": "cd services/order && npm run build",
    "build:frontend": "cd frontend && npm run build",
    
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "jest --config jest.config.js",
    "test:integration": "jest --config jest.integration.config.js",
    "test:e2e": "cd frontend && npm run test:e2e",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:quick": "jest --passWithNoTests --silent",
    
    "lint": "npm run lint:api && npm run lint:services && npm run lint:frontend",
    "lint:api": "cd api-gateway && npm run lint",
    "lint:services": "concurrently \"cd domains/catalog/product-service && npm run lint\" \"cd domains/customer/user-service && npm run lint\"",
    "lint:frontend": "cd frontend && npm run lint",
    "lint:fix": "npm run lint -- --fix",
    
    "type-check": "npm run type-check:api && npm run type-check:services",
    "type-check:api": "cd api-gateway && npm run type-check",
    "type-check:services": "concurrently \"cd domains/catalog/product-service && npm run type-check\" \"cd domains/customer/user-service && npm run type-check\"",
    
    "migrate": "npm run migrate:postgres",
    "migrate:postgres": "cd domains/customer/user-service && npm run migrate",
    "migrate:rollback": "cd domains/customer/user-service && npm run migrate:rollback",
    "seed": "npm run seed:dev",
    "seed:dev": "node scripts/seed-dev-data.js",
    
    "clean": "npm run clean:dist && npm run clean:logs && npm run clean:coverage",
    "clean:dist": "find . -name 'dist' -type d -exec rm -rf {} +",
    "clean:logs": "find . -name 'logs' -type d -exec rm -rf {} +",
    "clean:coverage": "find . -name 'coverage' -type d -exec rm -rf {} +",
    "clean:node_modules": "find . -name 'node_modules' -type d -exec rm -rf {} +",
    
    "docker:dev": "docker-compose -f docker-compose.dev.yml up -d",
    "docker:logs": "docker-compose logs -f",
    "docker:clean": "docker-compose down -v && docker system prune -f",
    
    "setup": "npm run install:all && npm run migrate && npm run seed",
    "install:all": "npm install && npm run install:services && npm run install:frontend",
    "install:services": "concurrently \"cd api-gateway && npm install\" \"cd domains/catalog/product-service && npm install\" \"cd domains/customer/user-service && npm install\"",
    "install:frontend": "cd frontend && npm install",
    
    "health": "node scripts/health-check.js",
    "logs": "tail -f logs/combined.log",
    "monitor": "node scripts/monitor-services.js"
  }
}
```

### Scripts de Utilidad

#### scripts/dev-setup.js

```javascript
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up TechNovaStore development environment...\n');

// Check prerequisites
console.log('1. Checking prerequisites...');
try {
  execSync('node --version', { stdio: 'pipe' });
  execSync('docker --version', { stdio: 'pipe' });
  execSync('docker-compose --version', { stdio: 'pipe' });
  console.log('✅ Prerequisites check passed\n');
} catch (error) {
  console.error('❌ Prerequisites check failed:', error.message);
  process.exit(1);
}

// Copy environment files
console.log('2. Setting up environment files...');
const envFiles = [
  { src: '.env.example', dest: '.env' },
  { src: 'api-gateway/.env.security.example', dest: 'api-gateway/.env.security' },
  { src: 'frontend/.env.local.example', dest: 'frontend/.env.local' }
];

envFiles.forEach(({ src, dest }) => {
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
    console.log(`✅ Created ${dest}`);
  } else {
    console.log(`⚠️  ${dest} already exists, skipping`);
  }
});

// Install dependencies
console.log('\n3. Installing dependencies...');
try {
  execSync('npm run install:all', { stdio: 'inherit' });
  console.log('✅ Dependencies installed\n');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Start databases
console.log('4. Starting databases...');
try {
  execSync('npm run dev:db', { stdio: 'inherit' });
  console.log('✅ Databases started\n');
} catch (error) {
  console.error('❌ Failed to start databases:', error.message);
  process.exit(1);
}

// Wait for databases
console.log('5. Waiting for databases to be ready...');
setTimeout(() => {
  // Run migrations
  console.log('6. Running migrations...');
  try {
    execSync('npm run migrate', { stdio: 'inherit' });
    console.log('✅ Migrations completed\n');
  } catch (error) {
    console.error('❌ Migrations failed:', error.message);
  }

  // Seed development data
  console.log('7. Seeding development data...');
  try {
    execSync('npm run seed', { stdio: 'inherit' });
    console.log('✅ Development data seeded\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  }

  console.log('🎉 Development environment setup complete!');
  console.log('\nNext steps:');
  console.log('1. Run "npm run dev" to start all services');
  console.log('2. Open http://localhost:3000 in your browser');
  console.log('3. Check API docs at http://localhost:3000/api-docs');
}, 10000);
```

#### scripts/health-check.js

```javascript
#!/usr/bin/env node

const axios = require('axios');

const services = [
  { name: 'API Gateway', url: 'http://localhost:3000/health' },
  { name: 'Product Service', url: 'http://localhost:3001/health' },
  { name: 'User Service', url: 'http://localhost:3002/health' },
  { name: 'Order Service', url: 'http://localhost:3003/health' },
  { name: 'Payment Service', url: 'http://localhost:3004/health' },
  { name: 'Notification Service', url: 'http://localhost:3005/health' }
];

async function checkHealth() {
  console.log('🏥 Health Check Report\n');
  
  for (const service of services) {
    try {
      const response = await axios.get(service.url, { timeout: 5000 });
      const status = response.status === 200 ? '✅' : '⚠️';
      console.log(`${status} ${service.name}: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${service.name}: ${error.message}`);
    }
  }
}

checkHealth();
```

## Herramientas de Testing

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/**/*.interface.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/e2e-tests/jest-setup.ts'],
  testTimeout: 10000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
```

### Testing Utilities

```typescript
// tests/helpers/testUtils.ts
import { Request, Response } from 'express';
import { createRequest, createResponse } from 'node-mocks-http';

export const createMockRequest = (options: any = {}): Request => {
  return createRequest({
    method: 'GET',
    url: '/',
    headers: {
      'content-type': 'application/json',
    },
    ...options,
  });
};

export const createMockResponse = (): Response => {
  return createResponse();
};

export const createMockNext = () => jest.fn();

export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};
```

## Monitoreo de Desarrollo

### Configuración de Prometheus para Dev

```yaml
# prometheus.dev.yml
global:
  scrape_interval: 5s
  evaluation_interval: 5s

scrape_configs:
  - job_name: 'technovastore-dev'
    static_configs:
      - targets: 
        - 'localhost:3000'
        - 'localhost:3001'
        - 'localhost:3002'
        - 'localhost:3003'
    metrics_path: '/metrics'
    scrape_interval: 5s
```

### Dashboard de Desarrollo

```javascript
// scripts/dev-dashboard.js
const express = require('express');
const app = express();

app.get('/dev-status', async (req, res) => {
  const services = [
    'http://localhost:3000/health',
    'http://localhost:3001/health',
    'http://localhost:3002/health',
    'http://localhost:3003/health'
  ];

  const status = await Promise.allSettled(
    services.map(url => fetch(url))
  );

  res.json({
    timestamp: new Date().toISOString(),
    services: status.map((result, index) => ({
      url: services[index],
      status: result.status === 'fulfilled' ? 'healthy' : 'unhealthy'
    }))
  });
});

app.listen(8080, () => {
  console.log('Dev dashboard running on http://localhost:8080');
});
```

## Próximos Pasos

1. **Configurar tu editor** con las extensiones y configuraciones recomendadas
2. **Ejecutar el setup** con `node scripts/dev-setup.js`
3. **Familiarizarte con los scripts** disponibles en package.json
4. **Configurar debugging** para tu flujo de trabajo
5. **Explorar la documentación** de cada servicio

## Soporte

Si tienes problemas con la configuración:

1. Revisa los [logs de troubleshooting](../maintenance/troubleshooting.md)
2. Consulta la [guía de despliegue local](../deployment/local.md)
3. Abre un [issue en GitHub](https://github.com/technovastore/issues)