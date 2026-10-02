const cp = require('child_process');
const serverJs = cp.execSync('git show origin/master:backend/server.js').toString();
const lines = serverJs.split('\n');
let found = false;
let printed = 0;
for (const line of lines) {
  if (line.includes("app.get('/api/admin/analytics',")) {
    found = true;
  }
  if (found && printed < 20) {
    console.log(line);
    printed++;
  }
}
