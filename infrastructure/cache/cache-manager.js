#!/usr/bin/env node

/**
 * Distributed Cache Manager for TechNovaStore
 * Manages Redis cluster operations, cache strategies, and monitoring
 */

const Redis = require('ioredis');
const fs = require('fs').promises;
const path = require('path');

class DistributedCacheManager {
  constructor(options = {}) {
    this.config = {
      // Redis cluster configuration
      clusterNodes: (options.clusterNodes || process.env.REDIS_CLUSTER_NODES || 'localhost:7001,localhost:7002,localhost:7003').split(','),
      password: options.password || process.env.REDIS_PASSWORD,
      
      // Cache TTL settings (seconds)
      ttl: {
        default: parseInt(process.env.CACHE_TTL_DEFAULT) || 3600,
        products: parseInt(process.env.CACHE_TTL_PRODUCTS) || 1800,
        prices: parseInt(process.env.CACHE_TTL_PRICES) || 300,
        sessions: parseInt(process.env.CACHE_TTL_SESSIONS) || 86400,
        search: parseInt(process.env.CACHE_TTL_SEARCH) || 600,
        recommendations: parseInt(process.env.CACHE_TTL_RECOMMENDATIONS) || 1800
      },
      
      // Cache key prefixes
      prefixes: {
        product: 'product:',
        price: 'price:',
        session: 'session:',
        search: 'search:',
        recommendation: 'rec:',
        user: 'user:',
        order: 'order:',
        inventory: 'inventory:'
      },
      
      // Monitoring settings
      monitoringInterval: parseInt(process.env.MONITORING_INTERVAL) || 60,
      
      // Performance settings
      maxRetries: 3,
      retryDelayOnFailover: 100,
      enableOfflineQueue: false
    };
    
    this.cluster = null;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
    
    this.initialize();
  }

  async initialize() {
    try {
      console.log('🚀 Initializing Distributed Cache Manager');
      
      // Create Redis cluster connection
      this.cluster = new Redis.Cluster(
        this.config.clusterNodes.map(node => {
          const [host, port] = node.split(':');
          return { host, port: parseInt(port) };
        }),
        {
          redisOptions: {
            password: this.config.password,
            maxRetriesPerRequest: this.config.maxRetries,
            retryDelayOnFailover: this.config.retryDelayOnFailover,
            enableOfflineQueue: this.config.enableOfflineQueue
          },
          enableReadyCheck: true,
          maxRetriesPerRequest: this.config.maxRetries
        }
      );

      // Event listeners
      this.cluster.on('connect', () => {
        console.log('✅ Connected to Redis cluster');
      });

      this.cluster.on('ready', () => {
        console.log('✅ Redis cluster is ready');
        this.startMonitoring();
      });

      this.cluster.on('error', (error) => {
        console.error('❌ Redis cluster error:', error.message);
        this.stats.errors++;
      });

      this.cluster.on('node error', (error, node) => {
        console.error(`❌ Redis node error (${node.options.host}:${node.options.port}):`, error.message);
      });

      // Test connection
      await this.cluster.ping();
      console.log('✅ Cache manager initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize cache manager:', error.message);
      throw error;
    }
  }

  // Core cache operations
  async get(key, options = {}) {
    try {
      const fullKey = this.buildKey(key, options.prefix);
      const value = await this.cluster.get(fullKey);
      
      if (value !== null) {
        this.stats.hits++;
        return options.json ? JSON.parse(value) : value;
      } else {
        this.stats.misses++;
        return null;
      }
    } catch (error) {
      console.error(`❌ Cache get error for key ${key}:`, error.message);
      this.stats.errors++;
      return null;
    }
  }

  async set(key, value, options = {}) {
    try {
      const fullKey = this.buildKey(key, options.prefix);
      const serializedValue = options.json ? JSON.stringify(value) : value;
      const ttl = options.ttl || this.getTTLForKey(key, options.prefix);
      
      await this.cluster.setex(fullKey, ttl, serializedValue);
      this.stats.sets++;
      return true;
    } catch (error) {
      console.error(`❌ Cache set error for key ${key}:`, error.message);
      this.stats.errors++;
      return false;
    }
  }

