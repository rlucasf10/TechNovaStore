# TechNovaStore - Production Deployment Guide

This guide covers the complete production deployment of TechNovaStore with load balancing, automated backups, and monitoring.

## Prerequisites

### System Requirements

- **OS**: Ubuntu 20.04 LTS or CentOS 8+ (recommended)
- **CPU**: Minimum 4 cores, 8 cores recommended
- **RAM**: Minimum 8GB, 16GB recommended
- **Storage**: Minimum 100GB SSD, 500GB recommended
- **Network**: Static IP address and domain name

### Software Requirements

- Docker 24.0+
- Docker Compose 2.0+
- Git
- OpenSSL
- curl

## Pre-Deployment Setup

### 1. System Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y docker.io docker-compose git openssl curl htop

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
```

### 2. Clone Repository

```bash
git clone https://github.com/your-org/technovastore.git
cd technovastore
```

### 3. Environment Configuration

```bash
# Copy production environment template
cp .env.prod.example .env.prod

# Edit production environment
nano .env.prod
```

**Required Configuration:**

- Database passwords (strong, unique passwords)
- JWT secret (minimum 32 characters)
- Domain names
- SSL certificate paths
- SMTP configuration
- Monitoring credentials
- Backup configuration (S3 optional)
- External API keys

### 4. SSL Certificates

#### Option A: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot

# Generate certificates
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates to project
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem infrastructure/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem infrastructure/nginx/ssl/key.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/chain.pem infrastructure/nginx/ssl/chain.pem
```

#### Option B: Custom Certificates

```bash
# Place your certificates in infrastructure/nginx/ssl/
# - cert.pem (certificate)
# - key.pem (private key)
# - chain.pem (certificate chain)
```

## Production Deployment

### 1. Run Enhanced Deployment Script

```bash
# Make script executable
chmod +x scripts/deploy-prod-enhanced.sh

# Run deployment (as root)
sudo ./scripts/deploy-prod-enhanced.sh
```

The deployment script will:

- Validate system requirements
- Check environment configuration
- Setup directory structure
- Create pre-deployment backup
- Build and deploy all services
- Perform health checks
- Setup monitoring and backup services
- Generate deployment report

### 2. Manual Deployment (Alternative)

If you prefer manual deployment:

```bash
# Create data directories
sudo mkdir -p /opt/technovastore/data/{mongodb,postgresql,redis,prometheus,grafana}
sudo mkdir -p /opt/technovastore/backups/{mongodb,postgresql,config}

# Set permissions
sudo chown -R 1000:1000 /opt/technovastore/data
sudo chown -R 1000:1000 /opt/technovastore/backups

# Deploy services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

## Post-Deployment Configuration

### 1. Verify Services

```bash
# Check all services are running
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Test endpoints
curl -k https://yourdomain.com/health
curl -k https://yourdomain.com/api/health
```

### 2. Configure Monitoring

Access Grafana at `http://your-server:3013`:

- Username: admin
- Password: (from GRAFANA_ADMIN_PASSWORD in .env.prod)

Import dashboards:

- Node Exporter Dashboard (ID: 1860)
- Docker Dashboard (ID: 893)
- NGINX Dashboard (ID: 12559)

### 3. Setup Backup Verification

```bash
# Check backup service
docker-compose -f docker-compose.prod.yml exec db-backup /scripts/health-check.sh

# Test manual backup
docker-compose -f docker-compose.prod.yml exec db-backup /scripts/backup-all.sh

# Check backup files
ls -la /opt/technovastore/backups/
```

### 4. Configure Firewall

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow SSH (adjust port as needed)
sudo ufw allow 22/tcp

# Allow monitoring (restrict to your IP)
sudo ufw allow from YOUR_IP to any port 3013
sudo ufw allow from YOUR_IP to any port 9090

