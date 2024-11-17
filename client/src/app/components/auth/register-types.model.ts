import { CurrentUser } from '../shared/types.model';

// Interface to represent the response structure for user registration
export interface RegisterResponse {
  data: CurrentUser;
  accessToken: string;
  refreshToken: string;
}

// Interface to represent the structure of data required for registering a new user
export interface RegisterUser {
  first_name: string;
  last_name: null | string;
  email: string;
  phone: null | string;
}
