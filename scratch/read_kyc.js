const fs = require('fs');
const serverJs = fs.readFileSync('backend/server.js', 'utf8');
const lines = serverJs.split('\n');
let found = false;
let printed = 0;
for (const line of lines) {
  if (line.includes("app.use('/api/kyc/documents'")) {
    found = true;
  }
  if (found && printed < 25) {
    console.log(line);
    printed++;
  }
}
