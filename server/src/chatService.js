import { v4 as uuid } from 'uuid';

import {
  db,
  findById,
  findMany,
  findOne,
  insert,
  nowIso,
  updateById,
  updateWhere,
} from './db.js';

export function mapMessage(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderRole: row.sender_role,
    senderId: row.sender_id,
    text: row.text,
    createdAt: row.created_at,
  };
}

export function enrichConversation(row) {
  if (!row) return null;
  const user = findById('users', row.user_id);
  const pet = row.pet_id ? findById('pets', row.pet_id) : null;
  const userMessages = findMany(
    'messages',
    (m) => m.conversation_id === row.id && m.sender_role === 'user',
  ).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const allMessages = findMany('messages', (m) => m.conversation_id === row.id).sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );
  const lastUser = userMessages[userMessages.length - 1];
  const lastAny = allMessages[allMessages.length - 1];

  return {
    id: row.id,
    userId: row.user_id,
    petId: row.pet_id,
    status: row.status,
    consultantId: row.consultant_id,
    claimedAt: row.claimed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    closedAt: row.closed_at,
    userName: user?.name || '',
    userEmail: user?.email || '',
    petName: pet?.name || '',
    preview: lastUser?.text || lastAny?.text || '',
  };
}

export function getConversationById(id) {
  return enrichConversation(findById('conversations', id));
}

export function getMessages(conversationId) {
  return findMany('messages', (m) => m.conversation_id === conversationId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))
    .map(mapMessage);
}

export function listWaitingQueue() {
  return findMany('conversations', (c) => c.status === 'waiting')
    .filter((c) =>
      findMany('messages', (m) => m.conversation_id === c.id && m.sender_role === 'user').length > 0,
    )
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map(enrichConversation);
}

export function listConsultantActive(consultantId) {
  return findMany(
    'conversations',
    (c) => c.status === 'active' && c.consultant_id === consultantId,
  )
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .map(enrichConversation);
}

/** Closed dialogs this consultant handled — archive / history. */
export function listConsultantHistory(consultantId, limit = 40) {
  return findMany(
    'conversations',
    (c) => c.status === 'closed' && c.consultant_id === consultantId,
  )
    .sort((a, b) => (b.closed_at || b.updated_at).localeCompare(a.closed_at || a.updated_at))
    .slice(0, limit)
    .map(enrichConversation);
}

/**
 * Reopen a closed conversation into the waiting queue, keeping message history.
 * Clears claim so any consultant can take it again.
 */
export function reopenConversation(conversationId) {
  const row = findById('conversations', conversationId);
  if (!row || row.status !== 'closed') {
    return { ok: false, reason: 'not_closed' };
  }
  const now = nowIso();
  updateById('conversations', conversationId, {
    status: 'waiting',
    consultant_id: null,
    claimed_at: null,
    closed_at: null,
    updated_at: now,
  });
  insertSystemMessage(conversationId, 'Пользователь возобновил обращение. Ожидаем консультанта…');
  return { ok: true, conversation: getConversationById(conversationId) };
}

export function ensureUserConversation(userId, petId = null) {
  const open = findMany(
    'conversations',
    (c) => c.user_id === userId && (c.status === 'waiting' || c.status === 'active'),
  ).sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];

  if (open) {
    if (petId && !open.pet_id) {
      updateById('conversations', open.id, { pet_id: petId, updated_at: nowIso() });
    }
    return getConversationById(open.id);
  }

  // Keep closed thread for history in the client; reopen only when the user sends again.
  const closed = findMany(
    'conversations',
    (c) => c.user_id === userId && c.status === 'closed',
  ).sort((a, b) => (b.closed_at || b.updated_at).localeCompare(a.closed_at || a.updated_at))[0];

  if (closed) {
    if (petId && !closed.pet_id) {
      updateById('conversations', closed.id, { pet_id: petId, updated_at: nowIso() });
      return getConversationById(closed.id);
    }
    return enrichConversation(closed);
  }

  const id = uuid();
  const now = nowIso();
  insert('conversations', {
    id,
    user_id: userId,
    pet_id: petId,
    status: 'waiting',
    consultant_id: null,
    claimed_at: null,
    created_at: now,
    updated_at: now,
    closed_at: null,
  });

  insertSystemMessage(id, 'Обращение создано. Ожидаем свободного консультанта…');
  return getConversationById(id);
}