# Enable firewall
sudo ufw enable
```

## Architecture Overview

### Load Balancing

- **NGINX**: Load balancer with SSL termination
- **API Gateway**: 2 instances with least-connection balancing
- **Frontend**: 2 instances with least-connection balancing
- **Services**: Scaled based on resource requirements

### Database Configuration

- **MongoDB**: Single instance with automated backups
- **PostgreSQL**: Single instance with automated backups
- **Redis**: Single instance for caching and sessions

### Backup Strategy

- **Daily Backups**: Automated at 2:00 AM
- **Weekly Full Backups**: Sundays at 3:00 AM
- **Retention**: 30 days for daily, 90 days for full
- **Storage**: Local + optional S3 upload
- **Cleanup**: Automated daily at 4:00 AM

### Monitoring Stack

- **Prometheus**: Metrics collection
- **Grafana**: Visualization and alerting
- **Node Exporter**: System metrics
- **Database Exporters**: MongoDB, PostgreSQL, Redis metrics
- **Application Metrics**: Custom metrics from services

## Maintenance

### Regular Tasks

#### Daily

- Check service health: `docker-compose -f docker-compose.prod.yml ps`
- Review logs: `docker-compose -f docker-compose.prod.yml logs --tail=100`
- Monitor disk space: `df -h`

#### Weekly

- Review backup reports: `ls -la /opt/technovastore/backups/`
- Check security updates: `sudo apt list --upgradable`
- Review monitoring alerts in Grafana

#### Monthly

- Update system packages: `sudo apt update && sudo apt upgrade`
- Rotate logs: `docker system prune -f`
- Review and update SSL certificates

### Backup Management

#### Manual Backup

```bash
# Create immediate backup
docker-compose -f docker-compose.prod.yml exec db-backup /scripts/backup-all.sh

# Create full backup
docker-compose -f docker-compose.prod.yml exec db-backup /scripts/backup-full.sh
```

#### Restore from Backup

```bash
# Stop services
docker-compose -f docker-compose.prod.yml down

# Restore MongoDB
docker run --rm -v /opt/technovastore/backups:/backups \
  -v mongodb_data:/data/db mongo:6.0 \
  mongorestore --archive=/backups/mongodb/backup_file.tar.gz --gzip

# Restore PostgreSQL
docker run --rm -v /opt/technovastore/backups:/backups \
  -v postgresql_data:/var/lib/postgresql/data postgres:15 \
  pg_restore -d technovastore /backups/postgresql/backup_file.dump

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

### Scaling Services

#### Scale API Gateway

```bash
# Scale to 3 instances
docker-compose -f docker-compose.prod.yml up -d --scale api-gateway-1=2 --scale api-gateway-2=1
```

#### Scale Frontend

```bash
# Scale to 4 instances
docker-compose -f docker-compose.prod.yml up -d --scale frontend-1=2 --scale frontend-2=2
```

### SSL Certificate Renewal

#### Let's Encrypt Auto-Renewal

```bash
# Add to crontab
echo "0 12 * * * /usr/bin/certbot renew --quiet && docker-compose -f /path/to/technovastore/docker-compose.prod.yml restart nginx" | sudo crontab -
```

## Troubleshooting

### Common Issues

#### Services Not Starting

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs service-name

# Check resource usage
docker stats

# Check disk space
df -h
```

#### Database Connection Issues

```bash
# Check database logs
docker-compose -f docker-compose.prod.yml logs mongodb
docker-compose -f docker-compose.prod.yml logs postgresql

# Test connections
docker-compose -f docker-compose.prod.yml exec mongodb mongosh
docker-compose -f docker-compose.prod.yml exec postgresql psql -U admin -d technovastore
```

#### High Memory Usage

```bash
# Check memory usage
free -h
docker stats

# Restart services if needed
docker-compose -f docker-compose.prod.yml restart
```

### Performance Optimization

#### Database Optimization

- Enable MongoDB indexes for frequently queried fields
- Configure PostgreSQL connection pooling
- Monitor slow queries and optimize

#### Caching Strategy

- Configure Redis for session storage
- Implement application-level caching
- Use NGINX caching for static content

#### Resource Limits

- Adjust container resource limits in docker-compose.prod.yml
- Monitor resource usage with Grafana
- Scale services based on load

## Security Considerations

### Network Security

- Use firewall to restrict access
- Configure VPN for administrative access
- Regular security updates

### Application Security

- Strong passwords and JWT secrets
- Regular dependency updates
- Security scanning with tools like Snyk

### Data Security

- Encrypted backups
- Secure backup storage (S3 with encryption)
- Regular backup testing

## Support and Monitoring

### Health Endpoints

- Frontend: `https://yourdomain.com/health`
- API: `https://yourdomain.com/api/health`
- Individual services: `http://service:port/health`

### Monitoring URLs

- Grafana: `http://your-server:3013`
- Prometheus: `http://your-server:9090`
- NGINX Status: `http://your-server:8080/nginx_status`

### Log Locations

- Application logs: `docker-compose logs`
- System logs: `/var/log/technovastore/`
- Backup logs: `/opt/technovastore/backups/logs/`
- NGINX logs: `/opt/technovastore/logs/nginx/`

For additional support, refer to the main README.md or contact the development team.
