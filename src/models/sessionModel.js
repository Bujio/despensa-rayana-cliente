export const sessionModel = {
  get() {
    try {
      return JSON.parse(localStorage.getItem('despensa-session')) || null;
    } catch {
      return null;
    }
  },
  save(session) {
    localStorage.setItem('despensa-session', JSON.stringify(session));
  },
  clear() {
    localStorage.removeItem('despensa-session');
  },
};
