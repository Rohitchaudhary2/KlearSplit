export interface SearchedUser {
  success: string;
  message: string;
  data: User[];
}

export interface User {
  email: string;
}

export interface Friend {
  success: string;
  message: string;
  data: FriendData[];
}

export interface FriendData {
  conversation_id: string;
}
