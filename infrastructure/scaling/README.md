# TechNovaStore Scalability Infrastructure

This directory contains the scalability infrastructure for TechNovaStore, implementing horizontal auto-scaling, CDN for static content, and distributed caching strategies.

## 🏗️ Architecture Overview

The scalability infrastructure consists of three main components:

1. **Horizontal Auto-scaling**: Automatically scales services based on CPU, memory, and response time metrics
2. **CDN (Content Delivery Network)**: Optimizes static content delivery with caching and compression
3. **Distributed Cache**: Redis cluster for high-performance distributed caching

## 📁 Directory Structure

```
infrastructure/scaling/
├── docker-swarm.yml              # Docker Swarm configuration for auto-scaling
├── kubernetes/                   # Kubernetes configurations
│   ├── namespace.yaml            # Kubernetes namespace
│   ├── deployments.yaml          # Service deployments
│   └── hpa.yaml                  # Horizontal Pod Autoscaler
├── auto-scaling-monitor.js       # Auto-scaling monitoring service
├── deploy-scalability.sh         # Deployment script
└── README.md                     # This file

infrastructure/cdn/
├── cloudflare-config.js          # CloudFlare CDN configuration
├── nginx-cdn.conf                # NGINX CDN configuration
└── cdn-deployment.yml            # CDN deployment configuration

infrastructure/cache/
├── redis-cluster.yml             # Redis cluster configuration
├── redis-cluster.conf            # Redis cluster settings
├── redis-sentinel.conf           # Redis Sentinel configuration
└── cache-manager.js              # Distributed cache manager
```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for monitoring services)
- At least 8GB RAM and 4 CPU cores for full deployment

### Deployment Options

#### 1. Docker Swarm (Recommended for Production)

```bash
# Initialize Docker Swarm (if not already done)
docker swarm init

# Deploy scalability infrastructure
./deploy-scalability.sh production docker-swarm
```

#### 2. Kubernetes

```bash
# Ensure kubectl is configured
kubectl cluster-info

# Deploy to Kubernetes
./deploy-scalability.sh production kubernetes
```

#### 3. Docker Compose (Development)

```bash
# Deploy with docker-compose
./deploy-scalability.sh development docker-compose
```

## 🔧 Configuration

### Environment Variables

Create environment files (`.env.production`, `.env.staging`, etc.) with the following variables:

```bash
# Redis Configuration
REDIS_PASSWORD=your-secure-redis-password

# Database Configuration
MONGO_PASSWORD=your-mongo-password
POSTGRES_PASSWORD=your-postgres-password

# JWT Configuration
JWT_SECRET=your-jwt-secret

# CDN Configuration (optional)
CLOUDFLARE_ZONE_ID=your-cloudflare-zone-id
CLOUDFLARE_API_KEY=your-cloudflare-api-key
CLOUDFLARE_EMAIL=your-cloudflare-email

# S3 Configuration for CDN (optional)
CDN_S3_BUCKET=your-s3-bucket
CDN_S3_ACCESS_KEY=your-s3-access-key
CDN_S3_SECRET_KEY=your-s3-secret-key
```

### Auto-scaling Configuration

The auto-scaling monitor can be configured by modifying `auto-scaling-monitor.js`:

```javascript
this.config = {
  // CPU thresholds
  scaleUpCpuThreshold: 70,
  scaleDownCpuThreshold: 30,

  // Memory thresholds
  scaleUpMemoryThreshold: 80,
  scaleDownMemoryThreshold: 40,

  // Response time thresholds (ms)
  scaleUpResponseTimeThreshold: 2000,
  scaleDownResponseTimeThreshold: 500,

  // Replica limits
  minReplicas: {
    'api-gateway': 2,
    'product-service': 2,
    'order-service': 2,
    frontend: 2,
  },
  maxReplicas: {
    'api-gateway': 10,
    'product-service': 8,
    'order-service': 6,
    frontend: 6,
  },
};
```

## 📊 Monitoring

### Auto-scaling Metrics

The auto-scaling monitor provides real-time metrics:

- CPU and memory usage per service
- Response time monitoring
- Scaling events and decisions
- Cooldown period tracking

### Cache Performance

The distributed cache manager tracks:

- Cache hit/miss ratios
- Redis cluster health
- Key distribution across nodes
- Performance metrics

### Accessing Monitoring

- **Grafana Dashboard**: http://localhost:3013
- **Prometheus Metrics**: http://localhost:9090
- **CDN Health Check**: http://localhost:8080/health
- **Auto-scaling Logs**: `logs/auto-scaling.log`
- **Cache Logs**: `logs/cache-manager.log`

## 🔄 Scaling Strategies

### Horizontal Pod Autoscaler (HPA) - Kubernetes

