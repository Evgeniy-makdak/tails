import { WebSocketServer } from 'ws';

import { verifyToken } from './auth.js';
import {
  claimConversation,
  closeConversation,
  ensureUserConversation,
  getConversationById,
  getMessages,
  insertMessage,
  listConsultantActive,
  listConsultantHistory,
  listWaitingQueue,
  reopenConversation,
} from './chatService.js';

function send(ws, type, payload = {}) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ type, ...payload }));
  }
}

function safeParse(raw) {
  try {
    return JSON.parse(String(raw));
  } catch {
    return null;
  }
}

export function attachWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  /** @type {Set<import('ws').WebSocket>} */
  const clients = new Set();

  function broadcast(filter, type, payload) {
    for (const client of clients) {
      if (client.readyState !== client.OPEN || !client.auth) continue;
      if (filter && !filter(client.auth, client)) continue;
      send(client, type, payload);
    }
  }

  function publishQueue() {
    const waiting = listWaitingQueue();
    broadcast((auth) => auth.role === 'consultant', 'queue.updated', { waiting });
  }

  function publishActiveForConsultant(consultantId) {
    const active = listConsultantActive(consultantId);
    broadcast(
      (auth) => auth.role === 'consultant' && auth.id === consultantId,
      'active.updated',
      { active },
    );
  }

  function publishHistoryForConsultant(consultantId) {
    const history = listConsultantHistory(consultantId);
    broadcast(
      (auth) => auth.role === 'consultant' && auth.id === consultantId,
      'history.updated',
      { history },
    );
  }

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', 'http://localhost');
    const token = url.searchParams.get('token');
    if (!token) {
      send(ws, 'error', { code: 'unauthorized', message: 'token required' });
      ws.close();
      return;
    }

    try {
      ws.auth = verifyToken(token);
    } catch {
      send(ws, 'error', { code: 'invalid_token', message: 'invalid token' });
      ws.close();
      return;
    }

    clients.add(ws);
    send(ws, 'auth.ok', {
      role: ws.auth.role,
      id: ws.auth.id,
      name: ws.auth.name,
      email: ws.auth.email,
    });

    if (ws.auth.role === 'consultant') {
      send(ws, 'queue.updated', { waiting: listWaitingQueue() });
      send(ws, 'active.updated', { active: listConsultantActive(ws.auth.id) });
      send(ws, 'history.updated', { history: listConsultantHistory(ws.auth.id) });
    }

    ws.on('message', (raw) => {
      const msg = safeParse(raw);
      if (!msg || !msg.type) {
        send(ws, 'error', { code: 'bad_payload' });
        return;
      }

      try {
        handleMessage(ws, msg, {
          broadcast,
          publishQueue,
          publishActiveForConsultant,
          publishHistoryForConsultant,
        });
      } catch (error) {
        send(ws, 'error', {
          code: 'server_error',
          message: error instanceof Error ? error.message : 'error',
        });
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
    });
  });

  return wss;
}

