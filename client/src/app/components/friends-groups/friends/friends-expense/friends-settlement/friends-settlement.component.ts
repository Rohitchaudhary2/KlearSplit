import { Component, inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

import { SettlementComponent } from "../../../shared/settlement/settlement.component";

@Component({
  selector: "app-friends-settlement",
  standalone: true,
  imports: [
    SettlementComponent
  ],
  templateUrl: "./friends-settlement.component.html",
  styleUrl: "./friends-settlement.component.css",
})
export class FriendsSettlementComponent {
  private readonly dialogRef = inject(MatDialogRef<FriendsSettlementComponent>);

  payer_name: string;
  debtor_name: string;
  total_amount: string;
  payer_image: string;
  debtor_image: string;

  constructor() {
    const data = inject(MAT_DIALOG_DATA);
    ({
      payerName: this.payer_name,
      debtorName: this.debtor_name,
      totalAmount: this.total_amount,
      debtorImage: this.debtor_image,
      payerImage: this.payer_image,
    } = data);
  }

  /**
   * Sends the settlement type and amount back to the friends-expense component when the form is valid.
   * This method is triggered when the user confirms the settlement.
   */
  sendSplitType(amount: string) {
    this.dialogRef.close({
      split_type: "SETTLEMENT",
      total_amount: amount,
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
