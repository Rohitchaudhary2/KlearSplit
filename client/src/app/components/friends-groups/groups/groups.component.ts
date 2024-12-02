import { NgClass } from "@angular/common";
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, inject, OnDestroy, signal, viewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";

import { AuthService } from "../../auth/auth.service";
import { CurrentUser } from "../../shared/types.model";
import { FriendsListComponent } from "../friends/friends-list/friends-list.component";
import { MessageComponent } from "../friends/message/message.component";
import { SocketService } from "../friends/socket.service";
import { GroupDetailsComponent } from "./group-details/group-details.component";
import { CombinedGroupExpense, CombinedGroupMessage, GroupData, GroupExpenseData, GroupMessageData } from "./groups.model";
import { GroupsListComponent } from "./groups-list/groups-list.component";

@Component({
  selector: "app-groups",
  standalone: true,
  imports: [
    FormsModule,
    NgClass,
    FriendsListComponent,
    GroupsListComponent,
    MessageComponent
  ],
  templateUrl: "./groups.component.html",
  styleUrls: [ "./groups.component.css", "../friends/friends.component.css" ]
})
export class GroupsComponent implements AfterViewInit, OnDestroy {
  // Reference to the message container element, accessed via ViewChild
  messageContainer = viewChild<ElementRef>("messageContainer");
  private readonly cdr = inject(ChangeDetectorRef); // Change detector for manual view updates
  private readonly authService = inject(AuthService);
  private readonly socketService = inject(SocketService);
  private dialog = inject(MatDialog);

  // Current user data from authService
  user = this.authService.currentUser();
  user_name = this.getFullNameAndImage(this.user).fullName;

  selectedGroup = signal<GroupData | undefined>(undefined);

  // Signal to control the visibility of message, expenses, or combined data
  currentView = signal<"Messages" | "Expenses" | "All">("All");

  messageInput = "";

  messages = signal<GroupMessageData[]>([]);
  expenses = signal<GroupExpenseData[] | []>([]);
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
  pageSize = 10;
  pageCombined = 1;

  // Flag to indicate if data is still being loaded
  loading = false;

  // Flags to track if all data (messages, expenses, combined) has been loaded
  allMessagesLoaded = false;
  allExpensesLoaded = false;
  allCombinedLoaded = false;

  // Scroll position state
  scrollPosition = 0;

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
    if (this.selectedGroup()) {
      this.socketService.leaveRoom(this.selectedGroup()!.group_id);
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
      // this.loadItems(element);
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

  clearSelectedGroupData() {
    // If there is, send a message to the server to leave the group
    this.socketService.leaveRoom(this.selectedGroup()!.group_id);
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
    if (this.selectedGroup()) {
      this.clearSelectedGroupData();
    }

    // Set the selected group as the new selected group
    this.selectedGroup.set(group);

    // If no group is selected, then return
    if (!this.selectedGroup()) {
      return;
    }

    // Join the new conversation room for the selected group
    this.socketService.joinRoom(this.selectedGroup()!.group_id);

    // Listen for new messages from the server for the new room
    this.socketService.onNewGroupMessage((message: GroupMessageData) => {
      this.messages.set([ ...this.messages(), message ]);
      this.combinedView.set([
        ...this.combinedView(),
        { ...message, type: "message" },
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
      group_id: this.selectedGroup()!.group_id,
      sender_id: this.user!.user_id,
      message: this.messageInput,
    };
    this.socketService.sendGroupMessage(messageData);
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

  openGroupDetails() {
    this.dialog.open(GroupDetailsComponent, {
      width: "500px",
      data: this.selectedGroup(),
    });
  }

  /**
   * Helper function to generate the full name and image URL from a user or friend's data.
   *
   * This function constructs the full name by concatenating the first name and last name (if present).
   * It also extracts the image URL.
   *
   * @param user - The user object (`CurrentUser`).
   * @returns An object containing the `fullName` and the `imageUrl` from the user object.
   */
  getFullNameAndImage(user: CurrentUser | undefined) {
    return {
      fullName: `${user?.first_name} ${ user?.last_name ?? ""}`.trim(),
      imageUrl: user?.image_url,
    };
  }
}
