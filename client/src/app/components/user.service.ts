import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { map } from "rxjs";

import { API_URLS } from "../constants/api-urls";
import { AuthService } from "./auth/auth.service";
import { TokenService } from "./auth/token.service";
import { CurrentUser, FetchResponse } from "./shared/types.model";

@Injectable({
  providedIn: "root",
})
export class UserService {
  private readonly httpClient = inject(HttpClient);

  private readonly tokenService = inject(TokenService);
  private readonly authService = inject(AuthService);

  fetchUserDetails() {
    return this.httpClient
      .get<FetchResponse>(API_URLS.fetchUser, {
        withCredentials: true,
      })
      .pipe(
        map((response) => {
          if (response) {
            this.authService.setAuthenticatedUser(response.data);
            this.tokenService.setUserId(response.data?.user_id);
            return true;
          } else {
            return false;
          };
        }),
      );
  }

  updateUser(id: string, updatedUser: CurrentUser | FormData) {
    return this.httpClient
      .patch(`${API_URLS.updateProfile}/${id}`, updatedUser, {
        withCredentials: true,
      });
  }
}
