import { apiRequest } from './apiClient.js';

export const authModel = {
  login(email, password) {
    return apiRequest(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
      null,
    );
  },
  register(data) {
    return apiRequest(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      null,
    );
  },
  registerSupplier(data) {
    return apiRequest(
      '/suppliers/register',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      null,
    );
  },
  async logout(refreshToken) {
    if (!refreshToken) return;
    await apiRequest(
      '/auth/logout',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      },
      null,
    );
  },
};
