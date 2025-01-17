import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { concatMap, firstValueFrom, map, Observable, tap } from "rxjs";

import { API_URLS } from "../../../constants/api-urls";
import {
  CombinedExpense,
  CombinedMessage,
  CombinedView,
  Expense,
  ExpenseInput,
  ExpenseResponse,
  Friend,
  FriendData,
  Message,
  SearchedUserResponse,
  SettlementData,
} from "./friend.model";

@Injectable({
  providedIn: "root", // This makes the service available globally within the app
})
export class FriendsService {
  // Injecting the HttpClient to make HTTP requests
  private readonly httpClient = inject(HttpClient);
  private friendRequests = signal<FriendData[]>([]);
  private friends = signal<FriendData[]>([]);

  requests = this.friendRequests.asReadonly();
  friendList = this.friends.asReadonly();

  sortBycreatedAt(data: (CombinedMessage | CombinedExpense)[]) {
    return data.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  }

  /**
   * Fetches messages, expenses, and combined data for a specific conversation.
   * It handles loading conditions based on flags: loadMessages, loadExpenses, loadCombined.
   *
   * @param conversationId - The ID of the conversation to fetch data for.
   * @param loadMessages - Flag to determine if messages are to be loaded.
   * @param loadExpenses - Flag to determine if expenses are to be loaded.
   * @param timestampMessage - Timestamp for last fetched message.
   * @param timestampExpense - Timestamp for last fetched expense.
   * @param timestampCombined - Timestamp for last fetched combined data.
   * @param pageSize - Page size for message, expense, and combined data.
   * @returns An observable with the data for messages, expenses, and combined.
   */
  fetchMessagesAndExpenses(
    conversationId: string,
    loadMessages: boolean,
    loadExpenses: boolean,
    pageSize: number,
    timestampMessage = new Date().toISOString(),
    timestampExpense = new Date().toISOString(),
    timestampCombined = new Date().toISOString(),
  ) {
    const messagesUrl = `${API_URLS.getMessages}/${conversationId}?pageSize=${pageSize}&timestamp=${timestampMessage}`;
    const expensesUrl = `${API_URLS.getExpenses}/${conversationId}?pageSize=${pageSize}&timestamp=${timestampExpense}`;
    const combinedUrl = `${API_URLS.getCombined}/${conversationId}?pageSize=${pageSize * 2}&timestamp=${timestampCombined}`;
    // If all messages, expenses, and combined need to be loaded
    if (loadMessages && loadExpenses) {
      return this.httpClient
        .get<Message>(messagesUrl, { withCredentials: true })
        .pipe(
          concatMap((messages) => {
            // Sort messages by creation date
            messages.data.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));

            // Fetch expenses after messages
            return this.httpClient
              .get<Expense>(expensesUrl, { withCredentials: true })
              .pipe(
                concatMap((expenses) => {
                  // Sort expenses by creation date
                  expenses.data.sort((a, b) =>
                    a.createdAt < b.createdAt ? -1 : 1,
                  );
                  // Fetch combined data after expenses
                  return this.httpClient
                    .get<CombinedView>(combinedUrl, { withCredentials: true })
                    .pipe(
                      map((combined) => {
                        // Sort combined data by creation date
                        combined.data = this.sortBycreatedAt(combined.data);
                        return {
                          messages: messages.data,
                          expenses: expenses.data,
                          combined: combined.data,
                        };
                      }),
                    );
                }),
              );
          }),
        );
    } else if (loadMessages) {
      return this.httpClient
        .get<Message>(messagesUrl, { withCredentials: true })
        .pipe(
          map((messages) => {
            messages.data.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
            return { messages: messages.data, expenses: [], combined: [] };
          }),
        );
    } else if (loadExpenses) {
      return this.httpClient
        .get<Expense>(expensesUrl, { withCredentials: true })
        .pipe(
          map((expenses) => {
            expenses.data.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
            return { messages: [], expenses: expenses.data, combined: [] };
          }),
        );
    }
    // If only combined data needs to be loaded
    return this.httpClient
      .get<CombinedView>(combinedUrl, { withCredentials: true })
      .pipe(
        map((combined) => {
          combined.data.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
          return { messages: [], expenses: [], combined: combined.data };
        }),
      );
  }

  /**
   * Fetch all expenses for a given conversation.
   *
   * @param conversationId - The ID of the conversation.
   * @returns An observable with the list of all expenses.
   */
  fetchAllExpenses(conversationId: string) {
    const params = new HttpParams().set("fetchAll", true);

    return this.httpClient
      .get<Expense>(`${API_URLS.getExpenses}/${conversationId}?timestamp=${new Date().toISOString()}`, {
        params,
        withCredentials: true,
      })
      .pipe(
        map((expenses) => {
          return expenses.data;
        }),
      );
  }

  /**
   * Add a new expense to the conversation.
   *
   * @param conversationId - The ID of the conversation.
   * @param expenseData - The data for the new expense.
   * @returns An observable with the response after adding the expense.
   */
  addExpense(
    conversationId: string,
    expenseData: SettlementData | ExpenseInput | FormData,
  ) {
    return this.httpClient.post<ExpenseResponse>(
      `${API_URLS.addExpense}/${conversationId}`,
      expenseData,
      { withCredentials: true },
    );
  }

  /**
   * Update an existing expense in the conversation.
   *
   * @param conversationId - The ID of the conversation.
   * @param expenseData - The updated expense data.
   * @returns An observable with the response after updating the expense.
   */
  updateExpense(
    conversationId: string,
    expenseData: ExpenseInput | SettlementData | FormData,
  ) {
    return this.httpClient.patch<ExpenseResponse>(
      `${API_URLS.updateExpense}/${conversationId}`,
      expenseData,
      { withCredentials: true },
    );
  }

  /**
   * Archive or block a request based on the provided ID and type.
   *
   * @param conversationId - The ID of the request.
   * @param type - The type of action to perform (archive/block).
   * @returns An observable indicating the success of the operation.
   */
  archiveBlockRequest(conversationId: string, type: string) {
    return this.httpClient.patch(
      `${API_URLS.archiveBlockRequest}/${conversationId}`,
      { type },
      { withCredentials: true },
    );
  }

  async getFriendRequests() {
    const params = new HttpParams().set("status", "PENDING");
    // API call to back-end to get pending friend requests
    const response = await firstValueFrom(this.getFriends(params));
    this.friendRequests.set(response.data);
  }

  async getAcceptedFriends() {
    const params = new HttpParams().set("status", "ACCEPTED");
    const response = await firstValueFrom(this.getFriends(params));
    this.friends.set(response.data);
  }

  /**
   * Fetch the list of friends with query parameters.
   *
   * @param params - HttpParams to filter the friend list.
   * @returns An observable with the list of friends.
   */
  getFriends(params: HttpParams): Observable<Friend> {
    return (this.httpClient.get<Friend>(API_URLS.getFriends, {
      params,
      withCredentials: true,
    }));
  }

  /**
   * Add a new friend by email.
   *
   * @param friendData - The data of the friend to be added.
   * @returns An observable indicating the success of the request.
   */
  addFriend(friendData: { email: string }) {
    return this.httpClient.post(API_URLS.addFriend, friendData, {
      withCredentials: true,
    }).pipe(tap({
      next: () => this.getFriendRequests()
    }));
  }

  /**
   * Accept or reject a friend request based on the ID and status.
   *
   * @param conversationId - The ID of the request to be accepted or rejected.
   * @param status - The status to update the request to ("ACCEPTED", "REJECTED").
   * @returns An observable indicating the success of the operation.
   */
  acceptRejectRequest(conversationId: string, status: string) {
    return this.httpClient.patch(
      `${API_URLS.acceptRejectRequest}/${conversationId}`,
      { status },
      { withCredentials: true },
    ).pipe(tap({
      next: () => {
        if (status === "ACCEPTED") {
          // Add the accepted request to the friend list
          this.friends().unshift({
            ...this.friendRequests().find(
              (request) => request.conversation_id === conversationId
            )!, status: "ACCEPTED"
          });
        }
        // Remove the processed request from the pending requests list
        this.friendRequests.set(
          this.friendRequests().filter(
            (request) => request.conversation_id !== conversationId,
          ),
        );
      }
    }));
  }

  /**
   * Withdraw a pending friend request by ID.
   *
   * @param conversationId - The ID of the request to withdraw.
   * @returns An observable indicating the success of the withdrawal.
   */
  withdrawRequest(conversationId: string) {
    return this.httpClient.delete(
      `${API_URLS.withdrawRequest}/${conversationId}`,
      {
        withCredentials: true,
      },
    ).pipe(tap({
      next: () => {
        // Update the friend requests list by removing the withdrawn request from the array
        this.friendRequests.set(
          this.friendRequests().filter(
            (request) => request.conversation_id !== conversationId,
          ),
        );
      }
    }));
  }

  /**
   * Delete an expense from the conversation.
   *
   * @param conversationId - The ID of the conversation.
   * @param expenseId - The ID of the expense to be deleted.
   * @returns An observable indicating the success of the operation.
   */
  deleteExpense(conversationId: string, expenseId: string) {
    return this.httpClient.delete(
      `${API_URLS.deleteExpense}/${conversationId}`,
      {
        body: { friend_expense_id: expenseId },
        withCredentials: true,
      },
    );
  }

  /**
   * Searching users based on the letters typed.
   *
   * @param query - The search query.
   * @returns An observable with the search results (list of users possibly empty).
   */
  searchUsers(query: string) {
    return this.httpClient.get<SearchedUserResponse>(
      `${API_URLS.getUsers}/${query}`,
      {
        withCredentials: true,
      },
    );
  }
}
