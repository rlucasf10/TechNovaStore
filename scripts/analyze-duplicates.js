#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DuplicateAnalyzer {
  constructor() {
    this.fileHashes = new Map();
    this.duplicates = new Map();
    this.dockerConfigs = [];
    this.similarConfigs = [];
  }

  // Calculate MD5 hash of file content
  calculateFileHash(filePath) {
    try {
      const content = fs.readFileSync(filePath);
      return crypto.createHash('md5').update(content).digest('hex');
    } catch (error) {
      console.warn(`Error reading file ${filePath}: ${error.message}`);
      return null;
    }
  }

  // Recursively scan directory for files
  scanDirectory(dirPath, excludeDirs = ['node_modules', '.git', 'dist', 'build', 'coverage']) {
    const files = [];
    
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!excludeDirs.includes(item)) {
            files.push(...this.scanDirectory(fullPath, excludeDirs));
          }
        } else if (stat.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Error scanning directory ${dirPath}: ${error.message}`);
    }
    
    return files;
  }

  // Analyze files for exact duplicates by hash
  analyzeExactDuplicates() {
    console.log('🔍 Scanning for exact duplicate files...\n');
    
    const allFiles = this.scanDirectory('.');
    let processedFiles = 0;
    
    for (const filePath of allFiles) {
      const hash = this.calculateFileHash(filePath);
      if (hash) {
        if (this.fileHashes.has(hash)) {
          // Found duplicate
          const existingFile = this.fileHashes.get(hash);
          if (!this.duplicates.has(hash)) {
            this.duplicates.set(hash, [existingFile]);
          }
          this.duplicates.get(hash).push(filePath);
        } else {
          this.fileHashes.set(hash, filePath);
        }
        processedFiles++;
      }
    }
    
    console.log(`📊 Processed ${processedFiles} files`);
    console.log(`🔍 Found ${this.duplicates.size} groups of duplicate files\n`);
    
    return this.duplicates;
  }

  // Analyze Docker configurations for similarities
  analyzeDockerConfigurations() {
    console.log('🐳 Analyzing Docker configurations...\n');
    
    const dockerFiles = this.scanDirectory('.').filter(file => 
      file.includes('Dockerfile') || 
      file.includes('docker-compose') ||
      file.endsWith('.dockerfile')
    );
    
    for (const dockerFile of dockerFiles) {
      try {
        const content = fs.readFileSync(dockerFile, 'utf8');
        this.dockerConfigs.push({
          path: dockerFile,
          content: content,
          lines: content.split('\n').filter(line => line.trim() !== ''),
          size: content.length
        });
      } catch (error) {
        console.warn(`Error reading Docker file ${dockerFile}: ${error.message}`);
      }
    }
    
    // Compare Docker configurations for similarities
    this.findSimilarDockerConfigs();
    
    console.log(`📊 Found ${dockerFiles.length} Docker configuration files`);
    console.log(`🔍 Found ${this.similarConfigs.length} groups of similar configurations\n`);
    
    return this.dockerConfigs;
  }

  // Find similar Docker configurations (not exact duplicates)
  findSimilarDockerConfigs() {
    for (let i = 0; i < this.dockerConfigs.length; i++) {
      for (let j = i + 1; j < this.dockerConfigs.length; j++) {
        const config1 = this.dockerConfigs[i];
        const config2 = this.dockerConfigs[j];
        
        const similarity = this.calculateSimilarity(config1.content, config2.content);
        
        if (similarity > 0.7) { // 70% similarity threshold
          this.similarConfigs.push({
            files: [config1.path, config2.path],
            similarity: Math.round(similarity * 100),
            commonLines: this.findCommonLines(config1.lines, config2.lines)
          });
        }
      }
    }
  }

  // Calculate similarity between two strings
  calculateSimilarity(str1, str2) {
    const lines1 = str1.split('\n').filter(line => line.trim() !== '');
    const lines2 = str2.split('\n').filter(line => line.trim() !== '');
    
    const commonLines = this.findCommonLines(lines1, lines2);
    const totalLines = Math.max(lines1.length, lines2.length);
    
    return commonLines.length / totalLines;
  }

  // Find common lines between two arrays
  findCommonLines(lines1, lines2) {
    const common = [];
    const set2 = new Set(lines2.map(line => line.trim()));
    
    for (const line of lines1) {
      if (set2.has(line.trim()) && line.trim() !== '') {
        common.push(line.trim());
      }
    }
    
    return common;
  }

  // Generate detailed report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalDuplicateGroups: this.duplicates.size,
        totalDuplicateFiles: Array.from(this.duplicates.values()).reduce((sum, group) => sum + group.length, 0),
        dockerConfigFiles: this.dockerConfigs.length,
        similarDockerGroups: this.similarConfigs.length
      },
      exactDuplicates: [],
      dockerAnalysis: {
        configurations: this.dockerConfigs.map(config => ({
          path: config.path,
          size: config.size,
          lineCount: config.lines.length
        })),
        similarGroups: this.similarConfigs
      },
      recommendations: []
    };

    // Process exact duplicates
    for (const [hash, files] of this.duplicates) {
      if (files.length > 1) {
        report.exactDuplicates.push({
          hash: hash,
          files: files,
          count: files.length,
          recommendation: this.getRecommendation(files)
        });
      }
    }

    // Generate recommendations
    report.recommendations = this.generateRecommendations();

    return report;
  }

  // Get recommendation for duplicate files
  getRecommendation(files) {
    // Prioritize keeping files in certain directories
    const priorities = ['src/', 'services/', 'shared/'];
    
    for (const priority of priorities) {
      const priorityFile = files.find(file => file.includes(priority));
      if (priorityFile) {
        return `Keep: ${priorityFile}, Remove: ${files.filter(f => f !== priorityFile).join(', ')}`;
      }
    }
    
    // Default: keep the shortest path (likely more central)
    const shortest = files.reduce((a, b) => a.length <= b.length ? a : b);
    return `Keep: ${shortest}, Remove: ${files.filter(f => f !== shortest).join(', ')}`;
  }

  // Generate general recommendations
  generateRecommendations() {
    const recommendations = [];
    
    if (this.duplicates.size > 0) {
      recommendations.push({
        type: 'duplicates',
        priority: 'high',
        message: `Found ${this.duplicates.size} groups of duplicate files. Consider removing redundant copies to reduce codebase size.`
      });
    }
    
    if (this.similarConfigs.length > 0) {
      recommendations.push({
        type: 'docker',
        priority: 'medium',
        message: `Found ${this.similarConfigs.length} groups of similar Docker configurations. Consider consolidating common patterns into base images or shared configurations.`
      });
    }
    
    if (this.dockerConfigs.length > 10) {
      recommendations.push({
        type: 'docker',
        priority: 'low',
        message: `Found ${this.dockerConfigs.length} Docker configuration files. Consider organizing them into a dedicated docker/ directory.`
      });
    }
    
    return recommendations;
  }

  // Save report to file
  saveReport(report, filename = 'duplicate-analysis-report.json') {
    try {
      fs.writeFileSync(filename, JSON.stringify(report, null, 2));
      console.log(`📄 Report saved to: ${filename}`);
    } catch (error) {
      console.error(`Error saving report: ${error.message}`);
    }
  }

  // Print summary to console
  printSummary(report) {
    console.log('=' .repeat(60));
    console.log('📋 DUPLICATE ANALYSIS SUMMARY');
    console.log('=' .repeat(60));
    
    console.log(`\n📊 Statistics:`);
    console.log(`   • Duplicate file groups: ${report.summary.totalDuplicateGroups}`);
    console.log(`   • Total duplicate files: ${report.summary.totalDuplicateFiles}`);
    console.log(`   • Docker config files: ${report.summary.dockerConfigFiles}`);
    console.log(`   • Similar Docker groups: ${report.summary.similarDockerGroups}`);
    
    if (report.exactDuplicates.length > 0) {
      console.log(`\n🔍 Exact Duplicates Found:`);
      report.exactDuplicates.forEach((group, index) => {
        console.log(`\n   Group ${index + 1} (${group.count} files):`);
        group.files.forEach(file => console.log(`     • ${file}`));
        console.log(`     💡 ${group.recommendation}`);
      });
    }
    
    if (report.dockerAnalysis.similarGroups.length > 0) {
      console.log(`\n🐳 Similar Docker Configurations:`);
      report.dockerAnalysis.similarGroups.forEach((group, index) => {
        console.log(`\n   Group ${index + 1} (${group.similarity}% similar):`);
        group.files.forEach(file => console.log(`     • ${file}`));
        console.log(`     📝 Common patterns: ${group.commonLines.length} shared lines`);
      });
    }
    
    if (report.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      report.recommendations.forEach((rec, index) => {
        const priority = rec.priority.toUpperCase();
        console.log(`   ${index + 1}. [${priority}] ${rec.message}`);
      });
    }
    
    console.log('\n' + '=' .repeat(60));
  }

  // Main execution method
  async run() {
    console.log('🚀 Starting Duplicate File Analysis...\n');
    
    // Analyze exact duplicates
    this.analyzeExactDuplicates();
    
    // Analyze Docker configurations
    this.analyzeDockerConfigurations();
    
    // Generate and save report
    const report = this.generateReport();
    this.saveReport(report);
    this.printSummary(report);
    
    console.log('\n✅ Analysis complete!');
    return report;
  }
}

// Run the analyzer if called directly
if (require.main === module) {
  const analyzer = new DuplicateAnalyzer();
  analyzer.run().catch(console.error);
}

module.exports = DuplicateAnalyzer;