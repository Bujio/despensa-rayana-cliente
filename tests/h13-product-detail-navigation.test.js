import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createProductDetailLoadCoordinator,
  createProductDetailRouteExitTransition,
  getProductDetailNavigationIdentity,
  runProductDetailLogoutTransition,
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

test('logout does not acquire an anonymous intent before catalog navigation commits', () => {
  const harness = createHarness();
  harness.coordinator.acquire(identity({
    hasSession: true,
    sessionGeneration: 1,
    sessionOwnerKey: 'user:one',
  }), harness.handlers);

  harness.coordinator.cancel();
  harness.coordinator.acquire(identity({
    hasSession: false,
    sessionGeneration: null,
    sessionOwnerKey: '',
    suppressLoad: true,
  }), harness.handlers);

  assert.deepEqual(harness.requests, { detail: 1, reviews: 1 });
  assert.deepEqual(harness.cancelled, [1]);
});

function createSessionRouterBoundaryHarness({ strictMode = false } = {}) {
  const releases = [];
  const requests = { detail: [], reviews: [] };
  const cancelled = [];
  const navigations = [];
  const routeExitTransition = createProductDetailRouteExitTransition();
  const coordinator = createProductDetailLoadCoordinator({
    scheduleRelease: (callback) => releases.push(callback),
  });
  let activeIntent = null;
  let effectLease = null;
  let generationSequence = 1;
  let intentSequence = 0;
  let navigationSequence = 0;
  let route = { navigationKey: 'catalog-0', productId: '', routeView: 'catalog' };
  let session = { generation: generationSequence, ownerKey: 'user:one' };
  const state = {
    loadingProductDetail: false,
    notice: '',
    privateCart: ['private-cart'],
    privateReviewDraft: 'private-draft',
    product: null,
    productReviews: [],
    productReviewsLoadError: '',
    productReviewsLoading: false,
  };

  const handlers = {
    cancel: (intent) => {
      if (activeIntent === intent) activeIntent = null;
      intent.detailAborted = true;
      intent.reviewsAborted = true;
      cancelled.push(intent.id);
    },
    start: () => {
      intentSequence += 1;
      const intent = {
        detailAborted: false,
        generation: session?.generation ?? null,
        id: intentSequence,
        ownerKey: session?.ownerKey || 'anonymous',
        reviewsAborted: false,
      };
      activeIntent = intent;
      requests.detail.push(intent);
      requests.reviews.push(intent);
      state.loadingProductDetail = true;
      state.notice = '';
      state.product = null;
      state.productReviews = [];
      state.productReviewsLoadError = '';
      state.productReviewsLoading = true;
      return intent;
    },
  };

  const flushReleases = () => {
    releases.splice(0).forEach((release) => release());
  };

  const renderControllerBoundary = () => {
    if (effectLease) coordinator.release(effectLease);
    effectLease = null;
    const navigationIdentity = getProductDetailNavigationIdentity({
      hasSession: Boolean(session),
      ...route,
      sessionGeneration: session?.generation ?? null,
      sessionOwnerKey: session?.ownerKey || '',
      suppressLoad: routeExitTransition.suppresses(route),
    });
    if (navigationIdentity) {
      effectLease = coordinator.acquire(navigationIdentity, handlers);
      if (strictMode) {
        coordinator.release(effectLease);
        effectLease = coordinator.acquire(navigationIdentity, handlers);
      }
    }
    flushReleases();
    if (route.routeView !== 'product') routeExitTransition.complete(route.routeView);
  };

  const purgeSessionAndProductState = () => {
    coordinator.cancel();
    state.loadingProductDetail = false;
    state.notice = '';
    state.privateCart = [];
    state.privateReviewDraft = '';
    state.product = null;
    state.productReviews = [];
    state.productReviewsLoadError = '';
    state.productReviewsLoading = false;
  };

  return {
    cancelled,
    get route() {
      return route;
    },
    get session() {
      return session;
    },
    login(ownerKey) {
      generationSequence += 1;
      session = { generation: generationSequence, ownerKey };
      renderControllerBoundary();
    },
    logout() {
      runProductDetailLogoutTransition({
        clearSession: () => {
          assert.equal(routeExitTransition.suppresses(route), true);
          purgeSessionAndProductState();
          session = null;
          renderControllerBoundary();
        },
        currentRoute: route,
        navigateToCatalog: () => {
          assert.equal(session, null);
          assert.deepEqual(state.privateCart, []);
          assert.equal(state.privateReviewDraft, '');
          navigationSequence += 1;
          route = {
            navigationKey: 'catalog-' + navigationSequence,
            productId: '',
            routeView: 'catalog',
          };
          navigations.push('/catalogo');
          renderControllerBoundary();
        },
        routeExitTransition,
      });
      state.notice = 'Sesión cerrada';
    },
    navigations,
    requests,
    resolveCurrentIntent() {
      if (!activeIntent) return;
      state.loadingProductDetail = false;
      state.product = {
        generation: activeIntent.generation,
        ownerKey: activeIntent.ownerKey,
      };
      state.productReviews = [{
        generation: activeIntent.generation,
        ownerKey: activeIntent.ownerKey,
      }];
      state.productReviewsLoading = false;
    },
    state,
    visitProduct() {
      navigationSequence += 1;
      route = {
        navigationKey: 'product-' + navigationSequence,
        productId,
        routeView: 'product',
      };
      renderControllerBoundary();
    },
  };
}

