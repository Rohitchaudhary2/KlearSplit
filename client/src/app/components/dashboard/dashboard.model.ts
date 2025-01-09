export type TopFriend = Record<string, { amount: number; friend_id: string }>;
export interface AllExpenses {
  success: boolean;
  message: string;
  data: {
    expensesRange: number[];
    balanceAmounts: number[];
    topFriends: TopFriend[];
    monthlyExpense: number[];
  };
}

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
