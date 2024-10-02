import { Component, inject, OnInit } from '@angular/core';

import { jwtDecode } from 'jwt-decode';

import { AuthService } from '../auth/auth.service';
import { TokenService } from '../auth/token.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FetchResponse } from '../shared/types.model';
import { API_URLS } from '../../constants/api-urls';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private tokenService = inject(TokenService);
  private httpClient = inject(HttpClient);
  private getUserUrl = API_URLS.fetchUser;

  ngOnInit(): void {
    const accessToken = this.tokenService.getAccessToken();
    if (accessToken) {
      const decodedToken = jwtDecode<{ id: string }>(accessToken);
      const userId = decodedToken.id;

      const getUserUrlWithId = `${this.getUserUrl}/${userId}`;

      this.httpClient
        .get<FetchResponse>(getUserUrlWithId, {
          observe: 'response',
          withCredentials: true,
        })
        .subscribe({
          next: (response) => {
            this.authService.currentUser.set(response.body?.data);
            if (response.headers instanceof HttpHeaders) {
              const refreshedAccessToken =
                response.headers.get('Authorization');
              if (refreshedAccessToken) {
                this.tokenService.setAccessToken(refreshedAccessToken);
              }
            }
          },
        });
    }
  }
}
