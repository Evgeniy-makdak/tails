import { v4 as uuid } from 'uuid';

import { hashPassword } from './auth.js';
import { findOne, insert, migrate, nowIso } from './db.js';

migrate();

const email = 'consultant@tailio.app';
if (findOne('consultants', (c) => c.email === email)) {
  console.log('Seed consultant already exists:', email);
  process.exit(0);
}

insert('consultants', {
  id: uuid(),
  email,
  name: 'Консультант Tailio',
  password_hash: hashPassword('tailio123'),
  created_at: nowIso(),
});

console.log('Seeded consultant:', email, '/ tailio123');
