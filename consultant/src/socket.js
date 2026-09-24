import { wsUrl } from './api.js';

export function createChatSocket(token, handlers = {}) {
  let socket = null;
  let closedByUser = false;
  let retry = 0;
  let retryTimer = null;

  const connect = () => {
    socket = new WebSocket(wsUrl(token));

    socket.onopen = () => {
      retry = 0;
      handlers.onStatus?.('online');
      send({ type: 'queue.subscribe' });
    };

    socket.onclose = () => {
      handlers.onStatus?.('offline');
      if (!closedByUser) {
        const delay = Math.min(10000, 1000 * 2 ** retry);
        retry += 1;
        retryTimer = setTimeout(connect, delay);
      }
    };

    socket.onerror = () => {
      handlers.onStatus?.('offline');
    };

    socket.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      handlers.onMessage?.(msg);
    };
  };

  const send = (payload) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
      return true;
    }
    return false;
  };

  connect();

  return {
    send,
    close() {
      closedByUser = true;
      if (retryTimer) clearTimeout(retryTimer);
      socket?.close();
    },
  };
}
