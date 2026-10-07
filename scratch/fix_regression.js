const fs = require('fs');
const file = 'x:/app/backend/tests/regression.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /console\.log\(\`\\\\n[\\s\\S]*?\\-\\-\\- BF-SKU-DELETE \\-\\-\\- \'/g;

content = content.replace("console.log(`\\\\n\\n  // --- BF-SKU-DELETE ---", "  // --- BF-SKU-DELETE ---");
content = content.replace("console.log(`\\\\n\\r\\n  // --- BF-SKU-DELETE ---", "  // --- BF-SKU-DELETE ---");

// Or just re-insert the `REGRESSION SUITE COMPLETED` line at the very end
// But wait, the `REGRESSION SUITE COMPLETED` line got replaced by `console.log(\`\n` and then the rest was pushed down.
// Let's just fix it manually.
