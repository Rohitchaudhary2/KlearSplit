// import { Component, inject, OnInit } from '@angular/core';

// import { jwtDecode } from 'jwt-decode';

// import { AuthService } from '../auth/auth.service';
// import { TokenService } from '../auth/token.service';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { FetchResponse } from '../shared/types.model';
// import { API_URLS } from '../../constants/api-urls';
// import { ActivatedRoute, Router } from '@angular/router';

// @Component({
//   selector: 'app-dashboard',
//   standalone: true,
//   imports: [],
//   templateUrl: './dashboard.component.html',
//   styleUrl: './dashboard.component.css',
// })
// export class DashboardComponent implements OnInit {
//   authService = inject(AuthService);
//   private tokenService = inject(TokenService);
//   private httpClient = inject(HttpClient);
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);

//   private getUserUrl = API_URLS.fetchUser;

//   ngOnInit(): void {
//     // Step 1: Check if user_id is passed as query parameter (for Google OAuth)
//     console.log(this.route)
//     this.route.queryParams.subscribe((params) => {
//       console.log(params['id']);
//       const userIdFromGoogle = params['id']; // user_id from Google OAuth redirect

//       if (userIdFromGoogle) {
//         // Handle Google OAuth user case
//         const getUserUrlWithId = `${this.getUserUrl}/${userIdFromGoogle}`;

//         this.httpClient
//           .get<FetchResponse>(getUserUrlWithId, {
//             observe: 'response',
//             withCredentials: true, // Sends cookies, including refreshToken
//           })
//           .subscribe({
//             next: (response) => {
//               console.log(response);
//               this.authService.currentUser.set(response.body?.data);
//               // Check if there's a refreshed token in the response headers
//               if (response.headers instanceof HttpHeaders) {
//                 const refreshedAccessToken =
//                   response.headers.get('Authorization');
//                 if (refreshedAccessToken) {
//                   this.tokenService.setAccessToken(refreshedAccessToken);
//                 }
//               }
//               // Remove query parameter from the URL after handling
//               this.router.navigate([], { queryParams: {} });
//             },
//             error: (err) => {
//               console.error('Error fetching Google OAuth user:', err);
//             },
//           });
//       } else {
//         // Step 2: Handle regular JWT user case
//         this.handleRegularUser();
//       }
//     });
//   }

//   private handleRegularUser() {
//     const accessToken = this.tokenService.getAccessToken();
//     if (accessToken) {
//       const decodedToken = jwtDecode<{ id: string }>(accessToken);
//       const userId = decodedToken.id;

//       const getUserUrlWithId = `${this.getUserUrl}/${userId}`;

//       this.httpClient
//         .get<FetchResponse>(getUserUrlWithId, {
//           observe: 'response',
//           withCredentials: true,
//         })
//         .subscribe({
//           next: (response) => {
//             this.authService.currentUser.set(response.body?.data);
//             if (response.headers instanceof HttpHeaders) {
//               const refreshedAccessToken =
//                 response.headers.get('Authorization');
//               if (refreshedAccessToken) {
//                 this.tokenService.setAccessToken(refreshedAccessToken);
//               }
//             }
//           },
//         }
//       );
//     }
//   }
// }
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';

import { AuthService } from '../auth/auth.service';
import { TokenService } from '../auth/token.service';
import { API_URLS } from '../../constants/api-urls';
import { FetchResponse } from '../shared/types.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private tokenService = inject(TokenService);
  private httpClient = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private getUserUrl = API_URLS.fetchUser;

  ngOnInit(): void {
    // Step 1: Check for Google OAuth access token and user_id in query params
    this.route.queryParams.subscribe((params) => {
      const userIdFromGoogle = params['id'];
      const accessTokenFromGoogle = params['token'];

      if (userIdFromGoogle && accessTokenFromGoogle) {
        // Store the access token in localStorage
        this.tokenService.setAccessToken(accessTokenFromGoogle);

        // Use the access token to fetch user details
        this.fetchUserDetails(userIdFromGoogle);

        // Clean the URL to remove query params
        this.router.navigate([], { queryParams: {} });
      } else {
        // Handle regular login scenario
        this.handleRegularUser();
      }
    });
  }

  private fetchUserDetails(userId: string): void {
    const getUserUrlWithId = `${this.getUserUrl}/${userId}`;
    this.httpClient
      .get<FetchResponse>(getUserUrlWithId, {
        observe: 'response',
        withCredentials: true,
      })
      .subscribe({
        next: (response) => {
          this.authService.currentUser.set(response.body?.data);
          const refreshedAccessToken = response.headers.get('Authorization');
          if (refreshedAccessToken) {
            this.tokenService.setAccessToken(refreshedAccessToken);
          }
        },
        error: (err) => {
          console.error('Error fetching user details:', err);
        },
      });
  }

  private handleRegularUser(): void {
    const accessToken = this.tokenService.getAccessToken();
    if (accessToken) {
      const decodedToken = jwtDecode<{ id: string }>(accessToken);
      const userId = decodedToken.id;

      this.fetchUserDetails(userId);
    }
  }
}
