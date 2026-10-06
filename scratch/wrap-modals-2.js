const fs = require('fs');

let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');
const lines = code.split('\n');
const outLines = [];

let inModalContent = false;
let divDepth = 0;
let modalContentDepth = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (inModalContent) {
    const openCount = (line.match(/<div\b[^>]*>/g) || []).length;
    const closeCount = (line.match(/<\/div>/g) || []).length;
    
    divDepth += openCount;
    divDepth -= closeCount;
    
    if (divDepth === modalContentDepth - 1) {
      const match = line.match(/^(\s*)<\/div>/);
      if (match) {
        outLines.push(match[1] + '  </PanelErrorBoundary>');
        outLines.push(line);
      } else {
        const lastDivIndex = line.lastIndexOf('</div>');
        const newLine = line.substring(0, lastDivIndex) + '</PanelErrorBoundary></div>' + line.substring(lastDivIndex + 6);
        outLines.push(newLine);
      }
      inModalContent = false;
    } else {
      outLines.push(line);
    }
  } else {
    outLines.push(line);
    
    // Check if line contains a div with modal-content class
    if (line.match(/<div[^>]*className=[^>]*modal-content[^>]*>/)) {
      inModalContent = true;
      divDepth = 1; 
      modalContentDepth = 1;
      
      const openCount = (line.match(/<div\b[^>]*>/g) || []).length;
      const closeCount = (line.match(/<\/div>/g) || []).length;
      divDepth = openCount - closeCount;
      modalContentDepth = openCount - closeCount;
      
      const indent = line.match(/^\s*/)[0];
      outLines.push(indent + '  <PanelErrorBoundary t={t}>');
      
      if (divDepth === 0) {
        inModalContent = false;
      }
    }
  }
}

fs.writeFileSync('scratch/App_patched.jsx', outLines.join('\n'));
console.log('Done patching modals');
