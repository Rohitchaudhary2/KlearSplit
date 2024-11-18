import { inject, Injectable } from '@angular/core';
import { API_URLS } from '../../constants/api-urls';
import { HttpClient } from '@angular/common/http';
import { AllExpenses } from './dashboard.model';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private httpClient = inject(HttpClient);
  getAllExpenses() {
    return this.httpClient
      .get<AllExpenses>(`${API_URLS.getAllExpensesData}`, {
        withCredentials: true,
      })
      .pipe(
        map((response) => {
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
