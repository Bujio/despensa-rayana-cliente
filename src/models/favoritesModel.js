const STORAGE_KEY = 'despensaRayana:favorites';

function readFavorites() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFavorites(ids) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export const favoritesModel = {
  getAll() {
    return readFavorites();
  },
  toggle(productId) {
    const current = readFavorites();
    const next = current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId];
    saveFavorites(next);
    return next;
  },
  clear() {
    saveFavorites([]);
    return [];
  },
};
