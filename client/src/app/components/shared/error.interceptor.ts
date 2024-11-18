import {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { TokenService } from '../auth/token.service';
import { StateService } from './state.service';
import { AuthService } from '../auth/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);
  const router = inject(Router);
  const tokenService = inject(TokenService);
  const stateService = inject(StateService);
  const authService = inject(AuthService);

  /**
   * This function handles token expiration errors.
   * If the error indicates that the token has expired, it attempts to refresh the token.
   *
   * @param req - The HTTP request that is being made.
   * @param next - The next HTTP handler to pass the request to.
   * @returns An observable that will retry the request after the token has been refreshed.
   */
  function handleTokenExpiration(
    req: HttpRequest<unknown>,
    next: HttpHandlerFn,
  ) {
    // Attempt to refresh the token
    return authService.refreshAccessToken().pipe(
      // If the token is refreshed successfully, retry the original request
      switchMap(() => {
        return next(req);
      }),
    );
  }

  return next(req).pipe(
    // Handling any errors that occur during the HTTP request
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      // Check if the error is a client-side error (e.g., network issues)
      if (error.error instanceof ErrorEvent) {
        errorMessage = `Client-side error: ${error.error.message}`;
      } else {
        // Handle different types of server-side errors based on the HTTP status code
        switch (error.status) {
          case 400:
            errorMessage = error.error.message || 'Bad Request';
            break;
          case 401:
            if (error.error.message === 'Token expired') {
              // Handle the case where the token has expired
              return handleTokenExpiration(req, next);
            } else {
              errorMessage = 'Unauthorized. Please log in.';
              router.navigate(['/login']);
              tokenService.removeUserId();
            }
            break;
          case 403:
            errorMessage =
              error.error.message ||
              'You do not have permission to perform this action.';
            break;
          case 404:
            errorMessage =
              error.error.message || 'The requested resource was not found.';
            break;
          case 410:
            errorMessage =
              error.error.message || 'Account deleted please restore it.';
            // Set the account deleted state to true in the StateService
            stateService.setAccountDeleted(true);
            break;
          case 503:
          case 500:
            errorMessage = 'Something went wrong. Please try again later.';
            break;
          default:
            errorMessage =
              error.error.message || 'Something went wrong. Please try again.';
            break;
        }
      }

      // Display error message using Toastr unless it's a token expired error
      if (error.error.message !== 'Token expired')
        toastr.error(errorMessage, 'Error');

      return throwError(() => new Error(errorMessage));
    }),
  );
};
