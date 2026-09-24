import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { v4 as uuid } from 'uuid';

import { hashPassword } from './auth.js';
import { findOne, insert, migrate, nowIso } from './db.js';
import { consolidateAllUsers } from './chatService.js';
import { createApiRouter } from './routes.js';
import { attachWebSocket } from './wsHub.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);

migrate();
ensureSeedConsultant();
consolidateAllUsers();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use('/api', createApiRouter());

const consultantDist = path.join(__dirname, '..', 'public');
if (fs.existsSync(consultantDist)) {
  app.use(express.static(consultantDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
      next();
      return;
    }
    const index = path.join(consultantDist, 'index.html');
    if (fs.existsSync(index)) {
      res.sendFile(index);
      return;
    }
    next();
  });
}

const server = http.createServer(app);
attachWebSocket(server);

server.listen(PORT, () => {
  console.log(`Tailio server listening on http://localhost:${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}/ws`);
});

function ensureSeedConsultant() {
  const email = 'consultant@tailio.app';
  if (findOne('consultants', (c) => c.email === email)) return;
  insert('consultants', {
    id: uuid(),
    email,
    name: 'Консультант Tailio',
    password_hash: hashPassword('tailio123'),
    created_at: nowIso(),
  });
  console.log('Seeded default consultant consultant@tailio.app / tailio123');
}
