import fs from 'fs';
const content = fs.readFileSync('src/App.jsx', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('map(') && (lines[i].includes('color') || lines[i+1]?.includes('color') || lines[i+2]?.includes('color'))) {
    // console.log(`${i+1}: ${lines[i].trim()}`);
  }
}
// Actually, let's just find the exact phrase "everything else is red" which the user said they've observed: "Check the other places that show ledger rows with their own colour rule... and report whether any of them have the same “everything else is red” rule."
