import { CommonModule } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

import { GroupMemberData } from "../../groups.model";

@Component({
  selector: "app-split-type-groups",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule
  ],
  templateUrl: "./groups-split-type.component.html",
  styleUrls: [ "./groups-split-type.component.css" ],
})
export class GroupsSplitTypeComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<GroupsSplitTypeComponent>);
  private readonly data = inject(MAT_DIALOG_DATA);

  participants: GroupMemberData[] = this.data.participants;
  totalAmount = this.data.totalAmount.total_amount;
  activeItem: "EQUAL" | "UNEQUAL" | "PERCENTAGE" = "EQUAL";

  selectedParticipants = [ ...this.participants ];
  calculatedShares: Record<string, number> = {};
  remainingTotal: number = this.totalAmount;

  unequalShares: Record<string, number> = {}; // To store unequal split type shares
  percentageShares: Record<string, number> = {}; // To store percentage split type shares

  validationError = "";

  ngOnInit(): void {
    this.dialogRef.updateSize("25%");

    // Check if splitState is passed, and initialize the dialog state
    if (this.data.splitState) {
      this.activeItem = this.data.splitState.split_type; // Set the active split type
      this.selectedParticipants = this.data.splitState.selectedParticipants; // Set the selected participants
      this.data.splitState.debtors.forEach((debtor: { debtor_id: string, debtor_share: number }) => {
        this.calculatedShares[debtor.debtor_id] = debtor.debtor_share;
      }); // Set the calculated shares
      this.calculatedShares[this.data.splitState.payerId] = this.data.splitState.payerShare;
      // Based on the active type, store the calculated shares in the appropriate type for submission
      this.setStoredShare();

      // Re-calculate the shares and remaining total based on the passed state
      this.updateRemainingTotal();
    } else {
      // Default behavior if no previous state is provided
      this.initializeShares();
      this.setActive("EQUAL");
    }
  }

  initializeShares() {
    this.participants.forEach((participant) => {
      this.calculatedShares[participant.group_membership_id] = 0;
      this.unequalShares[participant.group_membership_id] = 0; // Initialize for UNEQUAL
      this.percentageShares[participant.group_membership_id] = 0; // Initialize for PERCENTAGE
    });
    this.updateRemainingTotal();
  }

  toggleParticipant(participant: GroupMemberData) {
    if (this.selectedParticipants.includes(participant)) {
      this.selectedParticipants = this.selectedParticipants.filter(
        (p) => p.group_membership_id !== participant.group_membership_id
      );
    } else {
      this.selectedParticipants.push(participant);
    }
  }

  setActive(item: "EQUAL" | "UNEQUAL" | "PERCENTAGE") {
    const wasActiveItem = this.activeItem;
    this.activeItem = item;

    switch (item) {
      case "EQUAL": {
        const equalShare = this.totalAmount / (this.selectedParticipants.length || 1);
        this.selectedParticipants.forEach(
          (participant) => (this.calculatedShares[participant.group_membership_id] = equalShare)
        );
        break;
      }
      case "UNEQUAL":
        if (wasActiveItem === "EQUAL" || Object.values(this.unequalShares).some((value) => value !== 0)) {
          // If switching to UNEQUAL, retain previous values
          this.selectedParticipants.forEach((participant) => {
            this.calculatedShares[participant.group_membership_id] = this.unequalShares[participant.group_membership_id] || 0;
          });
        } else {
          // Reset shares for first-time visit to UNEQUAL
          this.participants.forEach((participant) => {
            this.calculatedShares[participant.group_membership_id] = 0;
          });
        }
        break;

      case "PERCENTAGE":
        if (wasActiveItem === "EQUAL" || Object.values(this.percentageShares).some((value) => value !== 0)) {
          // If switching to PERCENTAGE, retain previous values
          this.selectedParticipants.forEach((participant) => {
            this.calculatedShares[participant.group_membership_id] = this.percentageShares[participant.group_membership_id] || 0;
          });
        } else {
          // Reset shares for first-time visit to PERCENTAGE
          this.participants.forEach((participant) => {
            this.calculatedShares[participant.group_membership_id] = 0;
          });
        }
        break;
    }

    this.updateRemainingTotal();
  }

  updateTotal() {
    this.updateRemainingTotal();
    this.checkForNegativeValues();
  }

  onInputChange(event: Event, groupMembershipId: string) {
    const inputElement = event.target as HTMLInputElement;
    let value = parseFloat(inputElement.value);

    // Ensure the value is non-negative
    if (value < 0) {
      value = 0; // Prevent negative numbers by resetting to 0
    }

    this.calculatedShares[groupMembershipId] = value;
    // Based on the active type, store the calculated shares in the appropriate type for submission
    this.setStoredShare();
    this.updateTotal();
  }

  checkForNegativeValues() {
    const hasNegativeValues = Object.values(this.calculatedShares).some((share) => share < 0);
    if (hasNegativeValues) {
      this.validationError = "Amounts cannot be negative";
    } else {
      this.validationError = "";
    }
  }

  updateRemainingTotal() {
    const total = Object.values(this.calculatedShares).reduce(
      (acc, val) => acc + (val || 0),
      0
    );
    this.remainingTotal =
      this.activeItem === "UNEQUAL"
        ? this.totalAmount - total
        : 100 - total;
  }

  sendSplitType() {
    const debtors = this.selectedParticipants.map((participant) => ({
      debtor_id: participant.group_membership_id,
      debtor_share: this.calculatedShares[participant.group_membership_id] || 0,
    })).filter((debtor) => debtor.debtor_share !== 0);

    this.dialogRef.close({
      split_type: this.activeItem,
      debtors,
      selectedParticipants: this.selectedParticipants,
    });
  }

  isValidSplit(): boolean {
    const total = Object.values(this.calculatedShares).reduce(
      (acc, val) => acc + (val || 0),
      0
    );

    switch (this.activeItem) {
      case "UNEQUAL":
        return total === this.totalAmount;
      case "PERCENTAGE":
        return total === 100;
      default:
        // For 'EQUAL' or other cases
        return true;
    }
  }

  setStoredShare() {
    if (this.activeItem === "UNEQUAL") {
      this.unequalShares = { ...this.calculatedShares };
    } else if (this.activeItem === "PERCENTAGE") {
      this.percentageShares = { ...this.calculatedShares };
    }
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}

