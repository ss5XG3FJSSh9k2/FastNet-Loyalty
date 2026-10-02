const fs = require('fs');
let c = fs.readFileSync('frontend/src/App.jsx', 'utf8');
c = c.replace(/\\\/api\\\/\?/, '\\/api\\/?');
c = c.replace(/https\?:\\\\\/\\\\/, 'https?:\\/\\/');
c = c.replace(/\\\/api\\\\/, '\\/api\\'); // In case of more backslashes
c = c.replace(/const apiOrigin = API_BASE\.replace\(\/\\\\\/api\\\\\\\/\?\$\/, ''\);/, "const apiOrigin = API_BASE.replace(/\\/api\\/?$/, '');");
c = c.replace(/const resolvedUrl = \/\^https\?:\\\\\/\\\\\/\/i\.test\(docUrl\) \? docUrl : `\$\{apiOrigin\}\$\{docUrl\}`;/, "const resolvedUrl = /^https?:\\/\\//i.test(docUrl) ? docUrl : `${apiOrigin}${docUrl}`;");

fs.writeFileSync('frontend/src/App.jsx', c);
console.log('Fixed');
