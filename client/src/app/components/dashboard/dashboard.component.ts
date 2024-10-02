import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../auth/auth.service';
import { API_URLS } from '../../constants/api-urls';
import { TokenService } from '../auth/token.service';
import { UserService } from '../user.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  authService = inject(AuthService);
  private tokenService = inject(TokenService);
  private userService = inject(UserService);

  private getUserUrl = API_URLS.fetchUser;

  ngOnInit(): void {
    // Check for user_id in query params
    this.route.queryParams.subscribe((params) => {
      const userId = params['id'];

      if (userId) {
        // Fetch User details
        this.tokenService.setUserId(userId);
        this.userService.fetchUserDetails(userId);

        // Clean the URL to remove query params
        this.router.navigate(['/dashboard'], { queryParams: {} });
      } else {
        // Handle regular login scenario
        this.handleRegularUser();
      }
    });
  }

  private handleRegularUser(): void {
    const userId = this.tokenService.getUserId();
    this.userService.fetchUserDetails(userId);
  }
}
