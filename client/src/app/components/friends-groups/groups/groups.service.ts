import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { concatMap, map, Observable } from "rxjs";

import { API_URLS } from "../../../constants/api-urls";
import {
  CombinedGroupExpense,
  CombinedGroupMessage,
  CombinedGroupSettlement,
  CombinedView,
  CreateGroupData,
  CreateGroupResponse,
  FetchExpenseResponse,
  GroupData,
  GroupExpenseData,
  GroupExpenseInput,
  GroupExpenseResponse,
  GroupMemberData,
  GroupMessageData,
  GroupMessageResponse,
  GroupResponse,
  Groups,
  GroupSettlementData,
  GroupSettlementInput,
  GroupSettlementResponse,
  MembersData,
  SearchedUserResponse,
} from "./groups.model";

@Injectable({
  providedIn: "root",
})
export class GroupsService {
  // Injecting the HttpClient to make HTTP requests
  private readonly httpClient = inject(HttpClient);

  sortBycreatedAt(data: (CombinedGroupMessage | CombinedGroupExpense | CombinedGroupSettlement)[]) {
    return data.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  }

  selectedGroup = signal<GroupData | undefined>(undefined);
  groupMembers = signal<GroupMemberData[]>([]);
  currentMember = signal<GroupMemberData | undefined>(undefined);
  messages = signal<GroupMessageData[]>([]);
  expenses = signal<(GroupExpenseData | GroupSettlementData)[]>([]);
  // Signal to hold combined view data (messages and expenses)
  combinedView = signal<(CombinedGroupMessage | CombinedGroupExpense | CombinedGroupSettlement)[]>([]);

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
   * Block groups for a particular group member.
   *
   * @param groupId - The ID of the group.
   * @param blockStatus - Block status of the group for a particular group member.
   * @returns - An observable with the updated block status.
   */
  blockGroup(groupId: string, blockStatus: boolean) {
    return this.httpClient.patch(
      `${API_URLS.updateGroupMember}/${groupId}`,
      { "has_blocked": blockStatus },
      { withCredentials: true }
    );
  }

  /**
   * Leave group functionality for a group member.
   *
   * @param groupId - The ID of the group.
   * @returns - An observable with leave group status.
   */
  leaveGroup(groupId: string) {
    return this.httpClient.delete(`${API_URLS.leaveGroup}/${groupId}`, {
      withCredentials: true,
    });
  }

  /**
   * Add a new expense to the group.
   *
   * @param groupId - The ID of the group.
   * @param expenseData - The data for the new expense.
   * @returns - An observable with the response after adding the expense.
   */
  addExpense(groupId: string, expenseData: GroupExpenseInput | FormData) {
    return this.httpClient.post<GroupExpenseResponse>(
      `${API_URLS.addGroupExpense}/${groupId}`,
      expenseData,
      { withCredentials: true },
    );
  }

  addSettlements(groupId: string, settlementData: GroupSettlementInput) {
    return this.httpClient.post<GroupSettlementResponse>(
      `${API_URLS.addGroupSettlements}/${groupId}`,
      settlementData,
      { withCredentials: true },
    );
  }

  /**
   * Fetches messages, expenses, and combined data for a specific conversation.
   * It handles loading conditions based on flags: loadMessages, loadExpenses, loadCombined.
   *
   * @param conversationId - The ID of the conversation to fetch data for.
   * @param loadMessages - Flag to determine if messages are to be loaded.
   * @param loadExpenses - Flag to determine if expenses are to be loaded.
   * @param pageMessage - Page number for message data.
   * @param pageExpense - Page number for expense data.
   * @param pageCombined - Page number for combined data.
   * @param pageSize - Page size for message, expense, and combined data.
   * @returns An observable with the data for messages, expenses, and combined.
   */
  fetchMessagesAndExpenses(
    groupId: string,
    loadMessages: boolean,
    loadExpenses: boolean,
    pageSize: number,
    timestampMessage: string = new Date().toISOString(),
    timestampExpense: string = new Date().toISOString(),
    timestampCombined: string = new Date().toISOString(),
  ) {
    const messagesUrl = `${API_URLS.getGroupMessages}/${groupId}?pageSize=${pageSize}&timestamp=${timestampMessage}`;
    const expensesUrl = `${API_URLS.fetchExpensesSettlements}/${groupId}?pageSize=${pageSize}&timestamp=${timestampExpense}`;
    const combinedUrl = `${API_URLS.fetchGroupCombined}/${groupId}?pageSize=${pageSize * 2}&timestamp=${timestampCombined}`;
    // If all messages, expenses, and combined need to be loaded
    if (loadMessages && loadExpenses) {
      return this.httpClient
        .get<GroupMessageResponse>(messagesUrl, { withCredentials: true })
        .pipe(
          concatMap((messages) => {
            // Sort messages by creation date
            messages.data.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));

            // Fetch expenses after messages
            return this.httpClient
              .get<FetchExpenseResponse>(expensesUrl, { withCredentials: true })
              .pipe(
                concatMap((expenses) => {
                  // Sort expenses by creation date
                  expenses.data.sort((a, b) =>
                    a.createdAt < b.createdAt ? -1 : 1,
                  );
                  // Fetch combined data after expenses
                  return this.httpClient
                    .get<CombinedView>(combinedUrl, { withCredentials: true })
                    .pipe(
                      map((combined) => {
                        // Sort combined data by creation date
                        combined.data = this.sortBycreatedAt(combined.data);
                        return {
                          messages: messages.data,
                          expenses: expenses.data,
                          combined: combined.data,
                        };
                      }),
                    );
                }),
              );
          }),
        );
    } else if (loadMessages) {
      return this.httpClient
        .get<GroupMessageResponse>(messagesUrl, { withCredentials: true })
        .pipe(
          map((messages) => {
            messages.data.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
            return { messages: messages.data, expenses: [], combined: [] };
          }),
        );
    } else if (loadExpenses) {
      return this.httpClient
        .get<FetchExpenseResponse>(expensesUrl, { withCredentials: true })
        .pipe(
          map((expenses) => {
            expenses.data.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
            return { messages: [], expenses: expenses.data, combined: [] };
          }),
        );
    }
    // If only combined data needs to be loaded
    return this.httpClient
      .get<CombinedView>(combinedUrl, { withCredentials: true })
      .pipe(
        map((combined) => {
          combined.data.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
          return { messages: [], expenses: [], combined: combined.data };
        }),
      );
  }
}
