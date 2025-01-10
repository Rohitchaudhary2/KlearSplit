export type TopFriend = Record<string, { amount: number; friend_id: string }>;

export interface ExpenseCount {
  success: boolean;
  message: string;
  data: number[];
}

export interface TopFriends {
  success: boolean;
  message: string;
  data: TopFriend[];
}

export type TopGroup = Record<string, { amount: number; group: string }>;

export interface TopGroups {
  success: boolean;
  message: string;
  data: TopGroup[];
}
