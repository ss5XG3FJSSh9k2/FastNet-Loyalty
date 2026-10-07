const fs = require('fs');

const file = 'x:/app/backend/tests/regression.js';
let content = fs.readFileSync(file, 'utf8');

const testCode = `
  // --- BF-PARTNER-REGION-GROUP ---
  console.log('\\n--- 36. BF-PARTNER-REGION-GROUP (UI assertions) ---');

  const appJsxCode = fs.readFileSync(path.join(__dirname, '../../frontend/src/App.jsx'), 'utf8');
  assert(appJsxCode.includes('groupedPartnerRegions.map(group =>'), 'App.jsx contains groupedPartnerRegions.map(group =>');
  assert(appJsxCode.includes('regionCardOpenState'), 'App.jsx contains regionCardOpenState');
  assert(appJsxCode.includes('toggleRegionCard'), 'App.jsx contains toggleRegionCard');
  pass('BF-PARTNER-REGION-GROUP UI string tests passed');
`;

const lines = content.split('\\n');
const insertIndex = lines.findIndex(l => l.includes('REGRESSION SUITE COMPLETED'));
if (insertIndex !== -1) {
  lines.splice(insertIndex, 0, testCode);
  fs.writeFileSync(file, lines.join('\\n'));
  console.log('Appended UI assertions.');
} else {
  console.log('Could not find insert point.');
}
