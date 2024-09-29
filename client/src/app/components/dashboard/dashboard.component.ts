import { Component, inject, OnInit } from '@angular/core';

import { jwtDecode} from 'jwt-decode';

import { AuthService } from '../auth/auth.service';
import { TokenService } from '../auth/token.service';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { map } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private toastr = inject(ToastrService);
  private tokenService = inject(TokenService);
  private httpClient = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/api/v1';
  private getUserUrl = `${this.apiUrl}/users`;

  ngOnInit(): void {
    const accessToken = this.tokenService.getAccessToken();
    if (accessToken) {
      const decodedToken = jwtDecode<{ id: string }>(accessToken);
      const userId = decodedToken.id;
      console.log(userId)

      const getUserUrlWithId = `${this.getUserUrl}/${userId}`;
         
      this.httpClient.get<any>(getUserUrlWithId, { withCredentials: true }).pipe(
        map((response) => {
          this.tokenService.removeAccessToken();
          console.log(response);
          return response;
        })
      )
      .subscribe({
        next:(response) => {
          this.authService.currentUser.set(response.data);
          const token = this.tokenService.getAccessToken();
          this.tokenService.setAccessToken('accessToken')
        }
      });
    }
  }
}
