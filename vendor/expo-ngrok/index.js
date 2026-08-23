'use strict';

const { execFileSync, spawn } = require('child_process');
const os = require('os');
const path = require('path');

const URL_RE = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i;
const START_TIMEOUT_MS = 60_000;

let child = null;
let publicUrl = null;

function binaryPath() {
  const override = process.env.CLOUDFLARED_BIN && process.env.CLOUDFLARED_BIN.trim();
  if (override) return override;
  const ext = process.platform === 'win32' ? '.exe' : '';
  return path.join(os.homedir(), '.expo', 'expo-cloudflared', `cloudflared${ext}`);
}

async function ensureCloudflared() {
  const cloudflared = require('expo-cloudflared');
  if (typeof cloudflared.ensureBinary === 'function') {
    await cloudflared.ensureBinary();
  }
}

function portFromOpts(opts) {
  if (opts == null) return 8081;
  if (typeof opts === 'number') return opts;
  if (typeof opts === 'string' && /^\d+$/.test(opts)) return Number(opts);
  const raw = opts.port ?? opts.addr ?? opts.host;
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string' && /^\d+$/.test(raw)) return Number(raw);
  return 8081;
}

function warnIfVpnHijacksDns() {
  try {
    const dns = execFileSync('scutil', ['--dns'], { encoding: 'utf8' });
    if (!dns.includes('198.18.')) return;
    console.error('');
    console.error('На Mac включён VPN (DNS 198.18.x.x, интерфейс utun).');
    console.error('Он подменяет адреса Cloudflare — туннель получает URL и сразу рвётся.');
    console.error('На телефоне тогда Expo Go показывает 1033 / HTTP 530.');
    console.error('');
    console.error('Выключите VPN на компьютере и повторите. Не только на iPhone.');
    console.error('Или без туннеля: режим модема на iPhone → Mac в эту сеть → npx expo start');
    console.error('');
  } catch {
    // scutil missing — ignore
  }
}

async function connect(opts) {
  const options = typeof opts === 'object' && opts ? opts : {};
  const port = portFromOpts(opts);
  const onStatusChange = options.onStatusChange;
  const onLogEvent = options.onLogEvent;

  warnIfVpnHijacksDns();

  await kill();
  await ensureCloudflared();

  const bin = binaryPath();
  const args = [
    'tunnel',
    '--no-autoupdate',
    '--protocol',
    'http2',
    '--edge-ip-version',
    '4',
    '--ha-connections',
    '4',
    '--url',
    `http://127.0.0.1:${port}`,
  ];

  child = spawn(bin, args, {
    env: process.env,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  publicUrl = await new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      finish(new Error('cloudflared did not produce a tunnel URL in time'));
    }, START_TIMEOUT_MS);

    const finish = (error, url) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) {
        if (child && child.exitCode == null) child.kill();
        reject(error);
        return;
      }
      resolve(url);
    };

    const onLine = (line) => {
      const text = String(line).trim();
      if (!text) return;
      onLogEvent?.(text);
      const match = text.match(URL_RE);
      if (match) {
        const url = match[0];
        onStatusChange?.('connected');
        finish(null, url);
      }
      if (/failed to request quick tunnel|failed to create tunnel/i.test(text)) {
        finish(new Error(text));
      }
      if (/DNS query failed|argotunnel\.com/i.test(text) && /no such host|failed/i.test(text)) {
        console.error(
          'cloudflared не резолвит Cloudflare из‑за VPN/DNS на Mac. Выключите VPN на компьютере.',
        );
      }
    };

    const feed = (chunk) => {
      String(chunk)
        .split(/\r?\n/)
        .forEach(onLine);
    };

    child.stdout.on('data', feed);
    child.stderr.on('data', feed);
    child.once('error', (error) => finish(error));
    child.once('exit', (code) => {
      if (!settled) {
        finish(new Error(`cloudflared exited before the tunnel was ready (code ${code})`));
        return;
      }
      publicUrl = null;
      onStatusChange?.('closed');
    });
  });

  return publicUrl;
}

async function kill() {
  const current = child;
  child = null;
  publicUrl = null;
  if (!current || current.exitCode != null) return;
  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      current.kill('SIGKILL');
    }, 3000);
    current.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
    current.kill('SIGTERM');
  });
}

function getUrl() {
  return publicUrl;
}

function getActiveProcess() {
  return child;
}

async function authtoken() {}

function getApi() {
  return null;
}

module.exports = {
  connect,
  disconnect: kill,
  kill,
  getUrl,
  getApi,
  getActiveProcess,
  authtoken,
};
