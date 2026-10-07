const fs = require('fs');
const file = 'x:/app/backend/tests/regression.js';
let lines = fs.readFileSync(file, 'utf8').split('\\n');

// Clean up lines 5817 and any other dangling templates
for(let i = 0; i < lines.length; i++) {
  if (lines[i].includes('console.log(`\\n') && !lines[i].includes('===')) {
    lines[i] = '';
  }
  if (lines[i].includes('// deleted===')) {
    lines[i] = '  console.log(`\\n=== REGRESSION SUITE COMPLETED: ${passedCount}/${testCount} tests passed ===`);';
  }
}

fs.writeFileSync(file, lines.join('\\n'));
console.log('Fixed regression.js');
