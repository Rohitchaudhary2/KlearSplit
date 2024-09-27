import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { CurrentUser } from '../shared/types.model';
import { Observable, map } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { TokenService } from './token.service'; // Token service for access token management
import { RegisterResponse, RegisterUser } from './register-types.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private httpClient = inject(HttpClient);
  private toastr = inject(ToastrService);
  private tokenService = inject(TokenService); // Inject token service
  private router = inject(Router);

  private apiUrl = 'http://localhost:3000/api/v1';
  private registerUrl = `${this.apiUrl}/users/register`;

  currentUser = signal<CurrentUser | undefined | null>(undefined);

  isAuthenticated(): boolean {
    const token = this.tokenService.getAccessToken();
    return !!token; // Or validate token expiration here
  }

  // Register User Function (error handling will be handled by ErrorInterceptor)
  registerUser(user: RegisterUser): Observable<HttpResponse<RegisterResponse>> {
    return this.httpClient.post<RegisterResponse>(
      this.registerUrl,
      user,
      { observe: 'response', withCredentials: true }
    ).pipe(
      map((response: HttpResponse<RegisterResponse>) => {
        const accessToken = response.headers.get('Authorization');
        
        if (accessToken) {
          // Use TokenService to handle the access token
          this.tokenService.setAccessToken(accessToken);
          this.router.navigate(['/dashboard']);
        } else {
          this.toastr.error('Failed to receive access token. Please try again.', 'Error', {
            timeOut: 3000,
          });
        }
        return response;
      })
    );
  }
}
