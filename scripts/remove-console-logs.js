#!/usr/bin/env node
/**
 * Удаляет console.log и console.info из исходников (не трогает console.warn/error).
 * Использование: node scripts/remove-console-logs.js
 */
const fs = require('fs');
const path = require('path');

function walkDir(dir, ext, callback) {
  if (!fs.existsSync(dir)) return;
  const list = fs.readdirSync(dir);
  for (const name of list) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (name !== 'node_modules' && name !== '.next' && name !== 'out') walkDir(full, ext, callback);
    } else if (ext.some((e) => name.endsWith(e))) {
      callback(full);
    }
  }
}

const exts = ['.js', '.jsx', '.ts', '.tsx'];
let total = 0;

walkDir(path.join(__dirname, '..'), exts, (file) => {
  let content = fs.readFileSync(file, 'utf8');
  const before = content;
  // Удаляем строки с console.log( ... ); и console.info( ... );
  content = content.replace(/^\s*console\.(log|info)\s*\([^)]*\)\s*;?\s*$/gm, '');
  if (content !== before) {
    fs.writeFileSync(file, content.trimEnd() + '\n');
    total++;
  }
});

console.log('Cleaned %d files', total);
