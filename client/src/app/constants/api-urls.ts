import { environment } from '../../environments/environment';

export const API_URLS = {
  login: `${environment.apiBaseUrl}/auth/login`,
  logout: `${environment.apiBaseUrl}/auth/logout`,
  verify: `${environment.apiBaseUrl}/users/verify`,
  register: `${environment.apiBaseUrl}/users/register`,
  verifyForgotPassword: `${environment.apiBaseUrl}/users/verifyforgotpassword`,
  forgotPassword: `${environment.apiBaseUrl}/users/forgotpassword`,
  restoreAccountVerify: `${environment.apiBaseUrl}/users/verifyrestore`,
  restoreAccount: `${environment.apiBaseUrl}/users/restore`,
  fetchUser: `${environment.apiBaseUrl}/users`,
};
