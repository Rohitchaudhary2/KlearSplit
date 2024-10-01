import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(): boolean {
    console.log(this.authService.isAuthenticated());
    if (this.authService.isAuthenticated()) {
      return true; // Allow access if the user is authenticated
    } else {
      this.router.navigate(['/login']); // Redirect to login if not authenticated
      return false; // Prevent access to the route
    }
  }
}