function handleMessage(ws, msg, helpers) {
  const { broadcast, publishQueue, publishActiveForConsultant, publishHistoryForConsultant } =
    helpers;
  const auth = ws.auth;

  switch (msg.type) {
    case 'conversation.ensure': {
      if (auth.role !== 'user') {
        send(ws, 'error', { code: 'forbidden' });
        return;
      }
      const conversation = ensureUserConversation(auth.id, msg.petId || null);
      const messages = getMessages(conversation.id);
      send(ws, 'conversation.snapshot', { conversation, messages });
      if (conversation.status === 'waiting') {
        publishQueue();
      }
      return;
    }

    case 'queue.subscribe': {
      if (auth.role !== 'consultant') {
        send(ws, 'error', { code: 'forbidden' });
        return;
      }
      send(ws, 'queue.updated', { waiting: listWaitingQueue() });
      send(ws, 'active.updated', { active: listConsultantActive(auth.id) });
      send(ws, 'history.updated', { history: listConsultantHistory(auth.id) });
      return;
    }

    case 'conversation.claim': {
      if (auth.role !== 'consultant') {
        send(ws, 'error', { code: 'forbidden' });
        return;
      }
      const result = claimConversation(msg.conversationId, auth.id);
      if (!result.ok) {
        send(ws, 'error', { code: result.reason || 'already_claimed' });
        publishQueue();
        return;
      }
      const messages = getMessages(result.conversation.id);
      send(ws, 'conversation.claimed', {
        conversation: result.conversation,
        messages,
      });
      broadcast(
        (a) => a.role === 'user' && a.id === result.conversation.userId,
        'conversation.assigned',
        { conversation: result.conversation },
      );
      // Notify other consultants that item left the queue
      broadcast(
        (a) => a.role === 'consultant' && a.id !== auth.id,
        'conversation.taken',
        { conversationId: result.conversation.id },
      );
      publishQueue();
      publishActiveForConsultant(auth.id);
      publishHistoryForConsultant(auth.id);
      // Push latest system message to user
      const last = messages[messages.length - 1];
      if (last) {
        broadcast(
          (a) =>
            (a.role === 'user' && a.id === result.conversation.userId) ||
            (a.role === 'consultant' && a.id === auth.id),
          'message.new',
          { message: last },
        );
      }
      return;
    }

    case 'conversation.open': {
      // Consultant opens an already-claimed active chat or archived history
      if (auth.role !== 'consultant') {
        send(ws, 'error', { code: 'forbidden' });
        return;
      }
      const conversation = getConversationById(msg.conversationId);
      if (!conversation || conversation.consultantId !== auth.id) {
        send(ws, 'error', { code: 'forbidden' });
        return;
      }
      send(ws, 'conversation.snapshot', {
        conversation,
        messages: getMessages(conversation.id),
      });
      return;
    }

    case 'message.send': {
      const text = String(msg.text || '').trim();
      if (!text) {
        send(ws, 'error', { code: 'empty_message' });
        return;
      }
      let conversation = getConversationById(msg.conversationId);
      if (!conversation) {
        send(ws, 'error', { code: 'not_found' });
        return;
      }

      // User resume: closed → waiting queue with full history preserved
      if (conversation.status === 'closed' && auth.role === 'user') {
        if (conversation.userId !== auth.id) {
          send(ws, 'error', { code: 'forbidden' });
          return;
        }
        const prevConsultantId = conversation.consultantId;
        const reopened = reopenConversation(conversation.id);
        if (!reopened.ok) {
          send(ws, 'error', { code: reopened.reason || 'reopen_failed' });
          return;
        }
        conversation = reopened.conversation;
        send(ws, 'conversation.snapshot', {
          conversation,
          messages: getMessages(conversation.id),
        });
        publishQueue();
        if (prevConsultantId) {
          publishHistoryForConsultant(prevConsultantId);
          publishActiveForConsultant(prevConsultantId);
        }
      }

      if (conversation.status === 'closed') {
        send(ws, 'error', { code: 'conversation_closed' });
        return;
      }

      if (auth.role === 'user') {
        if (conversation.userId !== auth.id) {
          send(ws, 'error', { code: 'forbidden' });
          return;
        }
      } else if (auth.role === 'consultant') {
        if (conversation.consultantId !== auth.id || conversation.status !== 'active') {
          send(ws, 'error', { code: 'forbidden' });
          return;
        }
      } else {
        send(ws, 'error', { code: 'forbidden' });
        return;
      }

      const message = insertMessage({
        conversationId: conversation.id,
        senderRole: auth.role,
        senderId: auth.id,
        text,
      });

      // If user messaged a brand-new waiting chat, refresh queue previews
      if (auth.role === 'user' && conversation.status === 'waiting') {
        publishQueue();
      }

      broadcast((a) => {
        if (a.role === 'user' && a.id === conversation.userId) return true;
        if (a.role === 'consultant' && conversation.consultantId && a.id === conversation.consultantId) {
          return true;
        }
        // Waiting dialogs: all consultants see new user messages via queue; also push message if they have it open
        if (a.role === 'consultant' && conversation.status === 'waiting') return false;
        return false;
      }, 'message.new', { message });

      if (conversation.consultantId) {
        publishActiveForConsultant(conversation.consultantId);
      }
      return;
    }

    case 'typing': {
      const conversation = getConversationById(msg.conversationId);
      if (!conversation) return;
      const isTyping = Boolean(msg.isTyping);
      broadcast((a) => {
        if (auth.role === 'user') {
          return a.role === 'consultant' && a.id === conversation.consultantId;
        }
        return a.role === 'user' && a.id === conversation.userId;
      }, 'typing', {
        conversationId: conversation.id,
        role: auth.role,
        isTyping,
        name: auth.name,
      });
      return;
    }

    case 'conversation.close': {
      const result = closeConversation(msg.conversationId, auth);
      if (!result.ok) {
        send(ws, 'error', { code: result.reason || 'close_failed' });
        return;
      }
      const messages = getMessages(result.conversation.id);
      const last = messages[messages.length - 1];
      const consultantId = result.conversation.consultantId;
      broadcast((a) => {
        if (a.role === 'user' && a.id === result.conversation.userId) return true;
        if (a.role === 'consultant' && a.id === consultantId) return true;
        return false;
      }, 'conversation.closed', { conversation: result.conversation });
      if (last) {
        broadcast((a) => {
          if (a.role === 'user' && a.id === result.conversation.userId) return true;
          if (a.role === 'consultant' && a.id === consultantId) return true;
          return false;
        }, 'message.new', { message: last });
      }
      publishQueue();
      if (consultantId) {
        publishActiveForConsultant(consultantId);
        publishHistoryForConsultant(consultantId);
      }
      return;
    }

    default:
      send(ws, 'error', { code: 'unknown_type', message: msg.type });
  }
}
