import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

import { API_URLS } from "../../../constants/api-urls";
import { CreateGroupData, SearchedUserResponse } from "./groups.model";

@Injectable({
  providedIn: "root"
})
export class GroupsService {
  // Injecting the HttpClient to make HTTP requests
  private readonly httpClient = inject(HttpClient);
  
  /**
   * Searching users based on the letters typed.
   *
   * @param query - The search query.
   * @returns An observable with the search results (list of users possibly empty).
   */
  searchUsers(query: string) {
    const params = new HttpParams().set("fetchAll", true);
    return this.httpClient.get<SearchedUserResponse>(
      `${API_URLS.getUsers}/${query}`,
      {
        params,
        withCredentials: true,
      },
    );
  }

  createGroup(groupData: CreateGroupData | FormData) {
    return this.httpClient.post(`${API_URLS.createGroup}`,
      groupData,
      { withCredentials: true }
    );
  }
}
