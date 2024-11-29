import { CurrencyPipe, NgClass } from "@angular/common";
import { Component, inject, OnInit, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ToastrService } from "ngx-toastr";

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
  ],
  templateUrl: "./groups-list.component.html",
  styleUrl: "./groups-list.component.css"
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
        }
      });
    });
  }

  // This function is triggered when a group is selected and emits out an output signal to the parent component to set which group is selected
  onSelectGroup(group: GroupData | undefined): void {
    this.currentGroup.set(group);
    this.selectedGroup.emit(group);
  }
}