  async del(key, options = {}) {
    try {
      const fullKey = this.buildKey(key, options.prefix);
      const result = await this.cluster.del(fullKey);
      this.stats.deletes++;
      return result > 0;
    } catch (error) {
      console.error(`❌ Cache delete error for key ${key}:`, error.message);
      this.stats.errors++;
      return false;
    }
  }

  async exists(key, options = {}) {
    try {
      const fullKey = this.buildKey(key, options.prefix);
      return await this.cluster.exists(fullKey) === 1;
    } catch (error) {
      console.error(`❌ Cache exists error for key ${key}:`, error.message);
      this.stats.errors++;
      return false;
    }
  }

  async expire(key, ttl, options = {}) {
    try {
      const fullKey = this.buildKey(key, options.prefix);
      return await this.cluster.expire(fullKey, ttl) === 1;
    } catch (error) {
      console.error(`❌ Cache expire error for key ${key}:`, error.message);
      this.stats.errors++;
      return false;
    }
  }

  // Advanced cache operations
  async mget(keys, options = {}) {
    try {
      const fullKeys = keys.map(key => this.buildKey(key, options.prefix));
      const values = await this.cluster.mget(...fullKeys);
      
      return values.map((value, index) => {
        if (value !== null) {
          this.stats.hits++;
          return options.json ? JSON.parse(value) : value;
        } else {
          this.stats.misses++;
          return null;
        }
      });
    } catch (error) {
      console.error('❌ Cache mget error:', error.message);
      this.stats.errors++;
      return keys.map(() => null);
    }
  }

  async mset(keyValuePairs, options = {}) {
    try {
      const pipeline = this.cluster.pipeline();
      const ttl = options.ttl || this.config.ttl.default;
      
      for (const [key, value] of keyValuePairs) {
        const fullKey = this.buildKey(key, options.prefix);
        const serializedValue = options.json ? JSON.stringify(value) : value;
        pipeline.setex(fullKey, ttl, serializedValue);
      }
      
      await pipeline.exec();
      this.stats.sets += keyValuePairs.length;
      return true;
    } catch (error) {
      console.error('❌ Cache mset error:', error.message);
      this.stats.errors++;
      return false;
    }
  }

  async flushPattern(pattern) {
    try {
      const keys = await this.cluster.keys(pattern);
      if (keys.length > 0) {
        await this.cluster.del(...keys);
        this.stats.deletes += keys.length;
        console.log(`🗑️ Flushed ${keys.length} keys matching pattern: ${pattern}`);
      }
      return keys.length;
    } catch (error) {
      console.error(`❌ Cache flush pattern error for ${pattern}:`, error.message);
      this.stats.errors++;
      return 0;
    }
  }

  // Specialized cache methods
  async cacheProduct(productId, productData, ttl = null) {
    return await this.set(productId, productData, {
      prefix: this.config.prefixes.product,
      ttl: ttl || this.config.ttl.products,
      json: true
    });
  }

  async getProduct(productId) {
    return await this.get(productId, {
      prefix: this.config.prefixes.product,
      json: true
    });
  }

  async cachePrice(productId, priceData, ttl = null) {
    return await this.set(productId, priceData, {
      prefix: this.config.prefixes.price,
      ttl: ttl || this.config.ttl.prices,
      json: true
    });
  }

  async getPrice(productId) {
    return await this.get(productId, {
      prefix: this.config.prefixes.price,
      json: true
    });
  }

  async cacheSearchResults(query, results, ttl = null) {
    const searchKey = this.hashString(query);
    return await this.set(searchKey, results, {
      prefix: this.config.prefixes.search,
      ttl: ttl || this.config.ttl.search,
      json: true
    });
  }

  async getSearchResults(query) {
    const searchKey = this.hashString(query);
    return await this.get(searchKey, {
      prefix: this.config.prefixes.search,
      json: true
    });
  }

  async cacheRecommendations(userId, recommendations, ttl = null) {
    return await this.set(userId, recommendations, {
      prefix: this.config.prefixes.recommendation,
      ttl: ttl || this.config.ttl.recommendations,
      json: true
    });
  }

  async getRecommendations(userId) {
    return await this.get(userId, {
      prefix: this.config.prefixes.recommendation,
      json: true
    });
  }

