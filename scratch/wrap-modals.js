const fs = require('fs');

let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// We want to find each occurrence of <div className="modal-content"...>
// and inject <PanelErrorBoundary t={t}> right after it.
// And then find the closing </div> for that modal-content and inject </PanelErrorBoundary> before it.
// 
// To do this reliably without a full AST parser, we can iterate through the file line by line
// and keep track of div nesting.

const lines = code.split('\n');
const outLines = [];

let inModalContent = false;
let divDepth = 0;
let modalContentDepth = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (inModalContent) {
    // Count open/close divs in this line
    const openCount = (line.match(/<div\b[^>]*>/g) || []).length;
    // self-closing divs don't count, but JSX rarely has <div />. Let's assume standard divs.
    const closeCount = (line.match(/<\/div>/g) || []).length;
    
    divDepth += openCount;
    divDepth -= closeCount;
    
    if (divDepth === modalContentDepth - 1) {
      // This line contains the closing tag for modal-content
      // We need to insert </PanelErrorBoundary> right before the </div>
      // But wait, the </div> might be on its own line.
      const match = line.match(/^(\s*)<\/div>/);
      if (match) {
        outLines.push(match[1] + '  </PanelErrorBoundary>');
        outLines.push(line);
      } else {
        // Just inject it before the last </div> in the line
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
    
    if (line.includes('className="modal-content"')) {
      inModalContent = true;
      // Recalculate depth up to this line
      // Actually, we just need to track depth from here on.
      divDepth = 1; // The modal-content div itself is open
      modalContentDepth = 1;
      
      const openCount = (line.match(/<div\b[^>]*>/g) || []).length;
      const closeCount = (line.match(/<\/div>/g) || []).length;
      // Adjust if multiple divs on this line
      divDepth = openCount - closeCount;
      modalContentDepth = openCount - closeCount;
      
      const indent = line.match(/^\s*/)[0];
      outLines.push(indent + '  <PanelErrorBoundary t={t}>');
      
      // What if the modal-content div is closed on the same line? Rare.
      if (divDepth === 0) {
        inModalContent = false;
        // This script doesn't handle single-line modal-content well, but they shouldn't exist.
      }
    }
  }
}

fs.writeFileSync('scratch/App_patched.jsx', outLines.join('\n'));
console.log('Done patching modals');
