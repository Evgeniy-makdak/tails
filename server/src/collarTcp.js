import net from 'node:net';

import { upsertCollarTelemetry } from './collarService.js';

/**
 * Minimal TCP gateway for TK919-class trackers (GPS103 + Watch).
 * Collars connect after SMS: adminip123456 <PUBLIC_IP> <PORT>
 */
export function startCollarTcpGateway(options = {}) {
  const enabled =
    options.enabled ??
    (process.env.COLLAR_TCP_ENABLE === '1' || process.env.COLLAR_TCP_ENABLE === 'true');
  if (!enabled) {
    console.log('Collar TCP gateway: off (set COLLAR_TCP_ENABLE=1 to accept TK919)');
    return [];
  }

  const ports = String(options.ports || process.env.COLLAR_TCP_PORTS || '5001,5093')
    .split(',')
    .map((p) => Number(p.trim()))
    .filter((p) => Number.isFinite(p) && p > 0);

  const servers = ports.map((port) => listenPort(port));
  return servers;
}

function listenPort(port) {
  const server = net.createServer((socket) => {
    socket.setEncoding('utf8');
    let buffer = '';
    const peer = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`[collar-tcp] connect ${peer} on :${port}`);

    socket.on('data', (chunk) => {
      buffer += chunk;
      const parts = splitFrames(buffer);
      buffer = parts.rest;
      for (const frame of parts.frames) {
        handleFrame(frame, socket, port);
      }
    });

    socket.on('error', (err) => {
      console.warn(`[collar-tcp] socket error ${peer}:`, err.message);
    });

    socket.on('close', () => {
      console.log(`[collar-tcp] close ${peer}`);
    });
  });

  server.on('error', (err) => {
    console.error(`[collar-tcp] listen :${port} failed:`, err.message);
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`[collar-tcp] listening 0.0.0.0:${port} (SMS: adminip123456 <IP> ${port})`);
  });

  return server;
}

function splitFrames(buffer) {
  const frames = [];
  let rest = buffer;

  while (rest.length) {
    if (rest.startsWith('[')) {
      const end = rest.indexOf(']');
      if (end === -1) break;
      frames.push(rest.slice(0, end + 1));
      rest = rest.slice(end + 1);
      continue;
    }

    const semi = rest.indexOf(';');
    if (semi !== -1) {
      frames.push(rest.slice(0, semi + 1));
      rest = rest.slice(semi + 1);
      continue;
    }

    // GPS103 login often ends with newline
    const nl = rest.search(/[\r\n]/);
    if (nl !== -1) {
      const line = rest.slice(0, nl).trim();
      rest = rest.slice(nl + 1);
      if (line) frames.push(line);
      continue;
    }

    break;
  }

  return { frames, rest };
}

function handleFrame(raw, socket, port) {
  const frame = String(raw || '').trim();
  if (!frame) return;

  try {
    if (frame.startsWith('[') && frame.endsWith(']')) {
      const watch = parseWatch(frame);
      if (watch?.ack) socket.write(watch.ack);
      if (watch?.telemetry) {
        void publishTelemetry(watch.telemetry, `tcp-watch:${port}`);
      }
      return;
    }

    const gps103 = parseGps103(frame);
    if (gps103?.ack) socket.write(gps103.ack);
    if (gps103?.telemetry) {
      void publishTelemetry(gps103.telemetry, `tcp-gps103:${port}`);
    }
  } catch (error) {
    console.warn('[collar-tcp] frame error:', error instanceof Error ? error.message : error, frame.slice(0, 120));
  }
}

