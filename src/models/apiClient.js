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
    return { ...session, ...next, user: next.user || session.user };
  } catch {
    return null;
  }
}

function applySessionChange(nextSession, onSessionChange) {
  if (onSessionChange) return onSessionChange(nextSession) !== false;
  if (nextSession) sessionModel.save(nextSession);
  else sessionModel.clear();
  return true;
}

function createStaleSessionError() {
  const error = new Error('La sesión cambió durante la solicitud.');
  error.code = 'STALE_SESSION';
  return error;
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

  if (response.status === 401 && session && path !== '/auth/refresh') {
    const refreshed = session.refreshToken ? await refreshSession(session) : null;
    if (!applySessionChange(refreshed, onSessionChange)) throw createStaleSessionError();
    if (refreshed) return apiRequest(path, options, refreshed, onSessionChange);
  }

  const payload = await readJson(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(payload));
  }

  return payload;
}

export { API_URL };
