#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class DoubleReturnFixer {
  constructor() {
    this.fixedFiles = [];
  }

  fixFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;

      // Fix double returns
      content = content.replace(/return return /g, 'return ');

      if (content !== originalContent) {
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
    console.log('🔧 Fixing double return statements...\n');

    // Scan entire project
    const files = this.scanDirectory('.');
    
    for (const file of files) {
      this.fixFile(file);
    }

    console.log(`\n📊 Summary:`);
    console.log(`   • Files fixed: ${this.fixedFiles.length}`);
    
    if (this.fixedFiles.length > 0) {
      console.log(`\n✅ Fixed files:`);
      this.fixedFiles.forEach(file => console.log(`   • ${file}`));
    }

    console.log('\n🎉 Double return fixing complete!');
  }
}

// Run if called directly
if (require.main === module) {
  const fixer = new DoubleReturnFixer();
  fixer.run();
}

module.exports = DoubleReturnFixer;