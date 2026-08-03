import { sessionModel } from './sessionModel.js';

const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3000/api';
const refreshRequestsByToken = new Map();
const SESSION_REFRESH_UNAVAILABLE_MESSAGE = 'No se ha podido comprobar tu sesión temporalmente. La operación no se ha enviado. Inténtalo de nuevo.';

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

function getSafeRefreshFailureCause(error) {
  const status = Number.isInteger(error?.status) ? error.status : undefined;
  if (status) {
    return { type: 'http', code: 'HTTP_' + status, status };
  }
  if (error?.code === 'INVALID_SESSION_REFRESH_RESPONSE') {
    return { type: 'response', code: 'INVALID_SESSION_REFRESH_RESPONSE' };
  }
  if (error?.name === 'AbortError' || error?.code === 'ETIMEDOUT') {
    return { type: 'timeout', code: 'SESSION_REFRESH_TIMEOUT' };
  }
  return { type: 'transport', code: 'SESSION_REFRESH_NETWORK_ERROR' };
}

function createSessionExpiredError(status = 401, causeCode = 'SESSION_REFRESH_REJECTED') {
  const error = new Error('La sesión ya no es válida.');
  error.name = 'ApiError';
  error.code = 'SESSION_EXPIRED';
  error.status = status;
  error.cause = { type: 'http', code: causeCode, status };
  return error;
}

function createSessionRefreshUnavailableError(sourceError) {
  const cause = getSafeRefreshFailureCause(sourceError);
  const error = new Error(SESSION_REFRESH_UNAVAILABLE_MESSAGE);
  error.name = 'ApiError';
  error.code = 'SESSION_REFRESH_UNAVAILABLE';
  if (cause.status) error.status = cause.status;
  error.cause = cause;
  return error;
}

async function performSessionRefresh(session) {
  try {
    const next = await apiRequest(
      '/auth/refresh',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      },
      null,
    );
    if (!next?.accessToken || !next?.refreshToken) {
      const invalidResponse = new Error('Invalid session refresh response');
      invalidResponse.code = 'INVALID_SESSION_REFRESH_RESPONSE';
      throw invalidResponse;
    }
    return {
      kind: 'refreshed',
      session: { ...session, ...next, user: next.user || session.user },
    };
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      return {
        kind: 'expired',
        error: createSessionExpiredError(error.status),
      };
    }
    return {
      kind: 'unavailable',
      error: createSessionRefreshUnavailableError(error),
    };
  }
}

async function refreshSession(session) {
  const refreshToken = session?.refreshToken;
  if (!refreshToken) {
    return {
      kind: 'expired',
      error: createSessionExpiredError(401, 'REFRESH_TOKEN_MISSING'),
    };
  }

  let refreshRequest = refreshRequestsByToken.get(refreshToken);
  if (!refreshRequest) {
    refreshRequest = performSessionRefresh(session);
    refreshRequestsByToken.set(refreshToken, refreshRequest);
  }

  try {
    return await refreshRequest;
  } finally {
    if (refreshRequestsByToken.get(refreshToken) === refreshRequest) {
      refreshRequestsByToken.delete(refreshToken);
    }
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

function createApiError(response, payload, code = 'HTTP_ERROR') {
  const error = new Error(getErrorMessage(payload));
  error.name = 'ApiError';
  error.code = code;
  error.status = response.status;
  return error;
}

async function performApiRequest(path, options, session, onSessionChange, refreshAttempted) {
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
    if (refreshAttempted) {
      if (!applySessionChange(null, onSessionChange)) throw createStaleSessionError();
      throw createSessionExpiredError(response.status, 'RETRIED_REQUEST_UNAUTHORIZED');
    }

    const refreshResult = await refreshSession(session);
    if (refreshResult.kind === 'unavailable') throw refreshResult.error;
    if (refreshResult.kind === 'expired') {
      if (!applySessionChange(null, onSessionChange)) throw createStaleSessionError();
      throw refreshResult.error;
    }
    if (!applySessionChange(refreshResult.session, onSessionChange)) {
      throw createStaleSessionError();
    }
    return performApiRequest(path, options, refreshResult.session, onSessionChange, true);
  }

  const payload = await readJson(response);
  if (!response.ok) {
    throw createApiError(response, payload);
  }

  return payload;
}

export function apiRequest(path, options = {}, session = sessionModel.get(), onSessionChange) {
  return performApiRequest(path, options, session, onSessionChange, false);
}

export { API_URL };
