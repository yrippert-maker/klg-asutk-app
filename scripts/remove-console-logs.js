const fs = require('fs');
const path = require('path');
const glob = require('glob');

const removeConsoleLogs = () => {
  const files = glob.sync('**/*.{js,jsx,ts,tsx}', {
    ignore: ['node_modules/**', 'scripts/**']
  });

  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/console\.(log|warn|error|info)\([^)]*\);?/g, '');
    fs.writeFileSync(file, content);
  });

  console.log(`Cleaned ${files.length} files`);
};

removeConsoleLogs();