import { v4 as uuid } from 'uuid';

import { findMany, insert, findById, nowIso } from './db.js';

/** @typedef {{ latitude: number, longitude: number, recordedAt?: string }} TrackPoint */

function haversineM(a, b) {
  const R = 6371008.8;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function pathDistanceM(points) {
  let sum = 0;
  for (let i = 1; i < points.length; i += 1) {
    sum += haversineM(points[i - 1], points[i]);
  }
  return sum;
}

function offsetPoint(start, distanceM, bearingDeg) {
  const R = 6371008.8;
  const δ = distanceM / R;
  const θ = (bearingDeg * Math.PI) / 180;
  const φ1 = (start.latitude * Math.PI) / 180;
  const λ1 = (start.longitude * Math.PI) / 180;
  const sinφ2 = Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ);
  const φ2 = Math.asin(sinφ2);
  const λ2 =
    λ1 +
    Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * sinφ2);
  return {
    latitude: (φ2 * 180) / Math.PI,
    longitude: (((λ2 * 180) / Math.PI + 540) % 360) - 180,
  };
}

/** Synthetic stroll around a center — used until collar telemetry is live. */
export function buildDemoTrackPoints(center, opts = {}) {
  const steps = opts.steps ?? 48;
  const radiusM = opts.radiusM ?? 280;
  const started = opts.startedAt ? new Date(opts.startedAt) : new Date(Date.now() - 40 * 60 * 1000);
  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const bearing = t * 360 * 1.15 + (opts.phaseDeg ?? 0);
    const r = radiusM * (0.55 + 0.45 * Math.sin(t * Math.PI * 2));
    const p = offsetPoint(center, r, bearing);
    points.push({
      latitude: p.latitude,
      longitude: p.longitude,
      recordedAt: new Date(started.getTime() + t * (opts.durationSec ?? 2400) * 1000).toISOString(),
    });
  }
  return points;
}

function mapTrack(row) {
  return {
    id: row.id,
    userId: row.user_id,
    petId: row.pet_id,
    petName: row.pet_name,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    distanceM: row.distance_m,
    durationSec: row.duration_sec,
    steps: row.steps,
    points: row.points || [],
    source: row.source || 'demo',
    createdAt: row.created_at,
  };
}

export function listTracksForUser(userId, { petId, limit = 40 } = {}) {
  let rows = findMany('walks', (w) => w.user_id === userId);
  if (petId) {
    rows = rows.filter((w) => w.pet_id === petId);
  }
  rows.sort((a, b) => String(b.started_at).localeCompare(String(a.started_at)));
  return rows.slice(0, limit).map(mapTrack);
}

export function getTrackById(id) {
  const row = findById('walks', id);
  return row ? mapTrack(row) : null;
}

export function createTrack({
  userId,
  petId,
  petName,
  points,
  startedAt,
  endedAt,
  steps,
  source = 'api',
}) {
  const cleaned = (points || [])
    .map((p) => ({
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
      recordedAt: p.recordedAt || p.t || null,
    }))
    .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));

  if (cleaned.length < 2) {
    throw new Error('track_needs_points');
  }

  const start = startedAt || cleaned[0].recordedAt || nowIso();
  const end = endedAt || cleaned[cleaned.length - 1].recordedAt || nowIso();
  const durationSec = Math.max(
    60,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000),
  );
  const distanceM = Math.round(pathDistanceM(cleaned));
  const id = uuid();
  const row = {
    id,
    user_id: userId,
    pet_id: petId || null,
    pet_name: petName || null,
    started_at: start,
    ended_at: end,
    distance_m: distanceM,
    duration_sec: durationSec,
    steps: steps ?? Math.round(distanceM * 1.3),
    points: cleaned,
    source,
    created_at: nowIso(),
  };
  insert('walks', row);
  return mapTrack(row);
}

/**
 * If the user has no tracks yet, seed 2–3 demo walks near `center`
 * so История перемещений is not empty before collar GPS exists.
 */
export function ensureDemoTracks(userId, { petId, petName, center }) {
  const existing = listTracksForUser(userId, { petId, limit: 5 });
  if (existing.length > 0) return existing;

  const now = Date.now();
  const seeds = [
    {
      phaseDeg: 20,
      radiusM: 260,
      durationSec: 38 * 60,
      startedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      steps: 3780,
    },
    {
      phaseDeg: 140,
      radiusM: 320,
      durationSec: 32 * 60,
      startedAt: new Date(now - 10 * 60 * 60 * 1000).toISOString(),
      steps: 3180,
    },
    {
      phaseDeg: 250,
      radiusM: 400,
      durationSec: 41 * 60,
      startedAt: new Date(now - 28 * 60 * 60 * 1000).toISOString(),
      steps: 4050,
    },
  ];

  return seeds.map((seed) => {
    const points = buildDemoTrackPoints(center, seed);
    const endedAt = new Date(
      new Date(seed.startedAt).getTime() + seed.durationSec * 1000,
    ).toISOString();
    return createTrack({
      userId,
      petId,
      petName,
      points,
      startedAt: seed.startedAt,
      endedAt,
      steps: seed.steps,
      source: 'demo',
    });
  });
}
