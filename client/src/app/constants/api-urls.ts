import { environment } from '../../environments/environment';

export const API_URLS = {
  login: `${environment.apiBaseUrl}/auth/login`,
  logout: `${environment.apiBaseUrl}/auth/logout`,
  verify: `${environment.apiBaseUrl}/users/verify`,
  register: `${environment.apiBaseUrl}/users/register`,
  googleAuth: `${environment.apiBaseUrl}/auth/google`,
  verifyForgotPassword: `${environment.apiBaseUrl}/users/verifyforgotpassword`,
  forgotPassword: `${environment.apiBaseUrl}/users/forgotpassword`,
  restoreAccountVerify: `${environment.apiBaseUrl}/users/verifyrestore`,
  restoreAccount: `${environment.apiBaseUrl}/users/restore`,
  fetchUser: `${environment.apiBaseUrl}/users`,
  getUsers: `${environment.apiBaseUrl}/users/getUsers/`,
  appFriend: `${environment.apiBaseUrl}/friends/addfriend`,
};
