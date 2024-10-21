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
  status: string;
  balance_amount: string;
  archival_status: string;
  block_status: string;
  friend: AddedFriend;
}

export interface AddedFriend {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  image_url: string;
}

export interface message {
  success: string;
  message: string;
  data: messageData[];
}

export interface messageData {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
}

export interface ExpenseResponse {
  success: string;
  message: string;
  data: {
    createdAt: string;
    debtor_amount: string;
    debtor_id: string;
    deletedAt: string | null;
    description: string;
    expense_name: string;
    friend_expense_id: string;
    payer_id: string;
    receipt_url: string | null;
    split_type: string;
    total_amount: string;
    updatedAt: string;
  };
}

export interface Expense {
  success: string;
  message: string;
  data: ExpenseData[];
}

export interface ExpenseData {
  createdAt: string;
  debtor_amount: string;
  debtor_id: string;
  deletedAt: string | null;
  description: string;
  expense_name: string;
  friend_expense_id: string;
  payer_id: string;
  receipt_url: string | null;
  split_type: string;
  total_amount: string;
  updatedAt: string;
}
