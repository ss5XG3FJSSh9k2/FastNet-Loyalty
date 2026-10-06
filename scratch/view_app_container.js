const fs = require('fs');
const lines = fs.readFileSync('frontend/src/App.jsx', 'utf8').split('\n');
const start = lines.findIndex(l => l.includes('app-container'));
console.log(lines.slice(Math.max(0, start - 10), start + 25).join('\n'));
