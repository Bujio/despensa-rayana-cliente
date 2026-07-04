import { sessionModel } from './sessionModel.js';

const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3000/api';

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getErrorMessage(payload) {
  if (Array.isArray(payload?.errors)) {
    return payload.errors.map((error) => error.message).join('. ');
  }
  return payload?.message || 'No se pudo completar la operación';
}

async function refreshSession(session) {
  try {
    const next = await apiRequest(
      '/auth/refresh',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      },
      null,
    );
    const updated = { ...session, ...next, user: next.user || session.user };
    sessionModel.save(updated);
    return updated;
  } catch {
    sessionModel.clear();
    return null;
  }
}

export async function apiRequest(path, options = {}, session = sessionModel.get(), onSessionChange) {
  const headers = new Headers(options.headers || {});
  const hasFormData = options.body instanceof FormData;

  if (!hasFormData && options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (session?.accessToken) {
    headers.set('Authorization', 'Bearer ' + session.accessToken);
  }

  const response = await fetch(API_URL + path, {
    ...options,
    headers,
  });

  if (response.status === 401 && session?.refreshToken && path !== '/auth/refresh') {
    const refreshed = await refreshSession(session);
    if (refreshed) {
      onSessionChange?.(refreshed);
      return apiRequest(path, options, refreshed, onSessionChange);
    }
    onSessionChange?.(null);
  }

  const payload = await readJson(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(payload));
  }

  return payload;
}

export { API_URL };
