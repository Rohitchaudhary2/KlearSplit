import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { map, Observable } from "rxjs";

import { API_URLS } from "../../../constants/api-urls";
import {
  CreateGroupData,
  CreateGroupResponse,
  GroupExpenseInput,
  GroupExpenseResponse,
  GroupMessageResponse,
  GroupResponse,
  Groups,
  MembersData,
  SearchedUserResponse,
} from "./groups.model";

@Injectable({
  providedIn: "root",
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
  createGroup(
    groupData: CreateGroupData | FormData,
  ): Observable<CreateGroupResponse> {
    return this.httpClient.post<CreateGroupResponse>(
      `${API_URLS.createGroup}`,
      groupData,
      { withCredentials: true },
    );
  }

  /**
   * Add members to the group.
   * @param membersData The member data object which contains the list of members, admins and coadmins depending on roles selected.
   * @param groupId The ID of the group to add members to.
   * @returns An observable containing the object with the data of the added members.
   */
  addGroupMembers(membersData: MembersData, groupId: string) {
    return this.httpClient.post<GroupResponse>(
      API_URLS.addGroupMembers,
      { membersData, group_id: groupId },
      { withCredentials: true },
    );
  }

  /**
   * Fetch the list of groups.
   *
   * @returns An observable with the list of groups.
   */
  fetchGroups() {
    return this.httpClient.get<Groups>(API_URLS.getGroups, {
      withCredentials: true,
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
      { withCredentials: true },
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
      { withCredentials: true },
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
      { withCredentials: true },
    );
  }

  /**
   * This method is used to fetch all the messages of a group.
   *
   * @param groupId The ID of the group from where the message needs to be fetched.
   * @returns An observable with the list of messages.
   */
  fetchGroupMessages(groupId: string) {
    return this.httpClient
      .get<GroupMessageResponse>(`${API_URLS.getGroupMessages}/${groupId}`, {
        withCredentials: true,
      })
      .pipe(
        map((messages) =>
          messages.data.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)),
        ),
      );
  }

  blockGroup(groupId: string, blockStatus: boolean) {
    return this.httpClient.patch(
      `${API_URLS.updateGroupMember}/${groupId}`,
      { "has_blocked": blockStatus },
      { withCredentials: true }
    );
  }

  leaveGroup(groupId: string) {
    return this.httpClient.delete(`${API_URLS.leaveGroup}/${groupId}`, {
      withCredentials: true,
    });
  }

  /**
   * Add a new expense to the conversation.
   *
   * @param groupId - The ID of the conversation.
   * @param expenseData - The data for the new expense.
   * @returns An observable with the response after adding the expense.
   */
  addExpense(groupId: string, expenseData: GroupExpenseInput | FormData) {
    return this.httpClient.post<GroupExpenseResponse>(
      `${API_URLS.addGroupExpense}/${groupId}`,
      expenseData,
      { withCredentials: true },
    );
  }
}
