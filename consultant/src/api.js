const API_BASE = import.meta.env.VITE_API_URL || '';

export async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || data.error || `HTTP ${res.status}`);
    err.code = data.error;
    err.status = res.status;
    throw err;
  }
  return data;
}

export function wsUrl(token) {
  if (import.meta.env.VITE_WS_URL) {
    return `${import.meta.env.VITE_WS_URL}?token=${encodeURIComponent(token)}`;
  }
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // Dev: Vite proxies /ws → backend. Prod: same origin as static served by server.
  if (import.meta.env.DEV) {
    return `${proto}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;
  }
  return `${proto}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;
}