function assertOneRequestPair(harness) {
  assert.equal(harness.requests.detail.length, 1);
  assert.equal(harness.requests.reviews.length, 1);
}

function assertTwoRequestPairs(harness) {
  assert.equal(harness.requests.detail.length, 2);
  assert.equal(harness.requests.reviews.length, 2);
}

for (const { label, strictMode } of [
  { label: 'production', strictMode: false },
  { label: 'StrictMode', strictMode: true },
]) {
  test(label + ': pending logout aborts the original pair without an anonymous intent', () => {
    const harness = createSessionRouterBoundaryHarness({ strictMode });
    harness.visitProduct();
    harness.logout();

    assertOneRequestPair(harness);
    assert.deepEqual(harness.cancelled, [1]);
    assert.equal(harness.requests.detail[0].detailAborted, true);
    assert.equal(harness.requests.reviews[0].reviewsAborted, true);
    assert.equal(harness.route.routeView, 'catalog');
    assert.deepEqual(harness.navigations, ['/catalogo']);
  });

  test(label + ': resolved logout purges detail and private session state before catalog', () => {
    const harness = createSessionRouterBoundaryHarness({ strictMode });
    harness.visitProduct();
    harness.resolveCurrentIntent();
    harness.state.productReviewsLoadError = 'old error';
    harness.state.notice = 'old notice';
    harness.logout();

    assertOneRequestPair(harness);
    assert.equal(harness.state.product, null);
    assert.deepEqual(harness.state.productReviews, []);
    assert.equal(harness.state.productReviewsLoadError, '');
    assert.equal(harness.state.loadingProductDetail, false);
    assert.equal(harness.state.productReviewsLoading, false);
    assert.deepEqual(harness.state.privateCart, []);
    assert.equal(harness.state.privateReviewDraft, '');
    assert.equal(harness.state.notice, 'Sesión cerrada');
    assert.equal(harness.route.routeView, 'catalog');
  });

  test(label + ': same-account relogin creates only the new-generation visible visit', () => {
    const harness = createSessionRouterBoundaryHarness({ strictMode });
    harness.visitProduct();
    harness.resolveCurrentIntent();
    const firstGeneration = harness.requests.detail[0].generation;
    harness.logout();
    harness.login('user:one');
    harness.visitProduct();
    harness.resolveCurrentIntent();

    assertTwoRequestPairs(harness);
    assert.equal(harness.requests.detail[1].ownerKey, 'user:one');
    assert.notEqual(harness.requests.detail[1].generation, firstGeneration);
    assert.equal(harness.state.product.ownerKey, 'user:one');
    assert.equal(harness.state.product.generation, harness.session.generation);
    assert.equal(harness.state.productReviews[0].generation, harness.session.generation);
  });

  test(label + ': different-account login exposes only the final owner visit', () => {
    const harness = createSessionRouterBoundaryHarness({ strictMode });
    harness.visitProduct();
    harness.resolveCurrentIntent();
    harness.logout();
    harness.login('user:two');
    harness.visitProduct();
    harness.resolveCurrentIntent();

    assertTwoRequestPairs(harness);
    assert.equal(harness.requests.detail[0].ownerKey, 'user:one');
    assert.equal(harness.requests.detail[1].ownerKey, 'user:two');
    assert.equal(harness.state.product.ownerKey, 'user:two');
    assert.equal(harness.state.productReviews[0].ownerKey, 'user:two');
  });
}
