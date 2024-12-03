import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { API_URLS } from "../../../constants/api-urls";
import { CreateGroupData, CreateGroupResponse, GroupMessageData, GroupResponse, Groups, SearchedUserResponse } from "./groups.model";

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
  createGroup(groupData: CreateGroupData | FormData): Observable<CreateGroupResponse> {
    return this.httpClient.post<CreateGroupResponse>(`${API_URLS.createGroup}`,
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
    return this.httpClient.get<Groups>(API_URLS.getGroups, {
      withCredentials: true
    });
  }
  
  /**
   * Update group member details.
   *
   * @param groupId The Id of the group to update.
   * @param status The field which needs to be updated.
   * @returns An observable indicating the success of the update.
   */
  acceptRejectInvite(groupId: string, status: string) {
    return this.httpClient.patch(
      `${API_URLS.updateGroupMember}/${groupId}`,
      { status },
      { withCredentials: true }
    );
  }

  /**
   * This method fetches the complete details of a particular group.
   * It fetches the group details and group members.
   *
   * @param groupId The ID of the group to fetch details.
   * @returns An observable with the list of objects for the details of each group member.
   */
  fetchGroupMembers(groupId: string) {
    return this.httpClient.get<GroupResponse>(
      `${API_URLS.getGroup}/${groupId}`,
      { withCredentials: true }
    );
  }

  /**
   * This method is used to save the message sent to the group.
   *
   *
   * @param message The message that needs to be sent.
   * @param groupId The ID of the group to which the message needs to be sent.
   * @returns The observable indicating the success of the message sending.
   */
  saveGroupMessages(message: string, groupId: string) {
    return this.httpClient.post(
      `${API_URLS.saveGroupMessages}/${groupId}`,
      { message },
      { withCredentials: true }
    );
  }

  /**
   * This method is used to fetch all the messages of a group.
   *
   * @param groupId The ID of the group from where the message needs to be fetched.
   * @returns An observable with the list of messages.
   */
  fetchGroupMessages(groupId: string) {
    return this.httpClient.get<GroupMessageData[]>(
      `${API_URLS.getGroupMessages}/${groupId}`,
      { withCredentials: true }
    );
  }
}
