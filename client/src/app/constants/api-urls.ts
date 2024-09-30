import { environment } from '../../environments/environment';

export const API_URLS = {
  login: `${environment.apiBaseUrl}/auth/login`,
  logout: `${environment.apiBaseUrl}/auth/logout`,
  verify: `${environment.apiBaseUrl}/users/verify`,
  register: `${environment.apiBaseUrl}/users/register`,
  fetchUser: `${environment.apiBaseUrl}/users`,
};
