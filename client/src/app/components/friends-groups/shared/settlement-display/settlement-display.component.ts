import { CurrencyPipe, DatePipe, NgClass } from "@angular/common";
import { Component, input } from "@angular/core";

interface GenericSettlement {
  settlement_id: string;
  settlement_amount: string;
  payerId: string;
  debtorId: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: "app-settlement-display",
  standalone: true,
  imports: [
    NgClass,
    DatePipe,
    CurrencyPipe
  ],
  templateUrl: "./settlement-display.component.html",
  styleUrl: "./settlement-display.component.css"
})
export class SettlementDisplayComponent {
  settlement = input<GenericSettlement>();
  currentUserId = input<string>();
  otherUserName = input<string>();
  currentUserImageUrl = input<string>();
  otherUserImageUrl = input<string>();

  /**
   * Checks if the current user is the payer for the settlement.
   * @returns {boolean} True if the current user is the payer, false otherwise.
   */
  isCurrentUserPayer(): boolean {
    return this.settlement()?.payerId === this.currentUserId();
  }

  /**
   * Checks if the current user is the debtor for the settlement.
   * @returns {boolean} True if the current user is the debtor, false otherwise.
   */
  isCurrentUserDebtor(): boolean {
    return this.settlement()?.debtorId === this.currentUserId();
  }
}
