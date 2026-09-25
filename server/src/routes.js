import { Router } from 'express';
import { v4 as uuid } from 'uuid';

import {
  authMiddleware,
  hashPassword,
  requireRole,
  signToken,
  verifyPassword,
} from './auth.js';
import { listConsultantActive, listWaitingQueue, upsertAppUser } from './chatService.js';
import { findById, findOne, insert, nowIso } from './db.js';
import {
  createTrack,
  ensureDemoTracks,
  getTrackById,
  listTracksForUser,
} from './trackService.js';

export function createApiRouter() {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'tailio-server', time: nowIso() });
  });

  router.post('/auth/consultant/register', (req, res) => {
    const email = String(req.body?.email || '')
      .trim()
      .toLowerCase();
    const password = String(req.body?.password || '');
    const name = String(req.body?.name || '').trim() || 'Консультант';

    if (!email || password.length < 6) {
      res.status(400).json({
        error: 'invalid_credentials',
        message: 'Email и пароль (от 6 символов) обязательны',
      });
      return;
    }

    if (findOne('consultants', (c) => c.email === email)) {
      res.status(409).json({ error: 'email_taken' });
      return;
    }

    const id = uuid();
    const createdAt = nowIso();
    insert('consultants', {
      id,
      email,
      name,
      password_hash: hashPassword(password),
      created_at: createdAt,
    });

    const token = signToken({ role: 'consultant', id, email, name });
    res.status(201).json({
      token,
      consultant: { id, email, name, createdAt },
    });
  });

  router.post('/auth/consultant/login', (req, res) => {
    const email = String(req.body?.email || '')
      .trim()
      .toLowerCase();
    const password = String(req.body?.password || '');
    const row = findOne('consultants', (c) => c.email === email);
    if (!row || !verifyPassword(password, row.password_hash)) {
      res.status(401).json({ error: 'invalid_credentials' });
      return;
    }
    const token = signToken({
      role: 'consultant',
      id: row.id,
      email: row.email,
      name: row.name,
    });
    res.json({
      token,
      consultant: { id: row.id, email: row.email, name: row.name, createdAt: row.created_at },
    });
  });

  router.post('/auth/consultant/forgot-password', (req, res) => {
    const email = String(req.body?.email || '').trim();
    res.json({
      ok: true,
      message:
        'Заглушка: восстановление пароля будет подключено позже. Напишите администратору, если нужен доступ.',
      email: email || undefined,
    });
  });

  router.post('/auth/user/upsert', (req, res) => {
    try {
      const { user, pet } = upsertAppUser({
        email: req.body?.email,
        name: req.body?.name,
        city: req.body?.city,
        pet: req.body?.pet,
      });
      const token = signToken({
        role: 'user',
        id: user.id,
        email: user.email,
        name: user.name,
      });
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          city: user.city,
        },
        pet: pet
          ? {
              id: pet.id,
              name: pet.name,
              kind: pet.kind,
              breed: pet.breed,
            }
          : null,
      });
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : 'upsert_failed',
      });
    }
  });

  router.get('/me', authMiddleware, (req, res) => {
    if (req.auth.role === 'consultant') {
      const row = findById('consultants', req.auth.id);
      res.json({
        role: 'consultant',
        profile: row
          ? { id: row.id, email: row.email, name: row.name, created_at: row.created_at }
          : null,
      });
      return;
    }
    const row = findById('users', req.auth.id);
    res.json({
      role: 'user',
      profile: row
        ? {
            id: row.id,
            email: row.email,
            name: row.name,
            city: row.city,
            created_at: row.created_at,
          }
        : null,
    });
  });

  router.get('/consultant/queue', authMiddleware, requireRole('consultant'), (req, res) => {
    res.json({
      waiting: listWaitingQueue(),
      active: listConsultantActive(req.auth.id),
    });
  });

  /** List GPS tracks / walks for the signed-in app user (pet history). */
  router.get('/tracks', authMiddleware, requireRole('user'), (req, res) => {
    const petId = req.query.petId ? String(req.query.petId) : undefined;
    const seed = req.query.seed !== '0';
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const center =
      Number.isFinite(lat) && Number.isFinite(lng)
        ? { latitude: lat, longitude: lng }
        : { latitude: 59.9362, longitude: 30.3141 };

    let tracks = listTracksForUser(req.auth.id, { petId });
    if (seed && tracks.length === 0) {
      tracks = ensureDemoTracks(req.auth.id, {
        petId,
        petName: req.query.petName ? String(req.query.petName) : undefined,
        center,
      });
    }
    res.json({ tracks });
  });

  router.get('/tracks/:id', authMiddleware, requireRole('user'), (req, res) => {
    const track = getTrackById(req.params.id);
    if (!track || track.userId !== req.auth.id) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.json({ track });
  });

  /** Collar / client upload of a finished track (points required). */
  router.post('/tracks', authMiddleware, requireRole('user'), (req, res) => {
    try {
      const track = createTrack({
        userId: req.auth.id,
        petId: req.body?.petId,
        petName: req.body?.petName,
        points: req.body?.points,
        startedAt: req.body?.startedAt,
        endedAt: req.body?.endedAt,
        steps: req.body?.steps,
        source: req.body?.source || 'api',
      });
      res.status(201).json({ track });
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : 'create_failed',
      });
    }
  });

  return router;
}
