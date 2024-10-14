import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class GuestGuard implements CanActivate {
  private router = inject(Router);
  private authService = inject(AuthService);

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      // If the user is authenticated, redirect them to the dashboard
      this.router.navigate(['/dashboard']);
      return false; // Prevent access to unprotected route
    }
    return true; // Allow access if not authenticated
  }
}
