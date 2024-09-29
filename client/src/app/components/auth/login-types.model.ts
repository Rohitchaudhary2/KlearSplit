import { CurrentUser } from '../shared/types.model';

export interface LoginResponse {
  user: CurrentUser;
  accessToken: string;
  refreshToken: string;
}

export interface LoginUser {
  email: string;
  password: string;
}
