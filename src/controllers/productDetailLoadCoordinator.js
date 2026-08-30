function scheduleReleaseInMicrotask(callback) {
  void Promise.resolve().then(callback);
}

export function getProductDetailNavigationIdentity({
  hasSession = false,
  navigationKey = '',
  productId = '',
  routeView = '',
  sessionGeneration = null,
  sessionOwnerKey = '',
} = {}) {
  const normalizedProductId = String(productId || '');
  if (routeView !== 'product' || !normalizedProductId) return '';

  if (hasSession) {
    if (!sessionOwnerKey || !Number.isSafeInteger(sessionGeneration)) return '';
    return JSON.stringify([
      String(navigationKey || 'default'),
      normalizedProductId,
      String(sessionOwnerKey),
      sessionGeneration,
    ]);
  }

  return JSON.stringify([
    String(navigationKey || 'default'),
    normalizedProductId,
    'anonymous',
  ]);
}

export function createProductDetailLoadCoordinator({
  scheduleRelease = scheduleReleaseInMicrotask,
} = {}) {
  let activeEntry = null;
  let leaseSequence = 0;

  const cancelEntry = (entry) => {
    entry?.cancel?.(entry.intent);
  };

  return Object.freeze({
    acquire(identity, { cancel, start } = {}) {
      if (!identity || typeof cancel !== 'function' || typeof start !== 'function') return null;

      if (activeEntry?.identity !== identity) {
        const previousEntry = activeEntry;
        activeEntry = null;
        cancelEntry(previousEntry);

        const intent = start();
        if (!intent) return null;
        activeEntry = { cancel, identity, intent, leaseToken: 0 };
      } else {
        activeEntry.cancel = cancel;
      }

      leaseSequence += 1;
      activeEntry.leaseToken = leaseSequence;
      return Object.freeze({
        identity,
        intent: activeEntry.intent,
        token: activeEntry.leaseToken,
      });
    },

    cancel() {
      const entry = activeEntry;
      activeEntry = null;
      cancelEntry(entry);
    },

    release(lease) {
      if (!lease) return;
      scheduleRelease(() => {
        if (
          activeEntry?.identity !== lease.identity
          || activeEntry?.intent !== lease.intent
          || activeEntry?.leaseToken !== lease.token
        ) return;

        const entry = activeEntry;
        activeEntry = null;
        cancelEntry(entry);
      });
    },
  });
}
