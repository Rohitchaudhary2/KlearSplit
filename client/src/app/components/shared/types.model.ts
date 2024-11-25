// Interface for the current logged in user
export interface CurrentUser {
  user_id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string;
  image_url: string;
}

// Interface for the response for fetching a user
export interface FetchResponse {
  data: CurrentUser;
  status: number;
  message: string;
}
