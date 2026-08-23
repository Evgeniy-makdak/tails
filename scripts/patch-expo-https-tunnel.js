#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const file = path.join(
  __dirname,
  '..',
  'node_modules/expo/node_modules/@expo/cli/build/src/start/server/UrlCreator.js',
);

if (!fs.existsSync(file)) {
  process.exit(0);
}

let src = fs.readFileSync(file, 'utf8');
if (src.includes("protocol === 'exp'") && src.includes("protocol = 'exps'")) {
  process.exit(0);
}

const oldProxy = `    if (parsedProxyUrl.protocol === 'https:') {
        if (protocol === 'http') {
            protocol = 'https';
        }
        if (!parsedProxyUrl.port) {
            parsedProxyUrl.port = '443';
        }
    }`;

const newProxy = `    if (parsedProxyUrl.protocol === 'https:') {
        if (protocol === 'http') {
            protocol = 'https';
        }
        if (protocol === 'exp') {
            protocol = 'exps';
        }
    }`;

const oldTunnel = `        const parsed = new (_url()).URL(tunnelUrl);
        return {
            port: parsed.port,
            hostname: parsed.hostname,
            protocol: options.scheme ?? 'http'
        };`;

const newTunnel = `        const parsed = new (_url()).URL(tunnelUrl);
        let protocol = options.scheme ?? 'http';
        if (parsed.protocol === 'https:') {
            if (protocol === 'http') {
                protocol = 'https';
            }
            if (protocol === 'exp') {
                protocol = 'exps';
            }
        }
        return {
            port: parsed.port,
            hostname: parsed.hostname,
            protocol
        };`;

if (!src.includes(oldProxy) || !src.includes(oldTunnel)) {
  console.warn('[hvostik] Expo UrlCreator.js changed — skip exps:// patch');
  process.exit(0);
}

fs.writeFileSync(file, src.replace(oldProxy, newProxy).replace(oldTunnel, newTunnel));
