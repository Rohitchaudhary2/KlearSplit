import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

import { TokenService } from './auth/token.service';
import { AuthService } from './auth/auth.service';
import { API_URLS } from '../constants/api-urls';
import { FetchResponse } from './shared/types.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private httpClient = inject(HttpClient);
  private toastr = inject(ToastrService);

  private tokenService = inject(TokenService);
  private authService = inject(AuthService);

  private getUserUrl = API_URLS.fetchUser; // URL for getting user without the id part

  fetchUserDetails(userId: string | undefined | null): void {
    const getUserUrlWithId = `${this.getUserUrl}/${userId}`;
    this.httpClient
      .get<FetchResponse>(getUserUrlWithId, {
        observe: 'response',
        withCredentials: true,
      })
      .subscribe({
        next: (response) => {
          if (response.body) {
            this.authService.setAuthenticatedUser(response.body?.data);
            this.tokenService.setUserId(response.body?.data?.user_id);
          }
        },
      });
  }
}
