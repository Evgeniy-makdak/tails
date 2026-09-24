import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
const dbPath = process.env.TAILIO_DB_PATH || path.join(dataDir, 'tailio.json');

fs.mkdirSync(dataDir, { recursive: true });

function emptyDb() {
  return {
    users: [],
    pets: [],
    consultants: [],
    conversations: [],
    messages: [],
    walks: [],
    geozones: [],
  };
}

function load() {
  if (!fs.existsSync(dbPath)) {
    const initial = emptyDb();
    fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    return { ...emptyDb(), ...parsed };
  } catch {
    return emptyDb();
  }
}

let state = load();

function persist() {
  fs.writeFileSync(dbPath, JSON.stringify(state, null, 2));
}

export const db = {
  get state() {
    return state;
  },
  reload() {
    state = load();
  },
  save() {
    persist();
  },
  reset() {
    state = emptyDb();
    persist();
  },
};

export function migrate() {
  // JSON store bootstraps itself; ensure all collections exist.
  state = { ...emptyDb(), ...state };
  persist();
}

export function nowIso() {
  return new Date().toISOString();
}

export function findById(collection, id) {
  return state[collection].find((row) => row.id === id) || null;
}

export function findOne(collection, predicate) {
  return state[collection].find(predicate) || null;
}

export function findMany(collection, predicate) {
  return state[collection].filter(predicate);
}

export function insert(collection, row) {
  state[collection].push(row);
  persist();
  return row;
}

export function updateById(collection, id, patch) {
  const idx = state[collection].findIndex((row) => row.id === id);
  if (idx < 0) return null;
  state[collection][idx] = { ...state[collection][idx], ...patch };
  persist();
  return state[collection][idx];
}

export function updateWhere(collection, predicate, patch) {
  let changed = 0;
  state[collection] = state[collection].map((row) => {
    if (!predicate(row)) return row;
    changed += 1;
    return { ...row, ...patch };
  });
  if (changed) persist();
  return changed;
}
