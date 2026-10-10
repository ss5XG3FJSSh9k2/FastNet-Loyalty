import fs from 'fs';
const content = fs.readFileSync('src/App.jsx', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('var(--danger)') && (lines[i].includes('EARN') || lines[i].includes('amount') || lines[i].includes('type'))) {
    console.log(`${i+1}: ${lines[i].trim()}`);
  }
}
