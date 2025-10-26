# Guías de Despliegue - TechNovaStore

Esta sección contiene todas las guías necesarias para desplegar TechNovaStore en diferentes entornos, desde desarrollo local hasta producción.

## Índice

- [Despliegue Local](#despliegue-local)
- [Despliegue en Staging](#despliegue-en-staging)
- [Despliegue en Producción](#despliegue-en-producción)
- [CI/CD Pipeline](#cicd-pipeline)
- [Configuración de Entornos](#configuración-de-entornos)
- [Monitoreo y Logging](#monitoreo-y-logging)

## Despliegue Local

### Prerrequisitos

- **Node.js**: v18.0.0 o superior
- **Docker**: v20.0.0 o superior
- **Docker Compose**: v2.0.0 o superior
- **Git**: Para clonar el repositorio

### Instalación Rápida

1. **Clonar el repositorio**

```bash
git clone https://github.com/technovastore/technovastore.git
cd technovastore
```

2. **Instalar dependencias**

```bash
# Windows
.\install-deps.bat

# Linux/macOS
chmod +x install-deps.sh
./install-deps.sh
```

3. **Configurar variables de entorno**

```bash
# Copiar archivos de ejemplo
cp .env.example .env
cp api-gateway/.env.security.example api-gateway/.env.security
cp frontend/.env.local.example frontend/.env.local
```

4. **Iniciar servicios con Docker**

```bash
docker-compose up -d
```

5. **Verificar instalación**

```bash
# Windows
.\verify-installation.bat

# Linux/macOS
chmod +x verify-installation.sh
./verify-installation.sh
```

### Servicios Disponibles

Una vez iniciado, los siguientes servicios estarán disponibles:

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:3000/api
- **Product Service**: http://localhost:3001
- **User Service**: http://localhost:3002
- **Order Service**: http://localhost:3003
- **Payment Service**: http://localhost:3004
- **Notification Service**: http://localhost:3005
- **MongoDB**: localhost:27017
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090

### Configuración de Base de Datos

#### MongoDB

```bash
# Conectar a MongoDB
docker exec -it technovastore-mongodb-1 mongosh

# Crear base de datos y usuario
use technovastore
db.createUser({
  user: "technovastore",
  pwd: "password123",
  roles: ["readWrite"]
})
```

#### PostgreSQL

```bash
# Conectar a PostgreSQL
docker exec -it technovastore-postgresql-1 psql -U postgres

# Crear base de datos y usuario
CREATE DATABASE technovastore;
CREATE USER technovastore WITH PASSWORD 'password123';
GRANT ALL PRIVILEGES ON DATABASE technovastore TO technovastore;
```

### Desarrollo con Hot Reload

Para desarrollo con recarga automática:

```bash
# Iniciar solo las bases de datos
docker-compose up -d mongodb postgresql redis

# Iniciar servicios en modo desarrollo
npm run dev:all

# O iniciar servicios individualmente
cd api-gateway && npm run dev
cd services/product && npm run dev
cd services/user && npm run dev
cd frontend && npm run dev
```

## Despliegue en Staging

### Configuración del Entorno

1. **Configurar variables de entorno**

```bash
cp .env.staging.example .env.staging
```

2. **Configurar secretos**

```bash
# Generar claves JWT
openssl rand -base64 32 > jwt-secret.key

# Configurar certificados SSL
mkdir -p ssl/staging
# Copiar certificados SSL a ssl/staging/
```

3. **Desplegar con Docker Compose**

```bash
docker-compose -f docker-compose.staging.yml up -d
```

### Configuración de Nginx

```nginx
# /etc/nginx/sites-available/technovastore-staging
server {
    listen 80;
    server_name staging.technovastore.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name staging.technovastore.com;

    ssl_certificate /path/to/ssl/staging/cert.pem;
    ssl_certificate_key /path/to/ssl/staging/key.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }
}
```

### Health Checks

```bash
# Script de health check para staging
#!/bin/bash
STAGING_URL="https://staging.technovastore.com"

echo "Checking staging health..."
curl -f "$STAGING_URL/health" || exit 1

echo "Checking API endpoints..."
curl -f "$STAGING_URL/api/products" || exit 1

echo "Staging deployment successful!"
```

## Despliegue en Producción

### Arquitectura de Producción

```
Internet
    ↓
Load Balancer (Nginx)
    ↓
API Gateway (Multiple instances)
    ↓
Microservices (Auto-scaled)
    ↓
Databases (Clustered)
```

### Configuración de Producción

1. **Variables de entorno**

```bash
# .env.prod
NODE_ENV=production
API_URL=https://api.technovastore.com
DATABASE_URL=postgresql://user:pass@prod-db:5432/technovastore
MONGODB_URI=mongodb://user:pass@prod-mongo:27017/technovastore
REDIS_URL=redis://prod-redis:6379
JWT_SECRET=your-super-secure-jwt-secret
ENCRYPTION_KEY=your-32-char-encryption-key
```

2. **Despliegue con Docker Swarm**

```bash
# Inicializar Docker Swarm
docker swarm init

# Crear secretos
echo "jwt-secret-key" | docker secret create jwt_secret -
echo "db-password" | docker secret create db_password -

# Desplegar stack
docker stack deploy -c docker-compose.prod.yml technovastore
```

3. **Configuración de Load Balancer**

```nginx
# /etc/nginx/nginx.conf
upstream api_backend {
    least_conn;
    server api-gateway-1:3000 max_fails=3 fail_timeout=30s;
    server api-gateway-2:3000 max_fails=3 fail_timeout=30s;
    server api-gateway-3:3000 max_fails=3 fail_timeout=30s;
}

upstream frontend_backend {
    least_conn;
    server frontend-1:3000 max_fails=3 fail_timeout=30s;
    server frontend-2:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 443 ssl http2;
    server_name technovastore.com;

    # SSL configuration
    ssl_certificate /etc/ssl/certs/technovastore.crt;
    ssl_certificate_key /etc/ssl/private/technovastore.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # API endpoints
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }

    # Login endpoint with stricter rate limiting
    location /api/auth/login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend
    location / {
        proxy_pass http://frontend_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static assets with caching
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://frontend_backend;
    }
}
```

### Base de Datos en Producción

#### PostgreSQL Cluster

```yaml
# docker-compose.prod.yml (fragmento)
services:
  postgres-primary:
    image: postgres:15
    environment:
      POSTGRES_DB: technovastore
      POSTGRES_USER: technovastore
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
      POSTGRES_REPLICATION_USER: replicator
      POSTGRES_REPLICATION_PASSWORD_FILE: /run/secrets/replication_password
    volumes:
      - postgres_primary_data:/var/lib/postgresql/data
      - ./postgresql/primary.conf:/etc/postgresql/postgresql.conf
    secrets:
      - db_password
      - replication_password
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager

  postgres-replica:
    image: postgres:15
    environment:
      PGUSER: postgres
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
      POSTGRES_PRIMARY_HOST: postgres-primary
      POSTGRES_REPLICATION_USER: replicator
      POSTGRES_REPLICATION_PASSWORD_FILE: /run/secrets/replication_password
    volumes:
      - postgres_replica_data:/var/lib/postgresql/data
    secrets:
      - db_password
      - replication_password
    deploy:
      replicas: 2
```

#### MongoDB Replica Set

```yaml
mongodb-primary:
  image: mongo:6.0
  environment:
    MONGO_INITDB_ROOT_USERNAME: admin
    MONGO_INITDB_ROOT_PASSWORD_FILE: /run/secrets/mongo_password
  volumes:
    - mongodb_primary_data:/data/db
  command: mongod --replSet rs0 --bind_ip_all
  secrets:
    - mongo_password
  deploy:
    replicas: 1

mongodb-secondary:
  image: mongo:6.0
  environment:
    MONGO_INITDB_ROOT_USERNAME: admin
    MONGO_INITDB_ROOT_PASSWORD_FILE: /run/secrets/mongo_password
  volumes:
    - mongodb_secondary_data:/data/db
  command: mongod --replSet rs0 --bind_ip_all
  secrets:
    - mongo_password
  deploy:
    replicas: 2
```

### Backup y Recuperación

#### Script de Backup Automático

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/$(date +%Y-%m-%d)"
mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL
docker exec postgres-primary pg_dump -U technovastore technovastore | gzip > "$BACKUP_DIR/postgres.sql.gz"

# Backup MongoDB
docker exec mongodb-primary mongodump --uri="mongodb://REDACTED_DB_PASSWORD@localhost:27017/technovastore" --gzip --archive="$BACKUP_DIR/mongodb.archive.gz"

# Backup Redis
docker exec redis redis-cli --rdb "$BACKUP_DIR/redis.rdb"

# Upload to S3 (opcional)
aws s3 sync "$BACKUP_DIR" "s3://technovastore-backups/$(date +%Y-%m-%d)/"

# Cleanup old backups (keep 30 days)
find /backups -type d -mtime +30 -exec rm -rf {} \;
```

#### Cron Job para Backups

```bash
# Agregar a crontab
0 2 * * * /opt/technovastore/scripts/backup.sh
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:ci

      - name: Run security audit
        run: npm audit --audit-level high

      - name: Build application
        run: npm run build

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to staging
        run: |
          echo "${{ secrets.STAGING_SSH_KEY }}" > staging_key
          chmod 600 staging_key
          ssh -i staging_key -o StrictHostKeyChecking=no ${{ secrets.STAGING_USER }}@${{ secrets.STAGING_HOST }} '
            cd /opt/technovastore &&
            git pull origin develop &&
            docker-compose -f docker-compose.staging.yml up -d --build
          '

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to production
        run: |
          echo "${{ secrets.PROD_SSH_KEY }}" > prod_key
          chmod 600 prod_key
          ssh -i prod_key -o StrictHostKeyChecking=no ${{ secrets.PROD_USER }}@${{ secrets.PROD_HOST }} '
            cd /opt/technovastore &&
            git pull origin main &&
            docker stack deploy -c docker-compose.prod.yml technovastore
          '

      - name: Run health checks
        run: |
          sleep 30
          curl -f https://technovastore.com/health || exit 1
          curl -f https://technovastore.com/api/products || exit 1
```

### Scripts de Despliegue

#### Despliegue con Zero Downtime

```bash
#!/bin/bash
# deploy-zero-downtime.sh

set -e

echo "Starting zero-downtime deployment..."

# Build new images
docker-compose -f docker-compose.prod.yml build

# Update services one by one
SERVICES=("api-gateway" "product-service" "user-service" "order-service" "frontend")

for service in "${SERVICES[@]}"; do
    echo "Updating $service..."
    docker service update --image "technovastore/$service:latest" "technovastore_$service"

    # Wait for service to be healthy
    while [ "$(docker service ps technovastore_$service --filter desired-state=running --format '{{.CurrentState}}' | grep -c Running)" -eq 0 ]; do
        echo "Waiting for $service to be running..."
        sleep 5
    done

    echo "$service updated successfully"
done

echo "Zero-downtime deployment completed!"
```

## Configuración de Entornos

### Variables de Entorno por Ambiente

#### Desarrollo (.env)

```bash
NODE_ENV=development
API_URL=http://localhost:3000
DATABASE_URL=postgresql://technovastore:password123@localhost:5432/technovastore
MONGODB_URI=mongodb://technovastore:password123@localhost:27017/technovastore
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-jwt-secret-key
LOG_LEVEL=debug
ENABLE_SWAGGER=true
```

#### Staging (.env.staging)

```bash
NODE_ENV=staging
API_URL=https://staging.technovastore.com
DATABASE_URL=postgresql://technovastore:${DB_PASSWORD}@staging-db:5432/technovastore
MONGODB_URI=mongodb://technovastore:${MONGO_PASSWORD}@staging-mongo:27017/technovastore
REDIS_URL=redis://staging-redis:6379
JWT_SECRET=${JWT_SECRET}
LOG_LEVEL=info
ENABLE_SWAGGER=true
```

#### Producción (.env.prod)

```bash
NODE_ENV=production
API_URL=https://technovastore.com
DATABASE_URL=postgresql://technovastore:${DB_PASSWORD}@prod-db:5432/technovastore
MONGODB_URI=mongodb://technovastore:${MONGO_PASSWORD}@prod-mongo:27017/technovastore
REDIS_URL=redis://prod-redis:6379
JWT_SECRET=${JWT_SECRET}
LOG_LEVEL=warn
ENABLE_SWAGGER=false
```

### Gestión de Secretos

#### Docker Secrets

```bash
# Crear secretos en Docker Swarm
echo "super-secure-jwt-key" | docker secret create jwt_secret -
echo "database-password" | docker secret create db_password -
echo "mongodb-password" | docker secret create mongo_password -
```

#### Kubernetes Secrets (opcional)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: technovastore-secrets
type: Opaque
data:
  jwt-secret: <base64-encoded-jwt-secret>
  db-password: <base64-encoded-db-password>
  mongo-password: <base64-encoded-mongo-password>
```

## Monitoreo y Logging

### Configuración de Prometheus

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'technovastore-api'
    static_configs:
      - targets: ['api-gateway:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'technovastore-services'
    static_configs:
      - targets:
          - 'product-service:3001'
          - 'user-service:3002'
          - 'order-service:3003'
          - 'payment-service:3004'
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
```

### Dashboards de Grafana

Los dashboards están disponibles en `infrastructure/grafana/dashboards/`:

- `api-performance.json` - Métricas de performance de API
- `system-resources.json` - Recursos del sistema
- `business-metrics.json` - Métricas de negocio

### Configuración de Alertas

```yaml
# alertmanager.yml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@technovastore.com'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
  - name: 'web.hook'
    email_configs:
      - to: 'admin@technovastore.com'
        subject: 'TechNovaStore Alert: {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          {{ end }}
```

## Troubleshooting

### Problemas Comunes

#### 1. Servicios no se conectan

```bash
# Verificar red de Docker
docker network ls
docker network inspect technovastore_default

# Verificar logs de servicios
docker-compose logs api-gateway
docker-compose logs product-service
```

#### 2. Base de datos no disponible

```bash
# Verificar estado de contenedores
docker-compose ps

# Conectar a base de datos
docker exec -it technovastore-postgresql-1 psql -U technovastore -d technovastore

# Verificar logs de base de datos
docker-compose logs postgresql
```

#### 3. Problemas de memoria

```bash
# Verificar uso de recursos
docker stats

# Ajustar límites de memoria en docker-compose.yml
services:
  api-gateway:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

### Scripts de Diagnóstico

```bash
#!/bin/bash
# diagnose.sh

echo "=== TechNovaStore Diagnostic ==="

echo "1. Checking Docker services..."
docker-compose ps

echo "2. Checking service health..."
curl -f http://localhost:3000/health || echo "API Gateway not healthy"

echo "3. Checking database connections..."
docker exec technovastore-postgresql-1 pg_isready -U technovastore || echo "PostgreSQL not ready"
docker exec technovastore-mongodb-1 mongosh --eval "db.adminCommand('ping')" || echo "MongoDB not ready"

echo "4. Checking disk space..."
df -h

echo "5. Checking memory usage..."
free -h

echo "6. Checking recent logs..."
docker-compose logs --tail=50 api-gateway
```

## Soporte

Para problemas de despliegue:

- Consulta los [logs de troubleshooting](../maintenance/troubleshooting.md)
- Revisa la [documentación de mantenimiento](../maintenance/README.md)
- Abre un [issue en GitHub](https://github.com/technovastore/issues)
