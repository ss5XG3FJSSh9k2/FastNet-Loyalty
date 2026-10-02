const fs = require('fs');
const lines = fs.readFileSync('backend/config.js', 'utf8').split('\n');
// find the last line with '};'
let lastBracket = -1;
for(let i=lines.length-1; i>=0; i--) {
  if (lines[i].includes('};')) {
    lastBracket = i;
    break;
  }
}

if (lastBracket !== -1) {
  lines[lastBracket] = '  KYC_DOC_URL_TTL_SECONDS: 300,\n};';
  // clear lines after that
  lines.splice(lastBracket+1);
  fs.writeFileSync('backend/config.js', lines.join('\n'), 'utf8');
}
