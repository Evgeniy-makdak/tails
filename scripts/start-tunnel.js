#!/usr/bin/env node
'use strict';

/**
 * Share the web preview with a tester in another city.
 * Expo Go + Cloudflare quick tunnels fail on mobile (530 / 1033).
 * A normal HTTPS URL in Safari/Chrome works over the same tunnel.
 */

const { spawn } = require('child_process');
const http = require('http');
const https = require('https');
const path = require('path');

const PORT = Number(process.env.RCT_METRO_PORT || process.env.PORT || 8081);

function fetchStatus(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https:') ? https : http;
    const req = lib.get(url, { timeout: 8000, rejectUnauthorized: true }, (res) => {
      res.resume();
      resolve(res.statusCode || 0);
    });
    req.on('error', () => resolve(0));
    req.on('timeout', () => {
      req.destroy();
      resolve(0);
    });
  });
}

async function waitFor(url, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const code = await fetchStatus(url);
    if (code >= 200 && code < 500) return code;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return 0;
}

function copyToClipboard(text) {
  try {
    const pb = spawn('pbcopy', { stdio: ['pipe', 'ignore', 'ignore'] });
    pb.stdin.end(text);
  } catch {
    // clipboard optional
  }
}

function printShareUrl(url) {
  copyToClipboard(url);
  console.log('');
  console.log('============================================================');
  console.log('  Ссылка для тестировщика (другой город / LTE):');
  console.log('');
  console.log(`  ${url}`);
  console.log('');
  console.log('  Откройте в Safari или Chrome на телефоне.');
  console.log('  Не Expo Go и не QR exp:// — обычный браузер.');
  console.log('  Ссылка скопирована в буфер. Mac не должен засыпать.');
  console.log('============================================================');
  console.log('');
}

async function main() {
  const tunnel = require(path.join(__dirname, '..', 'vendor', 'expo-ngrok'));
  const extraArgs = process.argv.slice(2);
  const expoCli = path.join(__dirname, '..', 'node_modules', 'expo', 'bin', 'cli');

  const caffeinate = spawn('caffeinate', ['-dims'], {
    stdio: 'ignore',
  });

  console.log('');
  console.log('Запускаю веб-превью и туннель для удалённой проверки…');
  console.log('');

  const expo = spawn(
    process.execPath,
    [expoCli, 'start', '--web', '--port', String(PORT), ...extraArgs],
    { stdio: 'inherit', env: process.env },
  );

  const shutdown = async () => {
    if (!expo.killed) expo.kill('SIGINT');
    caffeinate.kill('SIGINT');
    try {
      await tunnel.kill();
    } catch {
      // already closed
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  expo.on('exit', async (code, signal) => {
    caffeinate.kill('SIGINT');
    try {
      await tunnel.kill();
    } catch {
      // already closed
    }
    if (signal) process.kill(process.pid, signal);
    else process.exit(code ?? 0);
  });

  const localOk = await waitFor(`http://127.0.0.1:${PORT}`, 60_000);
  if (!localOk) {
    console.error('Metro на localhost:8081 не ответил. Проверьте, что порт свободен.');
    await shutdown();
    process.exit(1);
  }

  let lastUrl = '';
  const startOnce = async () => {
    const publicUrl = await tunnel.connect({
      port: PORT,
      onLogEvent(line) {
        if (/Registered tunnel|Connection terminated|failed to serve/i.test(line)) {
          console.log(`[cloudflared] ${line}`);
        }
      },
    });
    const remoteOk = await waitFor(publicUrl, 45_000);
    if (!remoteOk) {
      console.error('Публичный туннель ещё не отвечает. Подождите и обновите ссылку в браузере.');
    }
    if (publicUrl !== lastUrl) {
      lastUrl = publicUrl;
      printShareUrl(publicUrl);
    }
    const proc = tunnel.getActiveProcess();
    if (proc && proc.exitCode == null) {
      await new Promise((resolve) => proc.once('exit', resolve));
    }
  };

  try {
    while (!expo.killed) {
      await startOnce();
      if (expo.killed) break;
      console.log('Туннель оборвался. Поднимаю заново — отправьте тестировщику новую ссылку.');
      await new Promise((r) => setTimeout(r, 2000));
    }
  } catch (error) {
    console.error('');
    console.error('Не удалось поднять туннель.');
    console.error(error && error.message ? error.message : error);
    await shutdown();
    process.exit(1);
  }
}

main();
