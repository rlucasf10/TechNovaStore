#!/usr/bin/env node

/**
 * Auto-scaling monitor for TechNovaStore
 * Monitors system metrics and scales services automatically
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class AutoScalingMonitor {
  constructor() {
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
      
      // Minimum and maximum replicas
      minReplicas: {
        'api-gateway': 2,
        'product-service': 2,
        'order-service': 2,
        'frontend': 2
      },
      maxReplicas: {
        'api-gateway': 10,
        'product-service': 8,
        'order-service': 6,
        'frontend': 6
      },
      
      // Scaling cooldown periods (seconds)
      scaleUpCooldown: 60,
      scaleDownCooldown: 300,
      
      // Check interval (seconds)
      checkInterval: 30
    };
    
    this.lastScaleAction = {};
    this.metrics = {};
  }

  async start() {
    console.log('🚀 Starting Auto-scaling Monitor for TechNovaStore');
    console.log(`📊 Check interval: ${this.config.checkInterval}s`);
    
    // Initial metrics collection
    await this.collectMetrics();
    
    // Start monitoring loop
    setInterval(async () => {
      try {
        await this.collectMetrics();
        await this.evaluateScaling();
      } catch (error) {
        console.error('❌ Error in monitoring loop:', error.message);
      }
    }, this.config.checkInterval * 1000);
  }

  async collectMetrics() {
    try {
      // Collect Docker container metrics
      const dockerStats = await this.getDockerStats();
      
      // Collect response time metrics from Prometheus if available
      const responseTimeMetrics = await this.getResponseTimeMetrics();
      
      // Collect current replica counts
      const replicaCounts = await this.getCurrentReplicaCounts();
      
      this.metrics = {
        docker: dockerStats,
        responseTime: responseTimeMetrics,
        replicas: replicaCounts,
        timestamp: new Date().toISOString()
      };
      
      console.log(`📈 Metrics collected at ${this.metrics.timestamp}`);
    } catch (error) {
      console.error('❌ Error collecting metrics:', error.message);
    }
  }

  async getDockerStats() {
    return new Promise((resolve, reject) => {
      exec('docker stats --no-stream --format "table {{.Container}}\\t{{.CPUPerc}}\\t{{.MemPerc}}"', (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        
        const lines = stdout.trim().split('\n').slice(1); // Skip header
        const stats = {};
        
        lines.forEach(line => {
          const [container, cpu, memory] = line.split('\t');
          const serviceName = this.extractServiceName(container);
          
          if (serviceName) {
            stats[serviceName] = {
              cpu: parseFloat(cpu.replace('%', '')),
              memory: parseFloat(memory.replace('%', ''))
            };
          }
        });
        
        resolve(stats);
      });
    });
  }

  async getResponseTimeMetrics() {
    // In a real implementation, this would query Prometheus
    // For now, we'll simulate response time metrics
    return {
      'api-gateway': Math.random() * 1000 + 200,
      'product-service': Math.random() * 800 + 150,
      'order-service': Math.random() * 600 + 100,
      'frontend': Math.random() * 400 + 50
    };
  }

  async getCurrentReplicaCounts() {
    const services = ['api-gateway', 'product-service', 'order-service', 'frontend'];
    const counts = {};
    
    for (const service of services) {
      try {
        const result = await this.execCommand(`docker service ls --filter name=${service} --format "{{.Replicas}}"`);
        const replicas = result.trim().split('/')[0];
        counts[service] = parseInt(replicas) || 1;
      } catch (error) {
        // Fallback to docker-compose scale check
        try {
          const result = await this.execCommand(`docker-compose ps -q ${service} | wc -l`);
          counts[service] = parseInt(result.trim()) || 1;
        } catch (fallbackError) {
          counts[service] = 1; // Default to 1 if unable to determine
        }
      }
    }
    
    return counts;
  }

  async evaluateScaling() {
    const services = Object.keys(this.config.minReplicas);
    
    for (const service of services) {
      const shouldScale = await this.shouldScaleService(service);
      
      if (shouldScale.action !== 'none') {
        await this.scaleService(service, shouldScale.action, shouldScale.reason);
      }
    }
  }

  async shouldScaleService(service) {
    const metrics = this.metrics.docker[service];
    const responseTime = this.metrics.responseTime[service];
    const currentReplicas = this.metrics.replicas[service];
    
    if (!metrics) {
      return { action: 'none', reason: 'No metrics available' };
    }
    
    // Check cooldown periods
    const lastAction = this.lastScaleAction[service];
    if (lastAction) {
      const timeSinceLastAction = (Date.now() - lastAction.timestamp) / 1000;
      const cooldownPeriod = lastAction.action === 'up' ? 
        this.config.scaleUpCooldown : this.config.scaleDownCooldown;
      
      if (timeSinceLastAction < cooldownPeriod) {
        return { action: 'none', reason: `Cooldown period active (${Math.round(cooldownPeriod - timeSinceLastAction)}s remaining)` };
      }
    }
    
    // Scale up conditions
    const shouldScaleUp = (
      metrics.cpu > this.config.scaleUpCpuThreshold ||
      metrics.memory > this.config.scaleUpMemoryThreshold ||
      responseTime > this.config.scaleUpResponseTimeThreshold
    ) && currentReplicas < this.config.maxReplicas[service];
    
    if (shouldScaleUp) {
      const reasons = [];
      if (metrics.cpu > this.config.scaleUpCpuThreshold) reasons.push(`CPU: ${metrics.cpu}%`);
      if (metrics.memory > this.config.scaleUpMemoryThreshold) reasons.push(`Memory: ${metrics.memory}%`);
      if (responseTime > this.config.scaleUpResponseTimeThreshold) reasons.push(`Response time: ${responseTime}ms`);
      
      return { 
        action: 'up', 
        reason: `Scale up triggered - ${reasons.join(', ')}` 
      };
    }
    
    // Scale down conditions
    const shouldScaleDown = (
      metrics.cpu < this.config.scaleDownCpuThreshold &&
      metrics.memory < this.config.scaleDownMemoryThreshold &&
      responseTime < this.config.scaleDownResponseTimeThreshold
    ) && currentReplicas > this.config.minReplicas[service];
    
    if (shouldScaleDown) {
      return { 
        action: 'down', 
        reason: `Scale down triggered - CPU: ${metrics.cpu}%, Memory: ${metrics.memory}%, Response time: ${responseTime}ms` 
      };
    }
    
    return { action: 'none', reason: 'Metrics within normal range' };
  }

  async scaleService(service, action, reason) {
    const currentReplicas = this.metrics.replicas[service];
    const newReplicas = action === 'up' ? currentReplicas + 1 : currentReplicas - 1;
    
    console.log(`🔄 Scaling ${service} ${action}: ${currentReplicas} -> ${newReplicas} replicas`);
    console.log(`📝 Reason: ${reason}`);
    
    try {
      // Try Docker Swarm scaling first
      await this.execCommand(`docker service scale ${service}=${newReplicas}`);
      console.log(`✅ Successfully scaled ${service} using Docker Swarm`);
    } catch (swarmError) {
      try {
        // Fallback to docker-compose scaling
        await this.execCommand(`docker-compose up -d --scale ${service}=${newReplicas}`);
        console.log(`✅ Successfully scaled ${service} using docker-compose`);
      } catch (composeError) {
        console.error(`❌ Failed to scale ${service}:`, composeError.message);
        return;
      }
    }
    
    // Record the scaling action
    this.lastScaleAction[service] = {
      action,
      timestamp: Date.now(),
      oldReplicas: currentReplicas,
      newReplicas,
      reason
    };
    
    // Log scaling event
    await this.logScalingEvent(service, action, currentReplicas, newReplicas, reason);
  }

  async logScalingEvent(service, action, oldReplicas, newReplicas, reason) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      service,
      action,
      oldReplicas,
      newReplicas,
      reason,
      metrics: this.metrics.docker[service]
    };
    
    const logFile = path.join(__dirname, '../../logs/auto-scaling.log');
    
    try {
      await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('❌ Failed to write scaling log:', error.message);
    }
  }

  extractServiceName(containerName) {
    // Extract service name from container name
    const patterns = [
      /technovastore-(.+?)-\d+/,
      /technovastore-(.+?)$/,
      /(.+?)-\d+$/,
      /(.+?)$/
    ];
    
    for (const pattern of patterns) {
      const match = containerName.match(pattern);
      if (match && this.config.minReplicas[match[1]]) {
        return match[1];
      }
    }
    
    return null;
  }

  async execCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(stdout);
      });
    });
  }
}

// Start the monitor if this file is run directly
if (require.main === module) {
  const monitor = new AutoScalingMonitor();
  monitor.start().catch(console.error);
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Auto-scaling Monitor');
    process.exit(0);
  });
}

module.exports = AutoScalingMonitor;