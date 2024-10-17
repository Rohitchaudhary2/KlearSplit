import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { CurrentUser } from '../shared/types.model';
import { Observable, map } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { RegisterResponse, RegisterUser } from './register-types.model';
import { Router } from '@angular/router';
import { LoginResponse, LoginUser } from './login-types.model';
import { API_URLS } from '../../constants/api-urls';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private httpClient = inject(HttpClient);
  private toastr = inject(ToastrService);
  private router = inject(Router);
  private tokenService = inject(TokenService);

  private verifyUrl = API_URLS.verify; // URL for OTP verification
  private registerUrl = API_URLS.register; // URL for user registeration
  private loginUrl = API_URLS.login; // URL for login
  private logoutUrl = API_URLS.logout; // URL for logout
  private forgotPasswordVerifyUrl = API_URLS.verifyForgotPassword; // URL to verify user for forgot password
  private forgotPasswordUrl = API_URLS.forgotPassword; // URL for forgot password
  private restoreAccountVerifyUrl = API_URLS.restoreAccountVerify; // URL to verify user for restore account
  private restoreAccountUrl = API_URLS.restoreAccount; // URL for restore account

  currentUser = signal<CurrentUser | undefined | null>(undefined); // Store user data

  // Getter for authentication status
  isAuthenticated(): boolean {
    const userId = this.tokenService.getUserId();
    return !!userId;
  }

  // Method to set user as authenticated after login/register
  setAuthenticatedUser(user: CurrentUser | undefined): void {
    this.currentUser.set(user);
  }

  // Verify User Function (Send OTP for Verification)
  verifyUser(user: Partial<RegisterUser>): Observable<object> {
    return this.httpClient
      .post(`${this.verifyUrl}`, user, { withCredentials: true })
      .pipe(
        map((response) => {
          // Handle OTP verification success response here (if needed)
          this.toastr.success('OTP sent successfully', 'Success');
          return response;
        }),
      );
  }

  // Register User with OTP Verification
  registerUserWithOtp(
    user: Partial<RegisterUser>,
    otp: { otp: string },
  ): Observable<RegisterResponse> {
    return this.httpClient
      .post<RegisterResponse>(
        this.registerUrl,
        { ...user, ...otp }, // Pass OTP along with user data
        { withCredentials: true },
      )
      .pipe(
        map((response: RegisterResponse) => {
          if (response) {
            this.setAuthenticatedUser(response.data);
            this.tokenService.setUserId(response.data?.user_id);
          }

          return response;
        }),
      );
  }

  // Login User
  login(user: LoginUser): Observable<LoginResponse> {
    return this.httpClient
      .post<LoginResponse>(this.loginUrl, user, { withCredentials: true })
      .pipe(
        map((response: LoginResponse) => {
          if (response) {
            this.setAuthenticatedUser(response.data);
            this.tokenService.setUserId(response.data?.user_id);
          }

          return response;
        }),
      );
  }

  // logout user
  logout(): void {
    this.httpClient.get(this.logoutUrl, { withCredentials: true }).subscribe({
      next: () => {
        // Remove the access of user from protected routes
        this.currentUser.set(null);
        this.tokenService.removeUserId();
        this.toastr.success('You have logged out successfully.', 'Success');
        this.router.navigate(['/login']);
      },
    });
  }

  // Verify a user who already exists to resend them a password
  verifyForgotPasswordUser(
    email: string | null | undefined,
  ): Observable<object> {
    return this.httpClient
      .post(`${this.forgotPasswordVerifyUrl}`, email, { withCredentials: true })
      .pipe(
        map((response) => {
          this.toastr.success('OTP sent successfully', 'Success');
          return response;
        }),
      );
  }

  // Get a new password if you forgot your current one
  forgotPassword(
    email: string | null | undefined,
    otp: string | null | undefined,
  ) {
    return this.httpClient
      .post(
        `${this.forgotPasswordUrl}`,
        { email, otp },
        { withCredentials: true },
      )
      .pipe(
        map((response) => {
          this.toastr.success('New Password sent successfully', 'Success');
          // Reroute to login
          this.router.navigate(['/login']);
          return response;
        }),
      );
  }

  // Verify a user who already exists to restore their account
  verifyExistingUser(email: string | null | undefined): Observable<object> {
    return this.httpClient
      .post(`${this.restoreAccountVerifyUrl}`, email, { withCredentials: true })
      .pipe(
        map((response) => {
          this.toastr.success('OTP sent successfully', 'Success');
          return response;
        }),
      );
  }

  // Restore a deleted account
  restoreAccount(
    email: string | null | undefined,
    otp: string | null | undefined,
  ): Observable<RegisterResponse> {
    return this.httpClient
      .post<RegisterResponse>(
        `${this.restoreAccountUrl}`,
        { email, otp },
        { withCredentials: true },
      )
      .pipe(
        map((response) => {
          if (response) {
            this.setAuthenticatedUser(response.data);
            this.tokenService.setUserId(response.data?.user_id);
          }

          return response;
        }),
      );
  }
}
