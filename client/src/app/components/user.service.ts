import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { map } from "rxjs";

import { API_URLS } from "../constants/api-urls";
import { AuthService } from "./auth/auth.service";
import { TokenService } from "./auth/token.service";
import { FetchResponse } from "./shared/types.model";

@Injectable({
  providedIn: "root",
})
export class UserService {
  private readonly httpClient = inject(HttpClient);

  private readonly tokenService = inject(TokenService);
  private readonly authService = inject(AuthService);

  private readonly getUserUrl = API_URLS.fetchUser; // URL for getting user without the id part

  fetchUserDetails() {
    return this.httpClient
      .get<FetchResponse>(this.getUserUrl, {
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
}
