import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { catchError, switchMap, throwError } from "rxjs";

import { AuthService } from "../auth/auth.service";
import { TokenService } from "../auth/token.service";

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);
  const router = inject(Router);
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);

  // Handles token expiration
  function handleTokenExpiration() {
    return authService.refreshAccessToken().pipe(switchMap(() => next(req)),
      catchError((refreshError) => {
        if (refreshError.status === 401) {
          // If the refresh token is invalid, redirect to login page
          tokenService.removeUserId();
          router.navigate([ "/login" ]);
          return throwError(() => refreshError);
        }
        return throwError(() => refreshError);
      }));
  }

  // Gets a user-friendly error message based on the HTTP status code
  function getErrorMessage(error: HttpErrorResponse): string {
    if (error.error instanceof ErrorEvent) {
      return `Client-side error: ${error.error.message}`;
    }

    const serverErrorMessages: Record<number, string> = {
      "400": error.error.message || "Bad Request",
      "401": "Unauthorized",
      "403": error.error.message || "You do not have permission to perform this action.",
      "404": error.error.message || "The requested resource was not found.",
      "410": error.error.message || "Account deleted, please restore it.",
      "500": "Something went wrong. Please try again later.",
      "503": "Service unavailable. Please try again later.",
    };

    return (
      serverErrorMessages[error.status] ||
      error.error.message ||
      "Something went wrong. Please try again."
    );
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      
      // Skip Toastr for token expiration error
      if (error.error.message === "Token expired") {
        return handleTokenExpiration();
      }
      const errorMessage = getErrorMessage(error);
      
      toastr.error(errorMessage, "Error");
      

      return throwError(() => new Error(errorMessage));
    }),
  );
};
