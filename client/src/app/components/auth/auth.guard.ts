import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { UserService } from '../user.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  private router = inject(Router);

  private authService = inject(AuthService);
  private tokenService = inject(TokenService);
  private userService = inject(UserService);

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (Object.keys(route.queryParams).length > 0) {
      this.tokenService.setUserId(route.queryParams['id']);
      this.router.navigate(['/dashboard'], {
        queryParams: {},
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
    const userId = this.tokenService.getUserId();
    this.userService.fetchUserDetails(userId);
    if (this.authService.isAuthenticated()) {
      return true; // Allow access if the user is authenticated
    } else {
      this.router.navigate(['/login']); // Redirect to login if not authenticated
      return false; // Prevent access to the route
    }
  }
}
