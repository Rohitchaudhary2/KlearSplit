import { CurrencyPipe } from "@angular/common";
import { Component, inject } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";

import { AuthService } from "../../../auth/auth.service";
import { AbsoluteValuePipe } from "../../../shared/pipes/absolute-value.pipe";
import { GroupsService } from "../groups.service";

@Component({
  selector: "app-group-details",
  standalone: true,
  imports: [ CurrencyPipe, AbsoluteValuePipe ],
  templateUrl: "./group-details.component.html",
  styleUrl: "./group-details.component.css",
})
export class GroupDetailsComponent {
  private readonly authService = inject(AuthService);
  private readonly dialogRef = inject(MatDialogRef<GroupDetailsComponent>);

  private readonly groupsService = inject(GroupsService);

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

  currentUserId = this.authService.currentUser()?.user_id;

  /**
   * Converts a string representation of a balance amount to a number.
   *
   * @param {string} balanceAmount - The balance amount in string format.
   * @returns {number} The parsed number representing the balance amount.
   */
  getBalanceAsNumber(balanceAmount: string): number {
    return parseFloat(balanceAmount);
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
