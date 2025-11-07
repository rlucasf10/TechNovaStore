# Guía de Despliegue en Producción - TechNovaStore

Esta guía describe cómo desplegar TechNovaStore en un entorno de producción con todas las funcionalidades, incluyendo el nuevo sistema de tickets integrado con el chatbot.

## 📋 Prerrequisitos

### Servidor de Producción
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Amazon Linux 2
- **RAM**: Mínimo 8GB, recomendado 16GB+
- **CPU**: Mínimo 4 cores, recomendado 8+ cores
- **Almacenamiento**: Mínimo 100GB SSD
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### Dominios y SSL
- Dominio principal: `technovastore.com`
- Subdominio API: `api.technovastore.com`
- Certificados SSL válidos

### Servicios Externos
- **SMTP**: Servidor de email configurado (Gmail, SendGrid, etc.)
- **Backup**: Solución de backup para bases de datos
- **Monitoreo**: Sentry, New Relic, o similar (opcional)

## 🚀 Proceso de Despliegue

### 1. Preparación del Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Reiniciar sesión para aplicar cambios de grupo
```

### 2. Configuración del Proyecto

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/technovastore.git
cd technovastore

# Configurar variables de entorno
cp .env.prod.example .env.prod
nano .env.prod  # Configurar todas las variables
```

### 3. Configuración de Variables de Entorno

Editar `.env.prod` con los valores de producción:

```env
# Credenciales de Base de Datos (CAMBIAR)
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=tu_password_mongo_seguro
POSTGRES_USER=admin
POSTGRES_PASSWORD=tu_password_postgres_seguro
REDIS_PASSWORD=tu_password_redis_seguro

# Seguridad (CAMBIAR)
JWT_SECRET=tu_jwt_secret_muy_seguro_de_64_caracteres_minimo

# Configuración de Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@technovastore.com
SMTP_PASS=tu_app_password_smtp

# Dominios
DOMAIN=technovastore.com
API_DOMAIN=api.technovastore.com
```

### 4. Configuración de Nginx y SSL

```bash
# Configurar certificados SSL
sudo mkdir -p /etc/nginx/ssl
sudo cp tu_certificado.crt /etc/nginx/ssl/cert.pem
sudo cp tu_clave_privada.key /etc/nginx/ssl/key.pem
sudo chmod 600 /etc/nginx/ssl/*
```

### 5. Despliegue Automático

#### Opción A: Script de PowerShell (Windows)
```powershell
# Despliegue completo
.\scripts\deploy-prod.ps1

# Despliegue sin rebuild (más rápido)
.\scripts\deploy-prod.ps1 -SkipBuild

# Despliegue sin migraciones
.\scripts\deploy-prod.ps1 -SkipMigrations
```

#### Opción B: Script de Bash (Linux/macOS)
```bash
# Hacer ejecutable
chmod +x scripts/deploy-prod.sh

# Ejecutar despliegue
./scripts/deploy-prod.sh
```

#### Opción C: Manual
```bash
# Construir imágenes
docker-compose -f docker-compose.prod.yml build

# Iniciar servicios
docker-compose -f docker-compose.prod.yml up -d

# Verificar estado
docker-compose -f docker-compose.prod.yml ps
```

## 🔧 Servicios Desplegados

### Servicios Principales
- **Frontend**: Puerto 80/443 (Nginx)
- **API Gateway**: Puerto interno 3000
- **Ticket Service**: Puerto interno 3005
- **Chatbot**: Puerto interno 3001
- **Notification Service**: Puerto interno 3000

### Bases de Datos
- **PostgreSQL**: Puerto interno 5432
- **MongoDB**: Puerto interno 27017
- **Redis**: Puerto interno 6379

### Nuevas Funcionalidades
- ✅ **Sistema de Tickets**: Gestión completa de tickets de soporte
- ✅ **Escalación Automática**: Integración chatbot → tickets
- ✅ **Métricas de Satisfacción**: Encuestas y análisis de calidad
- ✅ **Categorización Inteligente**: Auto-clasificación de tickets
- ✅ **Alertas de Satisfacción**: Notificaciones automáticas

## 📊 Monitoreo y Mantenimiento

