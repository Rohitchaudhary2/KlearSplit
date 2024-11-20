import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';

import { API_URLS } from '../../constants/api-urls';
import { AllExpenses } from './dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private httpClient = inject(HttpClient);
  /**
   * Fetches all expense-related data from the server.
   *
   * The data includes:
   * - Expense ranges: Distribution of expenses based on predefined ranges.
   * - Balance amounts: Total amounts lent and borrowed.
   * - Top friends: A list of friends with the highest cash flow activity.
   * - Monthly expenses: Expenses categorized by month.
   *
   * The raw data from the server is transformed to provide a cleaner format for use in charts.
   *
   * @returns An observable emitting the transformed expense data.
   */
  getAllExpenses() {
    return this.httpClient
      .get<AllExpenses>(`${API_URLS.getAllExpensesData}`, {
        withCredentials: true,
      })
      .pipe(
        map((response) => {
          /**
           * Transforming the server response:
           * - Extracts top friends and their associated amounts from the response.
           * - Maps the raw data into an object with separate fields for:
           *   - `expensesRange`
           *   - `balanceAmounts`
           *   - `topFriends` (amounts only)
           *   - `topFriendsName` (names only)
           *   - `monthlyExpense`
           */
          const topAmounts: number[] = [];
          const friendsName: string[] = [];
          for (const item in response.data.topFriends) {
            topAmounts.push(Number(response.data.topFriends[item]['amount']));
            friendsName.push(String(response.data.topFriends[item]['friend']));
          }
          return {
            expensesRange: response.data.expensesRange,
            balanceAmounts: response.data.balanceAmounts,
            topFriends: topAmounts,
            topFriendsName: friendsName,
            monthlyExpense: response.data.monthlyExpense,
          };
        }),
      );
  }
}