  // Cache invalidation strategies
  async invalidateProduct(productId) {
    const pipeline = this.cluster.pipeline();
    
    // Invalidate product cache
    pipeline.del(this.buildKey(productId, this.config.prefixes.product));
    
    // Invalidate price cache
    pipeline.del(this.buildKey(productId, this.config.prefixes.price));
    
    // Invalidate related search results
    const searchKeys = await this.cluster.keys(`${this.config.prefixes.search}*`);
    if (searchKeys.length > 0) {
      pipeline.del(...searchKeys);
    }
    
    await pipeline.exec();
    console.log(`🗑️ Invalidated cache for product: ${productId}`);
  }

  async invalidateUserCache(userId) {
    const pipeline = this.cluster.pipeline();
    
    // Invalidate user-specific caches
    pipeline.del(this.buildKey(userId, this.config.prefixes.user));
    pipeline.del(this.buildKey(userId, this.config.prefixes.recommendation));
    
    // Invalidate user sessions
    const sessionKeys = await this.cluster.keys(`${this.config.prefixes.session}*${userId}*`);
    if (sessionKeys.length > 0) {
      pipeline.del(...sessionKeys);
    }
    
    await pipeline.exec();
    console.log(`🗑️ Invalidated cache for user: ${userId}`);
  }

  // Utility methods
  buildKey(key, prefix = '') {
    return `${prefix}${key}`;
  }

  getTTLForKey(key, prefix = '') {
    if (prefix === this.config.prefixes.product) return this.config.ttl.products;
    if (prefix === this.config.prefixes.price) return this.config.ttl.prices;
    if (prefix === this.config.prefixes.session) return this.config.ttl.sessions;
    if (prefix === this.config.prefixes.search) return this.config.ttl.search;
    if (prefix === this.config.prefixes.recommendation) return this.config.ttl.recommendations;
    return this.config.ttl.default;
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Monitoring and statistics
  startMonitoring() {
    console.log(`📊 Starting cache monitoring (interval: ${this.config.monitoringInterval}s)`);
    
    setInterval(async () => {
      try {
        await this.collectMetrics();
        await this.logStatistics();
      } catch (error) {
        console.error('❌ Error in monitoring:', error.message);
      }
    }, this.config.monitoringInterval * 1000);
  }

  async collectMetrics() {
    try {
      const info = await this.cluster.cluster('info');
      const nodes = await this.cluster.cluster('nodes');
      
      this.clusterInfo = {
        state: info.match(/cluster_state:(\w+)/)?.[1],
        slots_assigned: parseInt(info.match(/cluster_slots_assigned:(\d+)/)?.[1] || 0),
        slots_ok: parseInt(info.match(/cluster_slots_ok:(\d+)/)?.[1] || 0),
        known_nodes: parseInt(info.match(/cluster_known_nodes:(\d+)/)?.[1] || 0),
        size: parseInt(info.match(/cluster_size:(\d+)/)?.[1] || 0)
      };
      
      // Calculate hit ratio
      const totalRequests = this.stats.hits + this.stats.misses;
      this.stats.hitRatio = totalRequests > 0 ? (this.stats.hits / totalRequests * 100).toFixed(2) : 0;
      
    } catch (error) {
      console.error('❌ Error collecting metrics:', error.message);
    }
  }

  async logStatistics() {
    const logEntry = {
      timestamp: new Date().toISOString(),
      stats: { ...this.stats },
      cluster: this.clusterInfo
    };
    
    console.log(`📈 Cache Stats - Hits: ${this.stats.hits}, Misses: ${this.stats.misses}, Hit Ratio: ${this.stats.hitRatio}%`);
    
    try {
      const logFile = path.join(__dirname, '../../logs/cache-manager.log');
      await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('❌ Failed to write cache log:', error.message);
    }
  }

  getStatistics() {
    return {
      ...this.stats,
      cluster: this.clusterInfo
    };
  }

  // Graceful shutdown
  async shutdown() {
    console.log('🛑 Shutting down cache manager');
    if (this.cluster) {
      await this.cluster.disconnect();
    }
  }
}

// Start the cache manager if this file is run directly
if (require.main === module) {
  const cacheManager = new DistributedCacheManager();
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    await cacheManager.shutdown();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    await cacheManager.shutdown();
    process.exit(0);
  });
}

module.exports = DistributedCacheManager;