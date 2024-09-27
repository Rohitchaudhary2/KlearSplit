import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { CurrentUser } from '../shared/types.model';
import { Observable, map } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { TokenService } from './token.service'; // Token service for access token management
import { RegisterResponse, RegisterUser } from './register-types.model';
import { Router } from '@angular/router';
import { LoginResponse, LoginUser } from './login-types.model';

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
  private verifyUrl = `${this.apiUrl}/users/verify`; // URL for OTP verification
  private loginUrl = `${this.apiUrl}/auth/login`; // URL for login

  currentUser = signal<CurrentUser | undefined | null>(undefined);

  isAuthenticated(): boolean {
    const token = this.tokenService.getAccessToken();
    return !!token; // Or validate token expiration here
  }

  // Register User Function
  registerUser(user: RegisterUser): Observable<HttpResponse<RegisterResponse>> {
    return this.httpClient
      .post<RegisterResponse>(this.registerUrl, user, {
        observe: 'response',
        withCredentials: true,
      })
      .pipe(
        map((response: HttpResponse<RegisterResponse>) => {
          const accessToken = response.headers.get('Authorization');

          if (accessToken) {
            // Use TokenService to handle the access token
            this.tokenService.setAccessToken(accessToken);
            this.router.navigate(['/dashboard']);
          } else {
            this.toastr.error(
              'Failed to receive access token. Please try again.',
              'Error',
              {
                timeOut: 3000,
              },
            );
          }
          return response;
        }),
      );
  }

  // Verify User Function (Send OTP for Verification)
  verifyUser(user: RegisterUser): Observable<any> {
    return this.httpClient
      .post(`${this.verifyUrl}`, user, { withCredentials: true })
      .pipe(
        map((response) => {
          // Handle OTP verification success response here (if needed)
          this.toastr.success('OTP sent successfully');
          return response;
        }),
      );
  }

  // Register User with OTP Verification
  registerUserWithOtp(
    user: RegisterUser,
    otp: any,
  ): Observable<HttpResponse<RegisterResponse>> {
    return this.httpClient
      .post<RegisterResponse>(
        this.registerUrl,
        { ...user, ...otp }, // Pass OTP along with user data
        { observe: 'response', withCredentials: true },
      )
      .pipe(
        map((response: HttpResponse<RegisterResponse>) => {
          const accessToken = response.headers.get('Authorization');

          if (accessToken) {
            // Handle the token after registration success
            this.tokenService.setAccessToken(accessToken);
            this.router.navigate(['/dashboard']);
          } else {
            this.toastr.error(
              'Failed to receive access token. Please try again.',
              'Error',
              {
                timeOut: 3000,
              },
            );
          }
          return response;
        }),
      );
  }

  // Login User
  login(user: LoginUser): Observable<HttpResponse<LoginResponse>> {
    return this.httpClient
      .post<LoginResponse>(this.loginUrl, user, { observe: 'response' })
      .pipe(
        map((response: HttpResponse<LoginResponse>) => {
          const accessToken = response.headers.get('Authorization');

          if (accessToken) {
            // Handle the token after registration success
            this.tokenService.setAccessToken(accessToken);
            this.router.navigate(['/dashboard']);
          } else {
            this.toastr.error(
              'Failed to receive access token. Please try again.',
              'Error',
              {
                timeOut: 3000,
              },
            );
          }
          return response;
        }),
      );
  }
}
