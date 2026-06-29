import { API_URL, apiRequest } from './models/apiClient.js';
import { authModel } from './models/authModel.js';
import { sessionModel } from './models/sessionModel.js';

const sessionStore = {
  get: sessionModel.get,
  set: sessionModel.save,
  clear: sessionModel.clear,
};

const login = authModel.login;
const logout = authModel.logout;
const registerAccount = authModel.register;

export { API_URL, apiRequest, login, logout, registerAccount, sessionStore };
export { authModel } from './models/authModel.js';
export { sessionModel } from './models/sessionModel.js';
