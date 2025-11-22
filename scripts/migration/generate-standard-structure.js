#!/usr/bin/env node

/**
 * Script para generar estructura estándar de microservicio
 * 
 * Uso:
 *   node scripts/migration/generate-standard-structure.js <service-path>
 * 
 * Ejemplo:
 *   node scripts/migration/generate-standard-structure.js domains/catalog/new-service
 */

const fs = require('fs');
const path = require('path');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Estructura de carpetas estándar
const STANDARD_STRUCTURE = {
  'src': {
    'domain': {
      'entities': {},
      'value-objects': {},
      'repositories': {},
      'services': {},
      'events': {}
    },
    'application': {
      'use-cases': {},
      'services': {},
      'dtos': {},
      'mappers': {}
    },
    'infrastructure': {
      'database': {
        'repositories': {},
        'models': {},
        'connection.ts': null
      },
      'http': {},
      'messaging': {},
      'external': {},
      'cache': {}
    },
    'presentation': {
      'controllers': {},
      'routes': {},
      'middleware': {},
      'validators': {},
      'serializers': {}
    },
    'config': {
      'index.ts': null,
      'database.ts': null,
      'redis.ts': null,
      'logger.ts': null
    },
    'shared': {
      'types': {},
      'constants': {},
      'utils': {},
      'errors': {}
    },
    'index.ts': null
  },
  'tests': {
    'unit': {
      'domain': {},
      'application': {},
      'infrastructure': {}
    },
    'integration': {
      'api': {},
      'database': {}
    },
    'e2e': {},
    'fixtures': {},
    'mocks': {},
    'setup.ts': null
  },
  'docs': {
    'README.md': null,
    'API.md': null,
    'ARCHITECTURE.md': null,
    'DEPLOYMENT.md': null
  },
  'scripts': {},
  '.dockerignore': null,
  '.gitignore': null,
  'Dockerfile': null,
  'Dockerfile.prod': null,
  'jest.config.js': null,
  'package.json': null,
  'tsconfig.json': null,
  'README.md': null
};

// Plantillas de archivos
const FILE_TEMPLATES = {
  'src/index.ts': `/**
 * Punto de entrada del servicio
 */

import express from 'express';
import { config } from './config';
import { connectDatabase } from './infrastructure/database/connection';

const app = express();

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: '{{SERVICE_NAME}}' });
});

// TODO: Agregar rutas aquí

async function start() {
  try {
    await connectDatabase();
    
    const port = config.port || 3000;
    app.listen(port, () => {
      console.log(\`{{SERVICE_NAME}} listening on port \${port}\`);
    });
  } catch (error) {
    console.error('Failed to start service:', error);
    process.exit(1);
  }
}

start();
`,

  'src/config/index.ts': `/**
 * Configuración principal del servicio
 */

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceName: '{{SERVICE_NAME}}',
  
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/{{SERVICE_NAME}}',
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  }
};
`,

  'src/infrastructure/database/connection.ts': `/**
 * Configuración de conexión a base de datos
 */

import mongoose from 'mongoose';
import { config } from '../../config';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.database.uri);
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
`,

  'tests/setup.ts': `/**
 * Configuración global de tests
 */

beforeAll(async () => {
  // Setup antes de todos los tests
});

afterAll(async () => {
  // Cleanup después de todos los tests
});

beforeEach(() => {
  // Setup antes de cada test
});

afterEach(() => {
  // Cleanup después de cada test
});
`,

  'jest.config.js': `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@presentation/(.*)$': '<rootDir>/src/presentation/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
`,

  'tsconfig.json': `{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./src",
    "paths": {
      "@domain/*": ["domain/*"],
      "@application/*": ["application/*"],
      "@infrastructure/*": ["infrastructure/*"],
      "@presentation/*": ["presentation/*"],
      "@shared/*": ["shared/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
`,

  'package.json': `{
  "name": "@technovastore/{{SERVICE_NAME}}",
  "version": "1.0.0",
  "description": "{{SERVICE_NAME}} microservice",
  "main": "dist/index.js",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts"
  },
  "dependencies": {
    "express": "^4.18.0",
    "mongoose": "^7.0.0",
    "redis": "^4.6.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.0.0"
  }
}
`,

  'Dockerfile': `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "dev"]
`,

  'Dockerfile.prod': `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
`,

  '.dockerignore': `node_modules
dist
tests
*.test.ts
.git
.gitignore
README.md
`,

  '.gitignore': `node_modules
dist
logs
*.log
.env
.env.local
coverage
`,

  'README.md': `# {{SERVICE_NAME}}

## Descripción

Microservicio de {{SERVICE_NAME}} para TechNovaStore.

## Estructura

Este servicio sigue la estructura estándar de Clean Architecture:

- \`src/domain/\`: Lógica de negocio pura
- \`src/application/\`: Casos de uso
- \`src/infrastructure/\`: Implementaciones técnicas
- \`src/presentation/\`: Controladores y rutas HTTP

## Desarrollo

\`\`\`bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar tests
npm test

# Build para producción
npm run build
\`\`\`

## Docker

\`\`\`bash
# Build imagen
docker build -t {{SERVICE_NAME}} .

# Ejecutar contenedor
docker run -p 3000:3000 {{SERVICE_NAME}}
\`\`\`

## API

Ver [API.md](docs/API.md) para documentación de endpoints.

## Arquitectura

Ver [ARCHITECTURE.md](docs/ARCHITECTURE.md) para detalles de arquitectura.
`,

  'docs/README.md': `# Documentación de {{SERVICE_NAME}}

## Contenido

- [API](API.md): Documentación de endpoints
- [Arquitectura](ARCHITECTURE.md): Diseño y arquitectura del servicio
- [Deployment](DEPLOYMENT.md): Guía de despliegue

## Descripción General

{{SERVICE_NAME}} es un microservicio que forma parte de la plataforma TechNovaStore.

## Responsabilidades

- TODO: Describir responsabilidades del servicio

## Dependencias

- MongoDB: Base de datos principal
- Redis: Cache y mensajería
- Otros servicios: TODO

## Variables de Entorno

\`\`\`
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/{{SERVICE_NAME}}
REDIS_HOST=localhost
REDIS_PORT=6379
\`\`\`
`,

  'docs/API.md': `# API Documentation - {{SERVICE_NAME}}

## Endpoints

### Health Check

\`\`\`
GET /health
\`\`\`

Verifica el estado del servicio.

**Response:**
\`\`\`json
{
  "status": "ok",
  "service": "{{SERVICE_NAME}}"
}
\`\`\`

## TODO

Agregar documentación de endpoints aquí.
`,

  'docs/ARCHITECTURE.md': `# Arquitectura - {{SERVICE_NAME}}

## Visión General

Este servicio sigue los principios de Clean Architecture y Domain-Driven Design.

## Capas

### Domain (Dominio)
Contiene la lógica de negocio pura.

### Application (Aplicación)
Orquesta los casos de uso.

### Infrastructure (Infraestructura)
Implementa detalles técnicos.

### Presentation (Presentación)
Maneja la interfaz HTTP.

## Flujo de Datos

\`\`\`
Request → Controller → Use Case → Domain Service → Repository → Database
                                       ↓
                                   Entity
                                       ↓
Response ← Controller ← DTO ← Mapper ← Entity
\`\`\`

## Decisiones de Diseño

TODO: Documentar decisiones de diseño importantes.
`,

  'docs/DEPLOYMENT.md': `# Deployment Guide - {{SERVICE_NAME}}

## Requisitos

- Node.js 18+
- MongoDB
- Redis
- Docker (opcional)

## Deployment con Docker

\`\`\`bash
# Build imagen de producción
docker build -f Dockerfile.prod -t {{SERVICE_NAME}}:latest .

# Ejecutar contenedor
docker run -d \\
  -p 3000:3000 \\
  -e MONGODB_URI=mongodb://mongo:27017/{{SERVICE_NAME}} \\
  -e REDIS_HOST=redis \\
  --name {{SERVICE_NAME}} \\
  {{SERVICE_NAME}}:latest
\`\`\`

## Deployment Manual

\`\`\`bash
# Instalar dependencias
npm ci --only=production

# Build
npm run build

# Ejecutar
npm start
\`\`\`

## Variables de Entorno

Ver [README.md](README.md) para lista completa de variables.

## Monitoreo

- Health check: \`GET /health\`
- Métricas: TODO
- Logs: TODO
`
};

