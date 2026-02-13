#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// console.log('🧹 Очистка debug кода...');

const files = glob.sync('**/*.{js,ts,tsx}', {
  ignore: ['node_modules/**', 'dist/**', '.next/**', 'scripts/**']
});

let totalRemoved = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const cleaned = content.replace(/console\.(log|warn|info|debug)\([^)]*\);?/g, '');
  
  if (content !== cleaned) {
    fs.writeFileSync(file, cleaned);
    console.log(`✅ Очищен: ${file}`);
    totalRemoved++;
  }
});

console.log(`🎉 Обработано ${totalRemoved} файлов`);