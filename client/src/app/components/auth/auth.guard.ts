import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { UserService } from '../user.service';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  private router = inject(Router);

  private authService = inject(AuthService);
  private tokenService = inject(TokenService);
  private userService = inject(UserService);

  /**
   * Determines whether the route can be activated based on the user's authentication status.
   *
   * @param route - The active route snapshot containing the information about the route being activated.
   * @returns A boolean or Promise resolving to a boolean indicating whether the route can be activated.
   *
   * This guard handles the following logic:
   * - Processes query parameters if present (e.g., user ID).
   * - Fetches and verifies user details using the `UserService`.
   * - Checks authentication status using the `AuthService`.
   * - Redirects to login if the user is not authenticated.
   */
  async canActivate(route: ActivatedRouteSnapshot) {
    if (Object.keys(route.queryParams).length > 0) {
      this.tokenService.setUserId(route.queryParams['id']);
      this.router.navigate(['/dashboard'], {
        queryParams: {},
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
      return false;
    }
    const userId = this.tokenService.getUserId();
    await lastValueFrom(this.userService.fetchUserDetails(userId));
    if (this.authService.isAuthenticated()) {
      return true; // Allow access if the user is authenticated
    } else {
      this.router.navigate(['/login']); // Redirect to login if not authenticated
      return false; // Prevent access to the route
    }
  }
}
