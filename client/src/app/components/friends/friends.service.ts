import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  CombinedView,
  Expense,
  ExpenseInput,
  ExpenseResponse,
  Friend,
  Message,
  SearchedUser,
  SettlementData,
} from './friend.model';
import { concatMap, map, of } from 'rxjs';
import { API_URLS } from '../../constants/api-urls';

@Injectable({
  providedIn: 'root',
})
export class FriendsService {
  private httpClient = inject(HttpClient);

  fetchMessagesAndExpenses(
    conversationId: string,
    loadMessages: boolean,
    loadExpenses: boolean,
    loadCombined: boolean,
    pageMessage: number,
    pageSizeMessage: number,
    pageExpense: number,
    pageSizeExpense: number,
    pageCombined: number,
    pageSizeCombined: number,
  ) {
    const messagesUrl = `${API_URLS.getMessages}/${conversationId}?page=${pageMessage}&pageSize=${pageSizeMessage}`;
    const expensesUrl = `${API_URLS.getExpenses}/${conversationId}?page=${pageExpense}&pageSize=${pageSizeExpense}`;
    const combinedUrl = `${API_URLS.getCombined}/${conversationId}?page=${pageCombined}&pageSize=${pageSizeCombined}`;
    if (loadMessages && loadExpenses) {
      return this.httpClient
        .get<Message>(messagesUrl, { withCredentials: true })
        .pipe(
          concatMap((messages) => {
            // Sort messages by createdAt
            messages.data.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));

            // First request completed, now make the second request
            return this.httpClient
              .get<Expense>(expensesUrl, { withCredentials: true })
              .pipe(
                concatMap((expenses) => {
                  expenses.data.sort((a, b) =>
                    a.createdAt < b.createdAt ? -1 : 1,
                  );
                  return this.httpClient
                    .get<CombinedView>(combinedUrl, { withCredentials: true })
                    .pipe(
                      map((combined) => {
                        combined.data.sort((a, b) =>
                          a.createdAt < b.createdAt ? -1 : 1,
                        );
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
    } else if (loadCombined) {
      return this.httpClient
        .get<CombinedView>(combinedUrl, { withCredentials: true })
        .pipe(
          map((combined) => {
            combined.data.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
            return { messages: [], expenses: [], combined: combined.data };
          }),
        );
    } else {
      return of({ messages: [], expenses: [], combined: [] }); // No data to load
    }
  }

  fetchAllExpenses(conversationId: string) {
    const params = new HttpParams().set('fetchAll', true);

    return this.httpClient
      .get<Expense>(`${API_URLS.getExpenses}/${conversationId}`, {
        params,
        withCredentials: true,
      })
      .pipe(
        map((expenses) => {
          return expenses.data;
        }),
      );
  }

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

  updateExpense(conversationId: string, expenseData: Partial<ExpenseInput>) {
    return this.httpClient.patch<ExpenseResponse>(
      `${API_URLS.updateExpense}/${conversationId}`,
      expenseData,
      { withCredentials: true },
    );
  }

  archiveBlockRequest(id: string, type: string) {
    return this.httpClient.patch(
      `${API_URLS.archiveBlockRequest}/${id}`,
      { type },
      { withCredentials: true },
    );
  }

  getFriends(params?: HttpParams) {
    return this.httpClient.get<Friend>(API_URLS.getFriends, {
      params,
      withCredentials: true,
    });
  }

  addFriend(friendData: { email: string }) {
    return this.httpClient.post(API_URLS.addFriend, friendData, {
      withCredentials: true,
    });
  }

  acceptRejectRequest(id: string, status: string) {
    return this.httpClient.patch(
      `${API_URLS.acceptRejectRequest}/${id}`,
      { status },
      { withCredentials: true },
    );
  }

  withdrawRequest(id: string) {
    return this.httpClient.delete(`${API_URLS.withdrawRequest}/${id}`, {
      withCredentials: true,
    });
  }

  deleteExpense(conversationId: string, expenseId: string) {
    return this.httpClient.delete(
      `${API_URLS.deleteExpense}/${conversationId}`,
      {
        body: { friend_expense_id: expenseId },
        withCredentials: true,
      },
    );
  }

  searchUsers(query: string) {
    return this.httpClient.get<SearchedUser>(`${API_URLS.getUsers}/${query}`, {
      withCredentials: true,
    });
  }
}
