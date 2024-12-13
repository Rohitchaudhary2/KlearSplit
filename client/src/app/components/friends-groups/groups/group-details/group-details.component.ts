import { CommonModule, CurrencyPipe } from "@angular/common";
import { Component, inject, OnInit, signal } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

import { AuthService } from "../../../auth/auth.service";
import { GroupMemberData } from "../groups.model";

@Component({
  selector: "app-group-details",
  standalone: true,
  imports: [ CommonModule, CurrencyPipe ],
  templateUrl: "./group-details.component.html",
  styleUrl: "./group-details.component.css",
})
export class GroupDetailsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly dialogRef = inject(MatDialogRef<GroupDetailsComponent>);
  data = inject(MAT_DIALOG_DATA);

  groupMembers = signal<GroupMemberData[]>([]);
  currentUserId = this.authService.currentUser()?.user_id;

  ngOnInit(): void {
    this.data[0].role = this.data[0].role !== "USER" ? `${this.data[0].role[0]}${this.data[0].role.slice(1).toLowerCase()}` : "Member";
    this.fetchGroupMembers();
  }

  /**
   * This function sets the value of the Group Members array passed from it's parent element in the groupMembers signal.
   */
  fetchGroupMembers() {
    this.groupMembers.set(this.data[1]);
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

  closeDialog() {
    this.dialogRef.close();
  }
}
