const fs = require('fs');
let c = fs.readFileSync('frontend/src/App.jsx', 'utf8');

c = c.replace(/const apiOrigin = API_BASE\.replace\(.+$/, "const apiOrigin = API_BASE.replace(/\\/api\\/?$/, '');");
c = c.replace(/const resolvedUrl = \/\^https\?:.+\.test\(docUrl\).+$/, "const resolvedUrl = /^https?:\\/\\//i.test(docUrl) ? docUrl : `${apiOrigin}${docUrl}`;");

fs.writeFileSync('frontend/src/App.jsx', c);
