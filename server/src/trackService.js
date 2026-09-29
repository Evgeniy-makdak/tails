import { v4 as uuid } from 'uuid';

import { findMany, insert, findById, nowIso, removeById, removeWhere } from './db.js';

/** Keep Render Free disk/egress small. */
export const MAX_TRACKS_PER_USER = 12;
export const MAX_POINTS_PER_TRACK = 120;

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

/** Evenly keep first/last + mid samples so uploads stay tiny. */
export function downsamplePoints(points, maxPoints = MAX_POINTS_PER_TRACK) {
  if (!points?.length) return [];
  if (points.length <= maxPoints) return points;
  const out = [];
  const last = points.length - 1;
  for (let i = 0; i < maxPoints; i += 1) {
    const idx = i === maxPoints - 1 ? last : Math.round((i * last) / (maxPoints - 1));
    out.push(points[idx]);
  }
  return out;
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
    source: row.source || 'device',
    createdAt: row.created_at,
  };
}

function pruneOldestForUser(userId) {
  let rows = findMany('walks', (w) => w.user_id === userId);
  if (rows.length <= MAX_TRACKS_PER_USER) return 0;
  rows.sort((a, b) => String(a.started_at).localeCompare(String(b.started_at)));
  const overflow = rows.length - MAX_TRACKS_PER_USER;
  let removed = 0;
  for (let i = 0; i < overflow; i += 1) {
    removed += removeById('walks', rows[i].id);
  }
  return removed;
}

export function listTracksForUser(userId, { petId, limit = MAX_TRACKS_PER_USER } = {}) {
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
  source = 'device',
}) {
  const cleaned = downsamplePoints(
    (points || [])
      .map((p) => ({
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
        recordedAt: p.recordedAt || p.t || null,
      }))
      .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude)),
  );

  if (cleaned.length < 2) {
    throw new Error('track_needs_points');
  }

  const start = startedAt || cleaned[0].recordedAt || nowIso();
  const end = endedAt || cleaned[cleaned.length - 1].recordedAt || nowIso();
  const durationSec = Math.max(
    30,
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
  pruneOldestForUser(userId);
  return mapTrack(row);
}

export function deleteTrackForUser(userId, trackId) {
  const row = findById('walks', trackId);
  if (!row || row.user_id !== userId) return false;
  return removeById('walks', trackId) > 0;
}

/** Wipe all walks for a user (or only demos) — frees Render Free storage. */
export function deleteTracksForUser(userId, { onlyDemo = false } = {}) {
  return removeWhere('walks', (w) => {
    if (w.user_id !== userId) return false;
    if (onlyDemo) return w.source === 'demo' || w.source === 'local-demo';
    return true;
  });
}
