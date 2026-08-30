import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createProductDetailLoadCoordinator,
  getProductDetailNavigationIdentity,
} from '../src/controllers/productDetailLoadCoordinator.js';

const productId = '000000000000000000000005';

function createHarness() {
  const releases = [];
  const requests = { detail: 0, reviews: 0 };
  const cancelled = [];
  let intentSequence = 0;
  const coordinator = createProductDetailLoadCoordinator({
    scheduleRelease: (callback) => releases.push(callback),
  });
  const handlers = {
    cancel: (intent) => cancelled.push(intent.id),
    start: () => {
      requests.detail += 1;
      requests.reviews += 1;
      intentSequence += 1;
      return { id: intentSequence };
    },
  };

  return {
    cancelled,
    coordinator,
    flushReleases() {
      releases.splice(0).forEach((release) => release());
    },
    handlers,
    requests,
  };
}

function identity(overrides = {}) {
  return getProductDetailNavigationIdentity({
    hasSession: false,
    navigationKey: 'navigation-a',
    productId,
    routeView: 'product',
    sessionGeneration: null,
    sessionOwnerKey: '',
    ...overrides,
  });
}

test('defers a persisted-session load until its logical generation exists', () => {
  assert.equal(identity({
    hasSession: true,
    sessionOwnerKey: 'user:one',
  }), '');

  assert.notEqual(identity({
    hasSession: true,
    sessionGeneration: 1,
    sessionOwnerKey: 'user:one',
  }), '');
});

test('StrictMode reclaims one anonymous navigation without issuing another request pair', () => {
  const harness = createHarness();
  const navigationIdentity = identity();
  const firstLease = harness.coordinator.acquire(navigationIdentity, harness.handlers);
  harness.coordinator.release(firstLease);
  const strictModeLease = harness.coordinator.acquire(navigationIdentity, harness.handlers);

  harness.flushReleases();
  assert.deepEqual(harness.requests, { detail: 1, reviews: 1 });
  assert.deepEqual(harness.cancelled, []);

  harness.coordinator.release(strictModeLease);
  harness.flushReleases();
  assert.deepEqual(harness.cancelled, [1]);
});

test('StrictMode reclaims one initialized persisted-session navigation', () => {
  const harness = createHarness();
  const navigationIdentity = identity({
    hasSession: true,
    sessionGeneration: 7,
    sessionOwnerKey: 'user:one',
  });
  const firstLease = harness.coordinator.acquire(navigationIdentity, harness.handlers);
  harness.coordinator.release(firstLease);
  harness.coordinator.acquire(navigationIdentity, harness.handlers);

  harness.flushReleases();
  assert.deepEqual(harness.requests, { detail: 1, reviews: 1 });
  assert.deepEqual(harness.cancelled, []);
});

test('a later real navigation to the same product starts a fresh request pair', () => {
  const harness = createHarness();
  harness.coordinator.acquire(identity(), harness.handlers);
  harness.coordinator.acquire(identity({ navigationKey: 'navigation-b' }), harness.handlers);

  assert.deepEqual(harness.requests, { detail: 2, reviews: 2 });
  assert.deepEqual(harness.cancelled, [1]);
});

test('owner and logical-generation changes each start a fresh request pair', () => {
  const harness = createHarness();
  harness.coordinator.acquire(identity({
    hasSession: true,
    sessionGeneration: 1,
    sessionOwnerKey: 'user:one',
  }), harness.handlers);
  harness.coordinator.acquire(identity({
    hasSession: true,
    sessionGeneration: 2,
    sessionOwnerKey: 'user:one',
  }), harness.handlers);
  harness.coordinator.acquire(identity({
    hasSession: true,
    sessionGeneration: 3,
    sessionOwnerKey: 'user:two',
  }), harness.handlers);

  assert.deepEqual(harness.requests, { detail: 3, reviews: 3 });
  assert.deepEqual(harness.cancelled, [1, 2]);
});

test('a stale cleanup cannot cancel the intent of a newer navigation', () => {
  const harness = createHarness();
  const firstLease = harness.coordinator.acquire(identity(), harness.handlers);
  harness.coordinator.release(firstLease);
  harness.coordinator.acquire(identity({ navigationKey: 'navigation-b' }), harness.handlers);

  harness.flushReleases();
  assert.deepEqual(harness.requests, { detail: 2, reviews: 2 });
  assert.deepEqual(harness.cancelled, [1]);
});
