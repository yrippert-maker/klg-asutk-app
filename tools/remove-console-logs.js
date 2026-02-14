const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

function removeConsoleLogsFromFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Удаляем console.log, но оставляем console.warn и console.error
    content = content.replace(/console\.log\([^)]*\);?/g, '');
    content = content.replace(/^\s*console\.log\([^)]*\);?\s*$/gm, '');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      logger.info(`Cleaned console.logs from: ${filePath}`);
      return true;
    }
  } catch (error) {
    logger.error(`Error processing ${filePath}:`, error.message);
  }
  return false;
}

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  let cleanedCount = 0;
  
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !['node_modules', '.git', '.next'].includes(file)) {
      cleanedCount += processDirectory(fullPath);
    } else if (file.match(/\.(js|jsx|ts|tsx)$/)) {
      if (removeConsoleLogsFromFile(fullPath)) {
        cleanedCount++;
      }
    }
  });
  
  return cleanedCount;
}

if (require.main === module) {
  const projectRoot = process.cwd();
  logger.info('Starting console.log cleanup...');
  const count = processDirectory(projectRoot);
  logger.info(`Cleanup complete. Modified ${count} files.`);
}

module.exports = { removeConsoleLogsFromFile, processDirectory };