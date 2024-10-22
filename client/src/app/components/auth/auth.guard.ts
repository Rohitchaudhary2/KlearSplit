import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { UserService } from '../user.service';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  private router = inject(Router);

  private authService = inject(AuthService);
  private tokenService = inject(TokenService);
  private userService = inject(UserService);

  async canActivate(route: ActivatedRouteSnapshot) {
    if (Object.keys(route.queryParams).length > 0) {
      this.tokenService.setUserId(route.queryParams['id']);
      this.router.navigate(['/friends'], {
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
