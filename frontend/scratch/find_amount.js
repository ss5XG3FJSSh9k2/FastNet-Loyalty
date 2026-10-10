import fs from 'fs';
const content = fs.readFileSync('src/App.jsx', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('amount > 0 ?') || lines[i].includes('formatPoints(l.amount)')) {
    console.log(`${i+1}: ${lines[i].trim()}`);
  }
}
