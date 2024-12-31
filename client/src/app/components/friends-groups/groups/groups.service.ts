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
  UpdateGroupResponse,
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
  groups = signal<GroupData[]>([]);
  groupInvites = signal<GroupData[]>([]);

  /**
   * Type guard to check if an item is of type CombinedGroupExpense.
   *
   * @param item - The item to check. Can be a CombinedGroupMessage, a CombinedGroupExpense or a CombinedGroupSettlement.
   * @returns True if the item is a CombinedGroupExpense, false otherwise.
   */
  isCombinedExpense(
    item: CombinedGroupMessage | CombinedGroupExpense | CombinedGroupSettlement,
  ): item is CombinedGroupExpense {
    return (item as CombinedGroupExpense).group_expense_id !== undefined;
  }

  /**
   * Type guard to check if an item is of type CombinedGroupSettlement.
   *
   * @param item - The item to check. Can be a CombinedGroupMessage, a CombinedGroupExpense or a CombinedGroupSettlement.
   * @returns True if the item is a CombinedGroupSettlement, false otherwise.
   */
  isCombinedSettlement(
    item: CombinedGroupMessage | CombinedGroupExpense | CombinedGroupSettlement,
  ): item is CombinedGroupSettlement {
    return (item as CombinedGroupSettlement).group_settlement_id !== undefined;
  }

  /**
   * Type guard to check if an item is of type CombinedGroupMessage.
   *
   * @param item - The item to check. Can be a CombinedGroupMessage, a CombinedGroupExpense or a CombinedGroupSettlement.
   * @returns True if the item is a CombinedGroupMessage, false otherwise.
   */
  isCombinedMessage(item: CombinedGroupMessage | CombinedGroupExpense | CombinedGroupSettlement): item is CombinedGroupMessage {
    return (item as CombinedGroupMessage).sender_id !== undefined;
  }

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
      `${API_URLS.group}/${groupId}`,
      { withCredentials: true },
    );
  }

  /**
   * This method calls the patch API to update the group details.
   *
   * @param groupId - The ID of the group to be updated.
   * @param groupData - The groupData object with the fields that need to be updated.
   * @returns - An observable with the response data of the updated group.
   */
  updateGroup(groupId: string, groupData: string) {
    return this.httpClient.patch<UpdateGroupResponse>(
      `${API_URLS.group}/${groupId}`,
      groupData,
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

  /**
   * This method calls the back-end API to add settlement in a group with a particular group member.
   *
   * @param groupId Id of the group in which settlement is to be done.
   * @param settlementData The input data required for settlement.
   * @param settlementData.payer_id The id of the user who is paying the settlement.
   * @param settlementData.debtor_id The id of the user who is getting paid the settlement.
   * @param settlementData.settlement_amount The amount of settlement.
   * @param settlementData.description Optional field to describe the settlement.
   * @returns An observable with the response data after settlement.
   */
  addSettlements(groupId: string, settlementData: GroupSettlementInput) {
    return this.httpClient.post<GroupSettlementResponse>(
      `${API_URLS.addGroupSettlements}/${groupId}`,
      settlementData,
      { withCredentials: true },
    );
  }

  /**
   * Fetches messages, expenses, and combined data for a specific group.
   * It handles loading conditions based on flags: loadMessages, loadExpenses.
   *
   * @param groupId - The ID of the group to fetch data for.
   * @param loadMessages - Flag to determine if messages are to be loaded.
   * @param loadExpenses - Flag to determine if expenses are to be loaded.
   * @param pageSize - Page size for message, expense, and combined data.
   * @param timestampMessage - Timestamp for messages.
   * @param timestampExpense - Timestamp for expenses and settlement data.
   * @param timestampCombined - Timestamp for combined messages and expenses and settlement data.
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

  /**
   * Fetch all expenses and settlements for a given group.
   *
   * @param groupId - The ID of the group.
   * @returns An observable with the list of all expenses and settlements.
   */
  fetchAllExpensesAndSettlements(groupId: string) {
    const params = new HttpParams()
      .set("fetchAll", true)
      .set("timestamp", new Date().toISOString());
  
    return this.httpClient
      .get<FetchExpenseResponse>(`${API_URLS.fetchExpensesSettlements}/${groupId}`, {
        params,
        withCredentials: true,
      })
      .pipe(
        map((expenses) => {
          return expenses.data;
        }),
      );
  }

  /**
   * Delete an expense or settlement from the group.
   *
   * @param groupId - The ID of the group.
   * @param isExpense - Boolean to check whether the entity being deleted is expense or settlement (expense if true).
   * @param id - The ID of either expense or settlement.
   * @returns - An observable indicating the success of the operation.
   */
  deleteExpenseAndSettlement(groupId: string, isExpense: boolean, id: string) {
    const url = isExpense ? API_URLS.deleteGroupExpense : API_URLS.deleteGroupSettlement;
    const body = isExpense ? { group_expense_id: id } : { group_settlement_id: id };
    return this.httpClient.delete(`${url}/${groupId}`, {
      body,
      withCredentials: true,
    });
  }

  /**
   * Update an existing expense or settlement in the group.
   *
   * @param groupId - The ID of the group.
   * @param isExpense - Boolean to check whether the entity being updated is expense or settlement (expense if true).
   * @param data - Expense or Settlement data to be updated.
   * @returns - An observable with the response after updating the expense or settlement.
   */
  updateExpenseAndSettlement(groupId: string, isExpense: boolean, data: GroupExpenseInput | GroupSettlementInput | FormData) {
    const url = isExpense ? API_URLS.updateGroupExpense : API_URLS.updateGroupSettlement;
    return this.httpClient.patch(
      `${url}/${groupId}`,
      data,
      { withCredentials: true },
    );
  }
}
