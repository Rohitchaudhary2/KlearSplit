import { NgClass } from "@angular/common";
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, inject, OnDestroy, signal, ViewChild, viewChild }
  from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";

import { AuthService } from "../../auth/auth.service";
import { ConfirmationDialogComponent } from "../../confirmation-dialog/confirmation-dialog.component";
import { CurrentUser } from "../../shared/types.model";
import { FriendsListComponent } from "../friends/friends-list/friends-list.component";
import { SocketService } from "../friends/socket.service";
import { ExpenseComponent } from "../shared/expense/expense.component";
import { MessageComponent } from "../shared/message/message.component";
import { SelectMembersDialogComponent } from "./create-group/select-members-dialog/select-members-dialog.component";
import { CombinedGroupExpense, CombinedGroupMessage, GroupData, GroupExpenseData, GroupExpenseResponse, GroupMemberData, GroupMessageData }
  from "./groups.model";
import { GroupsService } from "./groups.service";
import { GroupsExpenseComponent } from "./groups-expense/groups-expense.component";
import { GroupsListComponent } from "./groups-list/groups-list.component";

@Component({
  selector: "app-groups",
  standalone: true,
  imports: [
    FormsModule,
    NgClass,
    FriendsListComponent,
    GroupsListComponent,
    MessageComponent,
    ExpenseComponent,
  ],
  templateUrl: "./groups.component.html",
  styleUrls: [ "./groups.component.css", "../friends/friends.component.css" ]
})
export class GroupsComponent implements AfterViewInit, OnDestroy {
  // Reference to the message container element, accessed via ViewChild
  messageContainer = viewChild<ElementRef>("messageContainer");
  @ViewChild(GroupsListComponent) groupsListComponent!: GroupsListComponent;
  private readonly cdr = inject(ChangeDetectorRef); // Change detector for manual view updates
  private readonly toastr = inject(ToastrService);
  private readonly authService = inject(AuthService);
  private readonly socketService = inject(SocketService);
  private readonly groupsService = inject(GroupsService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  // Current user data from authService
  user = this.authService.currentUser();
  user_name = this.getFullNameAndImage(this.user).fullName;

  // Signal to control the visibility of message, expenses, or combined data
  currentView = signal<"Messages" | "Expenses" | "All">("All");

  messageInput = "";

  messages = signal<GroupMessageData[]>([]);
  expenses = signal<GroupExpenseData[]>([]);
  // Signal to hold combined view data (messages and expenses)
  combinedView = signal<(CombinedGroupMessage | CombinedGroupExpense)[]>([]);

  // Character count and Flag to check if character count exceeded for the input field
  charCount = 0;
  charCountExceeded = false;

  // Flag to track if welcome image is loaded
  isImageLoaded = false;

  // Pagination related variables for message and expense loading
  pageMessage = 1;
  pageExpense = 1;
  pageSize = 20;
  pageCombined = 1;
  offset = 0;
  timestampMessages = new Date().toISOString();
  timestampExpenses = new Date().toISOString();
  timestampCombined = new Date().toISOString();

  // Flag to indicate if data is still being loaded
  loading = false;

  // Flags to track if all data (messages, expenses, combined) has been loaded
  allMessagesLoaded = false;
  allExpensesLoaded = false;
  allCombinedLoaded = false;

  // Scroll position state
  scrollPosition = 0;

  addExpenseLoader = false;

  // Access signals from the GroupsService
  get selectedGroup() {
    return this.groupsService.selectedGroup()!;
  }

  get groupMembers() {
    return this.groupsService.groupMembers()!;
  }

  get currentMember() {
    return this.groupsService.currentMember()!;
  }

  /**
   * This lifecycle hook is triggered after the view has been initialized.
   * Here, we automatically scroll the message container to the bottom.
   */
  ngAfterViewInit() {
    this.scrollToBottom();
  }

  /**
   * Cleanup when component is destroyed.
   * This method ensures that when the component is destroyed,
   * user properly leaves the room and disconnected from the socket.
   */
  ngOnDestroy(): void {
    if (this.selectedGroup) {
      this.socketService.leaveRoom(this.selectedGroup!.group_id);
      this.socketService.disconnect();
    }
  }

  /**
   * HostListener that listens for scroll events on the component.
   * When the user scrolls to the top, it triggers loading of more items.
   *
   * @param event - The scroll event
   */
  @HostListener("scroll", [ "$event" ])
  onScroll(event: Event) {
    const element = event.target as HTMLElement;
    // Check if the user has scrolled to the top and if loading is not in progress
    if (element.scrollTop === 0 && !this.loading) {
      this.scrollPosition = element.scrollHeight;
      this.loadItems(element);
    }
  }

  /**
   * Scrolls the message container to the bottom.
   */
  scrollToBottom() {
    if (!this.messageContainer()) {
      return;
    }
    const container = this.messageContainer()?.nativeElement;
    container.scrollTop = container.scrollHeight;
  }

  /**
   * Method to handle image loading.
   * This sets the `isImageLoaded` flag to true when the image has been loaded.
   */
  onImageLoad() {
    this.isImageLoaded = true;
  }

  /**
   * This method clears all the message and expese signals to empty so that no previous group data is displayed when a new group is selected.
   * It also leaves the room in socket so that it doesn't listen to the messages from previous group.
   */
  clearSelectedGroupData() {
    // If there is, send a message to the server to leave the group
    this.socketService.leaveRoom(this.selectedGroup!.group_id);
    // Remove the existing 'onNewGroupMessage' listener for the previous group
    this.socketService.removeNewMessageListener();
    // Clear previous data (messages, expenses, and combined view)
    this.messages.set([]);
    this.expenses.set([]);
    this.combinedView.set([]);
    // Reset pagination values
    this.pageMessage = 1;
    this.pageExpense = 1;
    this.pageCombined = 1;
    this.messageInput = "";
    // Reset flags to indicate whether all messages, expenses, and combined data are loaded
    this.allMessagesLoaded = false;
    this.allExpensesLoaded = false;
    this.allCombinedLoaded = false;
  }

  onSelectGroup(group: GroupData | undefined) {
    // Check if there is a previously selected group
    if (this.groupsService.selectedGroup()) {
      this.clearSelectedGroupData();
    }

    // Set the selected group as the new selected group
    this.groupsService.setSelectedGroup(group);

    // If no group is selected, then return
    if (!this.selectedGroup) {
      return;
    }

    // Fetch group members
    this.fetchGroupMembers();
    // Fetch messages, expenses, and combined data (messages + expenses) for the selected group
    this.fetchMessagesAndExpenses(true, true, true, null);
    // Join the new conversation room for the selected group
    this.socketService.joinRoom(this.selectedGroup!.group_id);

    // Listen for new messages from the server for the new room
    this.socketService.onNewGroupMessage((message: GroupMessageData) => {

      const sender = this.getFullNameAndImage(this.groupMembers.find((member) =>{
        const isSender = message.sender_id === member.member_id;
        message.sender_id = member.group_membership_id;
        return isSender;
      }));
  
      const messageWithName = {
        ...message,
        senderName: sender.fullName,
        senderImage: sender.imageUrl
      };
      this.messages.set([ ...this.messages(), messageWithName ]);
      this.combinedView.set([
        ...this.combinedView(),
        { ...messageWithName, type: "message" },
      ]);
      this.cdr.detectChanges();
      this.scrollToBottom();
    });
  }

  /**
   * Toggles between different views (Messages, Expenses, or All) based on the provided filter.
   *
   * @param filter - The filter that determines which view to display. Can be 'Messages', 'Expenses', or 'All'.
   */
  toggleView(filter: "Messages" | "Expenses" | "All") {
    this.currentView.set(filter);
    this.cdr.detectChanges();
    this.scrollToBottom();
  }

  // Method to load the appropriate data based on the current view
  loadItems(element: HTMLElement) {
    switch (this.currentView()) {
      case "All":
        this.fetchMessagesAndExpenses(false, false, true, element); // Load combined view
        break;
      case "Messages":
        this.fetchMessagesAndExpenses(true, false, false, element); // Load only messages
        break;
      case "Expenses":
        this.fetchMessagesAndExpenses(false, true, false, element); // Load only expenses
        break;
    }
  }

  /**
   * Sends a message in the conversation.
   *
   * @returns void
   * This method sends the message data to the server via the socket service and clears the input field.
   * If the message input is empty or consists only of whitespace, no action is taken.
   */
  sendMessage(): void {
    if (!this.messageInput.trim()) {
      return;
    }
    const messageData = {
      group_id: this.selectedGroup!.group_id,
      sender_id: this.user!.user_id,
      message: this.messageInput,
    };
    this.socketService.sendGroupMessage(messageData);
    this.groupsService.saveGroupMessages(this.messageInput, this.selectedGroup!.group_id).subscribe();
    this.messageInput = "";
  }

  /**
   * Handles the input change event for the message textarea.
   * Updates the character count and sets a flag if the character limit is exceeded.
   *
   * @param event - The input event triggered when the textarea value changes.
   */
  onInputChange(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.charCount = textarea.value.length;
    this.charCountExceeded = this.charCount === 512;
  }

  /**
   * Opens the dialog for viewing a group's details such as balance of the current user with each member.
   */
  openGroupDetails() {
    this.router.navigate([ "/groups/details" ]);// Navigate to the group details page
  }

  /**
   * Add members to the group.
   */
  onAddMembers() {
    const dialogRef = this.dialog.open(SelectMembersDialogComponent, {
      maxWidth: "50vw",
      maxHeight: "50vh",
      height: "70%",
      width: "100%",
      data: [ "Add Members" ],
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      delete result.membersToDisplay;
      const membersData = result;
      // Process and clean up membersData
      const cleanedMembersData = Object.keys(membersData).reduce((acc, key) => {
        const typedKey = key as keyof typeof membersData; // Explicitly cast key
        const value = membersData[typedKey];
        // Only include non-empty arrays
        if (Array.isArray(value) && value.length > 0) {
          acc[typedKey] = value;
        }
        return acc;
      }, {} as typeof membersData);
      this.groupsService.addGroupMembers(cleanedMembersData, this.selectedGroup!.group_id).subscribe({
        next: () => {
          this.fetchGroupMembers();
          this.toastr.success("Member Added Successfully", "Success");
        },
      });
    });
  }

  /**
   * Checks whether all messages, expenses, or combined data have been completely loaded,
   * and sets the appropriate loader state accordingly.
   *
   * @param loadedKey - The key indicating which data type's load status to check. It can be one of:
   *   - `"allMessagesLoaded"` for messages,
   *   - `"allExpensesLoaded"` for expenses,
   *   - `"allCombinedLoaded"` for combined messages and expenses.
   * @param loadCondition - A boolean indicating whether the data should be considered loaded based on the condition.
   * @param items - The array of items (messages, expenses, or combined data) to check the length against.
   * @param pageSize - The number of items that should be loaded per page. If the number of items is less than this, it indicates all data is loaded.
   */
  checkAndSetLoaded(loadedKey: "allMessagesLoaded" | "allExpensesLoaded" |"allCombinedLoaded", loadCondition: boolean,
    items: (GroupMessageData | GroupExpenseData)[], pageSize: number) {
    if (!this[loadedKey] && loadCondition && items.length < pageSize) {
      this[loadedKey] = true;
    }
  }

  // Method to fetch messages, expenses, and combined data based on flags
  fetchMessagesAndExpenses(
    loadMessages: boolean,
    loadExpenses: boolean,
    loadCombined: boolean,
    element: HTMLElement | null,
  ) {
    // Prevent making multiple requests if one is already in progress
    if (this.loading ||
      (loadMessages && this.allMessagesLoaded) ||
      (loadExpenses && this.allExpensesLoaded) ||
      (loadCombined && this.allCombinedLoaded)) {
      return;
    }

    // Set loading to true to prevent subsequent requests until this one is complete
    this.loading = true;

    // Call the service to fetch the data (messages, expenses, and/or combined view)
    this.groupsService
      .fetchMessagesAndExpenses(
        this.selectedGroup!.group_id,
        loadMessages,
        loadExpenses,
        this.pageMessage,
        this.pageExpense,
        this.pageCombined,
        this.pageSize,
        this.offset,
        this.timestampMessages,
        this.timestampExpenses,
        this.timestampCombined
      )
      .subscribe({
        next: ({ messages, expenses, combined }) => {
          expenses.forEach((expense) => {
            if (expense.payer_id === this.currentMember?.group_membership_id) {
              expense.payer = this.getFullNameAndImage(this.currentMember);;
            } else {
              const payer = this.groupMembers.find((member) => expense.payer_id === member.group_membership_id);
              expense.payer = this.getFullNameAndImage(
                payer
              );
            }
          });
          const messagesWithName = messages.map((message) => {
            const sender = this.getFullNameAndImage(this.groupMembers.find((member) =>
              message.sender_id === member.group_membership_id
            ));
            return {
              ...message,
              senderName: sender.fullName,
              senderImage: sender.imageUrl
            };
          });
          
          // Check if all data has already been loaded for the current view and set the flag accordingly
          this.checkAndSetLoaded("allMessagesLoaded", loadMessages, messages, this.pageSize);
          this.checkAndSetLoaded("allExpensesLoaded", loadExpenses, expenses, this.pageSize);
          this.checkAndSetLoaded("allCombinedLoaded", loadCombined, combined, this.pageSize);
          
          this.messages.set([ ...messagesWithName, ...this.messages() ]);
          this.expenses.set([ ...expenses, ...this.expenses() ]);
          this.combinedView.set([ ...combined, ...this.combinedView() ]);
          
          this.offset++;
          this.timestampMessages = this.messages()[0].createdAt;
          this.timestampExpenses = this.expenses()[0].createdAt;
          this.timestampCombined = this.combinedView()[0].createdAt;
          if (this.offset === 3) {
            this.offset = 0;
            this.pageExpense++;
            this.pageMessage++;
            this.pageCombined++;
          }

          // If it's the first page load (page 1), scroll to the bottom, and for subsequent pages, adjust the scroll position
          if (
            this.pageMessage === 1 ||
            this.pageExpense === 1 ||
            this.pageCombined === 1
          ) {
            this.cdr.detectChanges();
            this.scrollToBottom();
          } else {
            this.cdr.detectChanges();
            // After loading new items, calculate the new scroll position
            const newScrollHeight = element!.scrollHeight;

            // Adjust the scroll position to keep the view consistent
            const scrollDiff = newScrollHeight - this.scrollPosition;
            element!.scrollTop = element!.scrollTop + scrollDiff - 100;
          }

          // Increment the page number for the next data fetch
          this.pageMessage += Number(loadMessages);
          this.pageExpense += Number(loadExpenses);
          this.pageCombined += Number(loadCombined);

          // Reset loading state to allow future requests
          this.loading = false;
        },
      });
  }

  /**
   * Fetches the messages of a particular group.
   */
  // fetchGroupMessages(
  //   loadMessages: boolean,
  //   element: HTMLElement | null,
  // ) {
  //   // Prevent making multiple requests if one is already in progress
  //   if (this.loading ||
  //     (loadMessages && this.allMessagesLoaded)
  //   ) {
  //     return;
  //   }

  //   // Set loading to true to prevent subsequent requests until this one is complete
  //   this.loading = true;

  //   this.groupsService.fetchGroupMessages(
  //     this.selectedGroup!.group_id,
  //     this.pageMessage,
  //     this.pageSize,
  //     this.offsetMessage,
  //     this.timestampMessage
  //   ).subscribe({
  //     next: (messages) => {
  //       // Check if all data has already been loaded for the current view and set the flag accordingly
  //       this.checkAndSetLoaded("allMessagesLoaded", loadMessages, messages, this.pageSize);
  //       const messagesWithName = messages.map((message) => {
  //         const sender = this.getFullNameAndImage(this.groupMembers.find((member) =>
  //           message.sender_id === member.group_membership_id
  //         ));
  //         return {
  //           ...message,
  //           senderName: sender.fullName,
  //           senderImage: sender.imageUrl
  //         };
  //       });
  //       this.messages.set([ ...messagesWithName, ...this.messages() ]); // Set the messages in the messages signal
  //       this.offsetMessage++;
  //       this.timestampMessage = this.messages()[0].createdAt;
  //       if (this.offsetMessage === 3) {
  //         this.offsetMessage = 0;
  //         this.pageMessage++;
  //       }
  //       // If it's the first page load (page 1), scroll to the bottom, and for subsequent pages, adjust the scroll position
  //       if (
  //         this.pageMessage === 1
  //       ) {
  //         this.cdr.detectChanges();
  //         this.scrollToBottom();
  //       } else {
  //         this.cdr.detectChanges();
  //         // After loading new items, calculate the new scroll position
  //         const newScrollHeight = element!.scrollHeight;

  //         // Adjust the scroll position to keep the view consistent
  //         const scrollDiff = newScrollHeight - this.scrollPosition;
  //         element!.scrollTop = element!.scrollTop + scrollDiff - 100;
  //       }

  //       // Increment the page number for the next data fetch
  //       this.pageMessage += Number(loadMessages);

  //       // Reset loading state to allow future requests
  //       this.loading = false;
  //     }
  //   });
  // }

  // fetchGroupExpensesAndSettlements(
  //   loadExpense: boolean,
  //   element: HTMLElement | null,
  // ) {
  //   // Prevent making multiple requests if one is already in progress
  //   if (this.loading ||
  //     (loadExpense && this.allExpensesLoaded)
  //   ) {
  //     return;
  //   }

  //   // Set loading to true to prevent subsequent requests until this one is complete
  //   this.loading = true;

  //   // Fetch group expenses and settlements
  //   this.groupsService.fetchExpensesSettlements(
  //     this.selectedGroup!.group_id,
  //     this.pageExpense,
  //     this.pageSize,
  //     this.offsetExpense,
  //     this.timestampExpense
  //   ).subscribe({
  //     next: (expenses) => {
  //       expenses.forEach((expense) => {
  //         if (expense.payer_id === this.currentMember?.group_membership_id) {
  //           expense.payer = this.getFullNameAndImage(this.currentMember);;
  //         } else {
  //           const payer = this.groupMembers.find((member) => expense.payer_id === member.group_membership_id);
  //           expense.payer = this.getFullNameAndImage(
  //             payer
  //           );
  //         }
  //       });

  //       // Check if all data has already been loaded for the current view and set the flag accordingly
  //       this.checkAndSetLoaded("allExpensesLoaded", loadExpense, expenses, this.pageSize);

  //       this.expenses.set(expenses);
  //       this.offsetExpense++;
  //       if (this.offsetExpense === 3) {
  //         this.offsetExpense = 0;
  //         this.pageExpense++;
  //       }
  //       // If it's the first page load (page 1), scroll to the bottom, and for subsequent pages, adjust the scroll position
  //       if (
  //         this.pageExpense === 1
  //       ) {
  //         this.cdr.detectChanges();
  //         this.scrollToBottom();
  //       } else {
  //         this.cdr.detectChanges();
  //         // After loading new items, calculate the new scroll position
  //         const newScrollHeight = element!.scrollHeight;

  //         // Adjust the scroll position to keep the view consistent
  //         const scrollDiff = newScrollHeight - this.scrollPosition;
  //         element!.scrollTop = element!.scrollTop + scrollDiff - 100;
  //       }

  //       // Increment the page number for the next data fetch
  //       this.pageExpense += Number(loadExpense);

  //       // Reset loading state to allow future requests
  //       this.loading = false;
  //     }
  //   });
  // }

  /**
   * This function calls the service to fetch the group details containing all the members.
   * The response contains the balance of the current user with each member and the total balance of that member.
   *
   * This function also maps over the result to update the roles so that they can be displayed properly.
   */
  fetchGroupMembers() {
    this.groupsService
      .fetchGroupMembers(this.selectedGroup!.group_id)
      .subscribe((response) => {
        const filteredMembers = this.filterMembers(response.data);
        this.groupsService.setGroupMembers(filteredMembers);
        const currentMember = filteredMembers.find((member) => this.user?.user_id === member.member_id);
        this.groupsService.setCurrentMember(currentMember);
      });
  }

  /**
   * Opens the dialog to add an expense and handles the process of adding the expense.
   * After the dialog is closed, it sends the expense data to the server and updates the UI accordingly.
   */
  openAddExpenseDialog() {
    const dialogRef = this.dialog.open(GroupsExpenseComponent, {
      data: [ "Add Expense", this.currentMember, this.selectedGroup, this.groupMembers ],
      enterAnimationDuration: "200ms",
      exitAnimationDuration: "200ms",
    });
    // Subscribe to the dialog close event and process the data returned when the dialog is closed.
    dialogRef.afterClosed().subscribe((data) => {
      if (!data) {
        return;
      }
      const result = data.formData;
      const expenseData = data.expenseData;

      expenseData.payer = this.getFullNameAndImage(
        this.groupMembers.find((member) => expenseData.payer_id === member.group_membership_id)
      );

      this.addExpenseLoader = true;
      // Temporarily add the new expense to the local view with a unique group_expense_id ('adding') to indicate that it's being processed.
      this.expenses.set([
        ...this.expenses(),
        { ...expenseData, group_expense_id: "adding" },
      ]);
      this.combinedView.set([
        ...this.combinedView(),
        { ...expenseData, group_expense_id: "adding" },
      ]);
      this.cdr.detectChanges();
      this.scrollToBottom();

      // Make the API call to add the expense on the server.
      this.groupsService
        .addExpense(this.selectedGroup!.group_id, result)
        .subscribe({
          next: (response: GroupExpenseResponse) => {
            const expense = response.data.expense;
            const expenseParticipants = response.data.expenseParticipants;
            // Reduce the above array to add the debtor_amount of each participant into a variable debtor_amount
            const totalDebtAmount = expenseParticipants.reduce((acc, val) => acc + parseFloat(val.debtor_amount), 0);
            expense.total_debt_amount = totalDebtAmount.toString();
            if (expense.payer_id === this.currentMember?.group_membership_id) {
              expense.payer = this.getFullNameAndImage(this.currentMember);
              expense.user_debt = (expenseParticipants.find(
                (participant) => participant.debtor_id === this.currentMember!.group_membership_id)!.debtor_amount);
            } else {
              const payer = this.groupMembers.find((member) => expense.payer_id === member.group_membership_id);
              expense.payer = this.getFullNameAndImage(
                payer
              );
              expense.user_debt = (expenseParticipants.find(
                (participant) => participant.debtor_id === payer?.group_membership_id)!.debtor_amount);
            }

            // Update the expenses list by replacing the temporary 'adding' entry with the actual response data.
            const currExpenses: GroupExpenseData[] = this.expenses();
            currExpenses.pop();
            this.expenses.set([ ...currExpenses, expense ]);

            // Update the combined view by replacing the temporary 'adding' entry.
            const currCombined = this.combinedView();
            currCombined.pop();
            this.combinedView.set([
              ...currCombined,
              { ...expense, type: "expense" },
            ]);
            this.addExpenseLoader = false;
            this.cdr.detectChanges();
            this.scrollToBottom();
            this.toastr.success("Expense Created successfully", "Success");
          },
          error: () => this.addExpenseLoader = false,
          complete: () => this.addExpenseLoader = false,
        });
    });
  }

  /**
   * Helper function to generate the full name and image URL from a user or member's data.
   *
   * This function constructs the full name by concatenating the first name and last name (if present).
   * It also extracts the image URL.
   *
   * @param user - The user object (`CurrentUser`).
   * @returns An object containing the `fullName` and the `imageUrl` from the user object.
   */
  getFullNameAndImage(user: CurrentUser | GroupMemberData | undefined) {
    return {
      fullName: `${user?.first_name} ${ user?.last_name ?? ""}`.trim(),
      imageUrl: user?.image_url,
    };
  }

  filterMembers(members: GroupMemberData[]) {
    const filteredMembers = members.map((member) => {
      if (member.member_id === this.user?.user_id) {
        member.first_name = "You";
        member.last_name = "";
      }
      switch (member.role) {
        case "ADMIN":
          return { ...member, role: "Admin" };
        case "COADMIN":
          return { ...member, role: "Co-Admin" };
        case "CREATOR":
          return { ...member, role: "Creator" };
        case "USER":
          return { ...member, role: "Member" };
        default:
          return member;
      }
    });
    return filteredMembers;
  }

  onBlockGroup() {
    if (this.currentMember!.total_balance && parseFloat(this.currentMember!.total_balance) !== 0) {
      this.toastr.warning("You have outstanding balance in this group. Please settle it before leaving.", "Warning");
      return;
    }
    const newBlockStatus = !this.currentMember!.has_blocked;
    const confirmationDialogRef = this.dialog.open(
      ConfirmationDialogComponent,
      {
        data: `Are you sure you want to ${newBlockStatus ? "block" : "unblock"} this group?`,
      },
    );

    confirmationDialogRef.afterClosed().subscribe((result) => {
      // If user confirms closing of Add Expense dialog box.
      if (result) {
        const updatedMember = {
          ...this.currentMember!,
          has_blocked: newBlockStatus,
        };
  
        // Update the signal with the new current member data
        this.groupsService.setCurrentMember(updatedMember);

        this.groupsService.blockGroup(
          this.selectedGroup!.group_id, newBlockStatus
        ).subscribe({
          next: () => {
            this.toastr.success(`Group ${newBlockStatus ? "Blocked" : "Unblocked"} Successfully`, "Success");
          }
        });
      }
    });
  }

  onLeaveGroup() {
    if (parseFloat(this.currentMember!.total_balance) !== 0) {
      this.toastr.warning("You have outstanding balance in this group. Please settle it before leaving.", "Warning");
      return;
    }
    const confirmationDialogRef = this.dialog.open(
      ConfirmationDialogComponent,
      {
        data: "Are you sure you want to leave this group?",
      },
    );

    confirmationDialogRef.afterClosed().subscribe((result) => {
      // If user confirms closing of Add Expense dialog box.
      if (result) {
        this.groupsService.leaveGroup(this.selectedGroup!.group_id).subscribe({
          next: () => {
            this.toastr.success("Group Left Successfully", "Success");
            const groupId = this.selectedGroup!.group_id;
            this.groupsListComponent.removeGroup(groupId);
            this.groupsService.setSelectedGroup(undefined);
          }
        });
      }
    });
  }
}