function parseGps103(frame) {
  // Login: ##,imei:3593...,A;  or imei:3593...,A;
  const login = frame.match(/^(?:##,)?imei:(\d+),A;?$/i);
  if (login) {
    return { ack: 'LOAD' };
  }

  // Heartbeat / short: imei:xxx,;
  const hb = frame.match(/^imei:(\d+),;?$/i);
  if (hb) {
    return { ack: 'ON' };
  }

  // Position: imei:ID,tracker,YYMMDDHHMMSS,,F,HHMMSS.sss,A,lat,N/S,lon,E/W,speed,...;
  const m = frame.match(
    /^imei:(\d+),([^,]*),([^,]*),([^,]*),([FL]),([^,]*),([AV]),([^,]*),([NS]),([^,]*),([EW]),([^,;]*)/i,
  );
  if (!m) return null;

  const collarId = m[1];
  const valid = String(m[7]).toUpperCase() === 'A';
  if (!valid) return { ack: 'ON' };

  const latitude = nmeaToDecimal(m[8], m[9]);
  const longitude = nmeaToDecimal(m[10], m[11]);
  if (latitude == null || longitude == null) return { ack: 'ON' };

  const knots = Number(m[12]);
  return {
    ack: 'ON',
    telemetry: {
      collarId,
      latitude,
      longitude,
      speedMps: Number.isFinite(knots) ? knots * 0.514444 : undefined,
      online: true,
      updatedAt: new Date().toISOString(),
    },
  };
}

function nmeaToDecimal(raw, hemi) {
  const value = Number(String(raw || '').trim());
  if (!Number.isFinite(value)) return null;
  const abs = Math.abs(value);
  const deg = Math.floor(abs / 100);
  const minutes = abs - deg * 100;
  let dec = deg + minutes / 60;
  const h = String(hemi || '').toUpperCase();
  if (h === 'S' || h === 'W') dec = -dec;
  if (value < 0) dec = -Math.abs(dec);
  return dec;
}

function parseWatch(frame) {
  // [SG*8800000015*0002*LK] or [3G*id*len*UD,...]
  const m = frame.match(/^\[([^*]+)\*([^*]+)\*([^*]+)\*([^\]]+)\]$/);
  if (!m) return null;
  const collarId = m[2];
  const body = m[4];
  const cmd = body.split(',')[0]?.toUpperCase() || body.toUpperCase();

  if (cmd === 'LK') {
    return { ack: `[SG*${collarId}*0002*LK]` };
  }

  if (cmd.startsWith('UD') || cmd === 'UD' || body.toUpperCase().startsWith('UD')) {
    const parts = body.split(',');
    // UD,yymmdd,hhmmss,A,lat,N,lon,E,speed,course,altitude,...
    // index: 0=UD 1=date 2=time 3=A/V 4=lat 5=N/S 6=lon 7=E/W 8=speed
    if (parts.length >= 8 && String(parts[3]).toUpperCase() === 'A') {
      const lat = Number(parts[4]);
      const lon = Number(parts[6]);
      const latH = parts[5];
      const lonH = parts[7];
      let latitude = lat;
      let longitude = lon;
      if (String(latH).toUpperCase() === 'S') latitude = -Math.abs(latitude);
      if (String(lonH).toUpperCase() === 'W') longitude = -Math.abs(longitude);
      // Some firmwares send already-decimal degrees; some send NMEA-like.
      if (Math.abs(latitude) > 90) latitude = nmeaToDecimal(parts[4], latH) ?? latitude;
      if (Math.abs(longitude) > 180) longitude = nmeaToDecimal(parts[6], lonH) ?? longitude;

      const speedKnots = Number(parts[8]);
      return {
        telemetry: {
          collarId,
          latitude,
          longitude,
          speedMps: Number.isFinite(speedKnots) ? speedKnots * 0.514444 : undefined,
          headingDeg: numOrUndef(parts[9]),
          altitudeM: numOrUndef(parts[10]),
          batteryPercent: batteryFromWatch(parts),
          online: true,
          updatedAt: new Date().toISOString(),
        },
      };
    }
  }

  return null;
}

function batteryFromWatch(parts) {
  // Common: field near end holds battery 1..6 bars or percent
  for (let i = parts.length - 1; i >= 12; i -= 1) {
    const n = Number(parts[i]);
    if (Number.isFinite(n) && n >= 0 && n <= 100) {
      if (n <= 6) return Math.round((n / 6) * 100);
      return n;
    }
  }
  return undefined;
}

function numOrUndef(value) {
  if (value == null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

async function publishTelemetry(telemetry, source) {
  const body = { ...telemetry, source };
  try {
    upsertCollarTelemetry(telemetry.collarId, body);
  } catch (error) {
    console.warn('[collar-tcp] local upsert failed:', error instanceof Error ? error.message : error);
  }

  const base = String(process.env.COLLAR_FORWARD_BASE || '').replace(/\/$/, '');
  if (!base) {
    console.log(`[collar-tcp] ${source} ${telemetry.collarId} → ${telemetry.latitude},${telemetry.longitude}`);
    return;
  }

  const url = `${base}/api/collars/${encodeURIComponent(telemetry.collarId)}/telemetry`;
  const headers = { 'Content-Type': 'application/json' };
  const key = process.env.COLLAR_INGEST_SECRET || process.env.COLLAR_FORWARD_KEY;
  if (key) headers['X-Collar-Ingest-Key'] = key;

  try {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    console.log(
      `[collar-tcp] ${source} ${telemetry.collarId} → ${telemetry.latitude},${telemetry.longitude} forward ${res.status}`,
    );
  } catch (error) {
    console.warn('[collar-tcp] forward failed:', error instanceof Error ? error.message : error);
  }
}
