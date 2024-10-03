import { CurrentUser } from '../shared/types.model';

export interface LoginResponse {
  data: CurrentUser;
  accessToken: string;
  refreshToken: string;
}

export interface LoginUser {
  email: string;
  password: string;
}
