#!/usr/bin/env node
'use strict';

/**
 * Expo Go on LTE cannot use a LAN QR, and Cloudflare quick tunnels
 * (trycloudflare.com) return 530/1033 on many mobile networks.
 * The reliable path: iPhone Personal Hotspot, Mac joins that network.
 */

const { execFileSync, spawn } = require('child_process');
const path = require('path');

function networkSnapshot() {
  try {
    return execFileSync('ifconfig', { encoding: 'utf8' });
  } catch {
    return '';
  }
}

function isOnIphoneHotspot() {
  const info = networkSnapshot();
  // iOS Personal Hotspot default subnet (Wi‑Fi or USB).
  return /\binet 172\.20\.10\.\d+/.test(info);
}

async function waitForHotspot(timeoutMs = 180_000) {
  if (isOnIphoneHotspot()) return true;
  const started = Date.now();
  console.log('');
  console.log('============================================================');
  console.log('  Телефон на LTE. Туннель Cloudflare здесь не работает');
  console.log('  (ошибка 530 / 1033). Нужна одна сеть с Mac.');
  console.log('');
  console.log('  1. iPhone: Настройки → Режим модема → включить.');
  console.log('  2. Mac: Wi‑Fi → сеть «iPhone …»  ИЛИ  кабель USB.');
  console.log('  3. На Mac VPN выключен.');
  console.log('============================================================');
  console.log('');
  console.log('Жду сеть iPhone на Mac…');
  while (Date.now() - started < timeoutMs) {
    if (isOnIphoneHotspot()) {
      console.log('Mac в сети iPhone. Запускаю Expo.');
      return true;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

async function main() {
  const ready = await waitForHotspot();
  if (!ready) {
    console.error('');
    console.error('Mac так и не попал в сеть iPhone (нет адреса 172.20.10.x).');
    console.error('Включите режим модема и подключите Mac, затем снова: npm run phone');
    process.exit(1);
  }

  const expoCli = path.join(__dirname, '..', 'node_modules', 'expo', 'bin', 'cli');
  const extraArgs = process.argv.slice(2);
  const child = spawn(
    process.execPath,
    [expoCli, 'start', '--lan', '--clear', '--port', '8081', ...extraArgs],
    { stdio: 'inherit', env: process.env },
  );

  const shutdown = () => {
    if (!child.killed) child.kill('SIGINT');
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});