export function insertMessage({ conversationId, senderRole, senderId, text }) {
  const id = uuid();
  const createdAt = nowIso();
  insert('messages', {
    id,
    conversation_id: conversationId,
    sender_role: senderRole,
    sender_id: senderId ?? null,
    text,
    created_at: createdAt,
  });
  updateById('conversations', conversationId, { updated_at: createdAt });
  return mapMessage({
    id,
    conversation_id: conversationId,
    sender_role: senderRole,
    sender_id: senderId ?? null,
    text,
    created_at: createdAt,
  });
}

export function insertSystemMessage(conversationId, text) {
  return insertMessage({
    conversationId,
    senderRole: 'system',
    senderId: null,
    text,
  });
}

export function claimConversation(conversationId, consultantId) {
  const row = findById('conversations', conversationId);
  if (!row || row.status !== 'waiting' || row.consultant_id) {
    return { ok: false, reason: 'already_claimed' };
  }

  const now = nowIso();
  const changed = updateWhere(
    'conversations',
    (c) => c.id === conversationId && c.status === 'waiting' && !c.consultant_id,
    {
      consultant_id: consultantId,
      status: 'active',
      claimed_at: now,
      updated_at: now,
    },
  );

  if (changed !== 1) {
    return { ok: false, reason: 'already_claimed' };
  }

  const consultant = findById('consultants', consultantId);
  insertSystemMessage(
    conversationId,
    `Консультант ${consultant?.name || 'Tailio'} подключился к диалогу.`,
  );

  return { ok: true, conversation: getConversationById(conversationId) };
}

export function closeConversation(conversationId, actor) {
  const row = findById('conversations', conversationId);
  if (!row || row.status === 'closed') {
    return { ok: false, reason: 'not_found' };
  }
  if (actor.role === 'consultant' && row.consultant_id !== actor.id) {
    return { ok: false, reason: 'forbidden' };
  }
  if (actor.role === 'user' && row.user_id !== actor.id) {
    return { ok: false, reason: 'forbidden' };
  }

  const now = nowIso();
  updateById('conversations', conversationId, {
    status: 'closed',
    closed_at: now,
    updated_at: now,
  });
  insertSystemMessage(conversationId, 'Диалог закрыт.');
  return { ok: true, conversation: getConversationById(conversationId) };
}

export function upsertAppUser({ email, name, city, pet }) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) {
    throw new Error('email_required');
  }

  const now = nowIso();
  let user = findOne('users', (u) => u.email === normalized);
  if (!user) {
    user = insert('users', {
      id: uuid(),
      email: normalized,
      name: name || '',
      city: city || '',
      password_hash: null,
      created_at: now,
      updated_at: now,
    });
  } else {
    user = updateById('users', user.id, {
      name: name || user.name,
      city: city || user.city,
      updated_at: now,
    });
  }

  let petRow = null;
  if (pet?.name) {
    const petId = pet.id || uuid();
    const existing = findById('pets', petId);
    if (existing && existing.user_id === user.id) {
      petRow = updateById('pets', petId, {
        name: pet.name,
        kind: pet.kind || 'dog',
        breed: pet.breed || '',
        sex: pet.sex || '',
        birth_date: pet.birthDate || '',
        collar_id: pet.collarId || null,
        updated_at: now,
      });
    } else if (!existing) {
      petRow = insert('pets', {
        id: petId,
        user_id: user.id,
        name: pet.name,
        kind: pet.kind || 'dog',
        breed: pet.breed || '',
        sex: pet.sex || '',
        birth_date: pet.birthDate || '',
        collar_id: pet.collarId || null,
        created_at: now,
        updated_at: now,
      });
    } else {
      // id collision with another user — create new
      petRow = insert('pets', {
        id: uuid(),
        user_id: user.id,
        name: pet.name,
        kind: pet.kind || 'dog',
        breed: pet.breed || '',
        sex: pet.sex || '',
        birth_date: pet.birthDate || '',
        collar_id: pet.collarId || null,
        created_at: now,
        updated_at: now,
      });
    }
  }

  return { user, pet: petRow };
}

// silence unused in case tree-shaking tools look at db export usage
void db;
