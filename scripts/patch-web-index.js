#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'dist', 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('patch-web-index: dist/index.html not found');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

if (html.includes('type="module"')) {
  process.exit(0);
}

html = html.replace(
  /<script src="([^"]+)" defer><\/script>/,
  '<script type="module" src="$1" defer></script>',
);

fs.writeFileSync(indexPath, html);
console.log('patch-web-index: added type="module" to dist/index.html');
