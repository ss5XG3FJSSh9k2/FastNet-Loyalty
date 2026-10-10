const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const tables = [];
const regex = /<table[^>]*>/g;
let match;
while ((match = regex.exec(content)) !== null) {
  tables.push({ index: match.index, text: match[0] });
}

console.log(`Found ${tables.length} tables`);

let replacements = [];

for (let i = tables.length - 1; i >= 0; i--) {
  const t = tables[i];
  let snippetBefore = content.substring(Math.max(0, t.index - 300), t.index);
  
  // Find the opening div if it exists right before the table
  const divMatch = snippetBefore.match(/(<div[^>]*>)\s*$/);
  
  if (divMatch) {
    const divStr = divMatch[1];
    if (divStr.includes('overflowX')) {
      // Existing wrapper
      const divIndex = t.index - divMatch[0].length + divMatch[0].indexOf(divStr);
      let newDivStr = divStr.replace(/overflowX:\s*'auto'/, '').replace(/,\s*\}\}/, ' }}').replace(/\{\{\s*\}\}/, '{}');
      if (newDivStr.includes('style={{}}')) newDivStr = newDivStr.replace('style={{}}', '');
      if (newDivStr.includes('className="')) {
        newDivStr = newDivStr.replace('className="', 'className="table-scroll ');
      } else {
        newDivStr = newDivStr.replace('<div ', '<div className="table-scroll" ');
      }
      replacements.push({ start: divIndex, end: divIndex + divStr.length, newText: newDivStr, note: 'replaced wrapper' });
      continue;
    }
  }

  // Not wrapped or wrapped by a non-overflow div
  // We should just inject <div className="table-scroll"> before the table, and </div> after the table.
  // We need to find the matching </table>
  let tableEndIndex = content.indexOf('</table>', t.index) + 8;
  
  replacements.push({ start: tableEndIndex, end: tableEndIndex, newText: '\n</div>', note: 'added wrapper end' });
  replacements.push({ start: t.index, end: t.index, newText: '<div className="table-scroll">\n', note: 'added wrapper start' });
}

// Sort replacements by descending start index to apply them without shifting
replacements.sort((a, b) => b.start - a.start);

for (const r of replacements) {
  content = content.substring(0, r.start) + r.newText + content.substring(r.end);
}

fs.writeFileSync('frontend/src/App.jsx', content);
console.log('App.jsx modified successfully!');
