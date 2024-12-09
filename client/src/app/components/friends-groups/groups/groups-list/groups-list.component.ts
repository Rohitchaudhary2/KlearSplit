import { CurrencyPipe, NgClass } from "@angular/common";
import { Component, inject, input, OnInit, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ToastrService } from "ngx-toastr";

import { ListDisplayComponent } from "../../shared/pending-requests/list-display.component";
import { SearchBarComponent } from "../../shared/search-bar/search-bar.component";
import { CreateGroupComponent } from "../create-group/create-group.component";
import { GroupData } from "../groups.model";
import { GroupsService } from "../groups.service";

@Component({
  selector: "app-groups-list",
  standalone: true,
  imports: [
    FormsModule,
    CurrencyPipe,
    MatIconModule,
    MatTooltipModule,
    NgClass,
    SearchBarComponent,
    ListDisplayComponent
  ],
  templateUrl: "./groups-list.component.html",
  styleUrls: [ "./groups-list.component.css", "../../friends/friends.component.css" ]
})
export class GroupsListComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly groupService = inject(GroupsService);
  private readonly toastr = inject(ToastrService);

  selectedGroup = output<GroupData | undefined>();
  currentGroup = signal<GroupData | undefined>(undefined);
  
  searchTerm = signal("");

  // Signals to store and manage the current list of group invites
  // Two signals are made for implementing search functionality.
  private groupInvites = signal<GroupData[]>([]);
  invites = signal(this.groupInvites());

  // Signals to store and manage the current list of group invites
  // Two signals are made for implementing search functionality.
  private groups = signal<GroupData[]>([]);
  groupList = signal(this.groups());

  balanceAmount = input<string>();

  // Fetch the list of groups of the currentUser
  fetchGroups() {
    this.groupService.fetchGroups().subscribe({
      next: (groups) => {
        this.groupInvites.set(groups.data.invitedGroups);
        this.invites.set(this.groupInvites());
        this.groups.set(groups.data.acceptedGroups);
        this.groupList.set(this.groups());
      }
    });
  }

  ngOnInit(): void {
    // Call to fetchGroups method to get all the groups of the user on component initialization.
    this.fetchGroups();
  }

  // Searches from the existing group list
  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    const regex = new RegExp(this.searchTerm(), "i");
    this.invites.set(
      this.groupInvites().filter((group) => regex.test(group.group_name))
    );
    this.groupList.set(
      this.groups().filter((group) => regex.test(group.group_name))
    );
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

  // Opens the dialog box to create a new group.
  onCreateGroupClick(): void {
    const dialogRef = this.dialog.open(CreateGroupComponent, {
      width: "500px",
      enterAnimationDuration: "500ms",
      exitAnimationDuration: "500ms",
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      const groupData = result.formData;
      // Call the createGroup method in the GroupService to send a group invite to the selected users
      this.groupService.createGroup(groupData).subscribe({
        next: () => {
          this.toastr.success("Group created successfully", "Success");
          this.fetchGroups();
        }
      });
    });
  }

  /**
   * Accepts or rejects a group invite based on the given status.
   *
   * @param groupId The ID of the group associated with the invite.
   * @param status The status of the invite, either "ACCEPTED" or "REJECTED".
   */
  onAcceptReject(data: {status: string, id: string}): void {
    const { id: groupId, status } = data;
    this.groupService.acceptRejectInvite(groupId, status).subscribe({
      next: () => {
        this.toastr.success(`Invite ${status} Successfully`, "Success");
        if (status === "ACCEPTED") {
          // Add the accepted invite to the group list
          this.groups().unshift({
            ...this.groupInvites().find(
              (invite) => invite.group_id === groupId
            )!, status: "ACCEPTED"
          });
        }
        // Remove the processed invite from the group invite list
        this.groupInvites.set(
          this.groupInvites().filter(
            (invite) => invite.group_id !== groupId
          )
        );
        // Changing the invites and groupList for UI display
        this.onSearchChange(this.searchTerm());
      }
    });
  }

  /**
   * Sets the selected group and emits the selected group.
   * This method updates the current group signal and notifies listeners
   * about the selected group by emitting an event.
   *
   * @param group - The group object to select or `undefined` to clear the selection.
   */
  onSelectGroup(group: GroupData | undefined): void {
    this.currentGroup.set(group);
    this.selectedGroup.emit(group);
  }

  removeGroup(groupId: string): void {
    this.groups.set(this.groups().filter((group) => group.group_id !== groupId));
    this.groupList.set(this.groups()); // Update filtered list for UI
    this.groupInvites.set(this.groupInvites().filter((group) => group.group_id !== groupId));
    this.invites.set(this.groupInvites()); // Update filtered list for UI
  }
}
