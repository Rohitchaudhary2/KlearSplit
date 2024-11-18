import { CurrentUser } from '../shared/types.model';

// Interface to represent the response structure for user log in
export interface LoginResponse {
  data: CurrentUser;
  accessToken: string;
  refreshToken: string;
}

// Interface to represent the structure of data required for logging in a user
export interface LoginUser {
  email: string;
  password: string;
}
