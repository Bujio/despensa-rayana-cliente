import { sessionModel } from './sessionModel.js';

const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3000/api';
const refreshRequestsByGeneration = new Map();
const SESSION_REFRESH_UNAVAILABLE_MESSAGE = 'No se ha podido comprobar tu sesión temporalmente. La operación no se ha enviado. Inténtalo de nuevo.';
let sessionGenerationSequence = 0;
let activeSessionGeneration = null;

export function beginSessionGeneration() {
  sessionGenerationSequence += 1;
  activeSessionGeneration = sessionGenerationSequence;
  return activeSessionGeneration;
}

export function invalidateSessionGeneration() {
  sessionGenerationSequence += 1;
  activeSessionGeneration = null;
  return sessionGenerationSequence;
}

export function isSessionGenerationActive(generation) {
  return Number.isSafeInteger(generation) && activeSessionGeneration === generation;
}

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

function createStaleSessionError() {
  const error = new Error('La sesión cambió durante la solicitud.');
  error.code = 'STALE_SESSION';
  return error;
}

function assertSessionContextCurrent(sessionContext) {
  if (sessionContext?.isCurrent && sessionContext.isCurrent(sessionContext) !== true) {
    throw createStaleSessionError();
  }
}

async function performSessionRefresh(session, sessionContext) {
  try {
    const next = await apiRequest(
      '/auth/refresh',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      },
      null,
    );
    assertSessionContextCurrent(sessionContext);
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
    assertSessionContextCurrent(sessionContext);
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

async function refreshSession(session, sessionContext) {
  assertSessionContextCurrent(sessionContext);
  const refreshToken = session?.refreshToken;
  if (!refreshToken) {
    return {
      kind: 'expired',
      error: createSessionExpiredError(401, 'REFRESH_TOKEN_MISSING'),
    };
  }

  const refreshKey = Number.isSafeInteger(sessionContext?.generation)
    ? sessionContext.generation
    : Symbol('unscoped-session-refresh');
  let refreshRequest = refreshRequestsByGeneration.get(refreshKey);
  if (!refreshRequest) {
    refreshRequest = performSessionRefresh(session, sessionContext);
    refreshRequestsByGeneration.set(refreshKey, refreshRequest);
  }

  try {
    const result = await refreshRequest;
    assertSessionContextCurrent(sessionContext);
    return result;
  } finally {
    if (refreshRequestsByGeneration.get(refreshKey) === refreshRequest) {
      refreshRequestsByGeneration.delete(refreshKey);
    }
  }
}

function applySessionChange(nextSession, sessionContext) {
  assertSessionContextCurrent(sessionContext);
  if (sessionContext?.onSessionChange) {
    return sessionContext.onSessionChange(nextSession, sessionContext) !== false;
  }
  if (nextSession) sessionModel.save(nextSession);
  else sessionModel.clear();
  return true;
}

function createApiError(response, payload, code = 'HTTP_ERROR') {
  const error = new Error(getErrorMessage(payload));
  error.name = 'ApiError';
  error.code = code;
  error.status = response.status;
  return error;
}

async function performApiRequest(path, options, session, sessionContext, refreshAttempted) {
  assertSessionContextCurrent(sessionContext);
  const headers = new Headers(options.headers || {});
  const hasFormData = options.body instanceof FormData;

  if (!hasFormData && options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (session?.accessToken) {
    headers.set('Authorization', 'Bearer ' + session.accessToken);
  }

  let response;
  try {
    response = await fetch(API_URL + path, {
      ...options,
      headers,
    });
  } catch (error) {
    assertSessionContextCurrent(sessionContext);
    throw error;
  }
  assertSessionContextCurrent(sessionContext);

  if (response.status === 401 && session && path !== '/auth/refresh') {
    if (refreshAttempted) {
      if (!applySessionChange(null, sessionContext)) throw createStaleSessionError();
      throw createSessionExpiredError(response.status, 'RETRIED_REQUEST_UNAUTHORIZED');
    }

    const refreshResult = await refreshSession(session, sessionContext);
    assertSessionContextCurrent(sessionContext);
    if (refreshResult.kind === 'unavailable') throw refreshResult.error;
    if (refreshResult.kind === 'expired') {
      if (!applySessionChange(null, sessionContext)) throw createStaleSessionError();
      throw refreshResult.error;
    }
    if (!applySessionChange(refreshResult.session, sessionContext)) {
      throw createStaleSessionError();
    }
    assertSessionContextCurrent(sessionContext);
    return performApiRequest(path, options, refreshResult.session, sessionContext, true);
  }

  const payload = await readJson(response);
  assertSessionContextCurrent(sessionContext);
  if (!response.ok) {
    throw createApiError(response, payload);
  }

  return payload;
}

export function apiRequest(path, options = {}, session = sessionModel.get(), sessionLifecycle) {
  const lifecycle = typeof sessionLifecycle === 'function'
    ? { onSessionChange: sessionLifecycle }
    : sessionLifecycle;
  const sessionContext = session && lifecycle ? Object.freeze({
    generation: lifecycle.generation,
    ownerKey: lifecycle.ownerKey,
    isCurrent: lifecycle.isCurrent,
    onSessionChange: lifecycle.onSessionChange,
  }) : null;
  return performApiRequest(path, options, session, sessionContext, false);
}

export { API_URL };
