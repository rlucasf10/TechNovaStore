/**
 * CloudFlare CDN Configuration for TechNovaStore
 * Manages static content distribution and caching rules
 */

const cloudflare = require('cloudflare');

class CloudFlareCDNManager {
  constructor(options = {}) {
    this.cf = cloudflare({
      email: options.email || process.env.CLOUDFLARE_EMAIL,
      key: options.apiKey || process.env.CLOUDFLARE_API_KEY
    });
    
    this.zoneId = options.zoneId || process.env.CLOUDFLARE_ZONE_ID;
    this.domain = options.domain || 'technovastore.com';
  }

  async setupCDNRules() {
    console.log('🌐 Setting up CloudFlare CDN rules for TechNovaStore');
    
    try {
      // Configure page rules for static content caching
      await this.createPageRules();
      
      // Configure cache settings
      await this.configureCacheSettings();
      
      // Setup security rules
      await this.setupSecurityRules();
      
      // Configure performance optimizations
      await this.configurePerformanceSettings();
      
      console.log('✅ CloudFlare CDN configuration completed');
    } catch (error) {
      console.error('❌ Error setting up CDN rules:', error.message);
      throw error;
    }
  }

  async createPageRules() {
    const pageRules = [
      {
        targets: [{
          target: 'url',
          constraint: {
            operator: 'matches',
            value: `${this.domain}/static/*`
          }
        }],
        actions: [{
          id: 'cache_level',
          value: 'cache_everything'
        }, {
          id: 'edge_cache_ttl',
          value: 31536000 // 1 year
        }, {
          id: 'browser_cache_ttl',
          value: 31536000 // 1 year
        }],
        priority: 1,
        status: 'active'
      },
      {
        targets: [{
          target: 'url',
          constraint: {
            operator: 'matches',
            value: `${this.domain}/_next/static/*`
          }
        }],
        actions: [{
          id: 'cache_level',
          value: 'cache_everything'
        }, {
          id: 'edge_cache_ttl',
          value: 31536000 // 1 year
        }, {
          id: 'browser_cache_ttl',
          value: 31536000 // 1 year
        }],
        priority: 2,
        status: 'active'
      },
      {
        targets: [{
          target: 'url',
          constraint: {
            operator: 'matches',
            value: `${this.domain}/images/*`
          }
        }],
        actions: [{
          id: 'cache_level',
          value: 'cache_everything'
        }, {
          id: 'edge_cache_ttl',
          value: 2592000 // 30 days
        }, {
          id: 'browser_cache_ttl',
          value: 2592000 // 30 days
        }],
        priority: 3,
        status: 'active'
      },
      {
        targets: [{
          target: 'url',
          constraint: {
            operator: 'matches',
            value: `${this.domain}/api/*`
          }
        }],
        actions: [{
          id: 'cache_level',
          value: 'bypass'
        }],
        priority: 4,
        status: 'active'
      }
    ];

    for (const rule of pageRules) {
      try {
        await this.cf.zones.pagerules.add(this.zoneId, rule);
        console.log(`✅ Created page rule for ${rule.targets[0].constraint.value}`);
      } catch (error) {
        console.error(`❌ Failed to create page rule: ${error.message}`);
      }
    }
  }

  async configureCacheSettings() {
    const cacheSettings = [
      {
        id: 'cache_level',
        value: 'aggressive'
      },
      {
        id: 'browser_cache_ttl',
        value: 14400 // 4 hours default
      },
      {
        id: 'always_online',
        value: 'on'
      },
      {
        id: 'development_mode',
        value: 'off'
      }
    ];

    for (const setting of cacheSettings) {
      try {
        await this.cf.zones.settings.edit(this.zoneId, setting.id, { value: setting.value });
        console.log(`✅ Configured cache setting: ${setting.id} = ${setting.value}`);
      } catch (error) {
        console.error(`❌ Failed to configure cache setting ${setting.id}: ${error.message}`);
      }
    }
  }

  async setupSecurityRules() {
    const securitySettings = [
      {
        id: 'security_level',
        value: 'medium'
      },
      {
        id: 'ssl',
        value: 'full'
      },
      {
        id: 'always_use_https',
        value: 'on'
      },
      {
        id: 'min_tls_version',
        value: '1.2'
      },
      {
        id: 'tls_1_3',
        value: 'on'
      },
      {
        id: 'automatic_https_rewrites',
        value: 'on'
      }
    ];

    for (const setting of securitySettings) {
      try {
        await this.cf.zones.settings.edit(this.zoneId, setting.id, { value: setting.value });
        console.log(`✅ Configured security setting: ${setting.id} = ${setting.value}`);
      } catch (error) {
        console.error(`❌ Failed to configure security setting ${setting.id}: ${error.message}`);
      }
    }
  }

  async configurePerformanceSettings() {
    const performanceSettings = [
      {
        id: 'minify',
        value: {
          css: 'on',
          html: 'on',
          js: 'on'
        }
      },
      {
        id: 'brotli',
        value: 'on'
      },
      {
        id: 'early_hints',
        value: 'on'
      },
      {
        id: 'http2',
        value: 'on'
      },
      {
        id: 'http3',
        value: 'on'
      }
    ];

    for (const setting of performanceSettings) {
      try {
        await this.cf.zones.settings.edit(this.zoneId, setting.id, { value: setting.value });
        console.log(`✅ Configured performance setting: ${setting.id}`);
      } catch (error) {
        console.error(`❌ Failed to configure performance setting ${setting.id}: ${error.message}`);
      }
    }
  }

  async purgeCache(urls = []) {
    try {
      if (urls.length === 0) {
        // Purge everything
        await this.cf.zones.purgeCache(this.zoneId, { purge_everything: true });
        console.log('✅ Purged entire cache');
      } else {
        // Purge specific URLs
        await this.cf.zones.purgeCache(this.zoneId, { files: urls });
        console.log(`✅ Purged cache for ${urls.length} URLs`);
      }
    } catch (error) {
      console.error('❌ Failed to purge cache:', error.message);
      throw error;
    }
  }

  async getCacheAnalytics(since = 7) {
    try {
      const analytics = await this.cf.zones.analytics.dashboard(this.zoneId, {
        since: `-${since}d`,
        until: 'now'
      });
      
      return {
        requests: analytics.result.totals.requests.all,
        bandwidth: analytics.result.totals.bandwidth.all,
        cacheHitRatio: analytics.result.totals.requests.cached / analytics.result.totals.requests.all,
        threats: analytics.result.totals.threats.all
      };
    } catch (error) {
      console.error('❌ Failed to get cache analytics:', error.message);
      throw error;
    }
  }
}

module.exports = CloudFlareCDNManager;