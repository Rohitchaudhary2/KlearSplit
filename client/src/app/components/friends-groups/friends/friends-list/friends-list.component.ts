import { CurrencyPipe, NgClass } from "@angular/common";
import { HttpParams } from "@angular/common/http";
import {
  Component,
  inject,
  input,
  OnInit,
  output,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ToastrService } from "ngx-toastr";

import { ConfirmationDialogComponent } from "../../../confirmation-dialog/confirmation-dialog.component";
import { SearchBarComponent } from "../../shared/search-bar/search-bar.component";
import { AddFriendComponent } from "../add-friend/add-friend.component";
import { FriendData } from "../friend.model";
import { FriendsService } from "../friends.service";

@Component({
  selector: "app-friends-list",
  standalone: true,
  imports: [
    FormsModule,
    CurrencyPipe,
    MatIconModule,
    MatTooltipModule,
    NgClass,
    SearchBarComponent,
  ],
  templateUrl: "./friends-list.component.html",
  styleUrl: "../friends.component.css",
})
export class FriendsListComponent implements OnInit {
  // Injecting necessary services and tools to handle dialog, toastr notifications, and fetching data from the friends service.
  private readonly dialog = inject(MatDialog);
  private readonly toastr = inject(ToastrService);
  private readonly friendsService = inject(FriendsService);

  // Signal to store the search term, used for searching friends
  searchTerm = signal("");

  // Signals to store and manage the current list of friend requests
  // Two signals are made for implementing search functionality.
  private friendRequests = signal<FriendData[]>([]);
  requests = signal(this.friendRequests());

  // Signals for managing the friend list (accepted friends)
  private friends = signal<FriendData[]>([]);
  friendList = signal(this.friends());

  selectedUser = output<FriendData | undefined>();
  selectedFriend = signal<FriendData | undefined>(undefined);

  balanceAmount = input<string>();

  // Fetch the list of pending friend requests
  fetchFriendRequests() {
    const params = new HttpParams().set("status", "PENDING");
    // API call to back-end to get pending friend requests
    this.friendsService.getFriends(params).subscribe({
      next: (response) => {
        this.friendRequests.set(response.data);
        this.requests.set(this.friendRequests());
      },
    });
  }

  ngOnInit() {
    // Call to fetchFriendRequests method to get pending requests on component initialization
    this.fetchFriendRequests();

    // API call to back-end to get friends with status 'ACCEPTED'
    const params = new HttpParams().set("status", "ACCEPTED");
    this.friendsService.getFriends(params).subscribe({
      next: (response) => {
        this.friends.set(response.data);
        this.friendList.set(this.friends());
      },
    });
  }

  /**
   * Converts a string representation of a balance amount to a number.
   *
   * @param {string} balanceAmount - The balance amount in string format.
   * @returns {number} The parsed number representing the balance amount.
   */
  getBalanceAsNumber(balanceAmount: string): number {
    return parseFloat(balanceAmount);
  }

  /**
   * Filters the list of friend requests and friends based on the current search term.
   * The search is case-insensitive and matches against the friend's email.
   *
   * @returns {void} This method doesn't return any value but updates the `requests` and `friendList` signals with the filtered results.
   */
  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    const regex = new RegExp(this.searchTerm(), "i"); // Case-insensitive search
    this.requests.set(
      this.friendRequests().filter((user) => regex.test(user.friend.email)),
    );
    this.friendList.set(
      this.friends().filter((user) => regex.test(user.friend.email)),
    );
  }

  /**
   * Opens a dialog to allow the user to add a friend. Upon closing the dialog,
   * if a result is provided, a friend request is sent via the `FriendsService`.
   * A success toast is shown after the request is sent.
   *
   * @returns {void} This method doesn't return any value but updates the UI after the dialog is closed.
   */
  onAddFriendClick(): void {
    const dialogRef = this.dialog.open(AddFriendComponent, {
      width: "500px",
      data: [ "Add Friend for Easier Bill Splitting" ],
      enterAnimationDuration: "500ms",
      exitAnimationDuration: "500ms",
    });

    // After the dialog is closed, if a result is returned (i.e., the user added a friend)
    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      // Call the addFriend method in the FriendsService to send a friend request
      this.friendsService.addFriend(result).subscribe({
        next: () => {
          this.toastr.success("Request Sent Successfully", "Success", {
            timeOut: 3000,
          });
          this.fetchFriendRequests();
        },
      });
    });
  }

  /**
   * Accepts or rejects a friend request based on the given status.
   * Updates the UI by moving the accepted request to the friend list and removing it from the pending requests.
   *
   * @param {string} conversationId - The ID of the conversation associated with the friend request.
   * @param {string} status - The status of the request, either "ACCEPTED" or "REJECTED".
   * @returns {void} This method doesn't return any value but updates the `requests` and `friendList` signals.
   */
  onAcceptReject(conversationId: string, status: string): void {
    this.friendsService.acceptRejectRequest(conversationId, status).subscribe({
      next: () => {
        this.toastr.success(`Request ${status} Successfully`, "Success", {
          timeOut: 3000,
        });
        if (status === "ACCEPTED") {
          // Add the accepted request to the friend list
          this.friends().unshift({
            ...this.friendRequests().find(
              (request) => request.conversation_id === conversationId
            )!
          });
        }
        // Remove the processed request from the pending requests list
        this.friendRequests.set(
          this.friendRequests().filter(
            (request) => request.conversation_id !== conversationId,
          ),
        );
        // Changing the requests and friendList for UI display
        this.onSearchChange(this.searchTerm());
      },
    });
  }

  /**
   * Handles the withdrawal of a friend request.
   * Opens a confirmation dialog and, if confirmed, withdraws the friend request
   * and updates the friend requests list and UI.
   *
   * @param {string} conversationId - The ID of the conversation associated with the friend request to withdraw.
   * @returns {void} This method doesn't return any value but updates the UI and triggers side effects.
   */
  onWithdrawRequest(conversationId: string): void {
    // Opens a confirmation dialog asking the user if they are sure they want to withdraw the request
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: "Are you sure you want to withdraw this request?",
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      // API call to back-end to withdraw the friend request
      this.friendsService.withdrawRequest(conversationId).subscribe({
        next: () => {
          // If the current selected friend is the one being withdrawn, clear the selection
          if (this.selectedFriend()?.conversation_id === conversationId) {
            this.onSelectUser(undefined);
          }
          this.toastr.success("Request deleted Successfully", "Success", {
            timeOut: 3000,
          });
          // Update the friend requests list by removing the withdrawn request from the array
          this.friendRequests.set(
            this.friendRequests().filter(
              (request) => request.conversation_id !== conversationId,
            ),
          );
          this.onSearchChange(this.searchTerm());
        },
      });
    });
  }

  /**
   * Sets the selected friend and emits the selected user.
   * This method updates the selected friend signal and notifies listeners
   * about the selected user by emitting an event.
   *
   * @param {FriendData | undefined} friend - The friend object to select or `undefined` to clear the selection.
   * @returns {void} This method doesn't return any value but updates state and emits an event.
   */
  onSelectUser(friend: FriendData | undefined): void {
    this.selectedFriend.set(friend);
    this.selectedUser.emit(friend);
  }
}
