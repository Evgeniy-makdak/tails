import { findOne, insert, nowIso, updateById } from './db.js';

function normalizeCollarId(id) {
  return String(id || '')
    .trim()
    .replace(/\s+/g, '');
}

export function getCollarLocation(collarId) {
  const id = normalizeCollarId(collarId);
  if (!id) return null;
  return findOne('collar_locations', (row) => row.collarId === id) || null;
}

export function upsertCollarTelemetry(collarId, body = {}) {
  const id = normalizeCollarId(collarId);
  if (!id) {
    throw new Error('collar_id_required');
  }

  const latitude = Number(body.latitude ?? body.lat);
  const longitude = Number(body.longitude ?? body.lng ?? body.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('lat_lng_required');
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error('lat_lng_out_of_range');
  }

  const updatedAt =
    typeof body.updatedAt === 'string' && body.updatedAt
      ? body.updatedAt
      : typeof body.fix === 'string' && body.fix
        ? body.fix
        : nowIso();

  const patch = {
    collarId: id,
    petId: body.petId ? String(body.petId) : undefined,
    latitude,
    longitude,
    accuracyM: numOrUndef(body.accuracyM ?? body.accuracy),
    altitudeM: numOrUndef(body.altitudeM ?? body.altitude),
    speedMps: numOrUndef(body.speedMps ?? body.speed),
    headingDeg: numOrUndef(body.headingDeg ?? body.course ?? body.heading),
    batteryPercent: numOrUndef(body.batteryPercent ?? body.battery),
    online: body.online !== false,
    source: body.source ? String(body.source) : 'ingest',
    updatedAt,
    receivedAt: nowIso(),
  };

  const existing = getCollarLocation(id);
  if (existing) {
    return toPublicDto(updateById('collar_locations', existing.id, patch));
  }

  const row = insert('collar_locations', {
    id: `collar-loc-${id}`,
    ...patch,
    createdAt: nowIso(),
  });
  return toPublicDto(row);
}

export function mapTraccarPosition(payload = {}) {
  const pos = payload.position || payload;
  const device = payload.device || {};
  const collarId =
    payload.collarId ||
    device.uniqueId ||
    pos.deviceId ||
    payload.uniqueId ||
    payload.id;

  return {
    collarId: normalizeCollarId(collarId),
    latitude: pos.latitude ?? pos.lat,
    longitude: pos.longitude ?? pos.lng ?? pos.lon,
    accuracyM: pos.accuracy,
    altitudeM: pos.altitude,
    speedMps:
      pos.speed != null
        ? // Traccar speed often in knots
          Number(pos.speed) * 0.514444
        : undefined,
    headingDeg: pos.course ?? pos.heading,
    batteryPercent:
      pos.attributes?.batteryLevel ??
      pos.attributes?.battery ??
      device.attributes?.batteryLevel,
    online: true,
    updatedAt: pos.deviceTime || pos.fixTime || pos.serverTime,
    source: 'traccar',
    petId: payload.petId,
  };
}

export function toPublicDto(row) {
  if (!row) return null;
  return {
    petId: row.petId || row.collarId,
    collarId: row.collarId,
    latitude: row.latitude,
    longitude: row.longitude,
    accuracyM: row.accuracyM,
    altitudeM: row.altitudeM,
    speedMps: row.speedMps,
    headingDeg: row.headingDeg,
    batteryPercent: row.batteryPercent,
    online: row.online !== false,
    updatedAt: row.updatedAt,
    source: row.source,
  };
}

function numOrUndef(value) {
  if (value == null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function assertIngestKey(req) {
  const expected = process.env.COLLAR_INGEST_SECRET;
  if (!expected) {
    // Dev-friendly: allow ingest when secret not configured.
    return true;
  }
  const got =
    req.get('x-collar-ingest-key') ||
    req.get('x-ingest-key') ||
    req.query?.key ||
    req.body?.ingestKey;
  return got === expected;
}