The HPA configuration automatically scales pods based on:

- CPU utilization (target: 70%)
- Memory utilization (target: 80%)
- Custom metrics (response time, queue length)

### Docker Swarm Scaling

Services are configured with:

- Resource limits and reservations
- Health checks for automatic recovery
- Rolling updates with zero downtime
- Placement constraints for optimal distribution

### Manual Scaling

You can manually scale services:

```bash
# Docker Swarm
docker service scale technovastore_api-gateway=5

# Kubernetes
kubectl scale deployment api-gateway --replicas=5 -n technovastore

# Docker Compose
docker-compose up -d --scale api-gateway=5
```

## 🌐 CDN Configuration

### NGINX CDN Features

- **Static Asset Caching**: Long-term caching for JS, CSS, images
- **Gzip Compression**: Automatic compression for text-based content
- **Security Headers**: XSS protection, CSRF prevention
- **Rate Limiting**: Protection against abuse
- **Health Checks**: Monitoring endpoint for load balancers

### CloudFlare Integration

The CloudFlare configuration provides:

- Global CDN with edge caching
- DDoS protection and security rules
- Performance optimizations (Brotli, HTTP/3)
- Cache purging and analytics

### Cache Invalidation

```javascript
// Invalidate product cache
await cacheManager.invalidateProduct(productId);

// Invalidate user-specific cache
await cacheManager.invalidateUserCache(userId);

// Purge CDN cache
await cdnManager.purgeCache(['/products/123', '/images/product-123.jpg']);
```

## 🗄️ Distributed Caching

### Redis Cluster Features

- **High Availability**: 3 master + 3 replica configuration
- **Automatic Failover**: Redis Sentinel for monitoring
- **Data Sharding**: Automatic key distribution
- **Persistence**: AOF and RDB snapshots

### Cache Strategies

1. **Product Caching**: 30-minute TTL for product data
2. **Price Caching**: 5-minute TTL for dynamic pricing
3. **Search Results**: 10-minute TTL for search queries
4. **User Sessions**: 24-hour TTL for session data
5. **Recommendations**: 30-minute TTL for ML recommendations

### Cache Usage Examples

```javascript
const cacheManager = new DistributedCacheManager();

// Cache product data
await cacheManager.cacheProduct('product-123', productData);

// Get cached product
const product = await cacheManager.getProduct('product-123');

// Cache search results
await cacheManager.cacheSearchResults('laptop gaming', searchResults);

// Batch operations
await cacheManager.mset([
  ['product-1', data1],
  ['product-2', data2],
]);
```

## 🚨 Troubleshooting

### Common Issues

1. **Redis Cluster Not Forming**

   ```bash
   # Check cluster status
   docker exec technovastore-redis-master-1 redis-cli -a $REDIS_PASSWORD cluster info

   # Reset cluster if needed
   docker exec technovastore-redis-master-1 redis-cli -a $REDIS_PASSWORD cluster reset
   ```

2. **Auto-scaling Not Working**

   ```bash
   # Check monitor logs
   tail -f logs/auto-scaling.log

   # Verify Docker stats
   docker stats --no-stream
   ```

3. **CDN Cache Issues**

   ```bash
   # Check NGINX cache
   docker exec technovastore-cdn-server nginx -t

   # Clear cache directory
   docker exec technovastore-cdn-server rm -rf /var/cache/nginx/*
   ```

### Performance Tuning

1. **Adjust scaling thresholds** based on your traffic patterns
2. **Optimize cache TTL values** for your data update frequency
3. **Configure CDN rules** for your specific content types
4. **Monitor resource usage** and adjust limits accordingly

## 🔒 Security Considerations

- Redis cluster uses password authentication
- NGINX CDN includes security headers
- Rate limiting prevents abuse
- SSL/TLS encryption for all communications
- Regular security updates for all components

## 📈 Performance Benchmarks

Expected performance improvements with full scalability infrastructure:

- **Response Time**: 50-70% reduction under load
- **Throughput**: 3-5x increase in concurrent requests
- **Cache Hit Ratio**: 85-95% for static content
- **Auto-scaling Response**: < 60 seconds scale-up time
- **High Availability**: 99.9% uptime with proper configuration

## 🤝 Contributing

When contributing to the scalability infrastructure:

1. Test changes in development environment first
2. Monitor performance impact of modifications
3. Update documentation for configuration changes
4. Follow security best practices
5. Ensure backward compatibility

## 📚 Additional Resources

- [Docker Swarm Documentation](https://docs.docker.com/engine/swarm/)
- [Kubernetes HPA Guide](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [Redis Cluster Tutorial](https://redis.io/docs/manual/scaling/)
- [NGINX Caching Guide](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache)
- [CloudFlare API Documentation](https://developers.cloudflare.com/api/)
