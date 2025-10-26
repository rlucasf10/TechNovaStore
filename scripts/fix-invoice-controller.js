#!/usr/bin/env node

const fs = require('fs');

const filePath = 'services/order/src/controllers/invoiceController.ts';

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace all static async methods with asyncHandler pattern
  content = content.replace(
    /static async (\w+)\(req: Request, res: Response\): Promise<void> \{/g,
    'static $1 = asyncHandler(async (req: Request, res: Response) => {'
  );
  
  // Remove all the try-catch blocks and their closing braces
  content = content.replace(/\s*try \{\s*/g, '');
  content = content.replace(/\s*\} catch \(error\) \{\s*logger\.error[^}]+\}\s*\}/g, '');
  
  // Remove unreachable return statements
  content = content.replace(/\s*return;\s*/g, '');
  
  // Fix the closing braces - change } to });
  const lines = content.split('\n');
  const fixedLines = [];
  let inMethod = false;
  let braceCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('= asyncHandler(async')) {
      inMethod = true;
      braceCount = 0;
    }
    
    if (inMethod) {
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      braceCount += openBraces - closeBraces;
      
      if (braceCount === 0 && line.trim() === '}') {
        fixedLines.push(line.replace('}', '});'));
        inMethod = false;
      } else {
        fixedLines.push(line);
      }
    } else {
      fixedLines.push(line);
    }
  }
  
  content = fixedLines.join('\n');
  
  fs.writeFileSync(filePath, content);
  console.log('✅ Fixed invoiceController.ts');
  
} catch (error) {
  console.error('❌ Error fixing invoiceController:', error.message);
}