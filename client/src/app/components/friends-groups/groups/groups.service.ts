import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

import { API_URLS } from "../../../constants/api-urls";
import { CreateGroupData, Group, SearchedUserResponse } from "./groups.model";

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

  /**
   * Create new group
   *
   * @param groupData The data to create a new group.
   * @returns An observable indicating the success of the request.
   */
  createGroup(groupData: CreateGroupData | FormData) {
    return this.httpClient.post(`${API_URLS.createGroup}`,
      groupData,
      { withCredentials: true }
    );
  }

  /**
   * Fetch the list of groups.
   *
   * @returns An observable with the list of groups.
   */
  fetchGroups() {
    return this.httpClient.get<Group>(API_URLS.fetchGroups, {
      withCredentials: true
    });
  }
}
