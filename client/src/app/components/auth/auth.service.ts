import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { map, Observable } from "rxjs";

import { API_URLS } from "../../constants/api-urls";
import { CurrentUser } from "../shared/types.model";
import { LoginResponse, LoginUser } from "./login-types.model";
import { RegisterResponse, RegisterUser } from "./register-types.model";
import { TokenService } from "./token.service";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  // Dependency injection for necessary services
  private httpClient = inject(HttpClient);
  private toastr = inject(ToastrService);
  private router = inject(Router);
  private tokenService = inject(TokenService);

  // URLs for API endpoints
  private verifyUrl = API_URLS.verify; // URL for OTP verification
  private registerUrl = API_URLS.register; // URL for user registeration
  private loginUrl = API_URLS.login; // URL for login
  private logoutUrl = API_URLS.logout; // URL for logout
  private forgotPasswordVerifyUrl = API_URLS.verifyForgotPassword; // URL to verify user for forgot password
  private forgotPasswordUrl = API_URLS.forgotPassword; // URL for forgot password
  private restoreAccountVerifyUrl = API_URLS.restoreAccountVerify; // URL to verify user for restore account
  private restoreAccountUrl = API_URLS.restoreAccount; // URL for restore account

  currentUser = signal<CurrentUser | undefined>(undefined); // Store user data

  /**
   * Check if a user is authenticated based on their user ID.
   * Returns `true` if a user ID is found, otherwise `false`.
   */
  isAuthenticated(): boolean {
    const userId = this.tokenService.getUserId();
    return !!userId;
  }

  /**
   * Set the authenticated user data after login or registration.
   * Updates the `currentUser` signal with the provided user data.
   *
   * @param user - The user data to set.
   */
  setAuthenticatedUser(user: CurrentUser | undefined): void {
    this.currentUser.set(user);
  }

  /**
   * Send an OTP to verify a new user.
   *
   * @param user - Partial details of the user (e.g., email or phone number).
   * @returns Observable of the API response.
   */
  verifyUser(user: Partial<RegisterUser>): Observable<object> {
    return this.httpClient
      .post(`${this.verifyUrl}`, user, { withCredentials: true })
      .pipe(
        map((response) => {
          this.toastr.success("OTP sent successfully", "Success");
          return response;
        }),
      );
  }

  /**
   * Register a new user with OTP verification.
   *
   * @param user - Partial details of the user.
   * @param otp - The OTP provided for verification.
   * @returns Observable of the registration response containing user data and tokens.
   */
  registerUserWithOtp(
    user: Partial<RegisterUser>,
    otp: { otp: string | null | undefined },
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
            // Set the authenticated user data
            this.setAuthenticatedUser(response.data);
            this.tokenService.setUserId(response.data?.user_id);
          }

          return response;
        }),
      );
  }

  /**
   * Authenticate a user by logging in.
   *
   * @param user - Login details of the user (e.g., email and password).
   * @returns Observable of the login response containing user data and tokens.
   */
  login(user: LoginUser): Observable<LoginResponse> {
    return this.httpClient
      .post<LoginResponse>(this.loginUrl, user, { withCredentials: true })
      .pipe(
        map((response: LoginResponse) => {
          if (response) {
            // Set the authenticated user data
            this.setAuthenticatedUser(response.data);
            this.tokenService.setUserId(response.data?.user_id);
          }

          return response;
        }),
      );
  }

  /**
   * Logout the currently authenticated user.
   * Clears the user session and navigates to the login page.
   */
  logout(): void {
    this.httpClient.get(this.logoutUrl, { withCredentials: true }).subscribe({
      next: () => {
        // Remove the access of user from protected routes
        this.currentUser.set(undefined);
        this.tokenService.removeUserId();
        this.toastr.success("You have logged out successfully.", "Success");
        this.router.navigate([ "/login" ]);
      },
    });
  }

  /**
   * Verify a user for the "Forgot Password" process.
   * Sends an OTP to the user's email.
   *
   * @param email - The email of the user.
   * @returns Observable of the API response.
   */
  verifyForgotPasswordUser(
    email: string | null | undefined,
  ): Observable<object> {
    return this.httpClient
      .post(
        `${this.forgotPasswordVerifyUrl}`,
        { email },
        { withCredentials: true },
      )
      .pipe(
        map((response) => {
          this.toastr.success("OTP sent successfully", "Success");
          return response;
        }),
      );
  }

  /**
   * Reset the password for a user who has forgotten it.
   *
   * @param email - The email of the user.
   * @param otp - The OTP sent for verification.
   */
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
          this.toastr.success("New Password sent successfully", "Success");
          // Reroute to login
          this.router.navigate([ "/login" ]);
          return response;
        }),
      );
  }

  /**
   * Verify an existing user for account restoration.
   * Sends an OTP to the user's email for verification.
   *
   * @param email - The email of the user.
   * @returns Observable of the API response.
   */
  verifyExistingUser(email: string | null | undefined): Observable<object> {
    return this.httpClient
      .post(
        `${this.restoreAccountVerifyUrl}`,
        { email },
        { withCredentials: true },
      )
      .pipe(
        map((response) => {
          this.toastr.success("OTP sent successfully", "Success");
          return response;
        }),
      );
  }

  /**
   * Restore a previously deleted account.
   *
   * @param email - The email of the user.
   * @param otp - The OTP sent for verification.
   * @returns Observable of the restoration response containing user data and tokens.
   */
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
            // Set the authenticated user data
            this.setAuthenticatedUser(response.data);
            this.tokenService.setUserId(response.data?.user_id);
          }

          return response;
        }),
      );
  }

  /**
   * Refresh the access token for the current user session.
   * Sends a request to the API to generate a new access token.
   */
  refreshAccessToken() {
    return this.httpClient.get(`${API_URLS.refreshAccessToken}`, {
      withCredentials: true,
    });
  }
}
