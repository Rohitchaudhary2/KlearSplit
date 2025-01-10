import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { map } from "rxjs";

import { API_URLS } from "../../constants/api-urls";
import { ExpenseCount, TopFriends } from "./dashboard.model";

@Injectable({
  providedIn: "root",
})
export class DashboardService {
  private readonly httpClient = inject(HttpClient);
  getExpense() {
    return this.httpClient.get<ExpenseCount>(`${API_URLS.expensesCount}`, { withCredentials: true });
  }

  getBalanceAmounts() {
    return this.httpClient.get<ExpenseCount>(`${API_URLS.balanceAmounts}`, { withCredentials: true });
  }

  getCashFlowFriends() {
    return this.httpClient.get<TopFriends>(`${API_URLS.cashFlowFriends}`, { withCredentials: true }).pipe(
      map((response) => {
        const topAmounts: number[] = [];
        const friendsName: string[] = [];
        for (const item in response.data) {
          topAmounts.push(Number(response.data[item]["amount"]));
          friendsName.push(String(response.data[item]["friend"]));
        }
        return {
          topFriends: topAmounts,
          topFriendsName: friendsName
        };
      }),
    );
  }

  getMonthlyExpenses(year: number) {
    return this.httpClient.post<ExpenseCount>(`${API_URLS.monthlyExpenses}`, { year }, { withCredentials: true });
  }

  getCashFlowGroups() {
    return this.httpClient.get<TopFriends>(`${API_URLS.cashFlowGroups}`, { withCredentials: true }).pipe(
      map((response) => {
        const topAmounts: number[] = [];
        const groupsName: string[] = [];
        for (const item in response.data) {
          topAmounts.push(Number(response.data[item]["amount"]));
          groupsName.push(String(response.data[item]["group"]));
        }
        return {
          topFriends: topAmounts,
          topGroupsName: groupsName
        };
      }),
    );
  }
}
