import { CurrencyPipe, NgClass } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";

import { FriendData } from "../../friends/friend.model";
import { GroupData } from "../../groups/groups.model";

interface AcceptedRejected {
  status: string;
  id: string;
}

@Component({
  selector: "app-list-display",
  standalone: true,
  imports: [
    FormsModule,
    CurrencyPipe,
    MatIconModule,
    MatTooltipModule,
    NgClass,
  ],
  templateUrl: "./list-display.component.html",
  styleUrls: [ "./list-display.component.css", "../../friends/friends.component.css" ],
})
export class ListDisplayComponent {
  heading = input("");
  items = input.required<(FriendData | GroupData)[]>();
  acceptReject = output<AcceptedRejected>();
  selectedFriend = output<FriendData>();
  selectedGroup = output<GroupData>();

  selectedItem?: FriendData | GroupData; // Of type T or undefined.

  onSelect(item: FriendData | GroupData): void {
    this.selectedItem = item;
    if (this.isFriendData(item)) {
      this.selectedFriend.emit(item);
    } else {
      this.selectedGroup.emit(item);
    }
  }

  onAcceptReject(item: FriendData | GroupData, status: string): void {
    if(this.isFriendData(item)) {
      return this.acceptReject.emit({ id: item.conversation_id, status });
    }
    return this.acceptReject.emit({ id: item.group_id, status });
  }

  isFriendData(
    item: FriendData | GroupData,
  ): item is FriendData {
    return (item as FriendData).friend !== undefined;
  }


  getItemDetails(item: FriendData | GroupData) {
    if(this.isFriendData(item)) {
      return {
        name: `${item.friend.first_name} ${item.friend.last_name || ""}`.trim(),
        profile: `${item.friend.image_url || "/profile.png"}`,
      };
    }
    return {
      name: item.group_name,
      profile: `${item.image_url || "/group-profile.png"}`,
    };
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
}
