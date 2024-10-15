import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { TokenService } from '../auth/token.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);
  const router = inject(Router);
  const tokenService = inject(TokenService);

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
            errorMessage = 'Unauthorized. Please log in.';
            router.navigate(['/login']);
            tokenService.removeUserId();
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
          case 500:
            errorMessage = 'Internal server error. Please try again later.';
            break;
          default:
            errorMessage =
              error.error.message || 'Something went wrong. Please try again.';
            break;
        }
      }

      // Display error message using Toastr
      toastr.error(errorMessage, 'Error', {
        timeOut: 3000,
      });

      return throwError(() => new Error(errorMessage));
    }),
  );
};
