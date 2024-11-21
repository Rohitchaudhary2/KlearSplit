import { NgClass } from "@angular/common";
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  signal,
  viewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DialogPosition, MatDialog } from "@angular/material/dialog";
import { ToastrService } from "ngx-toastr";

import { AuthService } from "../auth/auth.service";
import { ExpenseComponent } from "../friends/expense/expense.component";
import { AddedFriend, CombinedExpense, CombinedMessage, ExpenseData, ExpenseDeletedEvent, ExpenseResponse, FriendData, MessageData }
  from "../friends/friend.model";
import { FriendsService } from "../friends/friends.service";
import { FriendsExpenseComponent } from "../friends/friends-expense/friends-expense.component";
import { SettlementComponent } from "../friends/friends-expense/settlement/settlement.component";
import { ViewExpensesComponent } from "../friends/friends-expense/view-expenses/view-expenses.component";
import { FriendsListComponent } from "../friends/friends-list/friends-list.component";
import { MessageComponent } from "../friends/message/message.component";
import { SocketService } from "../friends/socket.service";
import { CurrentUser } from "../shared/types.model";


@Component({
  selector: "app-friends",
  standalone: true,
  imports: [
    FormsModule,
    FriendsListComponent,
    NgClass,
    MessageComponent,
    ExpenseComponent,
  ],
  templateUrl: "./friends.component.html",
  styleUrl: "./friends.component.css",
})
export class FriendsComponent implements OnDestroy, AfterViewInit {
  // Reference to the message container element, accessed via ViewChild
  messageContainer = viewChild<ElementRef>("messageContainer");
  private cdr = inject(ChangeDetectorRef); // Change detector for manual view updates
  // Injecting services needed by the component
  private toastr = inject(ToastrService);
  private friendsService = inject(FriendsService);
  private authService = inject(AuthService);
  private socketService = inject(SocketService);
  private dialog = inject(MatDialog);

  // Current user data from authService
  user = this.authService.currentUser();
  user_name = this.getFullNameAndImage(this.user).fullName;

  // Signal to hold the selected user/friend data
  selectedUser = signal<FriendData | undefined>(undefined);
  messageInput = "";

  // Signal to control the visibility of message, expenses, or combined data
  currentView = signal<"Messages" | "Expenses" | "All">("All");

  messages = signal<MessageData[]>([]);
  expenses = signal<ExpenseData[] | []>([]);
  // Signal to hold combined view data (messages and expenses)
  combinedView = signal<(CombinedMessage | CombinedExpense)[]>([]);

  // Character count and Flag to check if character count exceeded for the input field
  charCount = 0;
  charCountExceeded = false;

  // Flag to track if welcome image is loaded
  isImageLoaded = false;

  // Pagination related variables for message and expense loading
  pageMessage = 1;
  pageSizeMessage = 10;
  pageExpense = 1;
  pageSizeExpense = 10;
  pageCombined = 1;
  pageSizeCombined = 20;

  // Flag to indicate if data is still being loaded
  loading = false;

  // Flags to track if all data (messages, expenses, combined) has been loaded
  allMessagesLoaded = false;
  allExpensesLoaded = false;
  allCombinedLoaded = false;

  // Scroll position state
  scrollPosition = 0;
  // Error number for making expense id unique for expenses that encountered an error during addition
  errorNumber = 0;

