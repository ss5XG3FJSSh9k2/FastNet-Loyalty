const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf8');

const t1 = "const apiOrigin = API_BASE.replace(/\\\\/api\\\\/?$/, '');";
const r1 = "const apiOrigin = API_BASE.replace(/\\/api\\/?$/, '');";

const t2 = "const resolvedUrl = /^https?:\\\\/\\\\//i.test(docUrl) ? docUrl : `${apiOrigin}${docUrl}`;";
const r2 = "const resolvedUrl = /^https?:\\/\\//i.test(docUrl) ? docUrl : `${apiOrigin}${docUrl}`;";

c = c.replace(t1, r1);
c = c.replace(t2, r2);

fs.writeFileSync('src/App.jsx', c);
console.log('Fixed exactly');
