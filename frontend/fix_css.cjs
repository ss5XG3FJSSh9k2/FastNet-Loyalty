const fs = require('fs');
let lines = fs.readFileSync('src/index.css', 'utf8').split('\n');
lines = lines.filter(l => !l.includes("'input[type=") && !l.includes('-webkit-inner-spin-button') && !l.includes('-moz-appearance'));
lines.push('input[type="number"]::-webkit-inner-spin-button,');
lines.push('input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }');
lines.push('input[type="number"] { -moz-appearance: textfield; }');
fs.writeFileSync('src/index.css', lines.join('\n'));

let appLines = fs.readFileSync('src/App.jsx', 'utf8').split('\n');
const appStart = 9485;
for(let i=appStart; i<appStart+15; i++) {
    if (appLines[i] === '                        />') {
        appLines[i] = '                              />';
    }
}
fs.writeFileSync('src/App.jsx', appLines.join('\n'));
