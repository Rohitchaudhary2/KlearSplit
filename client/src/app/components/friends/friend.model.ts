export interface SearchedUser {
  email: string;
}

export interface SearchedUserResponse {
  success: string;
  message: string;
  data: SearchedUser[];
}

export interface AddedFriend {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  image_url: string;
}

export interface FriendData {
  conversation_id: string;
  status: string;
  balance_amount: string;
  archival_status: string;
  block_status: string;
  friend: AddedFriend;
}

export interface Friend {
  success: string;
  message: string;
  data: FriendData[];
}

export interface MessageData {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  createdAt: string;
}

export interface Message {
  success: string;
  message: string;
  data: MessageData[];
}

export interface ExpenseData {
  createdAt: string;
  debtor_amount: string;
  debtor_id: string;
  deletedAt: string | null;
  conversation_id: string;
  description: string;
  expense_name: string;
  friend_expense_id: string;
  payer_id: string;
  receipt_url: string | null;
  split_type: string;
  total_amount: string;
  updatedAt: string;
  payer: string;
}

export interface ExpenseResponse {
  success: string;
  message: string;
  data: ExpenseData;
}

export interface Expense {
  success: string;
  message: string;
  data: ExpenseData[];
}

export interface SettlementData {
  split_type: string;
  total_amount: string;
}

export interface ExpenseInput {
  expense_name: string;
  total_amount: string;
  description?: string;
  split_type: string;
  payer_id: string;
  participant1_share: string;
  participant2_share: string;
  receipt?: File;
  debtor_share: string;
  debtor_id: string;
}

export interface CombinedMessage extends MessageData {
  type: string;
}

export interface CombinedExpense extends ExpenseData {
  type: string;
}

export interface CombinedView {
  success: string;
  message: string;
  data: (CombinedExpense | CombinedMessage)[];
}

export interface ExpenseDeletedEvent {
  id: string;
  payerId: string;
  debtorAmount: string;
}
