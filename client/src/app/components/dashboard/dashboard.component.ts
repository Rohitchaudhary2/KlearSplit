import { Component, inject, OnInit } from '@angular/core';

import { jwtDecode } from 'jwt-decode';

import { AuthService } from '../auth/auth.service';
import { TokenService } from '../auth/token.service';
import { HttpClient } from '@angular/common/http';
import { FetchResponse } from '../shared/types.model';

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

  private apiUrl = 'http://localhost:3000/api/v1';
  private getUserUrl = `${this.apiUrl}/users`;

  ngOnInit(): void {
    const accessToken = this.tokenService.getAccessToken();
    if (accessToken) {
      const decodedToken = jwtDecode<{ id: string }>(accessToken);
      const userId = decodedToken.id;

      const getUserUrlWithId = `${this.getUserUrl}/${userId}`;

      this.httpClient
        .get<FetchResponse>(getUserUrlWithId, { withCredentials: true })
        .subscribe({
          next: (response) => {
            this.authService.currentUser.set(response.data);
          },
        });
    }
  }
}
