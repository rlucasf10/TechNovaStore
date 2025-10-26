#!/usr/bin/env node

const fs = require('fs');

const filePath = 'automation/auto-purchase/src/services/__mocks__/orderServiceClient.ts';

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add override to all async methods that don't have it
  const methods = [
    'markOrderAsProcessing',
    'updateTrackingInfo', 
    'getOrder',
    'getOrdersForAutoPurchase',
    'reportAutoPurchaseFailure',
    'reportAutoPurchaseSuccess',
    'healthCheck'
  ];
  
  for (const method of methods) {
    const regex = new RegExp(`(\\s+)async ${method}`, 'g');
    content = content.replace(regex, `$1override async ${method}`);
  }
  
  fs.writeFileSync(filePath, content);
  console.log('✅ Fixed override modifiers in orderServiceClient mock');
  
} catch (error) {
  console.error('❌ Error fixing overrides:', error.message);
}