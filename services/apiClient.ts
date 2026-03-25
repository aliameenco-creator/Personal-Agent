import { supabase } from './supabaseClient';

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');
  return session.access_token;
}

interface ApiOptions {
  timeout?: number;
}

export async function apiPost<T = any>(endpoint: string, body: any, options: ApiOptions = {}): Promise<T> {
  const token = await getAuthToken();
  const { timeout = 120000 } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`/api/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `API error ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function apiGet<T = any>(endpoint: string): Promise<T> {
  const token = await getAuthToken();

  const response = await fetch(`/api/${endpoint}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `API error ${response.status}`);
  }

  return response.json();
}
