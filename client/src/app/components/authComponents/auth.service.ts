import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { RegisterResponse, User } from '../shared/user/types.model';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private httpClient = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/v1';

  registerUser (user: User): Observable<HttpResponse<RegisterResponse>> {
    return this.httpClient.post<RegisterResponse>(`${this.apiUrl}/users/register`, user, {observe: 'response'})
  };

  setAccessToken (accessToken: string): void {
    localStorage.setItem('accessToken', accessToken);
  }

  getAccessToken (): string | null {
    return localStorage.getItem('accessToken');
  };

  logout (): void {
    localStorage.removeItem('accessToken');
  }
}
