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

  function handleTokenExpiration(
    req: HttpRequest<unknown>,
    next: HttpHandlerFn,
  ) {
    // Attempt to refresh the token
    return authService.refreshAccessToken().pipe(
      switchMap(() => {
        return next(req);
      }),
      // catchError(() => {
      //   // Handle any error that occurred during token refresh (e.g., refresh token expired)
      //   router.navigate(['/login']);
      //   tokenService.removeUserId();
      //   return throwError(() => new Error('Session expired'));
      // }),
    );
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Client-side error: ${error.error.message}`;
      } else {
        // Server-side error
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

      // Display error message using Toastr
      if (error.error.message !== 'Token expired')
        toastr.error(errorMessage, 'Error');

      return throwError(() => new Error(errorMessage));
    }),
  );
};
