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
  friend1_id: string;
  friend2_id: string;
  status: string;
  balance_amount: string;
  archival_status: string;
  block_status: string;
  friend1: AddedFriend | null;
  friend2: AddedFriend | null;
}

export interface AddedFriend {
  first_name: string;
  last_name: string;
  email: string;
  image_url: string;
}