/**
 * Crea la estructura de carpetas recursivamente
 */
function createStructure(basePath, structure) {
  for (const [name, content] of Object.entries(structure)) {
    const fullPath = path.join(basePath, name);
    
    if (content === null) {
      // Es un archivo (marcador)
      continue;
    } else if (typeof content === 'object') {
      // Es una carpeta
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        log(`  ✓ Created directory: ${fullPath}`, 'green');
      }
      createStructure(fullPath, content);
    }
  }
}

/**
 * Crea archivos desde plantillas
 */
function createFiles(basePath, serviceName) {
  for (const [filePath, template] of Object.entries(FILE_TEMPLATES)) {
    const fullPath = path.join(basePath, filePath);
    const dir = path.dirname(fullPath);
    
    // Crear directorio si no existe
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Reemplazar placeholders
    const content = template.replace(/\{\{SERVICE_NAME\}\}/g, serviceName);
    
    // Crear archivo
    fs.writeFileSync(fullPath, content, 'utf8');
    log(`  ✓ Created file: ${fullPath}`, 'blue');
  }
}

/**
 * Función principal
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    log('Error: Service path is required', 'red');
    log('Usage: node generate-standard-structure.js <service-path>', 'yellow');
    log('Example: node generate-standard-structure.js domains/catalog/new-service', 'yellow');
    process.exit(1);
  }
  
  const servicePath = args[0];
  const serviceName = path.basename(servicePath);
  const fullPath = path.resolve(servicePath);
  
  log(`\nGenerating standard structure for: ${serviceName}`, 'blue');
  log(`Path: ${fullPath}\n`, 'blue');
  
  // Verificar si el directorio ya existe
  if (fs.existsSync(fullPath)) {
    log(`Warning: Directory ${fullPath} already exists`, 'yellow');
    log('Files will be created only if they don\'t exist\n', 'yellow');
  }
  
  try {
    // Crear estructura de carpetas
    log('Creating directory structure...', 'blue');
    createStructure(fullPath, STANDARD_STRUCTURE);
    
    // Crear archivos desde plantillas
    log('\nCreating files from templates...', 'blue');
    createFiles(fullPath, serviceName);
    
    log('\n✓ Standard structure generated successfully!', 'green');
    log('\nNext steps:', 'yellow');
    log('  1. cd ' + servicePath, 'yellow');
    log('  2. npm install', 'yellow');
    log('  3. Update package.json with correct dependencies', 'yellow');
    log('  4. Implement your domain logic', 'yellow');
    log('  5. Run tests: npm test', 'yellow');
    
  } catch (error) {
    log(`\nError: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Ejecutar
main();
