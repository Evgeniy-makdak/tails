import { useEffect, useRef, useState } from 'react';
import { api } from './api.js';
import { createChatSocket } from './socket.js';

const TOKEN_KEY = 'tailio_consultant_token';
const PROFILE_KEY = 'tailio_consultant_profile';

function loadSession() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
    if (token && profile) return { token, profile };
  } catch {
    // ignore
  }
  return null;
}

export default function App() {
  const [session, setSession] = useState(loadSession);
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('consultant@tailio.app');
  const [password, setPassword] = useState('tailio123');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');
  const [forgotNote, setForgotNote] = useState('');
  const [status, setStatus] = useState('offline');
  const [waiting, setWaiting] = useState([]);
  const [active, setActive] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [peerTyping, setPeerTyping] = useState(false);
  const [toast, setToast] = useState('');
  const feedRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimer = useRef(null);
  const selectedIdRef = useRef(null);
  const conversationRef = useRef(null);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  const showToast = (text) => {
    setToast(text);
    setTimeout(() => setToast(''), 2800);
  };

  const clearWorkspace = () => {
    setConversation(null);
    setMessages([]);
    setSelectedId(null);
    setPeerTyping(false);
    setDraft('');
  };

  const logout = () => {
    socketRef.current?.close();
    socketRef.current = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
    setSession(null);
    setWaiting([]);
    setActive([]);
    setHistory([]);
    clearWorkspace();
  };

  const persistSession = (token, profile) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    setSession({ token, profile });
  };

  const onLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const data = await api('/api/auth/consultant/login', {
        method: 'POST',
        body: { email, password },
      });
      persistSession(data.token, data.consultant);
    } catch (err) {
      setAuthError(err.message || 'Ошибка входа');
    }
  };

  const onRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const data = await api('/api/auth/consultant/register', {
        method: 'POST',
        body: { email, password, name },
      });
      persistSession(data.token, data.consultant);
    } catch (err) {
      setAuthError(err.message || 'Ошибка регистрации');
    }
  };

  const onForgot = async () => {
    setForgotNote('');
    try {
      const data = await api('/api/auth/consultant/forgot-password', {
        method: 'POST',
        body: { email },
      });
      setForgotNote(data.message);
    } catch (err) {
      setForgotNote(err.message || 'Не удалось отправить запрос');
    }
  };

  useEffect(() => {
    if (!session?.token) return undefined;

    const sock = createChatSocket(session.token, {
      onStatus: setStatus,
      onMessage: (msg) => {
        switch (msg.type) {
          case 'queue.updated':
            setWaiting(msg.waiting || []);
            break;
          case 'active.updated':
            setActive(msg.active || []);
            break;
          case 'history.updated':
            setHistory(msg.history || []);
            break;
          case 'conversation.claimed':
          case 'conversation.snapshot':
            setConversation(msg.conversation);
            setMessages(msg.messages || []);
            setSelectedId(msg.conversation?.id || null);
            setPeerTyping(false);
            break;
          case 'conversation.taken':
            setWaiting((prev) => prev.filter((c) => c.id !== msg.conversationId));
            if (selectedIdRef.current === msg.conversationId) {
              showToast('Диалог уже забрал другой консультант');
              clearWorkspace();
            }
            break;
          case 'message.new': {
            const openId = conversationRef.current?.id || selectedIdRef.current;
            if (msg.message?.conversationId === openId) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === msg.message.id)) return prev;
                return [...prev, msg.message];
              });
            }
            break;
          }
          case 'typing':
            if (
              msg.conversationId === (conversationRef.current?.id || selectedIdRef.current) &&
              msg.role === 'user'
            ) {
              setPeerTyping(Boolean(msg.isTyping));
            }
            break;
          case 'conversation.closed':
            if (msg.conversation?.id === (conversationRef.current?.id || selectedIdRef.current)) {
              showToast('Диалог закрыт и перенесён в историю');
              clearWorkspace();
            }
            break;
          case 'error':
            showToast(msg.message || msg.code || 'Ошибка');
            break;
          default:
            break;
        }
      },
    });

    socketRef.current = sock;
    return () => sock.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, peerTyping]);

  const claim = (id) => {
    socketRef.current?.send({ type: 'conversation.claim', conversationId: id });
  };

  const openConversation = (id) => {
    setSelectedId(id);
    socketRef.current?.send({ type: 'conversation.open', conversationId: id });
  };

  const sendMessage = (e) => {
    e?.preventDefault?.();
    const text = draft.trim();
    if (!text || !conversation?.id || conversation.status === 'closed') return;
    socketRef.current?.send({
      type: 'message.send',
      conversationId: conversation.id,
      text,
    });
    setDraft('');
    socketRef.current?.send({
      type: 'typing',
      conversationId: conversation.id,
      isTyping: false,
    });
  };

  const onDraftChange = (value) => {
    setDraft(value);
    if (!conversation?.id || conversation.status === 'closed') return;
    socketRef.current?.send({
      type: 'typing',
      conversationId: conversation.id,
      isTyping: true,
    });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socketRef.current?.send({
        type: 'typing',
        conversationId: conversation.id,
        isTyping: false,
      });
    }, 1200);
  };

  const closeDialog = () => {
    if (!conversation?.id || conversation.status !== 'active') return;
    socketRef.current?.send({ type: 'conversation.close', conversationId: conversation.id });
  };

  if (!session) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="brand">
            <div className="brand-mark" />
            <div>
              <h1>Tailio Desk</h1>
              <p>Кабинет консультанта</p>
            </div>
          </div>
          <div className="tabs">
            <button className={mode === 'login' ? 'tab on' : 'tab'} type="button" onClick={() => setMode('login')}>
              Вход
            </button>
            <button
              className={mode === 'register' ? 'tab on' : 'tab'}
              type="button"
              onClick={() => setMode('register')}
            >
              Регистрация
            </button>
          </div>
          <form onSubmit={mode === 'login' ? onLogin : onRegister} className="auth-form">
            {mode === 'register' ? (
              <label>
                Имя
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Анна" />
              </label>
            ) : null}
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@tailio.app"
                required
              />
            </label>
            <label>
              Пароль
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="минимум 6 символов"
                required
                minLength={6}
              />
            </label>
            {authError ? <div className="error">{authError}</div> : null}
            {forgotNote ? <div className="note">{forgotNote}</div> : null}
            <button className="primary" type="submit">
              {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </button>
          </form>
          {mode === 'login' ? (
            <button className="link" type="button" onClick={onForgot}>
              Восстановить пароль
            </button>
          ) : null}
          <p className="hint">Демо: consultant@tailio.app / tailio123</p>
        </div>
      </div>
    );
  }

  const isArchivedView = conversation?.status === 'closed';

  return (
    <div className="desk">
      <header className="topbar">
        <div className="brand compact">
          <div className="brand-mark sm" />
          <strong>Tailio Desk</strong>
        </div>
        <div className="top-meta">
          <span className={`pill ${status}`}>{status === 'online' ? 'Online' : 'Offline'}</span>
          <span className="who">{session.profile.name}</span>
          <button type="button" className="ghost" onClick={logout}>
            Выйти
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <section>
            <h2>Ожидают ({waiting.length})</h2>
            <div className="list">
              {waiting.length === 0 ? <div className="empty">Очередь пуста</div> : null}
              {waiting.map((item) => (
                <button key={item.id} type="button" className="dialog-card wait" onClick={() => claim(item.id)}>
                  <div className="dialog-title">{item.userName || item.userEmail}</div>
                  <div className="dialog-sub">
                    {item.petName ? `Питомец: ${item.petName}` : 'Без питомца'} · нажмите, чтобы забрать
                  </div>
                  <div className="dialog-preview">{item.preview || 'Новое обращение'}</div>
                </button>
              ))}
            </div>
          </section>
          <section>
            <h2>Мои активные ({active.length})</h2>
            <div className="list">
              {active.length === 0 ? <div className="empty">Нет активных диалогов</div> : null}
              {active.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`dialog-card ${selectedId === item.id ? 'selected' : ''}`}
                  onClick={() => openConversation(item.id)}
                >
                  <div className="dialog-title">{item.userName || item.userEmail}</div>
                  <div className="dialog-sub">{item.petName || 'Без питомца'}</div>
                  <div className="dialog-preview">{item.preview || ''}</div>
                </button>
              ))}
            </div>
          </section>
          <section>
            <h2>История ({history.length})</h2>
            <div className="list">
              {history.length === 0 ? <div className="empty">Закрытых диалогов пока нет</div> : null}
              {history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`dialog-card archived ${selectedId === item.id ? 'selected' : ''}`}
                  onClick={() => openConversation(item.id)}
                >
                  <div className="dialog-title">{item.userName || item.userEmail}</div>
                  <div className="dialog-sub">
                    {item.petName || 'Без питомца'} · архив
                  </div>
                  <div className="dialog-preview">{item.preview || ''}</div>
                </button>
              ))}
            </div>
          </section>
        </aside>

        <main className="chat">
          {!conversation ? (
            <div className="chat-empty">
              <h2>Выберите диалог</h2>
              <p>Заберите обращение из очереди или откройте активный чат / историю слева.</p>
            </div>
          ) : (
            <>
              <div className="chat-head">
                <div>
                  <h2>{conversation.userName || conversation.userEmail}</h2>
                  <p>
                    {conversation.petName ? `${conversation.petName} · ` : ''}
                    {conversation.status === 'active'
                      ? 'Активный диалог'
                      : conversation.status === 'waiting'
                        ? 'Ожидает'
                        : 'Архив (только просмотр)'}
                    {peerTyping ? ' · печатает…' : ''}
                  </p>
                </div>
                {conversation.status === 'active' ? (
                  <button type="button" className="ghost danger" onClick={closeDialog}>
                    Закрыть диалог
                  </button>
                ) : null}
              </div>
              <div className="feed" ref={feedRef}>
                {messages.map((m) => (
                  <div key={m.id} className={`bubble ${m.senderRole}`}>
                    <div className="bubble-meta">
                      {m.senderRole === 'user'
                        ? 'Пользователь'
                        : m.senderRole === 'consultant'
                          ? 'Вы'
                          : 'Система'}
                    </div>
                    <div className="bubble-text">{m.text}</div>
                  </div>
                ))}
              </div>
              <form className="composer" onSubmit={sendMessage}>
                <input
                  value={draft}
                  onChange={(e) => onDraftChange(e.target.value)}
                  placeholder={
                    isArchivedView
                      ? 'Архивный диалог — только просмотр'
                      : 'Напишите ответ…'
                  }
                  disabled={isArchivedView}
                />
                <button className="primary" type="submit" disabled={isArchivedView}>
                  Отправить
                </button>
              </form>
            </>
          )}
        </main>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}
