import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  Expense,
  ExpenseInput,
  ExpenseResponse,
  Friend,
  Message,
  SearchedUser,
  SettlementData,
} from './friend.model';
import { concatMap, map } from 'rxjs';
import { API_URLS } from '../../constants/api-urls';

@Injectable({
  providedIn: 'root',
})
export class FriendsService {
  private httpClient = inject(HttpClient);

  fetchMessagesAndExpenses(conversationId: string) {
    return this.httpClient
      .get<Message>(`${API_URLS.getMessages}/${conversationId}`, {
        withCredentials: true,
      })
      .pipe(
        concatMap((messages) => {
          messages.data.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
          return this.httpClient
            .get<Expense>(`${API_URLS.getExpenses}/${conversationId}`, {
              withCredentials: true,
            })
            .pipe(
              map((expenses) => ({
                messages: messages.data,
                expenses: expenses.data,
              })),
            );
        }),
      );
  }

  addExpense(
    conversationId: string,
    expenseData: SettlementData | ExpenseInput,
  ) {
    return this.httpClient.post<ExpenseResponse>(
      `${API_URLS.addExpense}/${conversationId}`,
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
