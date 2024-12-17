import { ElementRef, Injectable } from "@angular/core";

import { CurrentUser } from "../../shared/types.model";
import { AddedFriend } from "../friends/friend.model";
import { GroupMemberData } from "../groups/groups.model";

@Injectable({
  providedIn: "root",
})
export class FriendsGroupsService {
  /**
   * Helper function to generate the full name and image URL from a user or member's data.
   *
   * This function constructs the full name by concatenating the first name and last name (if present).
   * It also extracts the image URL.
   *
   * @param user - The user object (`CurrentUser` | `GroupMemberData`).
   * @returns An object containing the `fullName` and the `imageUrl` from the user object.
   */
  getFullNameAndImage(user: CurrentUser | AddedFriend | GroupMemberData | undefined) {
    return {
      fullName: `${user?.first_name} ${user?.last_name ?? ""}`.trim(),
      imageUrl: user?.image_url,
    };
  }

  /**
   * Scrolls the message container to the bottom.
   */
  scrollToBottom(messageContainer: ElementRef) {
    if (!messageContainer) {
      return;
    }
    const container = messageContainer?.nativeElement;
    container.scrollTop = container.scrollHeight;
  }

  /**
   * Updates the balance by either adding or subtracting the given amount.
   *
   * @param balance - The current balance (as a string).
   * @param amount - The amount to be added or subtracted from the balance.
   * @param isAddition - A boolean flag indicating whether the amount should be added (true) or subtracted (false).
   *
   * @returns A string representing the updated balance after performing the addition or subtraction.
   */
  updateBalance(
    balance: string,
    amount: number,
    isAddition: boolean,
  ): string {
    return JSON.stringify(
      parseFloat(balance) + (isAddition ? amount : -amount),
    );
  }
}
