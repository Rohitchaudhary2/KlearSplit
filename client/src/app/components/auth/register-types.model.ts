import { CurrentUser } from '../shared/types.model';

export interface RegisterResponse {
  user: CurrentUser;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterUser {
  first_name: string;
  last_name: null | string;
  email: string;
  phone: string;
}
