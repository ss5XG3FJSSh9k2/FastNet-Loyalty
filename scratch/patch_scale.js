const fs = require('fs');

let css = fs.readFileSync('frontend/src/index.css', 'utf8');

const scaleCss = `
:root {
  --ui-scale: 1;
}

@media (min-width: 1024px) {
  :root {
    --ui-scale: 0.9;
  }
  html {
    zoom: var(--ui-scale);
  }
}
`;

if (!css.includes('--ui-scale')) {
  css = css.replace(/:root\s*\{/, scaleCss + '\n:root {');
}

// Replace vh/vw in css
css = css.replace(/(\d+)vh/g, 'calc($1vh / var(--ui-scale))');
css = css.replace(/(\d+)vw/g, 'calc($1vw / var(--ui-scale))');

fs.writeFileSync('frontend/src/index.css', css);

let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');
app = app.replace(/'(\d+)(vh|vw)'/g, "\`calc($1$2 / var(--ui-scale))\`");
fs.writeFileSync('frontend/src/App.jsx', app);
console.log('Scaled everything successfully.');
