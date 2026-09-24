import { API_BASE_URL } from '../config/features';

export type UpsertUserPayload = {
  email: string;
  name?: string;
  city?: string;
  pet?: {
    id?: string;
    name: string;
    kind?: string;
    breed?: string;
    sex?: string;
    birthDate?: string;
    collarId?: string;
  };
};

export type UpsertUserResult = {
  token: string;
  user: { id: string; email: string; name: string; city: string };
  pet: { id: string; name: string; kind: string; breed: string } | null;
};

export async function upsertChatUser(payload: UpsertUserPayload): Promise<UpsertUserResult> {
  const res = await fetch(`${API_BASE_URL}/api/auth/user/upsert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || `upsert_failed_${res.status}`);
  }
  return data as UpsertUserResult;
}

export async function pingChatServer(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}
