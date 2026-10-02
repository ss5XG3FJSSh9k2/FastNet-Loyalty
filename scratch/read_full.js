const fs = require('fs');
const lines = fs.readFileSync('C:/Users/thari/.gemini/antigravity-ide/brain/bc414b09-0546-45ef-97b7-541a3d622922/.system_generated/logs/transcript_full.jsonl', 'utf8').split('\n');
for (const line of lines) {
  if (line.includes('"step_index":61,')) {
    const obj = JSON.parse(line);
    console.log(obj.content);
  }
}
