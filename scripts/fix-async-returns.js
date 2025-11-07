#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class AsyncReturnFixer {
  constructor() {
    this.fixedFiles = [];
    this.patterns = [
      // Pattern for res.status().json() without return
      {
        regex: /(\s+)(res\.status\(\d+\)\.json\([^;]+\));(\s*$)/gm,
        replacement: '$1return $2;$3'
      },
      // Pattern for res.json() without return
      {
        regex: /(\s+)(res\.json\([^;]+\));(\s*$)/gm,
        replacement: '$1return $2;$3'
      },
      // Pattern for res.send() without return
      {
        regex: /(\s+)(res\.send\([^;]+\));(\s*$)/gm,
        replacement: '$1return $2;$3'
      }
    ];
  }

  fixFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;

      for (const pattern of this.patterns) {
        const originalContent = content;
        content = content.replace(pattern.regex, pattern.replacement);
        if (content !== originalContent) {
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(filePath, content);
        this.fixedFiles.push(filePath);
        console.log(`✅ Fixed: ${filePath}`);
      }

    } catch (error) {
      console.error(`❌ Error fixing ${filePath}: ${error.message}`);
    }
  }

  scanDirectory(dirPath, extensions = ['.ts']) {
    const files = [];
    
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !['node_modules', 'dist', '.git'].includes(item)) {
          files.push(...this.scanDirectory(fullPath, extensions));
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Warning: Cannot scan ${dirPath}: ${error.message}`);
    }
    
    return files;
  }

  run() {
    console.log('🔧 Fixing async function return statements...\n');

    // Target directories
    const targetDirs = [
      'domains/customer/user-service/src/controllers',
      'services/order/src/controllers',
      'domains/catalog/product-service/src/controllers',
      'domains/customer/notification-service/src',
      'ai-services/chatbot/src'
    ];

    for (const dir of targetDirs) {
      if (fs.existsSync(dir)) {
        console.log(`📁 Scanning: ${dir}`);
        const files = this.scanDirectory(dir);
        
        for (const file of files) {
          this.fixFile(file);
        }
      } else {
        console.log(`⚠️ Directory not found: ${dir}`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   • Files scanned: ${this.fixedFiles.length > 0 ? 'Multiple' : '0'}`);
    console.log(`   • Files fixed: ${this.fixedFiles.length}`);
    
    if (this.fixedFiles.length > 0) {
      console.log(`\n✅ Fixed files:`);
      this.fixedFiles.forEach(file => console.log(`   • ${file}`));
    }

    console.log('\n🎉 Async return fixing complete!');
  }
}

// Run if called directly
if (require.main === module) {
  const fixer = new AsyncReturnFixer();
  fixer.run();
}

module.exports = AsyncReturnFixer;