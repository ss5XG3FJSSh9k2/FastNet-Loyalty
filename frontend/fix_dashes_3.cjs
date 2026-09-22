const fs = require('fs');

let app = fs.readFileSync('src/App.jsx', 'utf8');

app = app.replace(/\}( ?)—( ?)\{loginPhone\}/g, '}: {loginPhone}');

fs.writeFileSync('src/App.jsx', app);
