import { useCallback, useEffect, useRef, useState } from 'react';

import { upsertChatUser } from '../api/chat';
import { API_BASE_URL, toWsBaseUrl } from '../config/features';
import type { LiveConversation, LiveMessage, UiChatMessage } from './types';
import { liveToUiMessage } from './types';

type Options = {
  enabled: boolean;
  email: string | null;
  ownerName: string;
  ownerCity: string;
  pet: {
    id: string;
    name: string;
    kind: string;
    breed?: string;
    sex?: string;
    birthDate?: string;
    collarId?: string;
  };
  welcomeText: string;
};

type Status = 'idle' | 'connecting' | 'online' | 'offline' | 'error';

export function useLiveChat(options: Options) {
  const { enabled, email, ownerName, ownerCity, pet, welcomeText } = options;
  const [status, setStatus] = useState<Status>('idle');
  const [conversation, setConversation] = useState<LiveConversation | null>(null);
  const [messages, setMessages] = useState<UiChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const retryRef = useRef(0);
  const closedRef = useRef(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    conversationIdRef.current = conversation?.id ?? null;
  }, [conversation?.id]);

  const pushUnique = useCallback((incoming: LiveMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === incoming.id)) return prev;
      return [...prev, liveToUiMessage(incoming)];
    });
  }, []);

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      return undefined;
    }

    if (!email) {
      setStatus('error');
      setError('Нужен email аккаунта для живого чата');
      setMessages([{ id: 'welcome', role: 'bot', text: welcomeText }]);
      return undefined;
    }

    closedRef.current = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = async () => {
      setStatus('connecting');
      setError(null);
      try {
        const auth = await upsertChatUser({
          email,
          name: ownerName,
          city: ownerCity,
          pet: {
            id: pet.id,
            name: pet.name,
            kind: pet.kind,
            breed: pet.breed,
            sex: pet.sex,
            birthDate: pet.birthDate,
            collarId: pet.collarId,
          },
        });

        if (closedRef.current) return;

        const ws = new WebSocket(`${toWsBaseUrl(API_BASE_URL)}/ws?token=${encodeURIComponent(auth.token)}`);
        wsRef.current = ws;

        ws.onopen = () => {
          retryRef.current = 0;
          setStatus('online');
          ws.send(
            JSON.stringify({
              type: 'conversation.ensure',
              petId: pet.id || null,
            }),
          );
        };

        ws.onmessage = (event) => {
          let msg: { type: string; [key: string]: unknown };
          try {
            msg = JSON.parse(String(event.data));
          } catch {
            return;
          }

          switch (msg.type) {
            case 'conversation.snapshot': {
              const conv = msg.conversation as LiveConversation;
              const list = (msg.messages as LiveMessage[]) || [];
              setConversation(conv);
              const mapped = list.map(liveToUiMessage);
              setMessages([
                { id: 'welcome', role: 'bot', text: welcomeText },
                ...mapped.filter((m) => m.text !== welcomeText),
              ]);
              break;
            }
            case 'conversation.assigned': {
              const conv = msg.conversation as LiveConversation;
              setConversation(conv);
              setTyping(false);
              break;
            }
            case 'message.new': {
              const message = msg.message as LiveMessage;
              if (message.conversationId === conversationIdRef.current || !conversationIdRef.current) {
                pushUnique(message);
              }
              if (message.senderRole === 'consultant') {
                setTyping(false);
              }
              break;
            }
            case 'typing': {
              if (
                msg.conversationId === conversationIdRef.current &&
                msg.role === 'consultant'
              ) {
                setTyping(Boolean(msg.isTyping));
              }
              break;
            }
            case 'conversation.closed': {
              setConversation(msg.conversation as LiveConversation);
              setTyping(false);
              break;
            }
            case 'error': {
              setError(String(msg.message || msg.code || 'Ошибка чата'));
              break;
            }
            default:
              break;
          }
        };

        ws.onclose = () => {
          setStatus('offline');
          wsRef.current = null;
          if (closedRef.current) return;
          const delay = Math.min(10000, 1000 * 2 ** retryRef.current);
          retryRef.current += 1;
          retryTimer = setTimeout(() => {
            void connect();
          }, delay);
        };

        ws.onerror = () => {
          setStatus('error');
          setError('Нет связи с сервером чата');
        };
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Не удалось подключить чат');
        setMessages([{ id: 'welcome', role: 'bot', text: welcomeText }]);
        if (!closedRef.current) {
          const delay = Math.min(10000, 1000 * 2 ** retryRef.current);
          retryRef.current += 1;
          retryTimer = setTimeout(() => {
            void connect();
          }, delay);
        }
      }
    };

    void connect();

    return () => {
      closedRef.current = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [
    enabled,
    email,
    ownerName,
    ownerCity,
    pet.id,
    pet.name,
    pet.kind,
    pet.breed,
    pet.sex,
    pet.birthDate,
    pet.collarId,
    welcomeText,
    pushUnique,
  ]);

  const sendText = useCallback((text: string) => {
    const trimmed = text.trim();
    const conversationId = conversationIdRef.current;
    if (!trimmed || !conversationId || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return false;
    }
    wsRef.current.send(
      JSON.stringify({
        type: 'message.send',
        conversationId,
        text: trimmed,
      }),
    );
    return true;
  }, []);

  const notifyTyping = useCallback((isTyping: boolean) => {
    const conversationId = conversationIdRef.current;
    if (!conversationId || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(
      JSON.stringify({
        type: 'typing',
        conversationId,
        isTyping,
      }),
    );
  }, []);

  const onDraftChange = useCallback(
    (value: string) => {
      notifyTyping(true);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => notifyTyping(false), 1200);
    },
    [notifyTyping],
  );

  return {
    status,
    error,
    conversation,
    messages,
    typing,
    sendText,
    onDraftChange,
    setMessages,
  };
}