### Verificación de Salud
```bash
# Estado de todos los servicios
docker-compose -f docker-compose.prod.yml ps

# Logs en tiempo real
docker-compose -f docker-compose.prod.yml logs -f

# Logs de un servicio específico
docker-compose -f docker-compose.prod.yml logs -f ticket-service

# Health checks
curl https://api.technovastore.com/health
curl https://api.technovastore.com/api/tickets/health
```

### Métricas del Sistema de Tickets
```bash
# Métricas de tickets
curl https://api.technovastore.com/api/metrics/tickets

# Métricas de satisfacción
curl https://api.technovastore.com/api/metrics/satisfaction
```

### Backup de Bases de Datos
```bash
# Backup PostgreSQL (tickets)
docker-compose -f docker-compose.prod.yml exec postgresql pg_dump -U admin technovastore > backup_postgres_$(date +%Y%m%d).sql

# Backup MongoDB
docker-compose -f docker-compose.prod.yml exec mongodb mongodump --host localhost --port 27017 --out /backup/mongodb_$(date +%Y%m%d)
```

## 🔄 Actualizaciones

### Actualización de Código
```bash
# Obtener últimos cambios
git pull origin main

# Reconstruir y redesplegar
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### Migraciones de Base de Datos
Las migraciones se ejecutan automáticamente al iniciar PostgreSQL. Para migraciones manuales:

```bash
# Ejecutar migración específica
docker-compose -f docker-compose.prod.yml exec postgresql psql -U admin -d technovastore -f /ruta/a/migracion.sql
```

## 🚨 Solución de Problemas

### Problemas Comunes

#### Servicio de Tickets no Responde
```bash
# Verificar logs
docker-compose -f docker-compose.prod.yml logs ticket-service

# Reiniciar servicio
docker-compose -f docker-compose.prod.yml restart ticket-service
```

#### Chatbot no Escala Tickets
```bash
# Verificar conectividad
docker-compose -f docker-compose.prod.yml exec chatbot curl http://ticket-service:3005/health

# Verificar variables de entorno
docker-compose -f docker-compose.prod.yml exec chatbot env | grep TICKET
```

#### Base de Datos PostgreSQL
```bash
# Verificar conexión
docker-compose -f docker-compose.prod.yml exec postgresql psql -U admin -d technovastore -c "SELECT version();"

# Verificar tablas de tickets
docker-compose -f docker-compose.prod.yml exec postgresql psql -U admin -d technovastore -c "\dt"
```

### Logs Importantes
- **Escalaciones**: Buscar "escalation" en logs del chatbot
- **Tickets**: Buscar "ticket" en logs del ticket-service
- **Satisfacción**: Buscar "satisfaction" en logs del ticket-service

## 📈 Optimización de Rendimiento

### Configuración de Recursos
```yaml
# En docker-compose.prod.yml, añadir límites de recursos:
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
    reservations:
      cpus: '1.0'
      memory: 1G
```

### Índices de Base de Datos
Los índices están configurados automáticamente en las migraciones, pero para optimización adicional:

```sql
-- Índices adicionales para mejor rendimiento
CREATE INDEX CONCURRENTLY idx_tickets_created_at_status ON tickets(created_at, status);
CREATE INDEX CONCURRENTLY idx_satisfaction_surveys_created_at ON satisfaction_surveys(created_at);
```

## 🔐 Seguridad

### Configuración de Firewall
```bash
# Permitir solo puertos necesarios
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### Rotación de Secretos
- Cambiar passwords de base de datos cada 90 días
- Rotar JWT_SECRET cada 6 meses
- Actualizar certificados SSL antes del vencimiento

### Backup y Recuperación
- Backup automático diario de bases de datos
- Retención de backups por 30 días
- Pruebas de recuperación mensuales

## 📞 Soporte

Para problemas específicos del sistema de tickets:
1. Verificar logs del servicio ticket-service
2. Comprobar conectividad entre chatbot y ticket-service
3. Validar configuración de PostgreSQL
4. Revisar métricas de satisfacción para detectar problemas

El sistema está diseñado para ser resiliente y auto-recuperable, pero el monitoreo continuo es esencial para mantener la calidad del servicio.