import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

import { API_URLS } from "../../../../constants/api-urls";

@Injectable({
  providedIn: "root"
})
export class SettlementService {
  private readonly httpClient = inject(HttpClient);

  createPayment(amount: number, id: string, payerId: string, debtorId: string, type: string){
    return this.httpClient.post<{success: boolean;
    message: string;
    data: string;}>(`${API_URLS.createPayment}`, { amount, id, payerId, debtorId, type }, { "withCredentials": true });
  }
}