  addExpenseLoader = false;

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
    if (this.selectedUser()) {
      this.socketService.leaveRoom(this.selectedUser()!.conversation_id);
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
   * Method to handle image loading.
   * This sets the `isImageLoaded` flag to true when the image has been loaded.
   */
  onImageLoad() {
    this.isImageLoaded = true;
  }

  onSelectUser(friend: FriendData | undefined) {
    // Check if there is a previously selected user
    if (this.selectedUser()) {
      // Leave the previous room to ensure no duplicate connections
      this.socketService.leaveRoom(this.selectedUser()!.conversation_id);
      // Remove the existing 'onNewMessage' listener for the previous user
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

    // Set the selected user (friend) as the new selected user (friend)
    this.selectedUser.set(friend);

    // If no user is selected, then return
    if (!this.selectedUser()) {
      return;
    }
    // Fetch messages, expenses, and combined data (messages + expenses) for the selected user(friend)
    this.fetchMessagesAndExpenses(true, true, true, null);
    // Join the new conversation room for the selected user
    this.socketService.joinRoom(this.selectedUser()!.conversation_id);

    // Listen for new messages from the server for the new room
    this.socketService.onNewMessage((message: MessageData) => {
      this.messages.set([ ...this.messages(), message ]);
      this.combinedView.set([
        ...this.combinedView(),
        { ...message, type: "message" },
      ]);
      this.cdr.detectChanges();
      this.scrollToBottom();
    });
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

  checkAndSetLoaded(loadedKey: "allMessagesLoaded" | "allExpensesLoaded" |"allCombinedLoaded", loadCondition: boolean,
    items: (ExpenseData | MessageData | CombinedExpense | CombinedMessage)[], pageSize: number) {
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
    this.friendsService
      .fetchMessagesAndExpenses(
        this.selectedUser()!.conversation_id,
        loadMessages,
        loadExpenses,
        this.pageMessage,
        this.pageSizeMessage,
        this.pageExpense,
        this.pageSizeExpense,
        this.pageCombined,
        this.pageSizeCombined,
      )
      .subscribe({
        next: ({ messages, expenses, combined }) => {
          // Check if all data has already been loaded for the current view and set the flag accordingly
          this.checkAndSetLoaded("allMessagesLoaded", loadMessages, messages, this.pageSizeMessage);
          this.checkAndSetLoaded("allExpensesLoaded", loadExpenses, expenses, this.pageSizeExpense);
          this.checkAndSetLoaded("allCombinedLoaded", loadCombined, combined, this.pageSizeCombined);

          this.messages.set([ ...messages, ...this.messages() ]);
          this.expenses.set([ ...expenses, ...this.expenses() ]);
          this.combinedView.set([ ...combined, ...this.combinedView() ]);

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
            const scrollDiff = newScrollHeight! - this.scrollPosition;
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
   * Type guard to check if an item is of type CombinedExpense.
   *
   * @param item - The item to check. Can be either a CombinedMessage or a CombinedExpense.
   * @returns True if the item is a CombinedExpense, false otherwise.
   */
  isCombinedExpense(
    item: CombinedMessage | CombinedExpense,
  ): item is CombinedExpense {
    return (item as CombinedExpense).payer_id !== undefined;
  }

  /**
   * Determines the "settle up" status based on the selected user's balance.
   * If the balance is 0, it returns 'All Settled'. Otherwise, it returns 'Settle up'.
   *
   * @returns A string representing the current settle up status ('All Settled' or 'Settle up').
   */
  getSettleUpStatus() {
    if (parseFloat(this.selectedUser()!.balance_amount) === 0) {
      return "All Settled";
    }
    return "Settle up";
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
      conversation_id: this.selectedUser()!.conversation_id,
      sender_id: this.user!.user_id,
      message: this.messageInput,
    };
    this.socketService.sendMessage(messageData);
    this.messageInput = "";
  }

  /**
   * Opens a dialog to view expenses for the selected conversation.
   *
   * @returns void
   * Opens the `ViewExpensesComponent` dialog, passing the the current user, and the selected user(friend).
   * Subscribes to `expenseDeleted` and `updatedExpense` events from the dialog, and handles the respective updates.
   */
  viewExpense() {
    const dialogPosition: DialogPosition = {
      top: "5%",
    };
    const dialogRef = this.dialog.open(ViewExpensesComponent, {
      data: [ this.user, this.selectedUser() ],
      maxWidth: "91vw",
      maxHeight: "85vh",
      height: "85%",
      width: "100%",
      position: dialogPosition,
      enterAnimationDuration: "200ms",
      exitAnimationDuration: "200ms",
    });
    dialogRef.componentInstance.expenseDeleted.subscribe(
      ({ id, payerId, debtorAmount }) => {
        this.onDeleteExpense({ id, payerId, debtorAmount });
      },
    );
    dialogRef.componentInstance.updatedExpense.subscribe(
      ({ expenses, updatedExpense }) => {
        this.onUpdateExpense(expenses, updatedExpense);
      },
    );
    dialogRef.afterClosed().subscribe();
  }

  /**
   * Handles the deletion of an expense.
   * Updates the balance of conversation, and removes the expense from both the expenses list and the combined view.
   *
   * @param {ExpenseDeletedEvent} expense - The event data containing the expense details.
   * @param {string} expense.id - The ID of the expense being deleted.
   * @param {string} expense.payer_id - The ID of the user who paid the expense.
   * @param {number} expense.debtor_amount - The amount that the debtor owe.
   *
   * @returns void
   * Updates the balance for the conversation and removes the expense from the list and combined view.
   */
  onDeleteExpense({ id, payerId, debtorAmount }: ExpenseDeletedEvent) {
    const balanceAmount = parseFloat(this.selectedUser()!.balance_amount);
    const debtAmount = parseFloat(debtorAmount);
    this.selectedUser()!.balance_amount =
      this.user?.user_id === payerId
        ? JSON.stringify(balanceAmount - debtAmount)
        : JSON.stringify(balanceAmount + debtAmount);
    const updatedExpenses = this.expenses().filter(
      (expense: ExpenseData) => expense.friend_expense_id !== id,
    );
    this.expenses.set(updatedExpenses);
    const updatedCombinedView = this.combinedView().filter(
      (item: CombinedMessage | CombinedExpense) => {
        if (this.isCombinedExpense(item)) {
          return item.friend_expense_id !== id;
        }
        return true;
      },
    );
    this.combinedView.set(updatedCombinedView);
  }

  /**
   * Updates an existing expense in the expenses list and adjusts the balance of the selected user.
   * This method updates both the `expenses` list and `combinedView` list, adjusting the balance of the selected user based on the updated expense.
   *
   * @param {ExpenseData[]} expenses - The list of all current expenses (after update).
   * @param {ExpenseData} updatedExpense - The updated expense data.
   *
   * @returns void
   * This method doesn't return any value but modifies the expenses and combinedView state.
   * Updates the selected user's balance.
   */
  onUpdateExpense(expenses: ExpenseData[], updatedExpense: ExpenseData) {
    const previousExpense = this.expenses().find((expense) => {
      return expense.friend_expense_id === updatedExpense.friend_expense_id;
    })!;

    // Create a copy of the expenses list and sort by creation date
    const totalExpenses = expenses.slice();
    totalExpenses.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));

    this.allExpensesLoaded = true;
    this.expenses.set(totalExpenses);

    // Update balance for previous expense
    this.selectedUser()!.balance_amount = this.updateBalance(
      this.selectedUser()!.balance_amount,
      parseFloat(previousExpense.debtor_amount),
      previousExpense.payer_id !== this.user?.user_id,
    );

    // Update balance for updated expense
    this.selectedUser()!.balance_amount = this.updateBalance(
      this.selectedUser()!.balance_amount,
      parseFloat(updatedExpense.debtor_amount),
      updatedExpense.payer_id === this.user?.user_id,
    );

    const updatedCombinedView = this.combinedView().map(
      (item: CombinedMessage | CombinedExpense) => {
        if (this.isCombinedExpense(item)) {
          return item.friend_expense_id === updatedExpense.friend_expense_id
            ? { ...updatedExpense, type: "expense" }
            : item;
        } else {
          return item;
        }
      },
    );
    this.combinedView.set(updatedCombinedView);
  }

  /**
   * Updates the user's balance by either adding or subtracting the given amount.
   *
   * @param userBalance - The current balance of the user (as a string).
   * @param amount - The amount to be added or subtracted from the balance.
   * @param isAddition - A boolean flag indicating whether the amount should be added (true) or subtracted (false).
   *
   * @returns A string representing the updated balance after performing the addition or subtraction.
   */
  private updateBalance(
    userBalance: string,
    amount: number,
    isAddition: boolean,
  ): string {
    return JSON.stringify(
      parseFloat(userBalance) + (isAddition ? amount : -amount),
    );
  }

  /**
   * Handles the settlement process between the current user and the selected user.
   * If there is a balance amount to be settled, this function opens a dialog for the user to add the settlement.
   * After confirmation, the settlement is processed by adding an settlement entry and updating the balances.
   */
  settlement() {
    // Check if balance is already settled up
    if (parseFloat(this.selectedUser()!.balance_amount) === 0) {
      return;
    }
    const totalAmount = Math.abs(
      parseFloat(this.selectedUser()!.balance_amount),
    );

    // Determine whether the user is the payer
    const isUserPayer = parseFloat(this.selectedUser()!.balance_amount) > 0;

    // Assign payer and debtor details using destructuring
    const { fullName: payerName, imageUrl: payerImage } = isUserPayer
      ? this.getFullNameAndImage(this.user) // User is the payer
      : this.getFullNameAndImage(this.selectedUser()?.friend); // Friend is the payer

    const { fullName: debtorName, imageUrl: debtorImage } = isUserPayer
      ? this.getFullNameAndImage(this.selectedUser()?.friend) // Friend is the debtor
      : this.getFullNameAndImage(this.user); // User is the debtor

    // Open a dialog for the user for the settlement
    const dialogRef = this.dialog.open(SettlementComponent, {
      data: {
        payerName,
        debtorName,
        totalAmount,
        debtorImage,
        payerImage,
      },
      enterAnimationDuration: "200ms",
      exitAnimationDuration: "200ms",
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      this.friendsService
        .addExpense(this.selectedUser()!.conversation_id, result)
        .subscribe({
          next: (response: ExpenseResponse) => {
            if (response.data.payer_id === this.user?.user_id) {
              response.data.payer = this.user_name;
            } else {
              response.data.payer = this.getFullNameAndImage(
                this.selectedUser()?.friend,
              ).fullName;
            }
            this.expenses.set([ ...this.expenses(), response.data ]);
            const combinedData = [
              ...this.combinedView(),
              { ...response.data, type: "message" },
            ];
            this.combinedView.set(combinedData);
            this.cdr.detectChanges();
            this.scrollToBottom();
            this.selectedUser()!.balance_amount = this.updateBalance(
              this.selectedUser()!.balance_amount,
              parseFloat(response.data.debtor_amount),
              response.data.payer_id === this.user?.user_id,
            );
            this.toastr.success("Settled up successfully", "Success");
          },
        });
    });
  }

  /**
   * Helper function to generate the full name and image URL from a user or friend's data.
   *
   * This function constructs the full name by concatenating the first name and last name (if present).
   * It also extracts the image URL.
   *
   * @param user - The user or friend object (either `CurrentUser` or `AddedFriend`).
   * @returns An object containing the `fullName` and the `imageUrl` from the user object.
   */
  getFullNameAndImage(user: CurrentUser | AddedFriend | undefined) {
    return {
      fullName: `${user?.first_name}${user?.last_name ? ` ${user?.last_name}` : ""}`,
      imageUrl: user?.image_url,
    };
  }

  /**
   * Gets the label for the archive action based on the user's archival status.
   *
   * This function calls the `getStatusLabel` helper function to determine the appropriate label
   * for the archival status. The result can either be "Archive" or "Unarchive" depending on the user's archival status.
   *
   * @returns A string representing the appropriate label for the archive action, either "Archive" or "Unarchive".
   */
  getArchiveLabel(): string {
    return this.getStatusLabel("archival_status", "Archive", "Unarchive");
  }

  /**
   * Gets the label for the block action based on the user's block status.
   *
   * This function calls the `getStatusLabel` helper function to determine the appropriate label
   * for the block status. The result can either be "Block" or "Unblock" depending on the user's block status.
   *
   * @returns A string representing the appropriate label for the block action,
   *          either "Block" or "Unblock".
   */
  getBlockLabel(): string {
    return this.getStatusLabel("block_status", "Block", "Unblock");
  }

  /**
   * Helper function to return the appropriate label based on the user's status and given status field.
   *
   * This function checks a specific status field (either `archival_status` or `block_status`) and
   * determines whether the user should see the "default" label ("Archive", "Block") or the
   * "alternate" label ("Unarchive", "Unblock"). The decision is based on the user's current status
   * and the given status field value.
   *
   * @param statusField - The status field to check (either 'archival_status' or 'block_status').
   * @param defaultLabel - The label to return when the user is in the default state ("Archive" or "Block").
   * @param alternateLabel - The label to return when the user is in the alternate state ("Unarchive" or "Unblock").
   * @returns A string representing the appropriate label based on the current status.
   */
  private getStatusLabel(
    statusField: "archival_status" | "block_status",
    defaultLabel: string,
    alternateLabel: string,
  ): string {
    const user = this.selectedUser();

    // Check if the user meets any of the conditions for the alternate label ("Unarchive", "Unblock")
    if (
      user?.[statusField] === "BOTH" ||
      (user!.status === "SENDER" && user?.[statusField] === "FRIEND1") ||
      (user!.status === "RECEIVER" && user?.[statusField] === "FRIEND2")
    ) {
      return alternateLabel;
    }

    return defaultLabel;
  }

  /**
   * Handles the archive or block request for a conversation based on the provided `type`.
   *
   * This function sends a request to either archive or block a conversation using the `archiveBlockRequest` method from friends service.
   * Based on the success of the request, it will show a success notification and update the `block_status` of the selected user if the operation was a block.
   *
   * @param conversationId - The ID of the conversation to be archived or blocked.
   * @param type - The type of the action, either 'archived' or 'blocked'. Determines whether the conversation will be archived or blocked.
   */
  archiveBlock(conversationId: string, type: string) {
    this.friendsService.archiveBlockRequest(conversationId, type).subscribe({
      next: () => {
        if (type === "archived") {
          this.toastr.success(
            `${this.getArchiveLabel()}d Successfully`,
            "Success",
          );
        } else {
          this.toastr.success(
            `${this.getBlockLabel()}ed Successfully`,
            "Success",
          );
          const currentStatus = this.selectedUser()?.block_status;
          const isSender = this.selectedUser()?.status === "SENDER";
          if (this.getBlockLabel() === "Block") {
            if (currentStatus !== "NONE") {
              this.selectedUser()!.block_status = "BOTH";
            } else {
              this.selectedUser()!.block_status = isSender
                ? "FRIEND1"
                : "FRIEND2";
            }
          } else {
            if (currentStatus !== "BOTH") {
              this.selectedUser()!.block_status = "NONE";
            } else {
              this.selectedUser()!.block_status = isSender
                ? "FRIEND2"
                : "FRIEND1";
            }
          }
        }
      },
    });
  }

  /**
   * Opens the dialog to add an expense and handles the process of adding the expense.
   * After the dialog is closed, it sends the expense data to the server and updates the UI accordingly.
   */
  openAddExpenseDialog() {
    const dialogRef = this.dialog.open(FriendsExpenseComponent, {
      data: [ "Add Expense", this.user, this.selectedUser() ],
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

      this.addExpenseLoader = true;
      // Temporarily add the new expense to the local view with a unique friend_expense_id ('adding') to indicate that it's being processed.
      this.expenses.set([
        ...this.expenses(),
        { ...expenseData, friend_expense_id: "adding" },
      ]);
      this.combinedView.set([
        ...this.combinedView(),
        { ...expenseData, friend_expense_id: "adding" },
      ]);
      this.cdr.detectChanges();
      this.scrollToBottom();

      // Make the API call to add the expense on the server.
      this.friendsService
        .addExpense(this.selectedUser()!.conversation_id, result)
        .subscribe({
          next: (response: ExpenseResponse) => {
            if (response.data.payer_id === this.user?.user_id) {
              response.data.payer = this.user_name;
            } else {
              response.data.payer = this.getFullNameAndImage(
                this.selectedUser()?.friend,
              ).fullName;
            }

            // Update the expenses list by replacing the temporary 'adding' entry with the actual response data.
            const currExpenses = this.expenses();
            currExpenses.pop();
            this.expenses.set([ ...currExpenses, response.data ]);

            // Update the combined view by replacing the temporary 'adding' entry.
            const currCombined = this.combinedView();
            currCombined.pop();
            this.combinedView.set([
              ...currCombined,
              { ...response.data, type: "expense" },
            ]);
            this.addExpenseLoader = false;
            this.cdr.detectChanges();
            this.scrollToBottom();
            // Updating balance amount accordingly
            this.selectedUser()!.balance_amount = this.updateBalance(
              this.selectedUser()!.balance_amount,
              parseFloat(response.data.debtor_amount),
              response.data.payer_id === this.user?.user_id,
            );
            this.toastr.success("Expense Created successfully", "Success");
          },
          error: () => {
            // If the API call fails, mark the expense as 'error' in the local view, and provide Retry functionality.
            const currExpenses = this.expenses();
            currExpenses[currExpenses.length - 1].friend_expense_id =
              `error${this.errorNumber}`;
            this.expenses.set(currExpenses);
            const expense = [ ...this.combinedView() ]
              .reverse()
              .find((item) => this.isCombinedExpense(item))!;
            if (expense) {
              expense.friend_expense_id = `error${this.errorNumber}`;
            }
            this.errorNumber++;
            this.addExpenseLoader = false;
          },
        });
    });
  }

  /**
   * Retries adding an expense when the initial attempt failed.
   * Updates the expense and combined view to indicate the retry state.
   * Sends the expense data to the server and updates the views based on the response.
   *
   * @param id - The unique identifier of the expense to retry.
   */
  onRetryExpenseAddition(id: string) {
    this.addExpenseLoader = true;
    // Find the expense by its friend_expense_id
    const expense = this.expenses().find(
      (expenseData) => expenseData.friend_expense_id === id,
    )!;
    // Update the expense's friend_expense_id to indicate retry state
    expense.friend_expense_id = `retrying${this.errorNumber}`;
    const combinedExpense = this.combinedView().filter((expenseData) => {
      if (this.isCombinedExpense(expenseData)) {
        return expenseData.friend_expense_id === id;
      }
      return false;
    });
    const combined = combinedExpense[0] as CombinedExpense;
    combined.friend_expense_id = `retrying${this.errorNumber}`;
    this.cdr.detectChanges();
    const { "friend_expense_id": friendExpenseId, ...expenseData } = expense;
    const formData = Object.entries(expenseData).reduce(
      (newFormData, [ key, value ]) => {
        if (value) {
          newFormData.append(key, value);
        }
        return newFormData;
      },
      new FormData(),
    );

    // Make the API call to retry adding the expense on the server.
    this.friendsService
      .addExpense(this.selectedUser()!.conversation_id, formData)
      .subscribe({
        next: (response: ExpenseResponse) => {
          if (response.data.payer_id === this.user?.user_id) {
            response.data.payer = this.user_name;
          } else {
            response.data.payer = this.getFullNameAndImage(
              this.selectedUser()?.friend,
            ).fullName;
          }
          const updatedExpenses = this.expenses().map((expenseDetails) => {
            return expenseDetails.friend_expense_id === friendExpenseId
              ? response.data
              : expenseDetails;
          });
          this.expenses.set(updatedExpenses);
          const updatedCombinedView = this.combinedView().map((item) => {
            return this.isCombinedExpense(item) &&
              item.friend_expense_id === friendExpenseId
              ? { ...response.data, type: "expense" }
              : item;
          });
          this.combinedView.set(updatedCombinedView);
          this.addExpenseLoader = false;
          this.cdr.detectChanges();
          this.scrollToBottom();
          // Updating balance amount accordingly
          this.selectedUser()!.balance_amount = this.updateBalance(
            this.selectedUser()!.balance_amount,
            parseFloat(response.data.debtor_amount),
            response.data.payer_id === this.user?.user_id,
          );
          this.toastr.success("Expense Created successfully", "Success");
        },
        error: () => {
          // If error occurs, mark the expense and combined view as failed
          const updatedExpenses = this.expenses().map((expenseDetails) => {
            return expenseDetails.friend_expense_id === friendExpenseId
              ? { ...expenseDetails, friend_expense_id: `error${this.errorNumber}` }
              : expenseDetails;
          });
          this.expenses.set(updatedExpenses);
          const updatedCombinedView = this.combinedView().map((item) => {
            return this.isCombinedExpense(item) &&
              item.friend_expense_id === friendExpenseId
              ? { ...item, friend_expense_id: `error${this.errorNumber}` }
              : item;
          });
          this.combinedView.set(updatedCombinedView);
          this.errorNumber++;
          this.addExpenseLoader = false;
        },
      });
  }
}
