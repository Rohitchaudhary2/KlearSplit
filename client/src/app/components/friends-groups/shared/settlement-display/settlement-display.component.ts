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
  payerName = input<string>();
  currentUserImageUrl = input<string>();
  payerImageUrl = input<string>();
  debtorName = input<string>();
  debtorImageUrl = input<string>();

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

  getUserName(name: string, role: "payer" | "debtor"): string {
    // Return "You" if the current user is the payer or debtor, based on the role
    if (
      (this.isCurrentUserPayer() && role === "payer") ||
      (this.isCurrentUserDebtor() && role === "debtor")
    ) {
      return "You";
    }
    return name; // Otherwise, return the actual name
  }
}
