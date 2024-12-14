import { CurrencyPipe } from "@angular/common";
import { Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";

import { AuthService } from "../../../auth/auth.service";
import { AbsoluteValuePipe } from "../../../shared/pipes/absolute-value.pipe";
import { GroupsService } from "../groups.service";
import { GroupsListComponent } from "../groups-list/groups-list.component";

@Component({
  selector: "app-groups-details",
  standalone: true,
  imports: [
    CurrencyPipe,
    AbsoluteValuePipe,
    GroupsListComponent,
    MatButtonModule
  ],
  templateUrl: "./groups-details.component.html",
  styleUrls: [ "./groups-details.component.css", "../../friends/friends.component.css" ]
})
export class GroupsDetailsComponent {
  private readonly authService = inject(AuthService);

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
  getBalanceAsNumber(balanceAmount: string | undefined): number {
    if (!balanceAmount) {
      return 0;
    }
    return parseFloat(balanceAmount);
  }
}
