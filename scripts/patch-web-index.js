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

// Expo SPA bundle needs ES module mode (zustand uses import.meta)
if (!html.includes('type="module"')) {
  html = html.replace(
    /<script src="([^"]+)" defer><\/script>/,
    '<script type="module" src="$1" defer></script>',
  );
}

const pwaHead = `
    <link rel="manifest" href="/tails/manifest.json" />
    <meta name="theme-color" content="#8B7FFF" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Хвостик" />
    <link rel="apple-touch-icon" href="/tails/apple-touch-icon.png" />
`;

if (!html.includes('rel="manifest"')) {
  html = html.replace('</head>', `${pwaHead}</head>`);
}

if (!html.includes('viewport-fit=cover')) {
  html = html.replace(
    /content="width=device-width, initial-scale=1, shrink-to-fit=no"/,
    'content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, shrink-to-fit=no"',
  );
}

// Mobile Safari: lock to dynamic viewport so chrome UI doesn't make the page scrollable
const viewportCss = `
    <style id="hvostik-viewport">
      html, body, #root {
        height: 100%;
        height: 100dvh;
        max-height: 100dvh;
        width: 100%;
        overflow: hidden;
        overscroll-behavior: none;
        touch-action: manipulation;
      }
      body {
        position: fixed;
        inset: 0;
      }
      #root {
        display: flex;
        flex-direction: column;
      }
    </style>
`;

if (!html.includes('id="hvostik-viewport"')) {
  html = html.replace('</head>', `${viewportCss}</head>`);
}

const swScript = `
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('/tails/sw.js', { scope: '/tails/' }).catch(function () {});
      });
    }
  </script>
`;

if (!html.includes('serviceWorker.register')) {
  html = html.replace('</body>', `${swScript}</body>`);
}

fs.writeFileSync(indexPath, html);
console.log('patch-web-index: module + PWA + mobile viewport applied');
