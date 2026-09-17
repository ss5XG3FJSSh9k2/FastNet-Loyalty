const fs = require('fs');
const appJsx = fs.readFileSync('src/App.jsx', 'utf8');
const selectCount = (appJsx.match(/<select/g) || []).length;
const classCount = (appJsx.match(/<select[^>]*className=[`'"]text-input[`'"]/g) || []).length;
if (selectCount !== classCount) {
  console.error(`REGRESSION: Found ${selectCount} <select> tags but only ${classCount} have className="text-input".`);
  process.exit(1);
}
console.log('OK');
