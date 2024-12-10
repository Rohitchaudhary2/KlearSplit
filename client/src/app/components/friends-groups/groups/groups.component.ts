import { NgClass } from "@angular/common";
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, inject, OnDestroy, signal, ViewChild, viewChild }
  from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { ToastrService } from "ngx-toastr";

import { AuthService } from "../../auth/auth.service";
import { CurrentUser } from "../../shared/types.model";
import { FriendsListComponent } from "../friends/friends-list/friends-list.component";
import { MessageComponent } from "../friends/message/message.component";
import { SocketService } from "../friends/socket.service";
import { SelectMembersDialogComponent } from "./create-group/select-members-dialog/select-members-dialog.component";
import { GroupDetailsComponent } from "./group-details/group-details.component";
import { CombinedGroupExpense, CombinedGroupMessage, GroupData, GroupExpenseData, GroupMemberData, GroupMessageData } from "./groups.model";
import { GroupsService } from "./groups.service";
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
  @ViewChild(GroupsListComponent) groupsListComponent!: GroupsListComponent;
  // groupsListComponent = viewChild<GroupsListComponent>("groupsListComponent");
  private readonly cdr = inject(ChangeDetectorRef); // Change detector for manual view updates
  private readonly toastr = inject(ToastrService);
  private readonly authService = inject(AuthService);
  private readonly socketService = inject(SocketService);
  private readonly groupsService = inject(GroupsService);
  private readonly dialog = inject(MatDialog);

  // Current user data from authService
  user = this.authService.currentUser();
  user_name = this.getFullNameAndImage(this.user).fullName;

  selectedGroup = signal<GroupData | undefined>(undefined);
  currentUserMembershipInfo = signal<GroupMemberData | undefined>(undefined);
  groupMembers = signal<GroupMemberData[] | []>([]);

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

    this.fetchGroupMembers();
    
    //Fetch messages
    this.fetchGroupMessages();
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
    this.groupsService.saveGroupMessages(this.messageInput, this.selectedGroup()!.group_id).subscribe();
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
    this.dialog.open(GroupDetailsComponent, {
      maxWidth: "80vw",
      maxHeight: "70vh",
      height: "85%",
      width: "100%",
      data: this.selectedGroup(),
    });
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
      this.groupsService.addGroupMembers(cleanedMembersData, this.selectedGroup()!.group_id).subscribe({
        next: () => {
          this.fetchGroupMembers();
          this.toastr.success("Member Added Successfully", "Success");
        }
      });
    });
  }

  /**
   * Fetches the messages of a particular group.
   */
  fetchGroupMessages() {
    this.groupsService.fetchGroupMessages(this.selectedGroup()!.group_id).subscribe({
      next: (messages) => {
        this.messages.set([ ...messages, ...this.messages() ]); // Set the messages in the messages signal
      }
    });
  }

  /**
   * This function calls the service to fetch the group details containing all the members.
   * The response contains the balance of the current user with each member and the total balance of that member.
   *
   * This function also maps over the result to update the roles so that they can be displayed properly.
   */
  fetchGroupMembers() {
    this.groupsService
      .fetchGroupMembers(this.selectedGroup()!.group_id)
      .subscribe((response) => {
        const filteredMembers = this.filterMembers(response.data);
        this.groupMembers.set(filteredMembers);
        this.currentUserMembershipInfo.set(this.groupMembers().find((member) => member.member_id === this.user?.user_id));
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

  filterMembers(members: GroupMemberData[]) {
    const filteredMembers = members.map((member) => {
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
    this.groupsService.blockGroup(this.selectedGroup()!.group_id, !this.currentUserMembershipInfo()!.has_blocked).subscribe({
      next: () => {
        this.toastr.success("Group Blocked Successfully", "Success");
        const groupId = this.selectedGroup()!.group_id;
        this.groupsListComponent.removeGroup(groupId);
        this.selectedGroup.set(undefined);
      }
    });
  }

  onLeaveGroup() {
    this.groupsService.leaveGroup(this.selectedGroup()!.group_id).subscribe({
      next: () => {
        this.toastr.success("Group Left Successfully", "Success");
        const groupId = this.selectedGroup()!.group_id;
        this.groupsListComponent.removeGroup(groupId);
        this.selectedGroup.set(undefined);
      }
    });
  }
}
