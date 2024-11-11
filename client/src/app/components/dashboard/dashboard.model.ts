export interface AllExpenses {
  success: boolean;
  message: string;
  data: {
    expensesRange: number[];
    balanceAmounts: number[];
    topFriends: TopFriend[];
  };
}

export type TopFriend = Record<string, { amount: number; friend_id: string }>;
