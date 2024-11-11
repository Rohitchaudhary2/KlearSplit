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
      .get<AllExpenses>(`${API_URLS.getAllExpenses}`, { withCredentials: true })
      .pipe(
        map((response) => {
          const topAmounts = [];
          for (const item in response.data.topFriends) {
            topAmounts.push(response.data.topFriends[item]['amount']);
          }
          return {
            expensesRange: response.data.expensesRange,
            balanceAmounts: response.data.balanceAmounts,
            topFriends: topAmounts,
          };
        }),
      );
  }
}
