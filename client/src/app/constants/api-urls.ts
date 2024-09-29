import { environment } from '../../environments/environment';

export const API_URLS = {
  login: `${environment.apiBaseUrl}/auth/login`,
  register: `${environment.apiBaseUrl}/users/register`,
  verify: `${environment.apiBaseUrl}/users/verify`,
  fetchUser: `${environment.apiBaseUrl}/users`,
};
